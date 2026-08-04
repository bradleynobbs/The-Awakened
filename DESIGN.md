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

- **Steam Surge** (Inferna + Water Healer): 1) deal fixed damage to all
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
| Inferna | Mage | Fire | 18 | |
| Earth Guardian | Tank | Earth | 24 | starts with 4 Shield |
| Water Healer | Support | Water | 20 | |
| Spark Duelist | Brawler | Spark | 20 | |
| Mourn | Speedster | Undead | 16 | first hit taken reduced by 3 |
| Kairo | Gunslinger | Charm | 17 | +1 dmg vs. Charmed targets |
| Spirit Mage | Mage | Spirit | 16 | survives one lethal hit at 1 HP per match |

| Card | Hero | Cost | Effect |
|---|---|---|---|
| Fire Bolt (attack) | Inferna | 1 | 5 dmg to one enemy + apply Burn (2 triggers, 3 dmg each) |
| Flame Wave (ability) | Inferna | 2 | 3 dmg to all enemies |
| Kindle Spirit (support) | Inferna | 2 | Empower one ally: +4 dmg on their next damage-dealing action |
| Stone Strike (attack) | Earth Guardian | 1 | 5 dmg to one enemy |
| Fortify (ability) | Earth Guardian | 2 | +6 Shield to one ally |
| Guardian's Watch (support) | Earth Guardian | 2 | +3 Shield to every allied hero |
| Tidal Shot (attack) | Water Healer | 1 | 3 dmg to one enemy + apply Wet |
| Restoring Current (ability) | Water Healer | 2 | heal 6 (7 if first heal this match) to one ally |
| Encouraging Current (support) | Water Healer | 2 | Empower one ally: +4 dmg on their next damage-dealing action |
| Charged Slash (attack) | Spark Duelist | 1 | 5 dmg; if target Wet, +3 bonus dmg and remove Wet |
| Chain Spark (ability) | Spark Duelist | 2 | 4 dmg to primary target, 2 dmg to secondary target; each gets +3/removes Wet independently if Wet |
| Static Charge (support) | Spark Duelist | 2 | Empower one ally: +4 dmg (+7 total and cleanses Wet, if that ally is currently Wet) |
| Quick Strike (attack) | Mourn | 1 | 5 dmg to one enemy |
| Execute (ability) | Mourn | 2 | 4 dmg; +6 bonus dmg if target ≤ 30% max HP |
| Marked Opening (support) | Mourn | 2 | Empower one ally: +6 dmg on their next damage-dealing action |
| Quickdraw (attack) | Kairo | 1 | 5 dmg to one enemy (+1 if they're Charmed, via passive) |
| Called Shot (ability) | Kairo | 2 | 4 dmg + Charm one enemy: their next damage-dealing action deals 3 less (min 1) |
| Cover Fire (support) | Kairo | 2 | Empower one ally: +5 dmg on their next damage-dealing action |
| Spirit Bolt (attack) | Spirit Mage | 1 | 4 dmg to one enemy + heal this hero for 2 |
| Soul Siphon (ability) | Spirit Mage | 2 | 6 dmg to one enemy + heal this hero for 4 |
| Spirit Ward (support) | Spirit Mage | 2 | Heal one ally for 5 |

Passives:
- **Inferna**: +1 damage dealt by this hero to any target that currently has Burn.
- **Earth Guardian**: begins the match with 4 Shield.
- **Water Healer**: the first healing card *this player* uses each match heals +1 additional.
- **Spark Duelist**: whenever this hero's card consumes Wet for the bonus-damage interaction, this hero gains 2 Shield.
- **Mourn**: the first damage instance taken by this hero each match is reduced by 3 (min 1).
- **Kairo**: +1 damage dealt by this hero to any target that currently has Charm.
- **Spirit Mage**: the first hit that would defeat this hero each match instead leaves them at 1 HP.

Team-Up cards:
- **Steam Surge** (Inferna + Water Healer, cost 3): 6 dmg to all enemies → remove Wet from any hit → apply Burn (2 triggers, 3 dmg) to all enemies.
- **Thunder Tide** (Water Healer + Spark Duelist, cost 3): apply Wet to all enemies → deal 4 dmg + 3 Wet bonus (7 total) to each enemy, consuming Wet.
- Kairo and Spirit Mage don't have a Team-Up yet — more Team-Ups are intentionally out of scope for this pass (see section 3), not an oversight.

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

### 5.6 A real battle phase (gating on animation playback, not just readiness)

Resolution used to unlock the *next* round's planning controls the
instant the engine produced a result — but `useEventQueue` was still
separately stepping through that round's `GameEvent[]` for the
battlefield's animations, cosmetically, in the background. Nothing
stopped a player from queuing (or even finishing) the next round's
plan while the previous round's attacks were still visibly playing
out, which doesn't read as a "battle phase" so much as animations
happening to play while you've already moved on.

`useEventQueue` now returns `isPlaying` alongside `activeEvent`, and
`Battle.tsx` folds it into the existing ready-gate: `canAct = !isReady
&& !isPlaying`. The hand, Fight button, Team-Up bar, and targeting all
stay locked until the current batch has finished stepping, and
`TopBar` shows a pulsing red "⚔️ Battle!" pill instead of "Plan your
actions" for the duration.

`isPlaying` is deliberately **not** just "a batch is queued" — most
`pendingEvents` batches are routine planning bookkeeping (queuing a
single card emits one `ACTION_QUEUED` event; a new round quietly
starting emits `ROUND_STARTED`/`CARDS_DRAWN`/`ENERGY_SPENT`), and
gating on those too would freeze the hand for a beat after every
click. `useEventQueue` only sets `isPlaying` when the current batch
contains at least one genuine combat event (`CARD_PLAYED`,
`DAMAGE_DEALT`, `HERO_DEFEATED`, etc. — see `NON_BATTLE_EVENT_TYPES`
for the exclusion list) — a real fight to watch, not bookkeeping.

This surfaced a real bug in `usePracticeMatch.ts`: the bot silently
planning its *next* round (so it can ready up the instant the human
does) was calling `setPendingEvents` with its own planning log slice,
which — since `useEventQueue` resets its queue whenever the `events`
array reference changes — clobbered the *previous* round's real battle
events almost immediately after they were set, cutting their animation
short before a player could see more than the first beat or two. Fixed
by having that effect update `state` only; the bot's plan is invisible
bookkeeping from the player's POV until they ready up too, exactly like
a real opponent's would be, so it should never touch `pendingEvents`.

Also added variable step timing: a genuine combat event still holds
the screen for 500ms so its cue is visible, but bookkeeping events
step through in 60ms — a round with several hero actions plus trailing
next-round setup no longer takes 10+ seconds just because every event
in the batch waited the same fixed beat regardless of whether there
was anything to actually look at.

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
support cards grant it, at different costs: 4 from Inferna/Water
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

## 7. Expanding elements and roles, and two new heroes

The original 5 elements (Fire, Water, Lightning, Earth, Shadow) and the
`Role` type's grab-bag of labels (Fighter, Defender, Support, Assassin,
Controller, Mage — `Controller` was never actually used by a hero) are
replaced with a fixed, deliberately chosen set: **7 elements** (Fire,
Water, Spark, Earth, Undead, Charm, Spirit) and **6 roles** (Mage,
Brawler, Tank, Assassin, Gunslinger, Support). Two existing heroes were
renamed to fit, and two new heroes were added to give every element and
role at least one hero.

