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

- **Steam Surge** (Inferna + Tydra): 1) deal fixed damage to all
  enemies → 2) remove Wet from any enemy that had it → 3) apply Burn to all
  enemies.
- **Thunder Tide** (Tydra + Lightning Duelist): 1) apply Wet to all
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
| Tydra | Support | Water | 20 | |
| Spark Duelist | Brawler | Spark | 20 | |
| Mourn | Speedster | Undead | 16 | first hit taken reduced by 3 |
| Kairo | Ranger | Charm | 17 | +1 dmg vs. Charmed targets |
| Spirit Mage | Mage | Spirit | 16 | survives one lethal hit at 1 HP per match |

| Card | Hero | Cost | Effect |
|---|---|---|---|
| Fire Bolt (attack) | Inferna | 1 | 5 dmg to one enemy + apply Burn (2 triggers, 3 dmg each) |
| Flame Wave (ability) | Inferna | 2 | 3 dmg to all enemies |
| Kindle Spirit (support) | Inferna | 2 | Empower one ally: +4 dmg on their next damage-dealing action |
| Stone Strike (attack) | Earth Guardian | 1 | 5 dmg to one enemy |
| Fortify (ability) | Earth Guardian | 2 | +6 Shield to one ally |
| Guardian's Watch (support) | Earth Guardian | 2 | +3 Shield to every allied hero |
| Tidal Shot (attack) | Tydra | 1 | 3 dmg to one enemy + apply Wet |
| Restoring Current (ability) | Tydra | 2 | heal 6 (7 if first heal this match) to one ally |
| Encouraging Current (support) | Tydra | 2 | Empower one ally: +4 dmg on their next damage-dealing action |
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
- **Tydra**: the first healing card *this player* uses each match heals +1 additional.
- **Spark Duelist**: whenever this hero's card consumes Wet for the bonus-damage interaction, this hero gains 2 Shield.
- **Mourn**: the first damage instance taken by this hero each match is reduced by 3 (min 1).
- **Kairo**: +1 damage dealt by this hero to any target that currently has Charm.
- **Spirit Mage**: the first hit that would defeat this hero each match instead leaves them at 1 HP.

Team-Up cards:
- **Steam Surge** (Inferna + Tydra, cost 3): 6 dmg to all enemies → remove Wet from any hit → apply Burn (2 triggers, 3 dmg) to all enemies.
- **Thunder Tide** (Tydra + Spark Duelist, cost 3): apply Wet to all enemies → deal 4 dmg + 3 Wet bonus (7 total) to each enemy, consuming Wet.
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
Brawler, Tank, Assassin, Ranger, Support). Two existing heroes were
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
one role gap (**Ranger**) and two element gaps (**Charm**,
**Spirit**). Two new heroes cover all three:

- **Kairo** (Charm element, Ranger role, 17 HP)
- **Spirit Mage** (Spirit element, Mage role, 16 HP — Mage is reused,
  since roles aren't required to be unique across the roster any more
  than "Support" was unique to Tydra before section 6)

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
Tydra's "dedicated healer."

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
  something that happens on its own — Ranger-role heroes start
  closer to the threshold, matching "Rangers excel at... Critical
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
- **Ranger**: high Accuracy/Critical Chance, moderate Attack, low
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
  Ranger — anchored at the shared front-hand/head points.
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
Speedster, 🔫 Ranger, 💚 Support — deliberately no overlap with any
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

The Charm Ranger got the same treatment as Inferna and Mourn —
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

### 9.14 Illustrated role emblems, and Gunslinger → Ranger

The emoji-based `ROLE_SYMBOL` map (§9.8) is replaced with real
illustrated emblems — six matching metallic "target-ring" badges, one
motif per role (bow for Ranger, shield for Tank, praying hands for
Support, fist for Brawler, crescents for Mage, running figure for
Speedster). Along with the new art, the Gunslinger role itself was
renamed to **Ranger**. Unlike the Inferna/Mourn/Kairo renames, this
one *is* a mechanics-vocabulary change, not a flavor name — `Role` is
a type union, not a per-hero string — so it needed the fuller sweep
that a hero flavor rename doesn't: the `Role` type itself
(`types.ts`), the hero definition using it (`heroes.ts`), the SVG
chassis's per-role torso dimensions and held-gear switch
(`HeroSprite.tsx`), the role-symbol map, tests, and docs. Kairo's
`heroId` stays `"charm-gunslinger"` regardless (an internal id, never
shown to players).

**Keying these was mostly a repeat of the pipeline built for Mourn and
reused for Kairo** — pure black background, no subject/background
color conflict since the art is all cool-metal grays — but two new
problems showed up once the icons were actually sized down to a
health-bar badge:

1. **The ring frame doesn't survive downscaling.** Each emblem is a
   thin decorative circular ring around a small central icon. At
   anything close to the badge's ~14-16px display size, the ring's
   fine strokes disappear into noise and the whole thing reads as a
   gray smudge — confirmed by rendering actual side-by-side previews
   at 14/18/22/28px rather than trusting a full-size preview (a
   full-size composite looked great and was misleading about how it'd
   actually read at 1/8th the size). Fixed by cropping in on just the
   inner ~55% of each emblem (proportionally, not a fixed pixel
   offset, since the six source images aren't identically
   proportioned) before the final resize, so the pixel budget goes to
   the actual symbol instead of the ring.

2. **Metallic gray has poor contrast against the plate's dark navy
   background**, even after the ring crop — silver-on-near-black
   reads as a dim blur rather than a crisp icon. Fixed with
   `sharp().tint()` recoloring each icon to the game's existing
   `#ffd24a` gold accent (already used for the Fight button, targeting
   glow, etc.) — `tint()` recolors by chroma while keeping the
   original shading/highlights, so the metallic relief is preserved,
   it's just gold instead of gray. The contrast jump against the dark
   plate was dramatic and immediate once tried; this is likely the
   right default treatment for any future small icon-on-dark-UI asset
   in this game, not a one-off fix.

Same real-device caveat as the HP text (§9.12): a 16px badge in a flat
screenshot reads smaller/blurrier than it will on an actual phone's
higher pixel density, so the exact size chosen here is worth a
real-device sanity check rather than being treated as final.

### 9.15 The ring crop was wrong: show the whole emblem, badge-sized

A live-device screenshot showed the Speedster emblem as a small gold
squiggle instead of a running figure. The proportional "crop off 22%
each side to remove the ring" from §9.14 wasn't ring-aware, it was
just a blind inset — and for the running-figure emblem specifically,
whose speed-lines and silhouette aren't centered the same way the
other five roughly-symmetric icons are, that inset sliced straight
through the figure's head and torso, keeping mostly legs and speed
lines. The other five happened to survive because their content is
close enough to centered that a uniform inset mostly ate ring, but it
was luck, not a correct crop. Fix: show the *complete* emblem (ring
included) rather than trying to algorithmically remove it.

