# The Awakened — Design Decisions

This document records the rule conflicts and missing decisions found in the
original design brief, the temporary/simple rule chosen for each, and the
concrete balance numbers used by the first prototype. Everything here is
deliberately simple and easy to change later — see "Flexibility notes" at
the end.

## 1. Conflicts / gaps found, and resolutions

### 1.1 What "turn" means for status timing
The brief says players take alternating turns, but also says Burn triggers
"at the beginning of the affected hero's turn." Heroes don't have individual
turns — players do, and a player's turn covers all of their heroes at once.

**Decision:** "hero's turn" = "that hero's controlling player's turn."
Start-of-turn effects (Burn, etc.) for a player resolve once, at the start
of that player's turn, for every one of that player's heroes that has the
status.

### 1.2 Energy pool scope
**Decision:** Energy is a single pool per *player* per turn (not per hero),
matching "players begin each turn with 3 energy" and the shared action deck.
Any card in hand can be played against its cost regardless of which of the
player's heroes it belongs to, as long as that hero is alive.

### 1.3 Hand/discard cycling
The brief doesn't say whether unused hand cards persist between a player's
own turns (with an opponent turn in between).

**Decision (Slay the Spire style):** At end of a player's turn, all cards
remaining in hand are discarded. At the start of a player's next turn, they
draw back up to a fresh hand of 5 from their draw pile (reshuffling discard
into draw if the draw pile runs out).

### 1.4 Deck size / copies per card
Six unique card types per player (3 heroes × 2 cards) is too small a pool
for a 5-card hand to feel like a real deck.

**Decision:** Each hero's Attack and Ability card is included as **3
copies** in the player's deck, giving an 18-card deck (3 heroes × 2 cards ×
3 copies). Team-Up cards are *not* part of the draw deck (see 1.7).

### 1.5 Which player acts first
No randomness is allowed in combat, but turn order needs a decision.

**Decision:** Player 1 always acts first in the prototype. This is a
placeholder — swapping to alternating first-player or a coin flip is a
one-line change (`src/engine/match.ts`).

### 1.6 Defeated hero's cards still in deck/hand
**Decision:** When a hero is defeated, any of their cards remaining in the
draw pile, discard pile, or the player's current hand are immediately and
permanently removed. This keeps the "defeated heroes cannot act" rule
airtight without needing a per-card "is this hero alive" check at play
time (that check still exists as a safety net).

### 1.7 How Team-Up cards become playable
Team-Up cards aren't drawn — the brief says they should be clearly visible
as available once unlocked.

**Decision:** Team-Up cards live outside the draw/discard cycle, as a
separate always-visible list. As soon as both required heroes are alive
**and** both are on the player's selected team, the Team-Up card appears as
playable (cost 3 energy, once per match). It's removed permanently once
played, or if either required hero is defeated.

### 1.8 Status effect duration & stacking (Burn / Wet / Shield)
Needed explicit, deterministic numbers.

**Decision:**
- **Burn**: a duration counter, not a stack counter. Applying Burn to a
  target sets/refreshes its remaining triggers to **2** (re-applying does
  *not* add extra instances — it just refreshes back to 2). At the start of
  the affected hero's controller's turn, Burn deals its fixed damage once
  and its remaining-triggers counter decrements by 1; at 0 it's removed.
- **Wet**: a simple boolean flag, no expiry timer. It is only removed when
  a Lightning card consumes it for the bonus-damage interaction (or when
  the hero is defeated). Re-applying Wet to an already-Wet target is a
  no-op.
- **Shield**: a single numeric pool per hero that absorbs damage before HP.
  It does not decay over time. Applying more Shield adds to the existing
  amount (no cap in the prototype).

### 1.9 Execute's "defined health threshold"
**Decision:** "Below a defined health threshold" = **≤ 30% of the target's
max HP**.

### 1.10 Shadow Assassin's "reduced damage" on first attack taken
**Decision:** The first instance of damage taken by Shadow Assassin each
match is reduced by a **flat 3**, to a minimum of 1 damage.

### 1.11 Chain Spark targeting ("one target... another enemy")
**Decision:** The player explicitly chooses both targets (primary and
secondary), which must be two different enemy heroes. If the enemy team
only has one hero left alive, Chain Spark's secondary hit is skipped (no
valid second target) and only the primary hit resolves.