### 7.1 Renames: Lightning → Spark, Shadow → Undead

Lightning Duelist → **Spark Duelist** (element `lightning`→`spark`, role
`Fighter`→`Brawler`) and Shadow Assassin → **Mourn** (element
`shadow`→`undead`). These are pure renames — the mechanics don't change
at all (Spark still consumes Wet for bonus damage and grants Shield on
the interaction; Mourn's first-hit reduction is untouched).
`HeroId` values (`lightning-duelist`→`spark-duelist`,
`shadow-assassin`→`undead-assassin`) were renamed too, since leaving the
internal id stale while the display name changed would've been the kind
of quiet inconsistency that's cheap to avoid now and confusing to find
later. `dealLightningDamage` (combat.ts) is renamed `dealSparkDamage` for
the same reason — code should use the game's current vocabulary, not its
history.

### 7.2 Two new heroes, and why these two

Filling every role and element with the existing 5 heroes left exactly
one role gap (**Gunslinger**) and two element gaps (**Charm**,
**Spirit**). Two new heroes cover all three:

- **Kairo** (Charm element, Gunslinger role, 17 HP)
- **Spirit Mage** (Spirit element, Mage role, 16 HP — Mage is reused,
  since roles aren't required to be unique across the roster any more
  than "Support" was unique to Water Healer before section 6)

Neither has a Team-Up yet (see section 3) — that's still explicitly out
of scope for this pass, not an oversight.

### 7.3 Charm: a debuff that mirrors Empower

Charm needed its own signature mechanic the way Fire has Burn and Water
has Wet. Rather than invent something unrelated, it's the direct
inverse of Empower (section 6.1): a new `StatusCharmed` status sits on
the *charmed* hero and subtracts (floor 1) from their next
damage-dealing action, then is consumed — same storage location, same
consume-on-`dealDamage` mechanism, just negative and applied to an
enemy instead of an ally. Reusing that exact code path (rather than
building a second, parallel buff/debuff system) is why Called Shot's
Charm application was cheap to add and easy to verify: it's the same
`dealDamage` branch Empower already exercises, just subtracting instead
of adding. Kairo's passive, Steady Aim (+1 damage to
currently-Charmed targets), mirrors Inferna's own Burn-synergy passive
for the same reason — a player who's already learned one of these
patterns has effectively learned both.

### 7.4 Spirit: lifesteal cards + a "cheat death once" passive

Spirit's two damage cards (Spirit Bolt, Soul Siphon) deal damage and
heal the caster in the same resolve — no new engine primitive, just
`dealDamage` followed by `healHero` in one card, which was already
enough to make Spirit Mage read as a distinct "sustain mage" next to
Water Healer's "dedicated healer."

The passive, Lingering Spirit, is new: the first hit that would defeat
this hero each match instead leaves them at 1 HP. Implemented as a
`hasCheatedDeath` flag on `HeroInstance` (mirroring Mourn's
existing `hasTakenFirstHit` flag) checked in `dealDamage` right before
HP would hit 0 — if the hit is lethal, `hasCheatedDeath` is unset, and
the target is `spirit-mage`, HP clamps to 1 and the flag is set instead
of the normal defeat path running. A `SURVIVED_LETHAL` event marks it
in the log/UI so it doesn't look like a silent bug when a lethal-looking
hit doesn't defeat its target.

### 7.5 What stayed deliberately unchanged

Card resolution, targeting, round planning/resolution, online sync, and
every other existing hero's numbers are untouched — this pass only
touched hero data (`heroes.ts`), the `Element`/`Role`/`HeroId` type
unions, two `combat.ts` helpers, and the small set of UI files that key
off role for 3D hero-model shape (`HeroModel.tsx`) or color/symbol
(`heroVisuals.ts`). `deck.ts`, `cards.ts`, `targeting.ts`, `bot.ts`,
`DeckBuilder.tsx`, and `CardHand.tsx` needed **no changes at all** —
they were already written generically against `HERO_LIST`/
`CardDefinition` rather than any specific hero, role, or element, which
is exactly what made adding two heroes safe to do without touching the
resolution engine.

