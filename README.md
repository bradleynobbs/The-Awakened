# The Awakened

A mobile-first, online 1v1 tactical card battler, presented as a
cinematic 3D battlefield in the style of *Slay the Spire* meets
team-based PvP. Two players each lock in a 3-hero team and fight it out
over the network with a shared action deck, deterministic damage, and
elemental status interactions. No random damage, no crits, no accuracy
rolls — every outcome is predictable and shown in the interface.

See [`DESIGN.md`](./DESIGN.md) for the full list of rule decisions made
while turning the original design brief into a buildable prototype (turn
structure, deck size, status durations, targeting edge cases, Team-Up
resolution order, balance numbers for every card, and the online
matchmaking/sync design in section 4).

## Running it

```bash
npm install
npm run dev        # start the dev server
npm run test       # run the Vitest suite (43 tests, engine-only)
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
WebView, so the entire engine, UI, and 3D battlefield above are unchanged.
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

The main menu has:
- **Find Match** — real online matchmaking (needs Supabase configured; see
  above). Grayed out with an explanation if it isn't.
- **Practice vs Bot** — a local, offline match against a simple bot
  opponent (`src/engine/bot.ts` + `src/state/usePracticeMatch.ts`). No
  network involved, good for trying out mechanics or verifying a change
  without needing a second device. The bot plays a random affordable,
  legal card each turn and never uses Team-Ups — it's a punching bag, not
  a serious AI.
- **Deck Builder** — browse every hero's full card text and save a
  preferred 3-hero loadout (stored locally), which pre-fills team
  selection in both modes above. The engine's decks are fixed per hero
  (3 copies of their Attack + Ability card each) — there's no separate
  card-picking mechanic yet, so this is really "choose your team," just
  with full card details up front.
- **Store** — honest "coming soon" placeholder. No currency or
  purchases exist in this prototype by design.
- A **Daily/Weekly objectives** summary (matches played/won, tracked
  locally, reset at local midnight / Monday) — no rewards wired up yet,
  just progress visibility.

1. **Find Match.** Tap **Find Match** on the main menu. You're paired
   with the next other player who's also looking (public queue — see
   `DESIGN.md` §4.1). (Or tap **Practice vs Bot** to skip matchmaking
   entirely.)
2. **Hero Selection.** Pick exactly 3 of your 5 offered heroes and lock
   in. You see only your own picks; once both players have locked in,
   both teams' full rosters become visible on the battlefield. A locked
   team cannot change for the rest of the match.
3. **Battle.** Turns alternate. On your turn you get 3 energy and a
   fresh hand of 5 cards drawn from your personal deck (built from your
   3 heroes' Attack + Ability cards, 3 copies of each).
   - Tap a card in your hand to arm it, then tap a highlighted hero on
     the battlefield to target it. Cards that hit all enemies (like
     Flame Wave) resolve immediately with no target tap needed.
   - Unused energy does not carry over — spend it or lose it.
   - Tap **End Turn** to pass to your opponent.
4. **Team-Ups.** Once both of a Team-Up's required heroes are alive and
   on your roster, its pill appears above your hand — tap it to expand
   and play it for 3 energy. Each Team-Up can only be used once per
   match, and disappears permanently if either required hero is
   defeated.
5. **Victory.** Defeat all 3 of your opponent's heroes. The match stops
   accepting actions immediately once a winner is decided.

The 📜 icon opens the full battle log; the latest event also shows as a
small banner on the battlefield. The 🐞 icon (bottom-right, low-key on
purpose) opens a raw state inspector for debugging.

## The 5 heroes (prototype names — easy to reskin later)

| Hero | Role | Element | HP | Passive |
|---|---|---|---|---|
| Fire Mage | Mage | Fire | 18 | +1 damage to targets already Burning |
| Earth Guardian | Defender | Earth | 24 | Starts the match with 4 Shield |
| Water Healer | Support | Water | 20 | First heal each match restores +1 HP |
| Lightning Duelist | Fighter | Lightning | 20 | +2 Shield after a Water+Lightning interaction |
| Shadow Assassin | Assassin | Shadow | 16 | First hit taken each match is reduced by 3 (min 1) |

Each hero has one Attack card (1 energy), one Ability card (2 energy), and
one passive. Full card text and numbers are in `DESIGN.md` §2.

**Team-Ups:** *Steam Surge* (Fire Mage + Water Healer) and *Thunder Tide*
(Water Healer + Lightning Duelist) — 3 energy, once per match, with a
fixed resolution order shown in the card's description.

## Elements

- **Fire** → Burn: fixed damage at the start of the burned hero's
  controller's next 2 turns.
- **Water** → Wet: a flag that Lightning cards consume for bonus damage.
- **Lightning** → deals bonus fixed damage to Wet targets and removes Wet.
- **Earth** → Shield: absorbs incoming damage before HP.

All interactions are deterministic and reflected as status badges on each
hero's health plate (🔥 Burn ticks remaining, 💧 Wet, 🛡 Shield amount).

## Architecture

The rules engine (`src/engine/`) is plain TypeScript with no dependency on
React, Three.js, or the network layer — every action is a pure function
that takes a `MatchState` and returns a new `MatchState` plus an ordered
`GameEvent[]` list. Both players' devices run the exact same engine code
locally; nothing server-side re-simulates the game (see `DESIGN.md` §4.2
for why, and its tradeoffs).

```
src/engine/       Pure rules engine (unchanged whether local or online)
  types.ts         Core typed models (Hero, Card, Status, MatchState, GameEvent…)
  heroes.ts        The 5 hero definitions + their Attack/Ability card resolvers
  teamups.ts       The 2 Team-Up card definitions
  cards.ts         Card-id → CardDefinition registry
  selection.ts     Hero-pick validation (exactly 3 of 5, lock-in)
  deck.ts          Deck building, draw/discard/reshuffle
  combat.ts        Damage, healing, shields, Burn/Wet primitives, victory check
  status.ts        Start-of-turn Burn ticking
  targeting.ts     Target-selection validation per card's target type
  teamup.ts        Team-Up availability rules
  turn.ts          Begin/end-of-turn sequencing (energy reset, draw, status ticks)
  match.ts         Public API: createMatch / playCard / playTeamUp / endTurn
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
                        (state, phase, myRole, playCard/playTeamUp/endTurn)
  usePracticeMatch.ts Local vs-bot flow with the same API shape, no network —
                        drives the bot's turn via chooseBotAction on a timer
  loadout.ts          Preferred 3-hero loadout (localStorage), set by Deck
                        Builder, read by both hero-selection screens
  objectives.ts       Daily/weekly matches-played/won counters (localStorage,
                        date-keyed reset), recorded on every match end