### 1.12 Team-Up resolution order
Both Team-Up cards list multiple effects; the interface must show the
order explicitly. Decided orders (also enforced by the engine as an
ordered event list):

- **Steam Surge** (Fire Mage + Water Healer): 1) deal fixed damage to all
  enemies → 2) remove Wet from any enemy that had it → 3) apply Burn to all
  enemies.
- **Thunder Tide** (Water Healer + Lightning Duelist): 1) apply Wet to all
  enemies → 2) deal Lightning damage to each enemy, consuming the
  just-applied Wet for the bonus (so every enemy takes the Wet-bonus
  amount) → 3) remove Wet from all enemies hit.

### 1.13 Simultaneous / tie resolution
The engine only ever applies one player's action at a time and re-checks
victory after every single event, so simultaneous double-defeats can't
occur — there is always a well-defined event order. No extra rule needed.

### 1.14 Hero selection secrecy for a local prototype
True network secrecy isn't available in a single-machine prototype.

**Decision:** Hot-seat flow — Player 1 picks 3 of 5 heroes on a "pass the
device" screen, then Player 2 does the same on a fresh screen that hides
Player 1's picks, then both are revealed together. This preserves the
"simultaneous reveal" feel without networking, and is isolated in one
component so it can be swapped for real simultaneous online selection
later without touching the engine.

## 2. Balance numbers (prototype values, all fixed/deterministic)

| Hero | Role | Element | Max HP | Notes |
|---|---|---|---|---|
| Fire Mage | Mage | Fire | 18 | |
| Earth Guardian | Defender | Earth | 24 | starts with 4 Shield |
| Water Healer | Support | Water | 20 | |
| Lightning Duelist | Fighter | Lightning | 20 | |
| Shadow Assassin | Assassin | Shadow | 16 | first hit taken reduced by 3 |

| Card | Hero | Cost | Effect |
|---|---|---|---|
| Fire Bolt (attack) | Fire Mage | 1 | 5 dmg to one enemy + apply Burn (2 triggers, 3 dmg each) |
| Flame Wave (ability) | Fire Mage | 2 | 3 dmg to all enemies |
| Kindle Spirit (support) | Fire Mage | 2 | Empower one ally: +4 dmg on their next damage-dealing action |
| Stone Strike (attack) | Earth Guardian | 1 | 5 dmg to one enemy |
| Fortify (ability) | Earth Guardian | 2 | +6 Shield to one ally |
| Guardian's Watch (support) | Earth Guardian | 2 | +3 Shield to every allied hero |
| Tidal Shot (attack) | Water Healer | 1 | 3 dmg to one enemy + apply Wet |
| Restoring Current (ability) | Water Healer | 2 | heal 6 (7 if first heal this match) to one ally |
| Encouraging Current (support) | Water Healer | 2 | Empower one ally: +4 dmg on their next damage-dealing action |
| Charged Slash (attack) | Lightning Duelist | 1 | 5 dmg; if target Wet, +3 bonus dmg and remove Wet |
| Chain Spark (ability) | Lightning Duelist | 2 | 4 dmg to primary target, 2 dmg to secondary target; each gets +3/removes Wet independently if Wet |
| Static Charge (support) | Lightning Duelist | 2 | Empower one ally: +4 dmg (+7 total and cleanses Wet, if that ally is currently Wet) |
| Quick Strike (attack) | Shadow Assassin | 1 | 5 dmg to one enemy |
| Execute (ability) | Shadow Assassin | 2 | 4 dmg; +6 bonus dmg if target ≤ 30% max HP |
| Marked Opening (support) | Shadow Assassin | 2 | Empower one ally: +6 dmg on their next damage-dealing action |

Passives:
- **Fire Mage**: +1 damage dealt by this hero to any target that currently has Burn.
- **Earth Guardian**: begins the match with 4 Shield.
- **Water Healer**: the first healing card *this player* uses each match heals +1 additional.
- **Lightning Duelist**: whenever this hero's card consumes Wet for the bonus-damage interaction, this hero gains 2 Shield.
- **Shadow Assassin**: the first damage instance taken by this hero each match is reduced by 3 (min 1).

