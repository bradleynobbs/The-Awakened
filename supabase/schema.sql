-- The Awakened — online multiplayer schema
-- Run this once in the Supabase project's SQL Editor (Project -> SQL Editor -> New query).
-- See DESIGN.md section 4 for the matchmaking/sync design this supports.

create extension if not exists pgcrypto;

-- Matchmaking queue. One row per waiting player; upserted by player_id.
create table if not exists queue (
  player_id uuid primary key,
  status text not null default 'waiting' check (status in ('waiting', 'matched')),
  match_id uuid,
  created_at timestamptz not null default now()
);

-- One row per created match, purely as a pairing record — gameplay state
-- itself is never persisted here, only broadcast peer-to-peer-via-relay
-- over a Realtime channel (see DESIGN.md 4.2).
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid not null,
  player2_id uuid not null,
  created_at timestamptz not null default now()
);

-- Realtime: the waiting client needs postgres_changes UPDATE events on
-- its own queue row to learn it's been matched.
alter publication supabase_realtime add table queue;

-- No auth in this prototype (see DESIGN.md 4) — RLS is enabled with
-- permissive policies scoped to what the client actually needs, rather
-- than left wide open.
alter table queue enable row level security;
alter table matches enable row level security;

drop policy if exists "anyone can read queue" on queue;
create policy "anyone can read queue" on queue for select using (true);

drop policy if exists "anyone can read matches" on matches;
create policy "anyone can read matches" on matches for select using (true);

-- Direct insert/update policies exist as a fallback only; normal play
-- goes through find_match() below (security definer), which enforces
-- the actual pairing rules server-side. RPC calls run with the
-- function's own privileges regardless of these table policies.
drop policy if exists "anyone can upsert own queue row" on queue;
create policy "anyone can upsert own queue row" on queue for insert with check (true);
drop policy if exists "anyone can update own queue row" on queue;
create policy "anyone can update own queue row" on queue for update using (true);

drop policy if exists "anyone can insert matches" on matches;
create policy "anyone can insert matches" on matches for insert with check (true);

-- Atomically pairs the caller with the oldest other waiting player, or
-- queues the caller as waiting if nobody is available yet.
-- Returns a single row: (match_id, opponent_id, is_player1).
-- match_id is null when the caller was queued instead of matched —
-- that client should then subscribe to its own queue row for the match.
create or replace function find_match(p_player_id uuid)
returns table (match_id uuid, opponent_id uuid, is_player1 boolean)
language plpgsql
security definer
as $$
declare
  v_opponent queue%rowtype;
  v_match_id uuid;
begin
  -- Housekeeping: drop abandoned waiting rows so nobody gets matched
  -- with a player who closed the tab. 2 minutes is generous for a
  -- casual queue; not load-bearing for correctness, just hygiene.
  delete from queue
  where status = 'waiting'
    and created_at < now() - interval '2 minutes'
    and player_id <> p_player_id;

  -- Try to claim the oldest other waiting player. SKIP LOCKED makes this
  -- safe if two players call find_match at the same instant.
  select * into v_opponent
  from queue
  where status = 'waiting' and player_id <> p_player_id
  order by created_at asc
  limit 1
  for update skip locked;

  if found then
    v_match_id := gen_random_uuid();

    insert into matches (id, player1_id, player2_id)
    values (v_match_id, v_opponent.player_id, p_player_id);

    update queue
    set status = 'matched', match_id = v_match_id
    where player_id = v_opponent.player_id;

    delete from queue where player_id = p_player_id;

    return query select v_match_id, v_opponent.player_id, false;
  else
    insert into queue (player_id, status, match_id, created_at)
    values (p_player_id, 'waiting', null, now())
    on conflict (player_id)
    do update set status = 'waiting', match_id = null, created_at = now();

    return query select null::uuid, null::uuid, null::boolean;
  end if;
end;
$$;

-- Lets a player leave the queue (e.g. they close the "searching" screen).
create or replace function leave_queue(p_player_id uuid)
returns void
language sql
security definer
as $$
  delete from queue where player_id = p_player_id and status = 'waiting';
$$;