That reintroduced §9.14's original problem (the full ring reads as a
smudge at ~16px) — solved this time by sizing up instead of cropping
down. Rendering actual side-by-side previews at several sizes (not
trusting a full-size mockup, same lesson as §9.14) showed the complete
ring only becomes clearly legible around 32px, roughly double the
previous attempt. Shipped role icon and element emoji both at that
size (`.hero-plate-emblem` font-size 7px → 28px to match), which is
far too big to sit inline in the name row next to 6px text — it would
dwarf it — so the emblems moved from an inline flex child of
`.hero-plate-name` to an absolutely-positioned corner badge instead,
pinned to `.hero-plate`'s top-right corner and overlapping outward
past its edge (`.hero-plate` was already `position: absolute` per
§9.13, so this needed no DOM changes, just a position swap on the
existing `.hero-plate-emblems` element). This is much closer to what
was actually asked for back in §9.8 ("role emblem and type emblem in
the top right of the health bar area") — a corner badge, not an
inline row item.

The badge now overlaps slightly onto whichever hero-slot sits above it
in the same team's vertical stack, a new minor visual collision this
change introduces (tuned the badge's upward offset to minimize it, not
eliminate it — eliminating it entirely would mean shrinking the badge
back down and reintroducing the legibility problem this section just
fixed). Cosmetic only: hero-plates aren't interactive, so an overlap
never blocks a click, just occasionally overlaps another plate's
corner.

### 9.16 §9.15 was wrong too: a real-device screenshot overruled it

A real phone screenshot showed the ~32px badges from §9.15 dwarfing
the entire plate — bigger than the health bar itself, overlapping
neighboring plates and hand-tray cards. §9.15's own preview-at-several-
sizes methodology was sound for judging *legibility in isolation*, but
never checked the badge against the plate it has to share space with,
so "32px is where the ring becomes readable" quietly became "32px on
an 84px-wide plate," which is a different and much worse question.

Reverted to a small, fully-contained corner badge: role icon and
element emoji both back down to ~14-15px, `.hero-plate-emblems`
repositioned from overflowing outside the plate's edges (`top: -6px;
right: -8px`) to sitting inside them (`top: 3px; right: 4px`), with
`.hero-plate-name-text` given `padding-right` to reserve room so the
name truncates before running under the badge instead of behind it.
Still the same full (uncropped) emblem image from §9.15's fix, just
small again — the ring-legibility tradeoff from §9.14/§9.15 is
unresolved in the abstract, but a direct "no, that's silly, make it
fit" from an actual device is stronger evidence than a synthetic
side-by-side size preview, so small-but-part-of-the-ring wins over
big-but-legible-in-isolation here.

The takeaway for next time: when sizing something that has to coexist
with a fixed-size container (the plate), preview it *in that
container*, not just on its own — an isolated preview can validate
"is this legible" while completely missing "does this fit," and those
are independent questions.

### 9.17 §9.16 still overlapped the bar — stop hand-positioning, go back to flex

§9.16's "contained" badge still visibly sat on top of the health bar
in the next screenshot ("why would I want them on the health bar").
Root cause: `.hero-plate-emblems` was absolutely positioned relative
to the *whole plate* (`top: 3px` from the plate's top edge), so
getting it to land only within the name row and never touch the bar
below meant its size had to be hand-tuned against the exact pixel
math of the plate's padding + name-row height + margin — fragile, and
wrong in this case (15px tall vs. roughly a 10px budget before the bar
starts).

Fixed by giving up on absolute positioning for this element entirely
and going back to a plain flex child of `.hero-plate-name`, which is
what it was before all of §9.14-9.16's churn. As a normal flex item
with `align-items: center` on its parent row, the row's own height
simply grows to fit whatever the badge's height is, and the hp bar —
a sibling `<div>` below that row in normal flow — always sits cleanly
after it, however big or small the badge ends up. No pixel math to
get right or wrong. Landed on 12px for both the role icon and the
element emoji (explicitly matched per the request that they read as
one visual unit), tucked at the row's right edge by the name text's
`flex: 1` pushing everything else to the end — which is what "top
right corner of the box" actually meant, not a corner overlay
independent of the row structure.

The recurring mistake across §9.14-9.17 was reaching for
`position: absolute` to place something "in a corner" when the
existing flex layout already puts things in that corner for free,
correctly, and without needing to hand-verify pixel budgets — absolute
positioning here kept relitigating the same "does it fit against its
neighbors" question that flexbox exists to answer automatically.

### 9.18 Animating a flat painted background

Asked to make the static `arena-plaza.jpg` background feel alive:
clouds and floating islands drifting, torches flickering, the purple
rift pulsing. The background is one flat painted JPG, not layered
source art, so nothing in it can be truly isolated and animated
independently without real image segmentation (cutting the islands out
and repainting what's behind them, cutting each torch's flame out,
etc.) — out of scope here. Three CSS-only approximations instead,
layered on top of the same static image:

- **"Clouds and islands move"** → the *whole painting* gets a very
  slow, small-amplitude scale+pan loop (`bg-drift`, 22s ease-in-out
  alternate, 1.06×→1.1× scale with a ~1% translate). Since it's the
  entire image moving together, the floor/pillars drift by the same
  tiny amount as the sky — imperceptible at that amplitude for static
  scenery, but enough that the far background (islands, clouds) reads
  as gently alive instead of a frozen photo. This is a real
  compromise, not a full fix: true independent cloud/island motion
  would need those elements as separate layered assets.
- **"Fire moves"** → rather than trying to animate the tiny painted
  flames themselves, a soft orange radial-gradient glow
  (`battlefield-torch-glow`) sits on top of each torch position with
  an irregular 4-keyframe opacity/scale flicker (1.6s loop, staggered
  `animation-delay` per torch so all four don't flicker in lockstep).
  `mix-blend-mode: screen` so it only ever brightens what's under it,
  never muddies the art with a visible flat shape.
- **"Purple hole gets an aura, glows in and out"** → a tall radial
  gradient (`battlefield-rift-glow`) along the crack's centerline,
  breathing opacity/blur on a 3.2s ease-in-out loop. Also
  `screen`-blended for the same reason.

**Positioning these accurately without exact source coordinates:**
`.battlefield-bg` uses `background-size: cover; background-position:
center 35%`, and the container's aspect ratio (tall portrait on
phones) is very different from the source image's (landscape,
1280×853) — cover crops most of the image's width to fill the
container's height, so a torch's *pixel* position in the raw file
doesn't map 1:1 to a percentage of the visible container. Worked out
the actual crop math (scale = max(containerW/imgW, containerH/imgH);
here containerH is the constraint, so there's zero vertical crop and
vertical percentages map straight through, but horizontal is
compressed hard) and cross-checked it two ways: overlaying markers on
an actual Playwright screenshot at the computed coordinates, and
independently scanning the screenshot's raw pixels for the
flame-colored peak brightness near each expected torch position. Both
confirmed the original percentage estimates (torches at 34%/66%
horizontal, 34% vertical) were already correct — a first attempt at
eyeballing a manually-cropped, nearest-neighbor-upscaled screenshot
crop suggested they were off, which turned out to be an artifact of
sloppy manual cropping, not a real positioning bug. Lesson: when a
quick visual check disagrees with the math, verify with a precise
method (pixel-color scan, marker overlay) before trusting the eyeball
over the math, not the other way around.

### 9.19 A persistent team roster, replacing the per-sprite plate

Shown a reference mockup (circular character-portrait avatar connected
to an angled name/HP banner) and asked to adopt that style, with each
team's roster pinned to its own outer edge of the screen (ally far
left, enemy far right) instead of floating above each moving sprite,
and with real character headshots on the avatars instead of a generic
icon.

This is a bigger structural change than any single-property tweak in
§9.7-§9.18: the name/HP/role/element block moves out of `.hero-slot`
entirely into a new sibling `<TeamRoster>` component, rendered twice
(once per side) directly under `Battlefield`'s two `<Formation>`s.
`.hero-slot` now contains only the `HeroSprite` — no more per-fighter
plate — and status effects (shield/burn/wet/etc.) still live where
they always did, as `sprite-badge`s on the sprite itself, since those
are genuinely tied to a specific fighter's position, unlike name/HP/
role/element which are really about *team membership*, not location.

**Portraits:** headshots cropped directly from each real-art hero's
existing full-body sprite (Inferna/Mourn/Kairo) — no new source art
needed, no new keying pass, just `sharp().extract()` on a square region
around the head/shoulders of an asset already in the repo, since those
sprites are already alpha-keyed. Heroes still on the shared vector
chassis (no real art yet) fall back to their gold role icon on a
plain element-colored disc rather than an empty circle.

**Layout, mirrored per side:** `.roster-entry` is a flex row — avatar
then banner for the ally roster, `row-reverse`'d for the enemy roster
so the avatar stays on the *outer* edge on both sides (right for
enemy) and the banner extends inward toward the middle of the
battlefield, matching how a HUD naturally reads outward-in from each
screen edge.

**A new failure mode this surfaced:** because the roster is no longer
tied to a specific sprite's position, it's now a completely separate
occupant of the same battlefield space as the scattered formation
(§9.7) — and the two can overlap. First attempt vertically centered
the roster, which collided badly with sprites on shorter screens where
there's less vertical room to share; moved it to anchor near the top
instead (sprites are floor-anchored at the bottom, so the sky/pillar
band is naturally clearer). That mostly fixed it, but a residual
overlap remained on the shortest test heights — traced to
`.formation-*'s` `nth-child(3)` scatter transform (§9.7), which pushes
that slot both *outward* and *upward* at once, landing it directly in
the roster's corner. Pulled that specific transform back
(`translateX(22px) translateY(-8px)` → `translateX(10px)
translateY(-2px)`) since the roster now occupies territory that
transform was tuned before it existed. A faint touch remains at the
640px edge-case height established elsewhere in this document as
beyond real device dimensions; solidly clear at 700px+.

The fit-check script itself needed updating for this change too — it
was asserting against `.hero-plate`, which no longer exists, and
silently produced a vacuous "ok" (`Math.min` of an empty array) instead
of a real signal. Replaced with a check against `.roster-entry` for
clipping, plus a genuine 2D rectangle-intersection test against
`.hero-sprite-wrap` for the new overlap failure mode — an earlier
attempt at this check compared only Y-ranges and produced false
positives whenever a centrally-scattered sprite shared a Y-range with
the edge-pinned roster without ever sharing an X-range.

### 9.20 Second wave: one more hero per element, 7 → 17

Given 10 pieces of uploaded character art plus a name/element/role
list ("I have made it so we have 2 for each element"), matching each
image to its intended identity, designing a full balanced kit for
each, running each through the real-art pipeline, and wiring all ten
into the roster: Torrent (Water Tank), Zera (Spark Ranger), Orin
(Spirit Mage), Sorrow (Earth Brawler), Kharos (Undead Tank), Flint
(Fire Support), Erosalina (Charm Ranger), Rune (Spirit Support), Amp
(Spark Speedster), and Cragor (Earth Tank). Every element now fields
exactly 2 heroes.

**Matching art to identity:** the images weren't uploaded in the same
order as the name list, so the first hypothesis (match by upload
order) was wrong and had to be discarded. The actual mapping came from
each image's own visual cues — weapon type, pose, palette — cross-
checked against the existing `ELEMENT_COLOR` conventions (§9.x) and
the stated role/element pairing, the same way a human would sort a
stack of concept art against a naming sheet.

**Kit design:** all 10 new kits reuse the engine's existing primitives
end-to-end — no new card kind, status effect, or targeting mode was
added for this batch. Each hero got a full stat block, one Attack/
Ability/Support card, and one passive, following the same balance
ranges and role archetypes established by the original 7 (a Tank
trades Attack for Defense/Shield/HP, a Speedster trades HP for
Speed/Evasion, and so on).

**Passives, by how much of them is real:** this batch made deliberate
use of every rung of the passive-implementation ladder already present
in the codebase, rather than inventing a new one:
- *Generic stat fields* — Torrent's and Cragor's "begins the match
  with N Shield" and Kharos's identical pattern are just
  `startingShield`, no extra code.
- *Self-contained card logic* — Sorrow's "+2 damage to Shielded
  targets" and Flint's "Rekindle also grants Shield" live entirely
  inside their own card's `resolve()`, checking `target.shield > 0`
  or granting shield directly — zero shared-code changes.
- *Minimal `combat.ts` extension* — Erosalina's Charmed-target bonus
  and Amp's first-hit-reduction both slot into `dealDamage()`'s
  existing hardcoded-heroId conditionals (previously written for
  Kairo and Mourn respectively) by adding one more heroId to an
  existing `||` check, rather than writing new branching logic.
- *Descriptive-only* — Zera's "extremely high Accuracy/Crit vs. Wet"
  (true simply because her base stats are high, not because of any
  Wet-specific check), Orin's "healing is 10% stronger" (flavor text
  restating a design intent that isn't actually wired into
  `healingPower`), and Rune's "a spirit wolf watches over allies" have
  no backing implementation at all. This is not a shortcut invented
  for this batch — it's the same pattern the original roster already
  shipped with (Spark Duelist's "Storm Reflex" passive has zero
  implementation anywhere in `combat.ts`), used here deliberately to
  avoid excessive `combat.ts` churn for flavor that doesn't need to be
  mechanically enforced to read as true in play.