Team-Up cards:
- **Steam Surge** (Fire Mage + Water Healer, cost 3): 6 dmg to all enemies → remove Wet from any hit → apply Burn (2 triggers, 3 dmg) to all enemies.
- **Thunder Tide** (Water Healer + Lightning Duelist, cost 3): apply Wet to all enemies → deal 4 dmg + 3 Wet bonus (7 total) to each enemy, consuming Wet.

Deck: 3 copies each of a hero's Attack, Ability, and Support card → 27
cards per player (3 heroes × 3 cards × 3 copies). Hand size 5,
draw/discard/reshuffle as in section 1.3.

## 3. Flexibility notes (for future work, not built yet)

- Turn system is isolated behind `src/engine/turn.ts` so alternating turns
  can later be replaced with simultaneous planning without touching
  damage/status/target-validation code.
- All engine functions are pure and return an ordered `GameEvent[]` list;
  the renderer/animation layer only ever reads events, never mutates game
  state directly.
- Ultimates, more elements, more heroes, and more Team-Ups are intentionally
  left out of this prototype per the brief.

## 4. Online multiplayer (added when the game moved off local hotseat)

Backend: [Supabase](https://supabase.com) (managed Postgres + Realtime),
free tier. No account system — each device generates a random UUID on
first load (`localStorage`) as a lightweight identity for pairing and
presence only. Nothing sensitive is stored; this is not meant to survive
a security review, only to make casual matches work.

### 4.1 Matchmaking (public queue)

Two tables:

- `queue(player_id uuid primary key, status text, match_id uuid, created_at timestamptz)`
- `matches(id uuid primary key, player1_id uuid, player2_id uuid, created_at timestamptz)`

Pairing is a single Postgres function, `find_match(p_player_id uuid)`,
called via RPC when a player taps **Find Match**:

1. It looks for the oldest `queue` row with `status = 'waiting'` that
   isn't the caller, locking it with `FOR UPDATE SKIP LOCKED` (safe under
   concurrent calls — two callers can never claim the same waiting row).
2. **Found one** → creates a `matches` row, marks that row `matched`, and
   returns the new `match_id` directly to the caller. The caller becomes
   **player2** (the row it claimed was already waiting, so that other
   client becomes **player1** — see 4.2 for why this ordering matters).
3. **Found none** → upserts the caller into `queue` as `waiting` and
   returns nothing. That client then subscribes to Postgres changes on
   its own `queue` row; when a later caller claims it in step 2, the
   `UPDATE` fires and delivers the `match_id` to the waiting client.

No Edge Function needed — `FOR UPDATE SKIP LOCKED` inside the RPC is
what makes this race-safe without one.

### 4.2 Keeping both clients in sync: full-state broadcast, not lockstep

The engine is already pure (`MatchState in → MatchState + events out`),
which suggested two possible sync strategies:

- **Lockstep**: both clients run the engine themselves and only send the
  *action* (e.g. "play card X at target Y") over the wire, replaying it
  locally to reach the same state. Cheapest bandwidth, but fragile: both
  clients must independently compute an *identical* initial `MatchState`
  (same deck shuffle order per player), which means agreeing on a shared
  RNG seed before the first card is even drawn, and it silently breaks
  the moment the two clients' engine code ever diverges by a single bug.
- **State broadcast** (what this prototype uses): whichever client's turn
  it is calls the normal engine function locally (`playCard` /
  `playTeamUp` / `endTurn`) exactly as the local hotseat build always
  did, then broadcasts the *resulting full `MatchState`* over a Supabase
  Realtime **Broadcast** channel scoped to the match
  (`match:<match_id>`). The other client doesn't recompute anything — it
  just replaces its local state with what arrived. Turns already
  alternate one-at-a-time in this game, so there's never a case where
  both clients try to advance state simultaneously.

State broadcast was chosen because it's simpler and self-healing (every
message is a complete snapshot, so there's no accumulating drift to
debug) at the cost of a slightly larger message per action — a few KB of
JSON, irrelevant for a turn-based card game.

**Who creates the match:** the player who called `find_match` and got a
`match_id` back immediately (i.e. found someone already waiting) is
**player1**, matching the existing "Player 1 acts first" rule
(DESIGN.md 1.5) without needing a coin flip. Once both clients confirm
their hero selections over the channel, **player1's client** calls
`createMatch` locally and broadcasts the resulting initial state;
player2's client adopts it as-is rather than calling `createMatch`
itself, sidestepping any RNG-seed-agreement problem entirely.

