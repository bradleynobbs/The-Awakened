# The Awakened

A mobile-first, online 1v1 tactical card battler, presented as a flat
2D side-on battlefield in the style of *Slay the Spire* meets
team-based PvP. Two players each lock in a 3-hero team and fight it out
over the network with a shared action deck, elemental status
interactions, and a full RPG-style stat system (Attack, Defense, Speed,
Accuracy, Critical Chance, and more — see "Stats" below). None of it
is randomized: Accuracy/Evasion and Critical Chance are stat-vs-stat
comparisons, not dice rolls, so every outcome is calculable from what
both players queued, before it resolves.

See [`DESIGN.md`](./DESIGN.md) for the full list of rule decisions made
while turning the original design brief into a buildable prototype (turn
structure, deck size, status durations, targeting edge cases, Team-Up
resolution order, balance numbers for every card, and the online
matchmaking/sync design in section 4). See
[`CHARACTER_CONCEPTS.md`](./CHARACTER_CONCEPTS.md) for a written
concept-art brief per hero (outfit, hairstyle, signature weapon,
palette, pose) — there's no image-generation tool in this project, so
that's text specs for an artist or an external image generator, not
finished art.

## Running it

```bash
npm install
npm run dev        # start the dev server
npm run test       # run the Vitest suite (82 tests, engine-only)
npm run typecheck  # tsc project build, no emit
npm run build      # production build (tsc -b && vite build)
npm run lint        # oxlint
```

## Online multiplayer setup (required to actually play)