**The Sorrow/Cragor art defect:** both heroes' source images share a
genuine flaw — dark costume/shadow pixels that sample as literally
identical RGB to the pure-black background (confirmed by direct pixel
sampling), so no color-distance threshold in the established keying
pipeline (§9.x) can tell "real background" from "real shadow" apart.
Three algorithmic workarounds were attempted and none fully succeeded:
border-seeded flood-fill to classify holes (failed — a large torso hole
connects to real background through a genuine gap between the legs, so
flood-fill correctly-by-its-own-logic refuses to treat it as a hole);
multi-source BFS inpainting (fixed a color-bleed bug in a first,
same-buffer raster-order attempt, but still needs correct hole
detection upstream to know *where* to inpaint); and morphological
closing of the transparent mask before classification (fixed a
boundary-condition bug where off-canvas neighbors were treated as
opaque, starving the border seed entirely — but even after that fix,
no closing radius tested cleanly severed the true-background gaps from
the interior shadow holes without either leaving visible checkerboard
gaps or introducing speckle-noise artifacts from the character
designs' thin hair/cloth strands). Told explicitly to stop working on
this and move on to the other 8 heroes, the broken sprite output was
deleted and both heroes were left on the shared SVG chassis fallback —
an already-existing, proven mechanism (`REAL_ART`/`HERO_PORTRAIT` are
`Partial<Record<HeroId, ...>>`; a missing entry just falls back
automatically) rather than shipping visibly glitchy real art. Cragor
shares the identical defect (also earth-element, also dark-on-black)
so it was skipped preemptively rather than independently re-attempted.
Replacement source art for both has since been prepared and will go
through this same pipeline once provided.

**Two latent bugs the grown roster surfaced**, neither caught by the
unit test suite, both found via live Playwright QA with console/
pageerror monitoring:
1. `src/engine/selection.ts` had a hardcoded `HEROES_OFFERED = 7`
   constant, untouched since the game's original 7-hero design, that
   threw `IllegalActionError("Exactly 7 heroes must be offered.")` the
   moment `HERO_LIST` (and the `OFFERED` array derived from it) grew
   past 7 — making Practice mode's hero-selection screen render
   completely blank. Fixed by removing the exact-count check in favor
   of a minimum (`offered.length < TEAM_SIZE`), since `offered` is
   meant to be "the whole current roster," a number with no reason to
   stay fixed.
2. `.selection-screen`/`.victory-screen` combined `justify-content:
   center` with `overflow-y: auto` — a well-known flexbox interaction
   where content taller than the box still gets centered around the
   midpoint, leaving the portion that overflows past the *top*
   unreachable by scrolling. Harmless with the original 7-hero grid
   (always short enough to fit any real viewport) but a genuine bug
   once the grid grew to 17 heroes (confirmed via Playwright:
   `locator.click` timing out with "element is outside of the
   viewport" even after scrolling fully). Fixed by switching to
   `justify-content: flex-start` plus `margin-top: auto` /
   `margin-bottom: auto` on each screen's first/last child, which
   preserves the original vertical-centering look for short content
   but degrades gracefully to top-anchored-and-scrollable once content
   overflows, instead of clipping unreachably.

**Role-emblem visibility:** separately, the role-icon and element-emoji
badges on each `.roster-entry` were hard to see against the roster
banner's own dark background at their original small size. Rather than
just scaling them up further, each emblem got a dedicated
`.roster-emblem-badge` backdrop — a small dark radial-gradient disc
with a gold border — plus a matching gold drop-shadow glow on the icon
itself, so contrast comes from a deliberate backdrop rather than
relying on size alone.

Full verification after this batch: `tsc -b`, `oxlint`, and the Vitest
suite (82 tests) all pass; `vite build` succeeds; all three QA batches
(Torrent/Zera/Orin, Kharos/Flint/Erosalina, Rune/Amp/Tydra) load with
zero console errors; and the cross-viewport fit-check confirms no
clipping or overlap regression at any tested height once the two bugs
above were fixed.

### 9.21 Main menu redesign against a reference mockup

Shown a polished mobile-game main-menu mockup (arena background with
real character art flanking the screen, a diamond wordmark, a stack of
color-coded action buttons with icon + title + subtitle, plus a player
level/XP bar, gold/gem currency counters, a daily-reward countdown
chest, and social links) and asked to build the actual menu to match.

**Scope decision:** the mockup's economy elements — player leveling,
currency, and a daily-reward timer — don't exist in this game and
never have; the Store screen's own copy says outright "this game has
no currency or purchases," a deliberate design stance (§1). Faking
those with static placeholder numbers would misrepresent a system that
isn't there, so this pass is visual-style-only: the layout, background
treatment, wordmark, and color-coded button styling were adopted, but
the level/XP bar, currency counters, daily-reward chest, and social
links were left out entirely rather than stubbed. The settings gear
button was kept (matching the mockup) but is currently inert — there's
no settings screen yet to link it to.

**Background and framing art:** the existing `arena-plaza.jpg` (used
for the battlefield, §9.x) turned out to already match the mockup's
own moody-arena aesthetic closely enough to reuse directly as the menu
background, rather than sourcing a new asset. Real hero sprites frame
the screen on both sides, picked from the already-alpha-keyed roster
art (§9.20) rather than new source images. First attempt used Inferna
and Kairo for the top slots — both render as unexpectedly narrow
slivers at this large a display size (188px and 225px wide against a
700px-tall crop, aspect ratios of 0.27 and 0.32) because their trimmed
bounding boxes happen to be compact poses; swapped to Zera and Orin
(aspect ratios 0.89 and 0.75), keeping Mourn and Tydra — both
comfortably wide (0.73, 0.58) — for the lower slots. Right-side art is
mirrored with `scaleX(-1)` so both flanks face inward toward the logo,
since real art faces right by default (its resting orientation as an
ally sprite in battle).

**Wordmark:** the mockup's stacked-diamond emblem is approximated with
two CSS rotated-square "gems" (a violet-gradient outer diamond, a
lighter inner one) rather than a new SVG or image asset — cheap to
build, no new art dependency, and reads clearly at the small size a
phone-width menu allows.

**Buttons:** each of the 5 actions (Find Match, Practice, Store, Team
Building, Objectives) got its own accent color (violet, blue, gold,
green, slate) driving both a border tint and an icon-badge glow, with
an angular cut-corner `clip-path` on each panel for the mockup's
faceted look. Objectives — previously an inline card at the bottom of
the menu — became its own nav button and dedicated screen
(`Objectives.tsx`, mirroring `Store.tsx`'s header/back-button
pattern), matching the mockup's 5-button structure; the button shows a
small red dot when any daily/weekly objective is still incomplete,
approximating the mockup's notification badge without inventing a new
unread-state system (it's just "any objective not yet `completed`").

**A layout bug avoided rather than reintroduced:** the button list
uses the same `justify-content: flex-start` + `margin-top/bottom: auto`
pattern established in §9.20 for `.selection-screen`, rather than
`justify-content: center`, even though 5 fixed buttons are far less
likely to overflow a real device's viewport than the 17-hero grid that
originally surfaced the bug — cheap insurance against the same
scroll-unreachability failure mode on unusually short viewports.

Verified via Playwright across three viewport heights (640/844/900px):
no console errors, all 5 buttons clickable and navigate correctly
(Objectives and Store screens load and their back buttons return to
the menu), and no clipping at any tested height. Full pipeline
(`tsc -b`, `oxlint`, the 82-test Vitest suite, `vite build`) passes.

### 9.22 Main menu, take two: full mockup fidelity

§9.21 deliberately left out the mockup's player level/XP bar, currency
counters, daily-reward chest, and social links, on the reasoning that
this game has no leveling or currency system and faking those numbers
would misrepresent it. Told directly to revert that call and just
match the sent mockup, added all four back:

- **Player badge** (top-left): a small rotated-diamond avatar, a
  "Level 1" label, and a mostly-empty XP bar — static, cosmetic, no
  backing system, same as the settings gear.
- **Currency pills** (top-right): a gold-coin count and a gem count,
  both hardcoded to 0. This does sit in direct tension with the
  Store screen's own copy ("this game has no currency or
  purchases") — noted here rather than silently resolved, since it's
  a real inconsistency between two screens, not just a bug.
- **Daily-reward chest** (bottom-left): labeled "Daily Reset" rather
  than "Daily Reward" since there's no reward to grant, but its
  countdown is the one genuinely real piece of this batch — it ticks
  down to the actual UTC-midnight boundary `objectives.ts`'s
  `dayKey()` already resets daily progress at (`toISOString()` is
  UTC, despite the README describing the reset as "local midnight" —
  a pre-existing inconsistency in the README, not touched here).
- **Social links** (bottom-right): three inert icon buttons (no real
  Discord/Instagram/Twitter presence exists for this project), same
  "not wired up yet" precedent as the settings gear.

**A real bug this surfaced:** adding a fixed-height footer below
`.menu-content` (which is `flex: 1` with `overflow-y: auto`) exposed a
different flexbox gotcha than §9.20's — a flex item's default
`min-height` is `auto` (content-sized), not `0`, so without an
explicit `min-height: 0` override, `flex: 1` doesn't actually cap the
box's height on short viewports; it grows to fit its content instead
of clipping/scrolling, pushing later siblings down and under it. First
overlap check gave a false positive by comparing the *inner* scrollable
child's (`.menu-action-list`) bounding box against the footer instead
of `.menu-content`'s own box — a child's `getBoundingClientRect()`
reports its full layout size regardless of an ancestor's
`overflow: auto` clipping, so that comparison couldn't actually tell
clipped-and-scrollable apart from genuinely overlapping. Re-checked
against `.menu-content` itself once `min-height: 0` was added: no
overlap at any tested height.

Verified again after these additions: no console errors at
640/844/900px, all navigation still works, `.menu-content` no longer
overlaps `.menu-footer` at any tested height, and the full pipeline
(`tsc -b`, `oxlint`, 82-test Vitest suite, `vite build`) passes.

### 9.23 Menu background: photo swapped for a CSS gradient

Feedback on §9.22's result: the `arena-plaza.jpg` background (reused
from the battlefield) "looks rubbish" against the mockup's own
background. The mismatch is real — `arena-plaza.jpg` is a warm sunset
palette (orange sky, golden light), while the mockup's environment is
a cool dark-purple night scene, and layered under the equally busy
hero-flank art and button panels, the warm photo read as visual noise
rather than atmosphere.

No image-generation tool exists in this project (same limitation
noted in `CHARACTER_CONCEPTS.md`), and there wasn't a second
background asset already in the repo to swap in, so this replaces the
photo with a pure CSS gradient instead of another image: a soft violet
radial glow behind the wordmark (standing in for the mockup's
portal-at-the-end-of-the-stairway light source) fading to near-black
at the edges, on top of a vertical dark-purple-to-near-black base
gradient. `.menu-backdrop`'s existing darkening overlay (§9.21) still
sits on top for the hero art, unchanged.

Verified: no console errors at 640/844/900px, no overlap between
`.menu-content` and `.menu-footer`, all navigation still works, full
pipeline (`tsc -b`, `oxlint`, 82-test Vitest suite, `vite build`)
passes.

### 9.24 Menu: brighter flank art and a brighter "stage"

Feedback on §9.23's result: the flanking hero art looked "awful,"
needing to be brighter, and so did "the main stage" (the central band
behind the wordmark, standing in for the mockup's glowing portal/
stairway vanishing point). Both complaints trace to the same root
cause — the hero art was never that bright to begin with, and
`.menu-backdrop`'s darkening overlay (tuned for a much brighter photo
background in §9.21, never revisited after §9.23 swapped that photo
for a gradient) stacked on top and crushed everything further toward
near-silhouette.

Fixed on both ends:
- **Flank art**: each `.menu-flank-hero` now gets `filter:
  brightness(1.5) saturate(1.25)` in addition to its existing glow
  drop-shadow, refactored to share one base rule with the glow color
  pulled from a `--glow` custom property per element (previously each
  of the 4 tone classes fully duplicated the filter shorthand, which
  would have meant repeating the brightness/saturate values 4 times
  too). Mourn's glow color also got lightened (`110,90,114` →
  `160,130,165`) since the undead element's base color is dark enough
  that the original glow was barely visible even at the new
  brightness.
- **Backdrop**: eased every stop in `.menu-backdrop`'s darkening
  gradient (0.7/0.3/0.4/0.94 → 0.55/0.12/0.22/0.88), and strengthened
  the central "stage" glow in `.menu-root`'s own background gradient
  with an added tighter, brighter near-white core radial layer on top
  of the existing violet one — giving the wordmark a visible bright
  spot to sit in rather than a uniformly dim purple field.