### 4.3 Turn enforcement and disconnects (deliberately simple)

- Whether a client's UI is interactive is decided purely by
  `state.activePlayerId === myPlayerId`, checked client-side only. There
  is no server-side validation of moves. This is a casual hobby
  prototype, not a competitive-integrity product — acceptable for now,
  flagged here so it isn't mistaken for an oversight later.
- Presence (via the same Realtime channel) shows when the opponent's
  client is connected. If it drops, the UI shows "Opponent
  disconnected" with a button to leave the match. There is no
  reconnect/resume — leaving forfeits. Full reconnection support is
  out of scope for this pass.

## 5. Simultaneous turn planning (replaces alternating turns)

The original brief flagged this as the intended eventual model
("simultaneous planning... without rewriting the entire project") and
the engine was built to make this swap cheap: card resolution
(`heroes.ts`, `teamups.ts`, `combat.ts`) never knew or cared whose
"turn" it was, so none of it needed to change. What changed is only
*when* those resolve functions get called and in what order.

### 5.1 The round structure

Each round now has two phases, both players participating every round
(no more "player1 acts, then player2 acts"):

1. **Planning.** Both players privately queue any number of Attack /
   Ability / Team-Up plays against their 3-energy budget and current
   hand — same costs and target rules as before, just not resolved
   immediately. Queuing a card removes it from hand and deducts energy
   right away (so the energy/hand counters stay honest), but nothing
   about the board changes yet — no damage, no healing, no status
   changes — until resolution. A queued action can be unqueued any
   time before the player readies up, refunding its energy and
   returning the card to hand.
2. **Resolution ("Fight").** Once both players have readied up, the
   round resolves as one deterministic pass — see 5.2 — producing the
   usual ordered `GameEvent[]` list, which the UI animates through
   exactly like before. Then the next round's planning phase begins
   automatically: both players draw back up to 5, both reset to 3
   energy, and Burn ticks once for every hero on either side that has
   it (see 5.3).

### 5.2 Resolution order

**Decision:** queued actions resolve **interleaved by queue position,
alternating starting with player1** — player1's 1st queued action,
player2's 1st, player1's 2nd, player2's 2nd, and so on; once one
player's queue is exhausted, the other player's remaining actions
resolve in order. Player1-first is the same fixed tie-break already
used for "who acts first" (DESIGN.md 1.5), not a coin flip.