The app needs a [Supabase](https://supabase.com) project for
matchmaking and move sync — see `DESIGN.md` §4 for how it works
(public queue + full-state broadcast over Realtime, no lockstep, no
accounts). One-time setup:

1. Create a free project at supabase.com.
2. In **SQL Editor**, paste and run [`supabase/schema.sql`](./supabase/schema.sql).
   It creates the matchmaking tables/function and enables Realtime on
   them — safe to re-run, it's idempotent.
3. In **Project Settings → API**, copy the **Project URL** and **anon
   public** key (the anon key is meant to be used client-side; it's not
   a secret admin key).
4. Copy `.env.example` to `.env` and fill in those two values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. For the GitHub Actions builds (Pages + Android) to include real
   multiplayer instead of the "not configured" screen, add the same two
   values as **repository secrets** (`Settings → Secrets and variables →
   Actions`) named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both
   workflows already read them — nothing else to wire up.

Without this, the app still runs and shows the main menu, but **Find
Match** stays disabled with an explanatory message — nothing crashes.

## Continuous deployment

Two GitHub Actions workflows run automatically:

- **`.github/workflows/android.yml`** — on every push, builds the web
  app and compiles it into a debug APK. Download it from the **Actions**
  tab → the run → the `the-awakened-debug-apk` artifact.
- **`.github/workflows/deploy-web.yml`** — on every push to the repo's
  default branch, runs the tests, builds the web app, and publishes it
  to GitHub Pages.

**One-time setup required for Pages** (GitHub won't deploy until this is
done — it can't be set from a workflow file): in the repo, go to
**Settings → Pages → Build and deployment → Source**, and choose
**GitHub Actions**. After that, every push to the default branch
auto-deploys to `https://<owner>.github.io/<repo>/`. The Vite config
(`vite.config.ts`) already sets the right base path for that URL when
`GITHUB_PAGES=true` (only the Pages workflow sets it — local dev, the
Android build, and `npm run build` on its own are unaffected).

## Building the Android app

The game is wrapped as a native Android app with
[Capacitor](https://capacitorjs.com/) — the web build runs inside a
WebView, so the entire engine, UI, and battlefield above are unchanged.
The `android/` folder is a standard Gradle/Android Studio project.

### Option A: GitHub Actions (no local Android setup needed)

`.github/workflows/android.yml` builds a debug APK on every push. Open
the **Actions** tab on GitHub → the latest **Android Debug APK** run →
download the `the-awakened-debug-apk` artifact from the run summary. It
contains `app-debug.apk`, ready to install on a device
(`adb install app-debug.apk`, or just copy it to a phone and tap it —
you'll need to allow installs from unknown sources).

### Option B: Build locally

**One-time setup on your machine:**

1. Install [Android Studio](https://developer.android.com/studio) (it
   bundles the Android SDK) or the standalone SDK command-line tools.
2. Clone this repo and check out this branch, then `npm install`.

**Build a debug APK:**

```bash
npm run android:sync   # builds the web app and copies it into android/
cd android
./gradlew assembleDebug
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk` —
install it on a device/emulator with `adb install app-debug.apk`, or open
the `android/` folder directly in Android Studio and hit Run.

**Release build (for the Play Store):** you'll additionally need a
signing keystore (`keytool -genkeypair -v -keystore release.keystore
-alias the-awakened -keyalg RSA -keysize 2048 -validity 10000`, kept
private and out of version control) wired up in
`android/app/build.gradle`, then `./gradlew bundleRelease` to produce an
`.aab` for Play Console. For an iOS build later, add the platform with
`npx cap add ios` — no other changes needed, since Capacitor shares the
same web build across both platforms.

App id: `com.theawakened.game` · configured in `capacitor.config.ts`. If
you rename it, re-run `npx cap sync` and update the `applicationId` /
`namespace` in `android/app/build.gradle` to match.

## How to play

The main menu went through 3 rounds of redesign against reference
mockups (`DESIGN.md` §9.21-§9.25); §9.25's version is a full
mobile-game home-screen shell — a side nav rail, a top bar, a season
banner, 3 mode buttons, a daily-reward bar, and a 5-tab bottom nav.
Almost none of the systems that chrome implies exist (no leveling,
currency, seasons, clans, or a battle pass — this prototype is
explicitly skill-decides-matches, not pay-to-win), so every number on
it is a static, neutral placeholder, and anything with no real screen
behind it opens a shared "Coming Soon" screen (`ComingSoon.tsx`)
instead of a silent dead click. What's actually real:
- **Find Match** — real online matchmaking (needs Supabase configured; see
  above). Disabled with an explanation if it isn't.
- **Practice** — a local, offline match against a simple bot
  opponent (`src/engine/bot.ts` + `src/state/usePracticeMatch.ts`). No
  network involved, good for trying out mechanics or verifying a change
  without needing a second device. The bot plays a random affordable,
  legal card each turn and never uses Team-Ups — it's a punching bag, not
  a serious AI.
- **Store** (sidebar) — honest "coming soon" placeholder. No currency or
  purchases exist in this prototype by design.
- **Collection** (sidebar) and **Decks** (bottom tab) — both open the
  Deck Builder: browse every hero's full card text and save a
  preferred 3-hero loadout (stored locally), which pre-fills team
  selection in both modes above. The engine's decks are fixed per hero
  (3 copies each of their Attack, Ability, and Support card) — there's
  no separate card-picking mechanic yet, so this is really "choose your
  team," just with full card details up front.
- **Missions** (sidebar) — opens the Objectives screen: a Daily/Weekly
  summary (matches played/won, tracked locally, reset at local
  midnight / Monday) — no rewards wired up yet, just progress
  visibility. Shows a small red dot while anything on either list is
  still incomplete.
- Everything else on the menu — **Custom Match**, **Events**,
  **Leaderboard**, **Battle Pass**, **Clan**, **Profile**, the friends/
  mail icons, the season banner, and the daily-reward Claim button —
  is cosmetic or opens "Coming Soon."

1. **Find Match.** Tap **Find Match** on the main menu. You're paired
   with the next other player who's also looking (public queue — see
   `DESIGN.md` §4.1). (Or tap **Practice vs Bot** to skip matchmaking
   entirely.)
2. **Hero Selection.** Pick exactly 3 of your 17 offered heroes and lock
   in. You see only your own picks; once both players have locked in,
   both teams' full rosters become visible on the battlefield. A locked
   team cannot change for the rest of the match.
3. **Battle.** Every round, both players plan simultaneously — there's
   no waiting for a turn. Each round you get a fresh hand of 5 cards
   drawn from your personal deck (built from your 3 heroes' Attack,
   Ability, and Support cards, 3 copies of each) and an energy budget of
   3 plus each of your living heroes' Energy stat (shown per-hero in the
   Deck Builder) — most heroes add 0, a couple add 1.
   - Tap a card in your hand to arm it, then tap a highlighted hero on
     the battlefield to target it. This queues the action (shown in
     your **Planned Actions** list) — nothing resolves yet, and your
     opponent can't see what you've queued. Cards that hit every enemy
     or buff every ally (like Flame Wave or Guardian's Watch) queue
     immediately with no target tap needed. Support cards target one of
     your own heroes instead of an enemy — most **Empower** an ally
     (shown as a 💪 badge on their plate), adding bonus damage to that
     hero's next hit before the buff is consumed.
   - Queue as many actions as your energy allows, in any order. Change
     your mind? Tap a queued action to unqueue it and get its energy
     back.
   - Unused energy does not carry over — spend it or lose it.
   - Tap **Fight** when you're done planning. Once both players are
     ready, everyone's queued actions resolve together, fastest hero
     first (by Speed stat, Pokémon-style — ties fall back to the same
     alternating order as before) — so an early action can defeat a
     hero (or a Team-Up's required hero) before a later queued action
     against it gets to resolve, in which case that later action
     fizzles instead of firing. This is what makes prediction matter:
     guessing what your opponent is likely to queue — and how fast
     their heroes are — is a real skill.
   - The next round then begins automatically — no separate "end turn"
     step.
4. **Team-Ups.** Once both of a Team-Up's required heroes are alive and
   on your roster, its pill appears above your hand — tap it to queue it
   for 3 energy, same as any other action (it resolves in Fight along
   with everything else, and can fizzle the same way if a required hero
   is defeated first). Each Team-Up can only be used once per match, and
   disappears permanently if either required hero is defeated.
5. **Victory.** Defeat all 3 of your opponent's heroes. The match stops
   accepting actions immediately once a winner is decided.

The 📜 icon opens the full battle log; the latest event also shows as a
small banner on the battlefield. The 🐞 icon (bottom-right, low-key on
purpose) opens a raw state inspector for debugging.

## The 17 heroes (prototype names — easy to reskin later)

The original 7, plus a second wave (§9.20) adding one more hero per
element so every element now fields exactly 2:

| Hero | Role | Element | HP | Passive |
|---|---|---|---|---|
| Inferna | Mage | Fire | 18 | +1 damage to targets already Burning |
| Earth Guardian | Tank | Earth | 24 | Starts the match with 4 Shield |
| Tydra | Support | Water | 20 | First heal each match restores +1 HP |
| Spark Duelist | Brawler | Spark | 20 | +2 Shield after a Water+Spark interaction |
| Mourn | Speedster | Undead | 16 | First hit taken each match is reduced by 3 (min 1) |
| Kairo | Ranger | Charm | 17 | +1 damage to targets already Charmed |
| Spirit Mage | Mage | Spirit | 16 | Survives the first lethal hit each match at 1 HP |
| Torrent | Tank | Water | 26 | Starts the match with 5 Shield |
| Zera | Ranger | Spark | 18 | Extremely high Accuracy/Crit vs. Wet targets |
| Orin | Mage | Spirit | 17 | This hero's healing is 10% stronger |
| Sorrow | Brawler | Earth | 22 | +2 damage to Shielded targets |
| Kharos | Tank | Undead | 28 | Starts the match with 4 Shield |
| Flint | Support | Fire | 19 | Rekindle also grants 2 Shield to its target |
| Erosalina | Ranger | Charm | 17 | +1 damage to targets already Charmed |
| Rune | Support | Spirit | 18 | A spirit wolf watches over this hero's allies |
| Amp | Speedster | Spark | 15 | First hit taken each match is reduced by 3 (min 1) |
| Cragor | Tank | Earth | 27 | Starts the match with 6 Shield |

Sorrow and Cragor currently render on the shared vector chassis rather
than real illustrated art — see §9.20 in `DESIGN.md` for why.

Each hero also has a full stat block (Attack, Defense, Speed, Accuracy,
Evasion, Critical Chance/Damage, Energy, Cooldown Reduction, Healing
Power, Shield Strength) shown in full in the Deck Builder — see "Stats"
below and `DESIGN.md` §8 for exactly how each one is used.

Each hero has one Attack card (1 energy), one Ability card (2 energy), one
Support card (2 energy — heals, shields, or Empowers an ally, see
`DESIGN.md` §6), and one passive. Full card text and numbers are in
`DESIGN.md` §2.

**Team-Ups:** *Steam Surge* (Inferna + Tydra) and *Thunder Tide*
(Tydra + Spark Duelist) — 3 energy, once per match, with a
fixed resolution order shown in the card's description. Kairo
and Spirit Mage don't have one yet (see `DESIGN.md` §7.2).

## Elements

- **Fire** → Burn: fixed damage at the start of the burned hero's
  controller's next 2 turns.
- **Water** → Wet: a flag that Spark cards consume for bonus damage.
- **Spark** → deals bonus fixed damage to Wet targets and removes Wet.
- **Earth** → Shield: absorbs incoming damage before HP.
- **Charm** → Charmed: subtracts fixed damage (floor 1) from the
  charmed hero's next damage-dealing action, then clears. The inverse
  of Empower (see `DESIGN.md` §6.1, §7.3) — a debuff on an enemy
  instead of a buff on an ally, using the same mechanism.
- **Spirit** → no shared status of its own; expressed instead through
  lifesteal cards (deal damage, heal the caster) and Spirit Mage's
  "survive one lethal hit" passive (`DESIGN.md` §7.4).
- **Undead** → no shared status either; currently just Undead
  Assassin's flavor plus its existing first-hit-reduction passive.

All interactions are deterministic and reflected as status badges on each
hero's health plate (🔥 Burn ticks remaining, 💧 Wet, 🛡 Shield amount,
💪 Empower bonus, 💫 Charm reduction, 🏃 Speed).

## Stats

Every hero has Health, Attack, Defense, and Speed, plus 8 secondary
stats (Accuracy, Evasion, Critical Chance/Damage, Energy, Cooldown
Reduction, Healing Power, Shield Strength) — see the Deck Builder for
every hero's full block, and `DESIGN.md` §8 for the exact formulas.
**Nothing here is randomized** — the same "no dice rolls, every outcome
predictable" rule from the top of this README applies to stats too:

- **Speed** decides resolution order in the Fight phase — the fastest
  acting hero across *both* players goes first, Pokémon-style, not
  "player1 always first" like earlier versions of this game.
- **Attack**/**Defense** are flat modifiers added to/subtracted from a
  card's damage.
- **Accuracy** vs. the target's **Evasion** decides a full hit or a
  halved "graze" — never a miss, since wasting an entire blind-queued
  action would feel bad.
- **Critical Chance** is a flat threshold, not a %: cross it and every
  hit crits, guaranteed. No hero's base kit crosses it on its own.
- **Energy** adds to your per-round energy budget while that hero is
  alive; **Cooldown Reduction** discounts that hero's Ability/Support
  card costs; **Healing Power**/**Shield Strength** scale the heals/
  Shield that hero grants.

Roles lean into different stats — Tanks run high Health/Defense,
Supports run high Healing Power, Rangers run high Accuracy/Critical
Chance, and so on — but nothing is enforced; a hero's actual numbers
are what matter, the same way Spirit Mage already bends "Mage" away
from Inferna's burst-damage template.

## Architecture

The rules engine (`src/engine/`) is plain TypeScript with no dependency on
React, the rendering layer, or the network layer — every action is a pure function
that takes a `MatchState` and returns a new `MatchState` plus an ordered
`GameEvent[]` list. Both players' devices run the exact same engine code
locally; nothing server-side re-simulates the game (see `DESIGN.md` §4.2
for why, and its tradeoffs).

```
src/engine/       Pure rules engine (unchanged whether local or online)
  types.ts         Core typed models (Hero, Card, Status, MatchState, GameEvent…)
  heroes.ts        The 7 hero definitions (incl. stat blocks) + their
                     Attack/Ability/Support card resolvers, effectiveCardCost()
  elements.ts      The 7-element advantage web (elementalMultiplier()), see DESIGN.md §8.3
  teamups.ts       The 2 Team-Up card definitions
  cards.ts         Card-id → CardDefinition registry
  selection.ts     Hero-pick validation (exactly 3 of 7, lock-in)
  deck.ts          Deck building, draw/discard/reshuffle
  combat.ts        Damage (Attack/Defense/elemental/Accuracy/Crit, DESIGN.md §8),
                     healing, shields, Burn/Wet/Empower/Charm primitives, victory check
  status.ts        Start-of-round Burn ticking
  targeting.ts     Target-selection validation per card's target type
  teamup.ts        Team-Up availability rules
  turn.ts          Start-of-round sequencing (energy budget = base + each
                     living hero's Energy stat, draw, status ticks)
  match.ts         Public API: createMatch / queueCard / queueTeamUp /
                     unqueueAction / setReady — planning + Speed-sorted
                     "Fight" resolution, see DESIGN.md §5 and §8.5
  rng.ts           Injectable RNG (seeded for tests; Math.random in the app)
  bot.ts           chooseBotAction() for Practice mode — picks a random
                     affordable, legal card + target; never uses Team-Ups

src/net/          Supabase-backed networking (matchmaking + realtime sync)
  identity.ts       Anonymous per-device id (localStorage), not auth
  supabaseClient.ts Client + isOnlineConfigured() guard
  matchmaking.ts    find_match RPC + waitForMatch() queue subscription
  matchChannel.ts   Per-match Realtime Broadcast channel + presence

src/state/
  useOnlineMatch.ts   Drives the online flow: matchmaking → hero-selection
                        sync → state-broadcast sync, exposing a small API
                        (state, phase, myRole, queueCard/queueTeamUp/
                        unqueueAction/setReady). Player 1 is the sole
                        authoritative resolver once both players are ready.
  usePracticeMatch.ts Local vs-bot flow with the same API shape, no network —
                        the bot plans its whole round up front each round via
                        chooseBotAction, then both players resolve together
  loadout.ts          Preferred 3-hero loadout (localStorage), set by Deck
                        Builder, read by both hero-selection screens
  objectives.ts       Daily/weekly matches-played/won counters (localStorage,
                        date-keyed reset), recorded on every match end

src/scene/         Flat 2D side-on battlefield (DESIGN.md §9), no 3D
                     rendering library at all: HeroSprite (hand-coded
                     SVG hero rig — shared chassis + per-hero hair/gear/
                     color — for most heroes; a hero listed in its
                     REAL_ART map instead renders an actual illustrated
                     image asset, same animation cues either way, see
                     DESIGN.md §9.3), heroCosmetics.ts (per-hero skin/
                     eye/hair color), Battlefield (two facing DOM
                     "formations," your team always on the left
                     regardless of engine player id), useEventQueue
                     (steps engine events into per-event animation cues
                     one at a time)
src/ui/             MainMenu (full home-screen shell, §9.25),
                     DeckBuilder, Store, Objectives, ComingSoon
                     (shared placeholder for unbuilt nav targets),
                     Matchmaking, OnlineHeroSelection (shared by
                     online + practice), Battle (TopBar, CardHand,
                     TeamUpBar, CombatLog sheet, LatestEventToast),
                     VictoryScreen, DebugPanel
```

Every round's resolution produces an ordered list of `GameEvent`s (e.g.
`ACTION_QUEUED`, `CARD_PLAYED`, `DAMAGE_DEALT`, `SHIELD_ABSORBED`,
`STATUS_APPLIED`, `ACTION_FIZZLED`, `HERO_DEFEATED`, `TEAM_UP_TRIGGERED`,
`ROUND_RESOLVED`, `MATCH_ENDED`…). `useEventQueue` steps through a fresh
batch one event at a time so the battlefield can animate a hero lunging
forward, a target flashing red on a hit, or a shield glow — in the exact
order the engine produced them, on *both* players' screens (since the
resolving client's resulting state — including its full event log — is
what gets broadcast).

Card resolution logic (`combat.ts`, `targeting.ts`, `status.ts`, `teamup.ts`)
is fully decoupled from *when* actions happen — `match.ts` just decides the
order to feed queued actions through it. That's what made it possible to
replace the original alternating-turn model with simultaneous blind
planning (DESIGN.md §5) by rewriting `turn.ts` and `match.ts` alone,
without touching damage, targeting, or status-effect code.

## What's deliberately out of scope (see DESIGN.md §3 and §4.3)

Ultimates and more than 2 Team-Ups (Kairo and Spirit Mage
don't have one yet). Online multiplayer is intentionally simple: no accounts, no
server-side move validation (each client trusts the other's broadcast
state), and no reconnect/resume — a disconnect ends the match. Fine for
a casual hobby prototype; flagged here so it isn't mistaken for an
oversight later.