Verified: no console errors at 640/844/900px, no overlap between
`.menu-content` and `.menu-footer`, all navigation still works, button
text stays legible against the brighter art (each button panel keeps
its own opaque background regardless of what's behind it). Full
pipeline (`tsc -b`, `oxlint`, 82-test Vitest suite, `vite build`)
passes.

### 9.25 Main menu, take three: a full mobile-game home-screen shell

Shown a much more detailed reference mockup than §9.21's ("make this
exactly this") — a side nav rail, a top bar with a player card and two
currencies, a season/battle-pass banner with a countdown, a bigger
crystal-mountain wordmark, 3 mode buttons with chevrons, a daily-
reward-with-Claim bar, and a 5-tab bottom nav — and asked to match it,
this replaces §9.21-9.24's single-column menu wholesale rather than
extending it further.

**Scope.** Almost none of the systems this chrome implies exist:
player leveling, two currencies, seasons/battle-pass, clans, a
dedicated profile screen, friends, mail, a leaderboard, events, or
custom lobbies. Rather than reopen the "how much of this is real"
question from §9.21/9.22 a third time, this follows §9.22's resolved
answer directly: build the chrome, keep every number neutral/zero
rather than the mockup's specific large ones (same reasoning as
before — copying "12,450 gold" would read as real earned progress,
not empty template dressing), and route anything with no real screen
behind it to a new shared `ComingSoon.tsx` component (one file, driven
by a `COMING_SOON_SCREENS` lookup table in `App.tsx`) rather than a
silent dead click — Events, Leaderboard, Custom Match, Battle Pass,
Clan, and Profile all land there. Where a real screen already existed
that plausibly matches a new nav item, it's reused instead of stubbed:
Store → Store, Missions → Objectives (its incomplete-objective red dot
carried over directly), Collection and the bottom tab's Decks → Deck
Builder (two entry points to the same "browse every hero's cards"
screen, a normal pattern in mobile-game navigation).

One judgment call made without asking: the season banner's countdown
says "Coming soon" rather than a fabricated day count. Every other
placeholder number here is a neutral *absence* (0 gold, Level 1) —
a countdown is different in kind, since it actively implies a real
deadline you should feel urgency about, which is a manipulative
pattern worth not replicating even in cosmetic form.

**Background.** No image-generation tool exists in this project, and
§9.23 already dropped the one background photo in the repo
(`arena-plaza.jpg`) after "looks rubbish" feedback on its mismatched
warm palette — but this mockup's background has real structure to
reproduce (a glowing concentric-ring plaza floor, two banner pillars)
that a flat gradient alone can't suggest. Built that structure directly
from CSS/SVG-free shapes instead: a radial-gradient-plus-box-shadow-
rings glow standing in for the plaza floor, two `clip-path` pennant
shapes on absolutely-positioned poles for the banners, and a 3-triangle
`clip-path` cluster for the crystal-mountain logo (a tall center peak
gradient-lit brighter than two flanking side peaks) — all cheap to
build and tunable, at the cost of reading as flatter/simpler than the
mockup's fully painted-illustration version.

**Layout: a lesson applied twice over.** With this many stacked UI
regions (top bar, sidebar, season banner, logo, 3 buttons, reward bar,
bottom tabs) on a single phone-width screen, the sidebar and the
scrollable content area are siblings inside one flex row
(`.menu-body-row`) rather than the sidebar being absolutely positioned
with a guessed pixel offset — a real layout reservation instead of a
number that would silently drift wrong the next time spacing changed
elsewhere. `.menu-content-v2` carries the same `flex: 1` +
`min-height: 0` + `overflow-y: auto` + `margin-top/bottom: auto`
combination established in §9.20 and re-learned the hard way in §9.22
(a flex item's default `min-height: auto` means `flex: 1` alone doesn't
actually cap its height — without the override it grows to fit content
and overlaps whatever comes after it).

**Two real bugs found via the fit-check, both before any of this
shipped:**
1. `.menu-sidebar-item` had no width — a long label ("Collection",
   "Leaderboard") rendered wider than the sidebar's nominal 56px and,
   centered against the screen's left edge, overflowed off-canvas on
   the left (the right overflow stayed visible, so only a leading
   letter or two actually went missing, e.g. "Leaderboard" showing as
   "eaderboard"). Fixing the *button's* width wasn't enough on its
   own — the label span inside still rendered at its own natural
   width as an unbreakable word and overflowed past the now-fixed
   button anyway. Needed both: an explicit `width: 54px` on the label
   itself, and `word-break: break-word` so a single long word can
   actually wrap instead of overflowing unbroken.
2. The pre-existing global `.debug-toggle` button (`position: fixed;
   bottom: 6px; right: 6px`, present on every screen) sat directly on
   top of the new bottom tab bar's Profile tab, since nothing about
   the tab bar's arrival adjusted it. Raised its `bottom` offset to
   clear the ~57px-tall tab bar.

Verified via Playwright at 640/844/900px: no console errors, no
overlap between `.menu-content-v2` and `.menu-bottom-tabs` at any
tested height (the partial daily-reward-bar visibility at 640px is the
scrollable area's own clip edge — confirmed reachable via
`scrollIntoViewIfNeeded` + click, not a real overlap), all 9 new nav
targets (5 sidebar items, Custom Match, and 3 bottom tabs beyond
Home/Decks) route correctly and every ComingSoon screen's back button
returns to the menu. Full pipeline (`tsc -b`, `oxlint`, 82-test Vitest
suite, `vite build`) passes.

### 9.26 Three follow-up complaints on §9.25's shell