## 8. Character stat system (Health/Attack/Defense/Speed + 8 secondary stats)

This section replaces "every card just has a fixed damage/heal/shield
number" with real per-hero stats that modify those numbers, plus
speed-based turn order and a 7-element advantage web. It's the biggest
single change to the engine since section 5 (simultaneous planning).

**The one rule every formula below obeys: nothing here is random.**
The game has been fully deterministic since the original brief — no
crits, no accuracy rolls, every outcome predictable from what both
players queued. Accuracy, Evasion, and Critical Chance are normally
probability stats; here they're all resolved as **stat-vs-stat
comparisons**, never a dice roll against the engine's RNG. A player
who knows both rosters' stat blocks (which the UI always shows — no
hidden information beyond the blind-queued actions themselves) can
calculate the exact outcome of any matchup before it happens. That's
what keeps "predict what your opponent is about to do" as the core
skill instead of "hope the percentages go your way."

### 8.1 Primary stats

- **Health** — unchanged: `HeroInstance.maxHp`/`currentHp`.
- **Attack** — added to a card's base power before Defense is applied.
- **Defense** — subtracted from incoming damage before Shield absorbs
  the rest (floor 1, same "never quite zero" floor already used for
  Mourn's first-hit reduction and Charm's debuff).
- **Speed** — decides resolution order within the Fight phase (see
  8.5) — replaces the old "always interleave starting with player1"
  rule from section 5.2.

### 8.2 Secondary stats, and how each resolves without randomness

- **Accuracy** (attacker) vs **Evasion** (target): if
  `Accuracy >= Evasion`, the hit lands in full. If `Accuracy < Evasion`,
  the hit **grazes** instead of missing outright — damage is halved
  (floor 1) rather than zeroed. A full miss would waste an entire
  blind-queued action for nothing, which feels bad in a game where
  actions are locked in before you see the result; grazing keeps
  Evasion meaningful without that swing.
- **Critical Chance**: a flat stat value, not a percentage. If
  `attacker.CriticalChance >= CRIT_THRESHOLD` (50), every hit from that
  hero crits — deterministically, every time, not "50% of the time."
  Base hero kits sit well under 50 (0–20), so crit is something you
  build toward (via Empower-style buffs from future cards) rather than
  something that happens on its own — Gunslinger-role heroes start
  closer to the threshold, matching "Gunslingers excel at... Critical
  Hits."
- **Critical Damage**: a percentage multiplier applied only when a crit
  triggers (base 100 = the crit still happens but adds nothing; higher
  numbers add more). Meaningless without enough Critical Chance to
  actually cross the threshold, which is intentional — the two stats
  are a matched pair.
- **Energy**: repurposed, since Ultimates don't exist and are still
  explicitly out of scope (section 3). Instead, each living roster
  hero's Energy stat adds directly to their controller's per-round
  energy budget: `roundEnergy = 3 + sum(hero.energy for hero in
  livingHeroes)`. Most heroes have 0; Mage-role heroes have 1, since
  "Mages focus on... Energy usage" and this is the cleanest way to
  make that literally true against a resource that already exists,
  without inventing a whole cooldown/ultimate layer this pass.
- **Cooldown Reduction**: repurposed the same way, for the same reason
  — there's no cooldown system (cards are drawn/discarded, not
  cooled down), so CDR becomes a flat energy-cost discount on that
  hero's Ability and Support cards specifically (`cost - CDR`, floor
  1). Support-role and Speedster-role heroes get a point of it.
- **Healing Power**: a percentage multiplier (base 100) applied in
  `healHero` when the *source* hero has it above 100. Support-role
  heroes run hot on this.
- **Shield Strength**: same shape, applied in `addShield` when the
  source hero has it above 100. Tank-role heroes run hot on this.

### 8.3 Elemental advantage web (7 elements, balanced by construction)

Arranged as a 7-element cycle — Fire → Earth → Spark → Water → Spirit →
Undead → Charm → (back to Fire) — where each element beats the next
**two** elements clockwise and loses to the previous **two**. With 7
elements that leaves exactly 2 "neutral" match-ups per element too, so
**every element has exactly 2 favorable, 2 unfavorable, and 2 neutral
match-ups** — nothing is ever strictly dominant, by construction, not
by hand-tuning:

| Attacker ↓ / Defender → | Fire | Earth | Spark | Water | Spirit | Undead | Charm |
|---|---|---|---|---|---|---|---|
| **Fire** | — | ✅ | ✅ | ⬜ | ⬜ | ❌ | ❌ |
| **Earth** | ❌ | — | ✅ | ✅ | ⬜ | ⬜ | ❌ |
| **Spark** | ❌ | ❌ | — | ✅ | ✅ | ⬜ | ⬜ |
| **Water** | ⬜ | ❌ | ❌ | — | ✅ | ✅ | ⬜ |
| **Spirit** | ⬜ | ⬜ | ❌ | ❌ | — | ✅ | ✅ |
| **Undead** | ✅ | ⬜ | ⬜ | ❌ | ❌ | — | ✅ |
| **Charm** | ✅ | ✅ | ⬜ | ⬜ | ❌ | ❌ | — |