src/scene/         React Three Fiber battlefield: HeroModel (capsule +
                     HTML health plate), Battlefield (camera + single-
                     perspective layout — your team always renders
                     nearest the camera regardless of engine player id),
                     useEventQueue (steps engine events into per-event
                     animation cues one at a time)
src/ui/             MainMenu (hero showcase, objectives), DeckBuilder,
                     Store, Matchmaking, OnlineHeroSelection (shared by
                     online + practice), Battle (TopBar, CardHand,
                     TeamUpBar, CombatLog sheet, LatestEventToast),
                     VictoryScreen, DebugPanel
```

Every player action produces an ordered list of `GameEvent`s (e.g.
`CARD_PLAYED`, `DAMAGE_DEALT`, `SHIELD_ABSORBED`, `STATUS_APPLIED`,
`HERO_DEFEATED`, `TEAM_UP_TRIGGERED`, `MATCH_ENDED`…). `useEventQueue`
steps through a fresh batch one event at a time so the 3D scene can
animate a hero lunging forward, a target flashing red on a hit, or a
shield glow — in the exact order the engine produced them, on *both*
players' screens (since the acting client's resulting state — including
its full event log — is what gets broadcast).

The turn system (`turn.ts`) is intentionally isolated from everything
else so alternating turns could later be swapped for simultaneous
planning without touching damage, targeting, or status-effect code.

## What's deliberately out of scope (see DESIGN.md §3 and §4.3)

Ultimates, more than 4 elements, more than 5 heroes, more than 2
Team-Ups. Online multiplayer is intentionally simple: no accounts, no
server-side move validation (each client trusts the other's broadcast
state), and no reconnect/resume — a disconnect ends the match. Fine for
a casual hobby prototype; flagged here so it isn't mistaken for an
oversight later.