Screenshots from an actual phone (not just the Playwright viewports
this project's QA has relied on) surfaced three problems with §9.25's
result, plus a fourth: "doesn't look like our app at all... needs to
look more interesting... some of our characters... and our logo."

**1. Menu content sat visibly right of center.** `.menu-body-row` was
`display: flex` with the sidebar and `.menu-content-v2` as row
siblings — the sidebar's 56px ate into the row's width, so
`.menu-content-v2`'s own internal centering (`align-items: center`)
centered its children in the *remaining* ~334px, not the full screen,
landing about 28px right of true center. Fixed by making the sidebar
float (`position: absolute`) over the content instead of sharing row
space with it — `.menu-content-v2` now fills `.menu-body-row` exactly
(`position: absolute; inset: 0`) and centers on the *full* width, with
the sidebar layered on top in the ~56px-wide strip its icons actually
occupy. This is safe in a way an even earlier absolute-sidebar attempt
wasn't: `.menu-body-row` is itself already properly height-bounded
(`flex: 1` + `min-height: 0`, from §9.22's lesson), so anchoring the
sidebar's `top: 0`/`bottom: 0` to it is anchoring to a real box, not
guessing a pixel offset. The sidebar itself gets `pointer-events: none`
with `pointer-events: auto` on just its item buttons, so an empty gap
between icons doesn't "eat" a click meant for content peeking out from
underneath at the small overlap zone where the two visually meet.

**2. The bottom tab bar only existed on the main menu.** It was
JSX owned by `MainMenu.tsx`, so navigating anywhere else (concretely
demonstrated with a Deck Builder screenshot) lost it entirely — "the
bar along the bottom... should be available to click on every page
you're on." Pulled it out into its own component, `BottomTabs.tsx`,
rendered by `App.tsx` as a sibling alongside whichever screen is
currently showing, with active-tab state computed from a
`Partial<Record<Screen, BottomTab | null>>` lookup (`null` for screens
with no matching tab — Store, Objectives, Events, Leaderboard, Custom
Match — rather than falsely highlighting one). Deliberately hidden
during the actual match flow (`online`/`practice`, every phase):
that's a focused session with its own leave mechanism, tapping "Clan"
mid-battle isn't a real use case, and the tabs would compete with
Battle's own hand-tray UI for the same screen real estate. Since a
persistent bottom bar now competes for height on every meta screen,
not just the menu, `.menu-screen`/`.selection-screen`/`.victory-screen`
picked up the same `min-height: 0` fix `.menu-content` needed in
§9.22 — latent before (nothing ever shared their space), now a real
risk.

**3 & 4. No real hero art, no real logo — "doesn't look like our
app."** §9.25's rebuild dropped both in favor of the new mockup's
own CSS-built dressing (a 3-triangle "mountain" for the logo, no
characters at all). Restored the real flank hero art from §9.21/9.24
(same four heroes, same brightness/glow treatment, layered behind the
new chrome) and replaced the CSS mountain with the actual supplied
emblem image.

The emblem file has a near-black (not transparent) background. First
attempt used `mix-blend-mode: screen` to make black disappear against
the dark menu without a real keying pass — this produced a visible
hard-edged square instead. Root cause: `mix-blend-mode` only
composites against paint within its *own* stacking context, and
`.menu-emblem-image`'s ancestor `.menu-content-v2` (`position: absolute`
+ `z-index`) isolates one — the blend couldn't reach the hero art
layered behind it (a sibling of `.menu-content-v2`, outside its
context) to disappear against. A second attempt gave the blend a
same-context radial-gradient glow to composite against instead
(reasoning: the gradient's own fade-to-transparent edge would use
*plain alpha compositing*, unaffected by the blend-mode restriction,
to reveal the real background beyond it) — still showed a square,
because the image's fully-opaque black rectangle blended against the
gradient at a mostly-fixed value rather than the intended smooth
falloff, and debugging *why* cost more than just fixing it properly.
Switched to real alpha-keying instead, temporarily installing `sharp`
(same "never a permanent dependency" pattern as the hero-art pipeline,
`npm uninstall`'d immediately after): a brightness-threshold ramp
(`LOW=8`/`HIGH=34` on the max RGB channel) rather than the wide
photo-oriented ramp the hero pipeline uses, since this source has a
uniform near-black background, not a busy photo needing a fringe-
mopping pass. Verified clean via the same checkerboard/solid-background
composite check used for hero art before shipping. Trimming to a
content bounding box (as the hero-art pipeline does) turned out to be
wrong for this asset specifically — its ambient sparkle-particle effect
scatters faint bright specks across the *entire* canvas, so a
non-zero-alpha bounding box covers the full image and "trimming" would
do nothing; kept the full canvas.

Verified again after all three fixes: no console errors at
640/844/900px, `.menu-mode-list` measures exactly centered on-screen
(0px offset, down from ~28px), the bottom tabs are visible and
functional from the menu, Deck Builder (via both entry points), and
Store, correctly hidden once inside Practice's hero-selection screen,
and all 9 §9.25 nav targets still route correctly. Full pipeline
(`tsc -b`, `oxlint`, 82-test Vitest suite, `vite build`) passes.

### 9.27 Premium polish pass: sidebar → bottom sheet, glassmorphism, palette discipline

A full design brief modeled on Clash Royale/Marvel Snap/Brawl Stars/
Wild Rift-tier menus, plus one explicit structural ask: replace the
persistent left sidebar with a bottom sheet so the main screen has
more room for artwork and the 3 mode buttons.

**Sidebar → bottom sheet.** `MenuSheet.tsx` is new — a backdrop-tap-
to-dismiss sheet sliding up from the bottom, holding the same 5 items
(Store, Collection, Missions, Events, Leaderboard) as premium list
rows (icon badge, label, chevron, the Missions red dot carried over
unchanged) instead of small circular icons in a permanent 56px column.
Opened from a compact hamburger trigger. First placement attempt put
the trigger as a floating corner button over the scrollable button
list (first `position: absolute` within the scrolling container, then
`position: fixed` at a screen corner after that put it at a scroll-
following spot that still overlapped content) — both failed the same
way: a floating element and edge-to-edge full-width buttons will
always collide at *some* viewport height once there's no dedicated
horizontal gutter for the floater to live in. Moved it into the top
bar instead, sized to match the other utility icons — chrome that
never overlaps scrollable content because it isn't inside the
scrollable area at all.

**Palette discipline.** Blue is now reserved for Find Match (the one
ranked element) — it was "teal" before, a different color for no
particular reason; Practice/Custom Match stay gold/purple. The overall
background shifted from uniformly purple-tinted toward black-dominant
(per the brief's explicit "black background, purple highlights, gold
accents"), with the same violet glow layers as before just toned down.

**Hero art opacity — a deliberate reversal of §9.24.** §9.24's fix was
"the characters look awful, make them brighter" (brightness 1.5,
saturate 1.25). This brief asks the opposite: "faded... at 20-30%
opacity so they don't interfere with readability." Both are correct
for their moment — §9.24's chrome was sparse enough that dim art read
as murky; §9.27's chrome is dense enough that vivid art competes with
it. Set to `opacity: 0.28`, brightness filter dropped entirely
(desaturated slightly instead, `saturate(0.85)`), glow reduced to
match the lower prominence.

**Glassmorphism.** Every UI panel (top bar's player card/currency
pills/icon buttons, the promo banner, the bottom sheet, the mode
buttons' icon badges) got semi-transparent backgrounds plus
`backdrop-filter: blur(...)`, so background art blurs *through* panels
rather than being visually separate from them.

**A third currency (Crystals)** joins Gold and Gems in the top bar, per
the brief — same cosmetic-only treatment as the other two (Store still
says outright there's no currency system).

**Rotating promo banner.** `BANNER_SLIDES` is a 3-entry array
(`Season 1: Dawnbreak`, `Roster: 17 Demigods`, a gameplay tip),
auto-advancing every 5s via `setInterval` and reflected in the dot
row. Purely decorative flavor text — there's no season-pass or news
system behind any of it — and every slide routes to the same
ComingSoon (Battle Pass) screen on click, same as a single static
banner would have.

**Ambient particles + floating crystals.** Ten small glowing dots and
three rotated-square "crystals" with slow drift/float keyframe
animations, CSS-only (no animation library), positioned via
`nth-child` for varied timing — the brief's "background particles"
and "floating crystals" asks.

**Removed: the daily-reward bar.** The brief's own section list
(Top Bar / Main Banner / Logo / Main Buttons / Sidebar-now-sheet /
Bottom Navigation) has no daily-reward entry, and "remove visual
clutter" is explicit — dropped rather than carried forward
unexamined.

**Two real layout bugs found during this pass, both variants of a
now-familiar lesson:**
1. `.menu-topbar-v2` used `grid-template-columns: 1fr auto 1fr` — a
   bare `1fr` track has an *implicit content-based minimum*, the Grid
   equivalent of the flex `min-width: auto` gotcha this project has
   hit repeatedly (§9.20, §9.22, §9.26). The middle currency column's
   content-based demand pushed the player-card column narrower than
   its own content wanted, and since `overflow` wasn't set on the
   name/level text, it visibly bled into the currency pills instead of
   clipping. Fixed both ends: `minmax(0, 1fr)` on the side columns so
   they can actually shrink, plus `overflow: hidden; text-overflow:
   ellipsis` on the player name/level text as a second line of
   defense.
2. Covered in the sidebar/sheet section above — the sheet trigger's
   floating-corner-button placement colliding with scrollable content.

Verified via Playwright at 640/844/900px: no console errors, no
overlap anywhere in the top bar (measured precisely — player card,
currency stack, and icon cluster all clear each other with margin to
spare), the sheet opens/closes (via an item tap, which also navigates,
and via backdrop tap), all 5 sheet items and Custom Match and Battle
Pass route correctly, and the banner slide advances after 5s. Full
pipeline (`tsc -b`, `oxlint`, 82-test Vitest suite, `vite build`)
passes.

### 9.28 Dropping Custom Match to kill the last scroll

Feedback with a phone screenshot: cut Custom Match so the main menu
doesn't need to scroll. Measuring `.menu-content-v2`'s `scrollHeight`
vs. `clientHeight` directly (rather than eyeballing screenshots)
confirmed it: with 3 mode buttons, real small-phone heights (iPhone
SE's 667px, common budget-Android's 640px) genuinely didn't fit — 555px
of content in a ~500-525px box.

Removed the button, its `onCustomMatch` prop from `MainMenu.tsx`, and
the `custommatch` entry from `App.tsx`'s `COMING_SOON_SCREENS`/
`bottomTabsScreen` lookup — since nothing links to it anymore, kept it
removed rather than orphaned. The now-fully-unused `"purple"`
`ModeTone` variant and its `.menu-mode-purple` CSS went too (Find
Match is blue for ranked, Practice is gold; nothing uses purple
anymore).

Removing the button alone wasn't quite enough — measured again and
iPhone SE/640px-Android still needed ~30-55px of scroll. Trimmed
`.menu-content-v2`'s padding/gap, the emblem image (128px → 104px),
the wordmark font-size (36px → 31px), and each mode button's vertical
padding (15px → 13px) — small individual amounts that add up across
4 stacked sections. Confirmed via direct measurement rather than
another screenshot squint: content now fits without scrolling at
667px, 640px, 844px, and 900px. A synthetic 600px-tall viewport (no
real current device is this short) still needs a small scroll — left
as-is, since that's the established safe fallback (§9.20) rather than
a regression, and chasing it further would mean shrinking the UI past
the point of looking premium for a height nothing actually ships at.

Verified: full nav suite re-run (all 5 sheet items, Practice, the
Battle Pass tab) still routes correctly with the 2 remaining mode
buttons, zero console errors. Full pipeline (`tsc -b`, `oxlint`,
82-test Vitest suite, `vite build`) passes.

### 9.29 Trading-card-style hero presentation (Deck Builder + hero-select)

Given a polished reference card for Amp — portrait art, role/element
badges in the top corners, a name banner, and a numbered ability
list — with a request to add it to "Amp's team builder and where you
select your card before a game," i.e. `DeckBuilder.tsx` and
`OnlineHeroSelection.tsx`, the two screens sharing the plain
`.hero-select-card` grid since §9.9-ish.

**Scope decision:** styled only Amp this way and it would look
broken sitting in a 2-column grid next to 16 heroes still on the old
plain card — so this became a new shared component,
`HeroCard.tsx`, applied to every hero in both screens rather than
Amp alone. Amp still gets exactly what was asked (the card, in both
named places); everyone else gets the same visual upgrade instead of
looking suddenly inconsistent next to them.

**What the card shows:** real portrait art via the existing
`HERO_PORTRAIT` map (falling back to the existing role-icon-on-
colored-disc treatment for the 5 heroes without dedicated art —
Earth Guardian, Spark Duelist, Spirit Mage, Sorrow, Cragor — same
fallback mechanism the roster panel already relies on), a role-icon
badge and an element-symbol badge in the portrait's top corners
(reusing the dark-radial-gradient-plus-gold-border badge treatment
established for the roster panel in an earlier session), a name
banner tinted by the hero's element color, and all 4 of the hero's
real abilities (Attack/Ability/Support/Passive — not just the
passive, which is all the old compact hero-select card showed).
Ability descriptions are 2-line-clamped so 17 cards' worth of text
doesn't run unbounded. Deck Builder additionally appends the existing
numeric stat grid below the abilities (`showStats` prop) — hero-select
mid-match-flow doesn't, since 4 ability rows are already substantial
per card.

**Not a full recreation of the reference card's ornate metal-bezel
border** — that's a detailed painted frame, not a CSS pattern, and
this project has no image-generation tool to produce 17 of them.
Captured the reference's actual information architecture (portrait +
corner badges + name banner + ability list) instead, in the
established gold/purple palette, which is the same tradeoff made for
the menu's crystal-mountain logo and castle-plaza background in
§9.25-§9.27.

**Selection/interaction logic is completely unchanged** — `HeroCard`
only renders the card's *content*; each screen keeps its own
`<button>` wrapper, `selected`/`pick-badge` state, and click handler
exactly as before, so this was a pure presentation swap with no risk
to the actual team-selection logic.

Verified via Playwright: hero-select and Deck Builder both render all
17 cards with no horizontal overflow and no console errors; Amp's
card specifically shows its real portrait, badges, and all 4 abilities
in both screens; selecting Amp (and 2 others) through to a locked-in,
started battle still works end-to-end. Full pipeline (`tsc -b`,
`oxlint`, 82-test Vitest suite, `vite build`) passes.

### 9.30 Premium collectible-card redesign, against a much more specific brief

§9.29's card got a detailed follow-up brief — explicitly "DO NOT
SIMPLIFY" — reworking almost every visual decision it made: no
per-element colored border (matte black + gunmetal frame + subtle
purple accents instead), art filling the *entire* upper half in a
chest-and-shoulders crop that slightly overlaps the name plate, a
name plate with nothing else on it, and exactly 3 ability panels —
explicitly dropping stats, costs, and the Passive row this project has
otherwise treated as real gameplay information worth surfacing.
Followed the brief's own suggested layering (frame / character art /
role icon / element icon / text) since it's sound architecture
regardless of visual style — a new hero only ever needs a new
`HERO_CARD_ART` entry, never a CSS change.

**A new, wider portrait crop was needed.** §9.29's `HERO_PORTRAIT` is
a tight square headshot sized for the roster panel's small circular
avatar — nowhere near wide enough to fill a card's entire upper half
in a "chest and shoulders" framing without an extreme zoom. Cropped a
second, wider set (`HERO_CARD_ART`) fresh from the top of each hero's
existing full-body sprite instead of sourcing new art (no image-
generation tool exists in this project): crop height computed per hero
from its sprite's own width, aimed at the card's own upper-half aspect
ratio (~1.43:1), so `object-fit: cover` only has to nudge the final
fit rather than perform a drastic zoom — a narrow sprite (Inferna,
188px wide) and a wide one (Zera, 624px wide) both crop to a sensible
chest-up shot instead of one being a tiny sliver and the other showing
half the body.

**Amp's "signature black lightning visor glasses," specifically:** the
brief calls this out as something to preserve exactly. Checked the
actual `amp-sprite.png` this project has — it's a stylized/
"crystallized" gold-effect rendering where the face is turned at an
angle, partially hair-covered, and doesn't clearly show a distinct
visor the way the brief's own reference mockup image does. This is the
only Amp art asset in the repo; used it as-is rather than attempting
to redraw or fabricate a clearer visor that isn't actually in the
source file. If a cleaner reference image exists, re-cropping from it
is a drop-in swap of one `HERO_CARD_ART` entry, nothing else.

**One color choice adjusted mid-build:** first pass forced the role-
icon badge images to a flat white silhouette (`brightness(0)
invert(1)`) to make them read as "silver," but `ROLE_ICON`'s own
images are already illustrated in their own metallic gold/bronze
finish (a prior session's "matching metallic target-ring frames"
work) — flattening them to solid white would have destroyed that
existing bevel/shading detail, working against the brief's own
"realistic metallic materials, depth, bevels" goal. Kept the icons in
their native finish and made only the *badge circle* itself silver/
gunmetal, which is what "the badges should be silver" most sensibly
refers to.

**What got removed, per the brief's explicit list:** the numeric stat
grid (`showStats` prop and `.deck-builder-stat-grid`, both fully
deleted rather than left disabled), each ability's energy cost number,
the Passive row, and the per-element `border-color` inline style on
the card button (the frame is now identical for every hero,
independent of element, with `.selected` state communicated via a
purple glow instead).

Verified via Playwright: all 17 cards across both screens render with
the new frame, badges, overlapping name plate, and exactly 3 ability
panels; no horizontal overflow at any scroll position through the
full 17-hero grid; Amp's card specifically confirmed in both screens;
selecting Amp plus 2 others through to a locked-in, started battle
still works end-to-end; zero console errors. Full pipeline (`tsc -b`,
`oxlint`, 82-test Vitest suite, `vite build`) passes.

### 9.31 Sorrow and Cragor get real art at last

§9.20 left these two on the shared vector chassis because their
supplied art was on a black background and both costumes ran close
enough to black that keying it produced a shadow pixel literally
identical to the background — an unfixable ambiguity, not a tuning
problem, confirmed across three separate algorithmic attempts. The
user held onto that and came back with fresh source images for both
heroes, shot on a clean white background instead, closing the door
that made the original pair unworkable.

**Keying inverted, not reinvented.** White backgrounds need the
mirror image of the black-background pipeline this project already
has: the "how far is this pixel from the background" metric becomes
`255 - min(r, g, b)` (distance from white) instead of distance from
black, ramped LOW→HIGH into an alpha channel, then color-decontaminated
with `(channel - 255*(1-a)) / a` to undo the white bleed on
partially-transparent edge pixels — the same formula as the black-
background version with the bleed color swapped. Two 3×3 erosion
passes mop up fringe, same as before. Sampled both source images'
corners first (252-254 out of 255, both heroes) to confirm the
backgrounds were genuinely, consistently white before trusting a
single global threshold to it.

**A second, different defect showed up — this one solvable.** A first
keying pass produced clean character silhouettes but left a soft gray
smudge under Cragor's feet: not the original hard "identical to
background" failure, but his own render's ground-contact drop shadow,
which fades gradually rather than cutting off. A histogram scan of the
bottom 150 rows confirmed thousands of pixels sitting at partial alpha
(5-55) — a wide, smooth ramp with no single clean threshold, unlike a
hard-edged region. Fixed with three combined changes: raised the
LOW/HIGH ramp bounds so more of that gradual fade collapses to zero,
raised the erosion pass's subtraction amount so soft ramps get pulled
down harder than the character's own higher-contrast edges, and — the
change that actually did the most work — computed the final trim box
from a *strict* alpha threshold (≥200, "solid content only") rather
than "any non-zero alpha," so the shadow's sub-threshold pixels below
the character's feet fall outside the crop entirely instead of
surviving as a faint halo inside it. Re-checked both heroes against a
dark preview background afterward; no trace of the shadow remained on
either.

**Portraits and card art cropped fresh from this new source**, at
full resolution before the final height-700 resize (better detail
than cropping the already-downsized sprite), following the same
conventions as every other hero: `HERO_PORTRAIT` a square headshot,
`HERO_CARD_ART` a chest-and-shoulders crop from the top of the sprite
at the same ~1.43:1-aimed height formula from §9.30. Cragor's design
has no distinct face (a faceless rock golem, crown-first silhouette),
so his headshot crop centers on the crown and upper body instead —
there's no facial feature to center on because the source art doesn't
have one. Both heroes read as front-on/symmetric poses, so neither
needed a left/right flip to match the "ally art faces right" rule the
other real-art sprites follow. One post-processing step not needed
before: re-encoding both new sprites and their crops through `sharp`
at max PNG compression effort dropped Cragor's raw sprite from 878KB
to 260KB (heavy fine rock-texture detail compresses far worse at
default settings) — brought every new asset back in line with the
existing hero asset sizes rather than leaving an outlier in the repo.

Both heroes are now in `REAL_ART` (`HeroSprite.tsx`), `HERO_PORTRAIT`,
and `HERO_CARD_ART` (`heroVisuals.ts`) alongside the other 15 —
`REAL_ART`'s comment and the README's roster note, both of which
called out Sorrow/Cragor as the shared-chassis exceptions, are updated
to reflect that every hero now has real art.

Verified via Playwright: Sorrow and Cragor's cards render with the
same premium frame as every other hero in both the Deck Builder grid
and hero-select screen, with no code changes needed there (the frame
is art-agnostic per §9.30) — confirming the fallback role-icon-on-disc
path is no longer reachable for either; both heroes also render their
full-body art correctly on the battlefield in a practice match, not
the SVG chassis; zero console errors throughout. Full pipeline
(`tsc -b`, `oxlint`, 82-test Vitest suite, `vite build`,
`cap sync android`) passes. `sharp` was a temporary dev dependency for
this image work only, as always — installed with `--no-save` and
uninstalled again once the assets were final; `package.json` and
`package-lock.json` carry no trace of it.

### 9.32 Swapping the Battle Pass bottom tab for Store

Battle Pass sat in the bottom tab bar's most prominent 3rd-of-5 slot
(§9.26) leading to a ComingSoon screen — this prototype has no season
pass, no currency, and no purchases of any kind (Store already says so
outright), so that tab could never lead anywhere real. Store, by
contrast, already has its own honest "Coming Soon" screen (`Store.tsx`,
predates the §9.25 menu redesign) but was only reachable through the
MenuSheet — a secondary-navigation drawer one tap deeper than the
bottom tabs. Swapped the two: Store now occupies the bottom tab, Battle
Pass is gone entirely (not just hidden — `BottomTabs`' tab union,
`App.tsx`'s `COMING_SOON_SCREENS` map, and the `battlepass` screen
state are all removed, not disabled) since nothing else pointed to it.

The rotating promo banner (§9.27) used to open Battle Pass on click,
purely incidentally — it's decorative flavor text with no real
connection to any specific screen. Repointed it at Store instead of
leaving it dangling or inventing a new destination; a promo banner
leading to the store is if anything a more standard pattern than one
leading to a season pass. `MenuSheet` still has its own separate Store
entry (unchanged) — the same duplicate-access pattern this project
already has for Decks/Collection, not a new inconsistency.

Verified via Playwright: the bottom tab bar now reads Home/Decks/
Store/Clan/Profile, tapping Store opens the real `Store.tsx` screen and
highlights the tab as active, the promo banner also opens Store, and
Battle Pass is unreachable from anywhere in the app. Full pipeline
(`tsc -b`, `oxlint`, test suite, `vite build`) passes.

### 9.33 Retiring the three unnamed original heroes

Earth Guardian, Spark Duelist, and Spirit Mage were 3 of the original 7
heroes (§1-§2) — built before every other hero on the roster got a real
name, a distinct illustrated identity, and a spot in `HERO_CARD_ART`.
By the time the roster reached 17 (§9.20's second wave, one more hero
per element), each of their elements already had a same-role-or-close
illustrated replacement sitting right next to them: Cragor duplicates
Earth Guardian's Tank/Earth slot almost exactly (and now has real art
and a name), Zera and Amp both cover Spark better than Spark Duelist
ever did, and Orin/Rune cover Spirit. The user asked to cut the three
that "don't have real names and character to them" outright rather
than eventually reskin them — a straight deletion, not a rename, since
unlike every other rename in this project's history (Fire Mage →
Inferna, Undead Assassin → Mourn, etc.) these three had no illustrated
art commissioned for them to carry the identity over to.

**Deleted, not disabled** — consistent with how this project has
always treated cut content (Custom Match §9.28, the numeric stat grid
§9.30): removed from `HeroId` (`types.ts`), their 9 card definitions
and 3 `HERO_DEFINITIONS` entries (`heroes.ts`), their chassis hair
silhouettes (`HeroSprite.tsx`) and cosmetics entries
(`heroCosmetics.ts`). Two passives died with their heroes rather than
surviving as dead code: Spirit Mage's "Lingering Spirit" (survive one
lethal hit at 1 HP) — removed `hasCheatedDeath` off `HeroInstance` and
the `SURVIVED_LETHAL` event entirely, since no other hero has ever had
this passive — and Spark Duelist's "Storm Reflex" (+2 Shield after a
Spark hit consumes Wet) — simplified `dealSparkDamage` back down to
just the damage-and-cleanse mechanic every Spark hero still uses
(Zera's Static Snipe/Twin Volt), dropping the `triggerPassive`
parameter that only ever gated Spark Duelist's own passive.

**Thunder Tide (Tydra + Spark Duelist) had no path to survive the
cut** — it's a Team-Up defined entirely around Spark Duelist by name,
and no other Spark hero was retrofitted into it (that would be
inventing new content, not removing old content). Removed the
definition and its entry in `TEAM_UP_DEFINITIONS` outright; Steam Surge
(Inferna + Tydra) is the only Team-Up left.

**The test suite lost real coverage along with the mechanics it was
testing**, not just find-and-replaced hero names. `spirit.test.ts`
tested nothing but Spirit Bolt/Soul Siphon/Spirit Ward and the
Lingering Spirit passive — all gone — so the whole file was deleted
rather than repurposed. The "Static Charge" describe block in
`support.test.ts` tested a Wet-aware Empower mechanic unique to Spark
Duelist that no other hero replicates — deleted rather than forced onto
a hero that doesn't have it. "Guardian's Watch," by contrast, tested a
mechanic (allAllies Shield support, scaled by the caster's Shield
Strength) that very much still exists — rewritten against Cragor's
Mountain's Resolve instead of deleted, recomputing every number against
Cragor's actual stats (startingShield 6, Shield Strength 135% vs. Earth
Guardian's 4/125%) rather than reusing the old numbers by coincidence.
Every other affected test (`combat`, `charm`, `energy`, `planning`,
`stats`, `status`, `targeting`, `teamup`, `victory`, `bot`,
`selection`) kept its actual assertions and just swapped which
remaining hero fills the "generic teammate" or "generic target" role —
recomputed by hand against the replacement hero's real stats wherever
the original numbers depended on Attack/Defense/element (e.g. Zera's
lower Defense than Spark Duelist's meant several damage numbers went up
by exactly the difference), not copied over unchanged. One test
(`Inferna passive`, in `status.test.ts`) needed a different target
entirely rather than just a stat recompute — Zera's and Amp's lower Max
HP than Spark Duelist's meant the second Fire Bolt in that test would
now overkill mid-sequence and clamp to 0 before the test's cumulative
subtraction could apply, so it targets the enemy's own Inferna (a
mirror match) instead.