(✅ = attacker favored ×1.25, ❌ = attacker disadvantaged ×0.8,
⬜ = neutral ×1.0. Damage is `round(base × multiplier)`, so the effect
is felt but never swings a fight on its own — a deliberately gentle
number, the same instinct behind Charm's damage-reduction floor of 1.)

Loose flavor (the table is what's balanced; the flavor is just to make
it memorable, the same way not every Pokémon type match-up has a
perfectly airtight real-world justification): Fire scorches Earth and
burns through Spark's circuits; Earth grounds Spark and dams Water;
Spark electrifies Water and disrupts Spirit's energy; Water is hostile
ground for Spirit and cleanses Undead; Spirit overcomes Undead and
resists Charm's manipulation; Undead is fearless against Fire and
immune to Charm; Charm redirects Fire's passion and out-maneuvers
Earth's brute physicality.

Elemental multiplier only applies to **damage**, not healing or
shielding — keeps the system's surface area contained to the thing
players are already used to predicting (combat), rather than also
making support numbers element-dependent.

### 8.4 Role stat archetypes

Each role favors a different 2–3 stats, expressed as each hero's actual
stat block rather than an enforced rule — a future hero can still bend
its role's archetype the way Spirit Mage already bends "Mage" away from
pure Inferna-style burst. Rough shape per role:

- **Tank**: high Health/Defense, high Shield Strength, low Speed.
- **Support**: high Healing Power, moderate Energy/CDR, low Attack.
- **Brawler**: balanced Attack/Health, moderate Defense, moderate Speed.
- **Mage**: high Attack, high Energy, low Defense/Health.
- **Speedster**: high Speed/Evasion, low Health/Defense.
- **Gunslinger**: high Accuracy/Critical Chance, moderate Attack, low
  Health.

Concrete numbers are in section 2's updated hero table.

### 8.5 Speed-based resolution order (replaces "player1 always first")

Section 5.2's interleave ("player1's 1st queued action, player2's 1st,
player1's 2nd, …") is replaced by sorting **all** queued actions from
both players into a single list ordered by the acting hero's Speed,
highest first — the Pokémon-style "faster mon moves first" rule, applied
per-action rather than per-turn since both players queue several
actions a round. Ties (equal Speed, or a Team-Up with no single acting
hero) keep the old alternating-starting-with-player1 rule as a
stable tiebreak, so existing tests that don't care about Speed keep
their original resolution order. Everything else about resolution —
fizzling when a target/source/required-hero dies earlier in the same
sorted order, stopping instantly on match-over — is unchanged from
section 5.2, just reading from a Speed-sorted list instead of a
strictly-alternating one.

This is also why Speed stays out of the Critical Chance formula in
8.2 despite the obvious "faster = more precise" flavor: Speed already
decides turn order on its own, and letting one stat govern two
different axes of power would make it the only stat worth investing
in, which directly contradicts "no role should dominate the meta."

## 9. Presentation: from a 3D battlefield to a 2D side-on scene

The battle screen was originally a React Three Fiber / Three.js 3D
scene (`src/scene/Battlefield.tsx` driving a `<Canvas>`, with heroes
built procedurally out of Three.js primitives in `HeroModel.tsx`). It
was rebuilt from scratch as a flat 2D side-on presentation, closer to
*Slay the Spire* — two facing columns of hand-drawn SVG character
sprites on a static backdrop, no camera, no 3D scene graph at all.
`@react-three/fiber`, `@react-three/drei`, and `three` were removed
from the project entirely (dropping the production bundle from ~1.37MB
to ~460KB) — there is no 3D rendering anywhere in the app anymore.

**The honest ceiling hasn't changed, only its shape:** this project
still has no image-generation or illustration tooling. What changed is
the medium the hand-built art lives in — flat, hand-coded SVG shapes
instead of hand-placed 3D primitives. The visual language is a bold,
flat "cartoon" style (thick dark outlines, flat fills, chunky
proportions) rather than an attempt at painted or photo-real
illustration, which stays out of reach for the same reason it always
was: nothing in this environment can generate or paint an image.

### 9.1 Layout: two facing formations

`Battlefield.tsx` renders a `.battlefield-2d` container with two
`Formation` columns — the player's team on the left (facing right),
the opponent's on the right (facing left) — each a vertical stack of
up to 3 heroes on a shared "ground," matching the classic side-view
JRPG/roguelike-deckbuilder framing the request asked for. Each hero
slot pairs a `hero-plate` (name, HP bar, Speed, shield badge — plain
DOM now, no longer an R3F `<Html>` overlay) with a `HeroSprite`.

### 9.2 `HeroSprite.tsx`: the shared 2D rig

Every hero is drawn from one shared "chassis" (the 2D equivalent of
the old `TORSO_SHAPE`/skeleton system): fixed leg/arm/head anchor
points, with only torso width/height varying by role. Per-hero
identity is layered on top exactly like before, just re-expressed as
flat SVG shapes instead of 3D meshes:

- **Cosmetics** (`heroCosmetics.ts`, unchanged): skin/eye/hair color
  per hero, reused as-is since it was never 3D-specific.
- **Hair** (`Hair()`): a hand-drawn silhouette path per hero — a swept
  fringe + bun (Inferna), a buzzcut dome, flowing side-locks, a
  three-spike mohawk, a hood-sliver, a ponytail + sharp spike, or long
  trailing hair.
- **Role gear** (`RoleGear()`): a staff for Mages, shoulder plates +
  gauntlet for Tank, a halo for Support, a bat for Brawler, a hood
  silhouette for Speedster, a pistol (+ visor for Charm) for
  Gunslinger — anchored at the shared front-hand/head points.
  Mirrors the old per-role `RoleGear` switch one-for-one.
- **Element aura** (`ElementAura()`): a few small floating colored
  dots per element, animated with a CSS `@keyframes` bob instead of a
  Three.js `useFrame` loop — same "glowing energy accent, not a real
  particle system" intent as before.
- **Animation cues**: attacking lunge, hit/heal/shield flash, and the
  defeated collapse are all CSS transitions/classes toggled from the
  same `AnimCue` prop the 3D version used, driven by
  `useEventQueue`/`cuesForEvent()` — the animation *logic* didn't
  change, only the rendering technology underneath it.

### 9.3 Real illustrated art: `REAL_ART` in `HeroSprite.tsx`

Hand-coded SVG shapes were never going to close the gap to real
character art — no amount of path-tweaking stops it reading as
"shapes." Once the player supplied an actual illustrated turnaround
(front/back/profile views on a plain background) for Inferna, the
right move was to stop drawing and use it: `HeroSprite.tsx` now checks
a small `REAL_ART: Partial<Record<HeroId, string>>` map before
building the vector chassis at all, and if a hero has an entry it
renders that image directly (`<img>`, `object-fit: contain`, bottom-
aligned on the same ground line) instead of any SVG. Every animation
cue (lunge, hit/heal/shield flash, defeat collapse) still applies —
they're CSS classes on the wrapper/visual element, agnostic to whether
the thing underneath is a raster image or a vector shape. Status
badges, targeting glow, and facing-mirror all work unchanged for the
same reason. Heroes without a `REAL_ART` entry keep using the shared
vector chassis (§9.2) exactly as before — this is additive, not a
replacement of the whole rig.

**Getting a photo/illustration into a game-ready sprite:** the supplied
image was a flat-background illustration (turnaround sheet with
front/back/profile panels). The relevant panel was cropped out with
`sharp`, then its solid background was keyed to transparency with a
small hand-rolled script — sample the background color from a few
points along the top edge (never the bottom, which often has a floor
shadow that isn't background), then walk every pixel and set alpha
based on color distance from that sample, with a soft threshold band
so anti-aliased edges fade instead of leaving a hard cutout ring. This
works well for a flat/uniform background; it is not real subject
segmentation and will do a mediocre job on a busy/photographic
background — get the source image on as plain a background as possible
(ideally by asking the image generator for one directly) for this to
work well.

**Facing convention:** every hero, vector or real-art, is authored/
stored facing right — `facing={1}` (the ally column) renders it as-is,
`facing={-1}` (the enemy column) mirrors it with `scaleX(-1)`. A
source photo doesn't automatically satisfy this — Inferna's supplied
art had her gaze/head-turn toward image-left, so the stored asset was
pre-flipped (`sharp().flop()`) once at import time to face right,
rather than special-casing the mirror logic per hero. Check which way
a new hero's source art is oriented before dropping it into `REAL_ART`.

**Leaning into the pixelation:** at typical in-game display size, the
illustration reads as pixelated rather than perfectly smooth. Rather
than fight that, `.hero-sprite-img` sets `image-rendering: pixelated`
so the browser scales with crisp nearest-neighbor blocks instead of
blurring — an intentional retro-pixel look instead of an accidental
soft one. This affects every `REAL_ART` hero, not just Inferna.

**Idle and attack motion:** a small continuous idle bob
(`@keyframes idle-bob`, ±3px vertical, 2.6s loop) now runs on every
hero's visual layer — SVG or image — so standing heroes don't read as
frozen; it's suppressed on defeat. The attack lunge (`.lunging`) is now
a proper `@keyframes attack-lunge` (dash forward ~24px with a slight
scale-punch, then back) instead of a static transform relying on the
wrapper's generic transition, giving it a real there-and-back arc
inside its ~380ms window rather than an instant snap.

### 9.4 What's still explicitly not attempted

Hand-rigged skeletal animation (the kind Slay the Spire actually uses —
separate arm/weapon layers moved frame-by-frame by an animator via
something like Spine), per-hero unique poses for the vector heroes
(they still share one chassis), and true background segmentation for
photos with busy backgrounds — none of these have a tool in this
project to produce them. A `REAL_ART` hero is a single static image
animated only as a rigid whole (translate/flash/rotate), not a rigged
character. [`CHARACTER_CONCEPTS.md`](./CHARACTER_CONCEPTS.md) remains
the written creative reference for heroes that don't have real art yet.

A real video clip for Inferna's attack was briefly wired in (a
`REAL_ART_ATTACK` map swapping her lunge for an actual `<video>` on the
`"attacking"` cue) and then deliberately reverted at the requester's
call — back to the plain CSS lunge for every hero, video included.
Worth remembering if this comes up again: the mechanism worked (mounted
cleanly, zero console errors), the only open questions were pacing
(the clip's own length vs. the ~500ms engine event step) and file size
(shipped as supplied, no compression tool exists here to shrink it).

### 9.5 A real battlefield background

`Battlefield.tsx` renders a `.battlefield-bg` layer using a real
painted arena image (`src/assets/backgrounds/arena-plaza.jpg`, resized
to 1280px wide and JPEG-compressed) behind both formations, with a
`.battlefield-scrim` gradient over it — darker at the top and bottom
(where the hero-plates and hand tray need to stay legible), clearer
through the middle where the two formations actually stand. This
replaced the old flat two-tone gradient (`battlefield-sky`/
`battlefield-ground`). Unlike hero art, a background doesn't need
transparency or facing/mirroring — it's a single `background-image`
sized with `cover`, so any similarly-composed wide image drops in
(swapped once already, from an initial rift-meadow image to this
plaza one, with no code changes needed beyond the import path).

### 9.6 Real-device fit-and-finish pass

A phone screenshot surfaced two things that looked fine at desktop
testing size but not on an actual device:

- **Inferna's `real-art` box was too dominant.** At 96×178px next to
  the SVG heroes' 74×92px, she visually swallowed the formation column
  on a real screen. Shrunk to 76×132px — still taller than the vector
  chassis (a full-body portrait can't be squished into the same box
  without going illegibly thin), but no longer out of proportion with
  the rest of the roster. `.hero-slot`'s gap also went from 2px to 6px
  so the plate and sprite aren't touching.
- **Hero-plates read as generic.** Reworked to feel more like this
  game specifically: a `--element-color` CSS variable (from the same
  `ELEMENT_COLOR` map used everywhere else) drives a colored top
  border per hero, and the HP bar now shifts color by threshold —
  green above 50%, amber 25-50%, a pulsing red at or below 25% — via
  an `hpTier()` helper in `Battlefield.tsx`, instead of one flat green
  gradient regardless of how much danger a hero is actually in. The
  Speed stat became a small pill badge instead of floated plain text,
  matching the badge language used elsewhere (`sprite-badge`, deck
  builder stat chips). Widening the plate to 148px (from 110px) was
  necessary to fit "Earth Guardian" — the roster's longest name — in
  full now that the pill costs more horizontal space than the old
  floated text did.

### 9.7 Scattered formations

Each `.formation`'s 3 heroes originally stacked in one rigid vertical
line via `justify-content: space-evenly`. `nth-child` transforms on
`.hero-slot` now jitter each slot's horizontal position (and give the
middle slot a small vertical nudge via negative margin) so a team
reads as loosely standing around their half of the floor instead of
queued up single-file — while staying strictly grouped on their own
side of the divide (`.formation-left`/`.formation-right` mirror the
offsets so both scatter toward their own outer edge, never toward the
center where they'd cross into the opposing team's space). This is
static per-slot-index jitter, not a real per-hero position system —
still fine for a fixed 3-per-side roster.

**Follow-up bug:** `.formation` still had `height: 100%` with
`justify-content: space-evenly` from before the scatter change, which
spread the 3 slots across the *entire* battlefield height — including
the sky/pillar area of the new plaza background (9.5), not just its
floor. The tallest hero in a formation would visually stand up in the
architecture instead of on the ground. Fixed by dropping the fixed
height so `.formation` sizes to its own content, letting the parent
`.battlefield-2d`'s existing `align-items: flex-end` cluster the whole
team down onto the floor the way it was already set up to for a
content-sized child. That in turn pushed the lowest hero close enough
to the bottom edge to clip under the "Round N — ..." toast
(`.latest-event-toast`, absolutely positioned near the bottom of the
same area) — fixed by giving `.battlefield-2d` more bottom padding
(16px -> 52px) as clearance.

**Second follow-up:** even content-sized, the 3-slot stack (plate +
sprite + gaps, repeated 3x) was still taller than the plaza image's
visible floor band, so the first slot's feet remained above the floor
line. Rather than fight the geometry further, gave the per-slot
transforms an explicit vertical component so the cluster's effective
footprint compresses onto the floor band instead of relying on the
natural stack height to fit. The middle slot's outward horizontal
offset was also increased so it reads as more clearly spread toward
the screen edges — first tried 30px, which pushed the 148px-wide plate
far enough out to clip against the actual screen edge on a narrow
phone viewport; a smaller value was the safe middle ground.

**Third follow-up — a real clipping bug, not just an aesthetic one:**
a phone screenshot showed the top hero's plate cut off entirely (only
the HP bar visible, the name row hidden above the visible screen) —
worse than "floating," actually invisible. The root issue: the fixed
sizes above were tuned against this session's own test viewport
(420×900), which turned out to be noticeably taller than the
requester's real device. `.battlefield-2d` has `overflow: hidden`, so
once the 3-hero stack's total height exceeded the *actual* available
space, the top slot didn't just look wrong, it got clipped by the
container's own bounds.