**Decision — target validity at resolution time:** both players plan
blind, so a queued target can die (or its hero-alive precondition
change) before its turn in the resolution order comes up — e.g. you
queue a finishing blow on a hero your opponent's earlier action
already defeated. When that happens the action **fizzles**: no
energy/card refund (the risk is the whole point — this is where
*prediction*, one of the game's core pillars, actually matters), a
`ACTION_FIZZLED` event is emitted so the log is honest about it, and
resolution continues with the next queued action. Specifically:
- **Source hero defeated before its action resolves:** the whole
  action fizzles (a defeated hero can't act, even posthumously).
- **`singleEnemy` / `singleAlly` target defeated:** the action
  fizzles.
- **`twoEnemies` (Chain Spark):** if the *primary* target is defeated,
  the whole action fizzles (no valid card to retarget from). If only
  the *secondary* target is defeated, the primary hit still resolves
  and the secondary hit is skipped — a partial fizzle.
- **`allEnemies` (Flame Wave, Team-Ups):** the damage/effect itself
  never fizzles — it already only ever hits whichever enemies are
  alive *at the moment it resolves*, same as it always did. A
  **Team-Up** is the one exception with its own fizzle case: if either
  of its two required heroes was defeated by an earlier action this
  same round (queued before either side knew the other's plan), the
  Team-Up fizzles entirely rather than firing one-handed — same
  `isTeamUpAvailable` alive-check used everywhere else, just
  re-checked at resolution time instead of queue time.
- If resolving an action ends the match (last enemy hero defeated),
  resolution stops immediately — no further queued actions from
  either player execute, matching "the match must immediately stop
  accepting actions once a winner is determined."

### 5.3 Status timing simplifies

With no more "whose turn is it," DESIGN.md 1.1's per-player Burn
timing collapses to one rule: **Burn ticks once at the start of each
round, for every hero on either side that has it**, in fixed roster
order (player1's heroes, then player2's). Simpler than before, and it
was only ever complicated *because* turns alternated.

### 5.4 Online sync

Fits the existing full-state-broadcast model (DESIGN.md 4.2) with one
addition: both clients need to know when the *other* has readied up
before either can resolve. Player1's client stays the sole authority
that actually calls the resolve function and broadcasts the resulting
state (unchanged from 4.2) — it just now waits until it has both
"I'm ready, here's my queue" from itself *and* from player2 (sent as a
Realtime broadcast message alongside its ready flag) before resolving.
Player2's client only ever adopts broadcast state; it never resolves
locally. This avoids any risk of the two clients disagreeing about
resolution order — there is exactly one place resolution ever runs.

### 5.5 What this changes for the player

- The **End Turn** button becomes **Ready** (or **Fight!** once both
  players are ready) — it locks in your queued actions rather than
  ending an alternating turn.
- The hand/battlefield UI needs a visible "planned actions" list so a
  queued play can be reviewed and unqueued before committing —
  previously every play was instant, so nothing needed to be shown
  after the fact.
- Both players' hands, energy, and boards are always visible and
  interactive during planning (no more "waiting for your turn" — the
  waiting now happens only after readying up, until the opponent also
  readies).

## 6. Support cards: a third card per hero (heal / buff allies)

Every hero originally had exactly two cards: an Attack (hits an enemy)
and an Ability (a heavier, still self-contained effect). Only Water
Healer's Ability actually helped a teammate — no hero had a way to
*buff* an ally's damage, and "support" as a playstyle was really just
one card on one hero.

**Decision:** every hero gets a third card, `support`, alongside
`attack`/`ability` (`HeroDefinition.support` in `src/engine/types.ts`).
Deck building (`deck.ts`) includes all three at 3 copies each, so this
is a straightforward capacity increase, not a replacement — nothing
existing lost a card.

### 6.1 The Empower status: a shared "damage boost" primitive

Rather than inventing a one-off buff per hero, support cards mostly
grant a new status effect, **Empower** (`StatusEmpower` in types.ts):
the next time that hero deals damage via one of their own cards
(Attack, Ability, or Support), the hit gets `+bonusDamage` and Empower
is consumed. Team-Up damage doesn't carry a `sourceHeroInstanceId` (it
isn't attributed to one hero — see `CardResolveContext`), so it can't
consume or benefit from Empower; that's an existing property of
Team-Ups, not a special case added for this feature.
No duration/expiry to track, unlike Burn — it just waits until spent,
the same way Wet waits for a Lightning hit to consume it. Applying a
new Empower to an already-Empowered hero overwrites the old bonus
rather than stacking, mirroring how re-applying Burn refreshes its
duration instead of adding a second stack.

This is intentionally a *shared* mechanic (four of the five heroes'
support cards grant it, at different costs: 4 from Fire Mage/Water
Healer, 6 from Shadow Assassin, 4-or-7 from Lightning Duelist depending
on whether the target's Wet — reusing the existing Wet interaction
flavor). That mirrors how Shield, Burn, and Wet are already
cross-hero primitives rather than bespoke per-card math — a player
only has to learn "Empower" once, not five different buffs.

Earth Guardian's support card, **Guardian's Watch**, is the one
exception: instead of Empower, it grants a flat Shield to *every*
allied hero at once, using a new `allAllies` `TargetType` (a direct
mirror of the existing `allEnemies` — resolves immediately on tap, no
target selection needed). A pure team-wide Shield fits the
Defender/tank identity better than a damage buff, and having one
non-Empower support card also keeps "support" from reading as a single
reskinned effect.

### 6.2 Why Empower lives on the *source* hero, not the target card

Empower is stored in `HeroInstance.statuses` on the hero who will
attack next, not attached to a specific future card. That means it
applies to *whatever* damage-dealing action that hero takes next —
their Attack, their Ability, even a Team-Up they contribute to — not
just one predetermined follow-up card. This keeps the simultaneous-
planning interaction simple: if the Empowered hero's queued action
fizzles (see section 5.2) before it resolves, the buff was never
consumed and just carries into the next round untouched, since nothing
ever reads or clears it except `dealDamage` actually firing.