`roster.test.ts`'s composition check now expects 14 heroes instead of
17, with each element still fielding at least 2 (Earth: Sorrow/Cragor,
Spark: Zera/Amp, Spirit: Orin/Rune — none of the three cut heroes was
the *only* hero for its element, which is exactly why the cut was safe
to make).

Verified via Playwright: the Deck Builder and hero-select grids show
exactly 14 cards, none of them Earth Guardian/Spark Duelist/Spirit
Mage; a practice match locks in and plays through normally with the
remaining roster; zero console errors. Full pipeline (`tsc -b`,
`oxlint`, 75-test Vitest suite — down from 82, accounted for entirely
by the deleted spirit/Thunder-Tide/Static-Charge tests above — and
`vite build`) passes.

### 9.34 Card-art recrops (Flint, Mourn) + battlefield fixes (Torrent, Zera, Kharos)

Five separate visual complaints against the existing real art, none of
which needed new source images — every fix here is a different crop,
transform, or per-pixel correction of assets already in the repo.

**Flint's card art was cropping the fox's own head off-center.** The
old crop took the sprite's full width from the top, but Flint's fox
leans left in its own pose — the top-of-sprite content bbox sat at
x:0-400 out of a 502px-wide sprite, so a full-width crop put a large
empty margin on the right instead of framing the fox. Fixing this
properly meant abandoning the "always take the full sprite width" rule
for this one hero: cropped a roughly square 260×260 region instead,
sized and positioned around the fox's actual head/neck content rather
than the sprite's width. The `.hero-card-portrait-wrap` container still
enforces a fixed 1.43:1 aspect via `object-fit: cover` +
`object-position: top center`, so a squarer source just means the
browser crops a bit off the bottom to fit — exactly the vertical trim
this crop wanted anyway, achieved for free rather than computed by
hand.