Fixed by shrinking the whole stack's footprint with real headroom
instead of chasing one specific device's numbers: `.formation` gap
(10px → 2px), `.hero-slot` gap (6px → 2px), the SVG hero box
(74×92 → 58×66), Inferna's `real-art` box (76×132 → 58×82), and the
hero-plate's padding/HP-bar/name-row spacing all trimmed a couple of
pixels each. The per-slot vertical nudges from the second follow-up
were bumped up alongside this (top slot `translateY(16px)`, bottom
slot `translateY(-8px)`) for extra margin. Verified with a
`getBoundingClientRect()`-based check (not just eyeballing
screenshots) across three viewport heights (900px/700px/640px) — the
900px and 700px cases now clear with real margin; only the most
extreme 640px case still clips slightly, which is shorter than
essentially any real phone's logical viewport height, so not chased
further at the cost of making everyone uncomfortably tiny.

### 9.8 Minimal hero-plates

The hero-plate was cut down to just what's needed at a glance during
play: name on one line, a role emblem and an element emblem in that
line's top-right corner, and an HP bar underneath with the number
overlaid directly on the bar rather than a separate text row. Dropped
entirely: the Speed stat pill and the separate HP-text/shield row from
earlier passes (§9.6) — this plate is for "who is this and how hurt
are they," not a full stat readout.