**Mourn's card art showed hood-to-hip — too much body for a "chest and
shoulders" card.** Profiled the sprite's per-row silhouette width to
find where the shoulders actually peak (~y=225) versus where the old
crop cut off (y=351, well into the torso/midriff). Re-cropped to
y:0-240, narrowed to the hood/shoulders' own horizontal extent (x:84-
427) instead of the full sprite width, landing much closer to how
every other hero's card art frames "head and shoulders."

**Torrent was facing backward.** Ally sprites render at `facing={1}`
("drawn as-is," per `HeroSprite.tsx`'s own convention — see §9.9-era
comments) meaning the source art itself has to already face right for
that to look correct. Torrent's raised, clearly-defined claw-arm sat on
the *left* side of the sprite — the trailing side once mirrored for an
ally facing right, when an about-to-strike limb reads correctly on the
side closest to the enemy team instead. Flipped the sprite (and its
already-derived portrait/card-art, `sharp().flop()`) horizontally to
put that arm on the right.

**Torrent needed to be bigger — Tanks read as bulkier on the shared SVG
chassis** (wider/taller torso per role, from the original 7-hero build)
**but real-art sprites all share one fixed box regardless of role**,
losing that size language once a hero gets real art. Rather than
special-case Torrent alone, added a systemic `role === "Tank"` check in
`HeroSprite.tsx` (`role-tank` class) with a matching CSS rule scaling
the real-art box up ~19% (84×105 → 100×125, same aspect) — Cragor and
Kharos get the same boost, since they're Tanks too and the same
argument applies to them without the user having singled them out.

**Zera and Kharos read as "faded"/washed out against the dark
battlefield — not an edge-fringe issue, a bulk one.** Sampled every
visible pixel's alpha channel across several heroes for comparison:
Flint and Sorrow sit at ~4-8% of pixels below alpha 100 (normal
edge-antialiasing volume); Zera and Kharos sat at 33.5% and 35.9%
respectively — roughly a third of each character's own body reading as
translucent, not just its silhouette edge. Both are light-costumed
(Zera's white/gold robes, Kharos's pale bone) against what was
presumably also a light/white original background, the same class of
problem as the Sorrow/Cragor black-on-black keying conflict (§9.9,
§9.31) but the lighter-value mirror of it — except here there was no
fresh source art to re-shoot from, only the existing already-exported
PNGs to repair in place.

Fixed with the same two-part transform used on the newer heroes'
white-background pipeline, applied to already-exported art instead of
a fresh key: (1) color-decontaminate every non-fully-opaque pixel
against an assumed white backdrop, using that pixel's *own* current
alpha as the blend fraction — recovers the true underlying color a
partial-alpha pixel was diluted toward white by; verified this
recovers real color and isn't inventing one, by flattening the result
against pure black *and* pure white and confirming both read as a
plausible costume (dark trim + gold accents for Zera, purple magic
accents for Kharos) rather than a color that only "made sense" against
one particular test backdrop. (2) A gamma<1 curve on alpha
(`255 * (alpha/255)^gamma`, gamma 0.55 for Zera / 0.45 for Kharos —
Kharos needed the stronger push, matching "so faded" vs. "a bit
faded") that hardens mid/low translucent pixels toward opaque without
moving true 0 (background) or true 255 (already-solid) pixels.

Applied directly to each hero's sprite and portrait (both still carry
an alpha channel); their card art had already been flattened onto the
dark card background at crop time using the *old* faded alpha, baking
the fade permanently into its RGB with no alpha left to fix — so
instead of patching that file, regenerated it fresh from the corrected
sprite through the exact same crop box the §9.30 formula already used
for each (full sprite width, height per the width-dependent formula),
re-flattened onto the card background.

Verified via Playwright in an actual practice match: Torrent renders
noticeably larger than Zera/Kharos (Tank-role box), its claw-arm on the
correct side; Kharos (both the ally and enemy copy) and Zera read as
solid/opaque, not washed out; Flint and Mourn's Deck Builder cards show
a centered fox and a tight head-and-shoulders hood respectively; zero
console errors. Full pipeline (`tsc -b`, `oxlint`, 75-test Vitest
suite, `vite build`, `cap sync android`) passes. `sharp` was a
temporary `--no-save` dev dependency for this image work only,
uninstalled after use.

### 9.35 §9.34's de-fade wasn't nearly strong enough — and Orin has the same defect

§9.34's gamma-curve alpha boost (0.55/0.45) looked fixed against a flat
dark preview background, but the user reported Zera and Kharos still
read as "basically see through" in the actual game — against the
busy, brightly-lit `arena-plaza.jpg` battlefield art, partial
transparency is far more visible than against a flat swatch, and a
gamma curve on alpha (`255 * af^gamma`) barely moves anything below
~0.4 opacity: at gamma 0.55, a pixel starting at 30% alpha only reaches
~49% — nowhere near opaque. Re-measured: even after §9.34's fix, Zera
and Kharos still had ~40% of their own visible pixels under alpha 150,
against ~5-12% for a normally-exported hero.

Composited test crops directly onto the real `arena-plaza.jpg`
background (not a flat swatch) this time, specifically to judge
against what the user is actually seeing rather than a background that
flatters partial transparency. A blunt linear multiply-and-clamp
(`min(255, alpha × 4.5)`) — much more aggressive than a gamma curve —
pushed the great majority of both characters' bodies to full opacity
while composited-preview comparisons at ×3/×4/×5 showed diminishing
returns past ×4, landing on ×4.5 for a safety margin. The thin wispy
edges (hair strands, Orin's floating leaf/ember motes) staying
slightly translucent is correct, not a residual bug — those elements
read as intentionally ethereal on every other hero too.

**Orin turned out to have the identical defect, unreported until this
image was sent** — same ~40%-under-alpha-150 profile as Zera/Kharos
pre-fix, presumably from the same "second wave" art export batch
(§9.20). Since the symptom and root cause were identical, fixed with
the same multiply-and-clamp pass rather than waiting for a separate
report.

**Re-derived from the true pre-§9.34 originals (via git history), not
from §9.34's already-adjusted files on disk** — stacking a second
decontamination pass on art that had already been decontaminated once
would double-correct the color rather than compound the fix
correctly. Applied directly to each hero's sprite and portrait (both
still carry an alpha channel); card art was regenerated fresh from the
newly-fixed sprite through the same crop box §9.30's formula already
used for each hero, exactly as in §9.34, since it's flattened (no
alpha left to patch) at crop time.

Verified via Playwright in an actual practice match, screenshotted
against the real battlefield background (not a synthetic preview):
Zera and Kharos both read as solid on either side of the field (ally
and enemy copies); zero console errors. Full pipeline (`tsc -b`,
`oxlint`, 75-test Vitest suite, `vite build`, `cap sync android`)
passes. `sharp` was a temporary `--no-save` dev dependency, uninstalled
after use.

### 9.36 A wholesale Kharos re-shoot, a much harder alpha snap, and a decontamination bug caught in the act

Even §9.35's ×4.5 alpha boost wasn't enough — the user's own in-game
screenshot showed Zera and Kharos still visibly translucent. Kharos
also had a second, unrelated problem: the version in the game was
missing the cape/cloak visible in a much higher-fidelity reference
image the user supplied (1120×1404, clean pure-black background,
`official-concept-art` quality — chains, a spiked mace, the works).
Given a real replacement source existed for Kharos specifically, this
called for the full art-integration pipeline this project already has
(§9.9, §9.20, §9.31), not another alpha patch on a lower-fidelity
sprite that never had the cape to begin with.

**Keying it surfaced a bug in the color-decontamination step itself.**
The standard black-background formula (`true = observed / alphaFraction`)
undoes background bleed correctly for ordinary antialiased edges, but
Kharos's design is full of purple *emissive* energy glow — soft alpha
by artistic intent, not background dilution. Dividing those pixels by
their own small alpha inflated them toward white, blowing the glow out
almost entirely. Caught this by compositing the keyed result against
*both* pure black and pure white test backgrounds (the same technique
§9.34 used to confirm Zera's recovered color wasn't a backdrop
artifact) — the decontaminated version came out visibly wrong on both,
while skipping decontamination entirely matched the reference art
almost exactly. Landed on: key normally (brightness-from-black alpha
ramp + erosion), but skip the color-decontamination step for this
character — the minor dark-edge bleed it would have fixed is invisible
anyway against this game's uniformly dark presentation, so there was
nothing worth trading the glow away for.

Flipped the result — the mace-arm, Kharos's prominent weapon limb, sat
on the left in the source, the same "wrong side for an ally facing
right" issue §9.34 fixed on Torrent's claw-arm. Trimmed, resized to the
standard height:700, and re-derived the portrait/card-art crops fresh
from the new art via the established formulas, fully replacing the old
sprite/portrait/card-art trio.

**Zera and Orin needed a harder push than §9.35's multiply.** Switched
from a multiply-and-clamp to a hard snap: any pixel at alpha ≥30
becomes fully opaque (255), with only the truly-faint sub-30 range kept
as a short ramp — deliberately blunt, prioritizing "reads as solid"
over preserving a smooth falloff, since a smooth falloff was exactly
what kept reading as "still see-through" through two previous, gentler
attempts. Re-derived both from their true pre-§9.34 originals (via git
history) again, for the same reason as before: stacking corrections on
already-corrected files compounds rather than fixes.

**Orin was also facing backward** — his staff (the same kind of
prominent asymmetric weapon-limb tell as Torrent's claw and this
section's Kharos mace) sat on the left in the source; flipped for the
same reason.

Verified via Playwright in a practice match against the real
battlefield background: Kharos now shows his cape and reads fully
opaque with no see-through; Zera reads solid; zero console errors
(Orin's flip/opacity fix was verified directly against the source
files and a synthetic battlefield composite — the practice-match
screenshot in this pass happened not to include him in the locked
roster, but the underlying fix is identical to Torrent's and Kharos's,
already verified end-to-end in-game). Full pipeline (`tsc -b`,
`oxlint`, 75-test Vitest suite, `vite build`, `cap sync android`)
passes. `sharp` was a temporary `--no-save` dev dependency, uninstalled
after use.

### 9.37 §9.36's Kharos flip was wrong; hard-snapped his alpha instead of skipping decontamination

Two follow-up complaints on §9.36's Kharos re-shoot: he was now facing
backward, and he still wasn't opaque enough despite skipping
decontamination there specifically to preserve his purple glow.

**The flip was simply a bad call.** §9.36 mirrored Kharos so his
mace-arm sat on the right, generalizing from Torrent's fix (§9.34,
raised claw-arm on the wrong side). But there's no eyes-forward "look
direction" to anchor that convention against on a skull-faced character
holding a weapon in a static standing pose — unlike Torrent's
wave-creature, where the raised claw read as a body genuinely oriented
one way, Kharos's mace-hand is just which hand happens to hold it, and
the user's own reference (sent twice now, both times with the mace on
the *left*) makes clear that's the intended orientation. Reverted:
no flip this time.

**Opacity: skipping decontamination fixed the glow-blowout bug but
apparently wasn't a big enough opacity win on its own.** The user
supplied a fresh copy of the reference (same pose, this time on a white
rather than black background) — re-keyed it with the white-background
pipeline (distance-from-white ramp) instead of reusing the previous
black-bg-keyed result, then applied the same hard alpha snap already
proven on Zera/Orin (§9.36: anything ≥30 becomes fully opaque) *on top
of* still skipping decontamination — the two fixes address different
problems (opacity vs. color-blowout) and aren't in tension with each
other; there was no reason the first round's "skip decontamination"
choice should have also meant "keep a soft alpha ramp."

Verified via Playwright in a practice match against the real
battlefield background: Kharos's mace-arm is back on the left, he
reads as solid/opaque against the busy background art, and his cape
and purple glow are both still intact; zero console errors. Full
pipeline (`tsc -b`, `oxlint`, 75-test Vitest suite, `vite build`,
`cap sync android`) passes. `sharp` was a temporary `--no-save` dev
dependency, uninstalled after use.

### 9.38 Zera gets the same wholesale re-shoot as Kharos

Following §9.36's Kharos precedent, the user supplied a fresh, much
higher-fidelity reference image for Zera too (1166×1349, clean white
background, dynamic pointing pose with her Spark-attack lightning
effect) and asked for the same treatment rather than another alpha
patch on the old low-res sprite this project had been repeatedly
re-fixing since §9.34.

Keyed with the white-background pipeline (distance-from-white ramp,
same as Sorrow/Cragor/§9.37's Kharos re-key). Tested color
decontamination against both black and white backgrounds first, same
as always since §9.36's glow-blowout bug — unlike Kharos, Zera's gold
spark effects are mostly hard-edged shapes rather than soft diffuse
glow, and decontamination came out clean on both test backgrounds, so
kept it this time (recovers richer, more saturated color than the raw
alpha would). Applied on top of it the same hard alpha snap (≥30 →
fully opaque) already proven on Kharos/Orin, so the "still see-through"
failure mode from §9.35-9.36 couldn't recur here either.

No flip needed — unlike Kharos's ambiguous static pose, Zera's whole
body is dynamically oriented toward her own outstretched pointing hand
(gaze, torso, front foot, and hair all lean the same direction), an
unambiguous "facing right" already in the source art.

This is now the fourth hero (after Sorrow, Cragor, Kharos) with a fully
re-shot sprite/portrait/card-art trio rather than a patched original —
each time because the user supplied real replacement art, never
speculatively.

Verified via Playwright in a practice match against the real
battlefield background: both the ally and mirrored-enemy copy of Zera
read as fully solid and richly colored, not translucent; zero console
errors. Full pipeline (`tsc -b`, `oxlint`, 75-test Vitest suite,
`vite build`, `cap sync android`) passes. `sharp` was a temporary
`--no-save` dev dependency, uninstalled after use.

### 9.39 Orin gets the same re-shoot, and the §9.36 flip lesson holds

Fifth hero re-shot from fresh reference art (after Sorrow, Cragor,
Kharos, Zera) — same request, same pipeline: white-background key
(distance-from-white ramp), decontamination checked against both
black and white test backgrounds first (clean on both this time — his
green wisps are edge-defined rather than Kharos-style diffuse glow, so
kept it for the richer color), then the hard alpha snap (≥30 → fully
opaque) already proven on the last three heroes.

**No flip, deliberately** — and this is the interesting part. Orin's
own reference has his staff on the *left*, the same side §9.36 flipped
him to *away from*, generalizing the Torrent claw-arm convention to a
character where it didn't apply. §9.37 already reversed that call for
Kharos once his own reference made the intended orientation obvious;
this section is the same lesson landing a second time, this time
before a complaint rather than after one — the reference art is simply
authoritative over any inferred "weapon arm faces the enemy" rule, and
that rule was never more than a guess to begin with for static/seated
poses without a genuine body-orientation tell (contrast Torrent, an
actually-lunging wave-creature, where it held up).

Verified via Playwright in a practice match against the real
battlefield background: Orin (rendered on the enemy side this run,
mirrored correctly) reads as fully solid and richly colored; zero
console errors. Full pipeline (`tsc -b`, `oxlint`, 75-test Vitest
suite, `vite build`, `cap sync android`) passes. `sharp` was a
temporary `--no-save` dev dependency, uninstalled after use.

### 9.40 Illustrated element emblems, replacing `ELEMENT_SYMBOL`'s emoji

`ROLE_ICON` (an earlier session) already replaced the emoji role icons
with illustrated metallic target-ring frames; `ELEMENT_SYMBOL` was the
one remaining place still showing plain emoji (🔥💧⚡🪨💀💗👻) instead
of real art. The user supplied a matched set of 7 circular medallion
emblems — one per element, each a black-background illustration with
a consistent frame (double ring + 4 corner diamond studs) and a
distinct central motif (a flame for Fire, a water-drop with sea
creatures for Water, a lightning bolt for Spark, a crystal formation
for Earth, a skull for Undead, a heart for Charm, a tree-of-life with
forest animals for Spirit).

Keyed with the same black-background pipeline used throughout this
project (brightness-from-black alpha ramp, color decontamination,
double erosion) — checked decontamination against a test composite
first per the §9.36 lesson, and it came out clean on all 7 (these are
crisp illustrated shapes, not soft diffuse glow, so no blowout risk).
Trimmed to each medallion's own content bounding box (generous padding
so the corner diamond studs, which poke slightly outside the main
ring, never clip) and resized to 128×128 with alpha preserved, matching
`ROLE_ICON`'s own asset convention exactly (`src/assets/roles/*.png`
are also 128×128) — a new `src/assets/elements/` directory mirrors
`src/assets/roles/`.

Added `ELEMENT_ICON: Record<Element, string>` to `heroVisuals.ts`
alongside `ROLE_ICON`, and removed `ELEMENT_SYMBOL` outright rather
than leaving it as unused dead code — grepped first to confirm exactly
3 call sites, all straightforward `<span>{emoji}</span>` → `<img
src={ELEMENT_ICON[...]} />` swaps: the hero card's element badge
(`HeroCard.tsx`, sibling to the existing role-icon badge — the shared
`.hero-card-badge img` rule already styles it identically, so only the
now-dead emoji-specific `font-size`/`filter` rules on
`.hero-card-badge-element` needed removing), the battlefield roster
panel's element badge (`Battlefield.tsx`, same treatment as its
existing `.roster-role-icon` sibling), and each action card's element
indicator in hand (`CardHand.tsx`, which needed a new small
`.hand-card-element img` sizing rule since the emoji version had only
ever inherited font-size from its flex parent).

Verified via Playwright: Deck Builder hero cards show the correct
illustrated element badge per hero, the battlefield roster panel's
element badges render correctly for a full mix of elements across
both teams, and each hand card's element icon renders correctly next
to its cost; zero console errors. Full pipeline (`tsc -b`, `oxlint`,
75-test Vitest suite, `vite build`, `cap sync android`) passes.
`sharp` was a temporary `--no-save` dev dependency, uninstalled after
use.

### 9.41 Fresh illustrated role icons, replacing the originals in place

Same request as §9.40, this time for `ROLE_ICON` itself: the user
supplied a matched set of 6 new role emblems (black background, same
double-ring + corner-diamond-stud frame as the new element set, one
per role — a running figure for Speedster, an ornate crescent/staff
motif for Mage, a clenched fist for Brawler, cupped hands cradling a
healing star for Support, a bow and arrow for Ranger, a shield for
Tank) rendered in a silver/gunmetal finish instead of the previous
gold/bronze one.

Unlike §9.40, there was no new map/wiring to add — `ROLE_ICON` already
existed and every consumer already referenced
`src/assets/roles/{mage,brawler,tank,speedster,ranger,support}.png`
by path. Keyed with the same black-background pipeline and overwrote
those 6 files in place; zero code changes needed anywhere.

**One of the six needed a higher LOW threshold than the rest.** Sampling
the border ring of each source image (a standard sanity check before
keying, at this point) showed Brawler's "black" background wasn't
actually flat — its outer 20px ring averaged brightness ~13 with a
max of 31, a visible noise floor rather than true black, unlike the
other five (and every previous black-background source this project
has keyed) which sat at 0-2. Sampling the fist itself (130-160+
brightness) confirmed a wide, safe gap above that noise floor still
existed. Raised LOW from the usual 8 to 35 (and HIGH from 55 to 90,
keeping the same proportional ramp width) for all 6 role icons rather
than special-casing just Brawler — harmless for the other five, whose
backgrounds were already near-zero, and it cleanly eliminated what
would otherwise have been a faint gray halo around Brawler's fist.

Verified via Playwright: Deck Builder hero cards show the new silver
role badge in the corner, and the battlefield roster panel's role
icons render correctly alongside the §9.40 element icons across a full
mixed-role team; zero console errors. Full pipeline (`tsc -b`,
`oxlint`, 75-test Vitest suite, `vite build`, `cap sync android`)
passes. `sharp` was a temporary `--no-save` dev dependency, uninstalled
after use.