`ROLE_SYMBOL: Record<Role, string>` in `heroVisuals.ts` is the new
counterpart to `ELEMENT_SYMBOL` — 🪄 Mage, 👊 Brawler, 🛡️ Tank, 💨
Speedster, 🔫 Gunslinger, 💚 Support — deliberately no overlap with any
element emoji. The shield indicator that used to live on the plate
moved to a `sprite-badge` on the hero's own sprite instead (matching
where burn/wet/empower/charm already lived), so removing it from the
plate didn't remove the information, just relocated it next to the
other status badges.

Net effect (bonus, not the point of the change): the shorter plate
further reduced the 3-hero stack's total height, which cleared even
the unrealistically-short 640px case that §9.7's fixes left slightly
clipped — verified again with the same `getBoundingClientRect()` check
across all three viewport heights.

### 9.9 Second real-art hero: Mourn, and a background-color lesson

The Undead Assassin got the same real-art treatment as Inferna
(§9.3) — only the flavor name changed, to **Mourn** (`heroId` stayed
`"undead-assassin"`, since this is a proper-noun/flavor change, not a
mechanics rename like Assassin→Speedster was; a stale doc row from
that earlier rename still said "Assassin" in the §2 balance table and
got fixed to "Speedster" while touching this row).

**The background-removal pipeline broke on the first supplied image,
for a new reason:** that image had a pure-black background, and Mourn's
own costume (hood, sleeves, skirt) is also predominantly black. The
same color-distance threshold that correctly keyed out the background
also ate transparency into large parts of her own dark clothing —
confirmed by compositing the cutout onto a light checkerboard and
seeing visible holes through the robe. §9.3's keying approach isn't
just sensitive to a *flat* background, it's sensitive to a background
whose color is *distinct from the subject's own palette* — a technique
that worked fine for Inferna (bright warm colors against a plain
background) silently fails for a subject sharing the background's hue.
The fix here was supplied by the source material itself: a second,
white-background version of the same artwork was provided, which keyed
out clean with no holes (verified the same way, composited onto a dark
checkerboard this time so any transparency in the dark costume would
show up clearly against it).

**Facing:** unlike Inferna, Mourn's face is fully obscured inside her
hood, so there's no gaze/head-turn cue to judge orientation from the
static source image the way §9.3 could — she was first dropped into
`REAL_ART` unflipped on the assumption that a frontal, hooded pose
would read fine either way. It didn't: checked live in-game, she read
as facing the wrong way (the body's subtle 3/4 turn and trailing torn
cloth are enough of a directional tell even without a visible face).
Fixed the same way as Inferna — one `sharp().flop()` on the stored
asset, no code changes — and reconfirmed on both sides of the
battlefield. Lesson for future faceless/hooded real-art heroes:
"no visible gaze" doesn't mean "no facing to get wrong," it just means
the tell is subtler (posture/cloth-flow instead of eyes) — still
needs the live in-game check both ways, not just an assumption from
the static source image.

**A real-device screenshot then showed a pale halo tracing her whole
silhouette** — worst along the tattered cloth edges, which have a lot
of fine, high-frequency linework relative to their solid area, so the
artifact was far more visible than it had been on Inferna's flatter
shapes. Root cause: §9.3's keying script only ever set the *alpha*
channel from color distance; it never touched the *RGB* of the
partially-transparent ramp pixels. On a white background, anti-aliased
ink lines blend toward white at the edges, so those ramp pixels are
still carrying white-contaminated color even once alpha says
"mostly transparent" — composited onto the game's dark floor art, that
contaminated color reads as a pale fringe. Tightening the alpha ramp
(tried first) made it *worse*: a soft ink line's white→black
transition is genuinely wide, so a tight threshold just snaps more of
the mid-gray transition pixels to fully-opaque-as-is instead of
letting them fade.

Fixed with two additions to the keying script, applied in this order:

1. **Color decontamination.** For any pixel with partial alpha, solve
   for the true foreground color assuming it's a linear blend with the
   sampled background (`fg = (pixel - (1-a)·bg) / a`, clamped to a
   valid byte range) instead of keeping the blended color as-is.
2. **A one-pixel alpha erosion** (3×3 min-filter, applied twice) after
   a *wider* distance ramp. The wider ramp lets genuine anti-aliasing
   fade out gradually (which decontamination alone doesn't fully
   clean up, since the distance-based alpha estimate is still only an
   estimate); the erosion then eats what's left of the fringe ring.
   A 1-2px shrink is imperceptible on a stroke this size but removes a
   fringe that's exactly that thin.

Also stripped the illustration's own drawn floor-contact shadow (a
smooth, near-white gradient blob under her shoes on the original art)
with a small local-variance pass: pixels in the bottom band of the
image that are both light and *smooth* (low variance in a 5×5
neighborhood, unlike the high-contrast linework of the shoes
themselves) get their alpha zeroed. The game already draws its own
`hero-sprite-ground` contact shadow at render time, so the source
art's baked-in one was redundant and, on the reddish arena floor, read
as another patch of unwanted white.

Same pass also bumped every hero's on-screen size up a notch (SVG
chassis 58×66 → 64×72, `real-art` box 58×82 → 64×88) per feedback that
the whole formation read too small on a real device. Re-verified with
the same `getBoundingClientRect()` cross-viewport check from §9.7
(900/700/640px) before settling on these numbers — an initial larger
bump (66×76 / 66×94) reintroduced clipping at the shortest case, so
the final sizes are the largest that still clear all three with margin
to spare.

### 9.10 Bigger heroes, smaller health bars

A follow-up ask: heroes still read too small, and now that the plate
carries less information (§9.8) it didn't need to be as physically
big either. Since the hero-plate sits directly above the sprite in the
same `.hero-slot` column, shrinking one directly frees vertical
headroom for the other — the two requests solve each other instead of
trading off. Plate width 136px → 112px, padding/font-size/emblem-size
all trimmed a notch, HP bar height 12px → 9px; that headroom went
straight into another size bump for the sprites (SVG chassis
64×72 → 72×77, `real-art` box 64×88 → 72×91).

Same iterative process as §9.9's sizing: try a size, run the
`getBoundingClientRect()` cross-viewport check (900/700/640px), back
off if the shortest case clips, repeat. An initial attempt at a bigger
jump (78×88 chassis, 78×108 real-art) clipped badly at 640px even
with the smaller plates; the final numbers above are the largest that
clear all three heights, with a few pixels of margin at the shortest
one this time instead of none.

### 9.11 Third real-art hero: Kairo, and the keying pipeline paying off

The Charm Gunslinger got the same treatment as Inferna and Mourn —
flavor rename to **Kairo** (`heroId` stays `"charm-gunslinger"`), real
art wired into `REAL_ART`. Unlike the previous two, this one was
uneventful: the supplied source image was already on a plain white
background with no dark-costume-vs-background conflict (§9.9), so the
keying script from that section — wide alpha ramp, color
decontamination, erosion, drawn-shadow strip — was reused as-is and
produced a clean cutout on the first try, verified the same way
(composited onto both a dark and a warm-floor-colored checkerboard).
Worth calling out only because it confirms the pipeline built for
Mourn's harder case generalizes: it's now the default approach for any
new real-art hero, not a one-off fix.

**Facing:** unlike Mourn, Kairo's face is fully visible and clearly
turned/gazing toward image-left in the source art (head tilted, eyes
cast down-left) — the same kind of gaze cue Inferna had. Pre-flipped
with `sharp().flop()` before ever wiring him in, on the theory from
§9.3 rather than needing a live in-game correction like Mourn did.

He's also a different build than the previous two real-art heroes —
tall and slim rather than a flowing dress silhouette — which trims
down to a narrower box after `trim()` (225×700 vs. Inferna/Mourn's
~500×700). No code changes needed for this: `object-fit: contain`
on `.hero-sprite-img` already centers and scales whatever aspect
ratio a given hero's art has within the shared `real-art` box.

### 9.12 Hitting the real ceiling on "bigger," and a better fit-test

Explicit ask: heroes twice as big, health bars a quarter their size.
The health-bar half was easy — see the numbers below. Literal 2×
sprites was not: built and measured, and it clipped badly on the
700px and 640px test heights (not just the unrealistically-short
640px case this time — 700px is a real budget-phone height). The
`.hero-plate` sitting above each sprite in the same column means
there's a hard vertical budget per hero-slot, and doubling blows
through it no matter how far the plate shrinks.

Backed off by testing intermediate scales against the
`getBoundingClientRect()` cross-viewport check (§9.7/§9.10) and
picking the largest that survived — landed on SVG chassis 72×77 →
75×80, `real-art` box 72×91 → 75×94, roughly a 4% bump. Far short of
"twice," but it's the true ceiling for a 3-hero-per-side vertical
stack at these screen heights without changing the formation layout
itself (fewer heroes visible at once, horizontal scroll, etc. — out of
scope here).

**The fit-check itself needed a fix first.** Repeated runs of the
existing check at an *identical* CSS size gave wildly different
margins (as low as a few px, occasionally negative) — looked like
animation jitter at first, but the real cause was hero composition:
the check only fixes the human player's 3 heroes, and the bot's 3 are
picked from whoever's left, so some runs land 2 of the 3 real-art
heroes (taller boxes) on the bot's side and some don't. A single run
at a given size was measuring "how did the bot's random draw go
today," not "does this size fit." Fixed by adding a second script
(`qa-worst-case.mjs`) that force-picks all 3 real-art heroes onto one
side to test the actual tallest possible stack directly, plus running
the original random check 10+ times before trusting a size — a couple
of runs is not enough when composition is part of what's being
measured.

For the record, the health-bar shrink (roughly the requested 0.25×
reduction on top of §9.10's already-smaller plate): width 112px →
84px, hpbar height 9px → 7px, font-size 8px → 6px, hptext 7px → 5px,
emblem 9px → 7px, padding/border-radius trimmed to match. Legibility
is getting close to a real floor: the HP number at 5px is readable on
a real screen's higher pixel density but genuinely tiny in a plain
screenshot crop — worth a real-device check before going any smaller.

### 9.13 Un-stacking the plate: the actual lever for bigger heroes

§9.12's conclusion — "the largest sprite that fits is a small bump,
2× just doesn't fit" — was true for the layout at the time, but it
was accepting a self-imposed constraint rather than the real one. The
hero-plate and the sprite were laid out as two stacked in-flow
children of `.hero-slot`, so the plate's own height was permanently
subtracted from every hero-slot's vertical budget. Following up on
"heroes need to be bigger, they're the heart of this game," the actual
fix was to stop paying that tax: `.hero-plate` is now
`position: absolute`, anchored to `bottom: 100%` of `.hero-slot`
(floating just above the sprite with a 2px gap) instead of sitting
in-flow above it. Pulled out of the flex flow, its height no longer
counts against the slot at all — every pixel it used to cost is now
free for the sprite. No JSX changes needed; `.hero-plate` and the
`HeroSprite` were already siblings in the DOM, this is purely a
positioning change.

Net result: SVG chassis 75×80 → 84×89, `real-art` box 75×94 → 84×105 —
a much bigger jump than §9.12's, on top of §9.12's already-smaller
plate. Sized the same iterative way (§9.7/§9.10/§9.12): push a size,
run both cross-viewport checks, back off if either clips.

**Also hardened the checks themselves**, because chasing a razor-thin
margin against `getBoundingClientRect()` turned out to be measuring
noise as much as signal: the idle-bob animation and (per §9.12) hero
composition both shift the observed margin run-to-run by a
meaningful amount. A size that "passed" on one run clipped on the
next. Fixed by requiring a genuine safety margin (tens of px, not a
handful) confirmed across *many* repeated runs of both the random
check and the forced-worst-case check before trusting a size — one
clean run is not evidence, given how much these numbers move between
otherwise-identical runs.
