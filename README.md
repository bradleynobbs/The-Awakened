# The Awakened

A browser-based prototype for an original 1v1 tactical card battler,
presented as a cinematic 3D battlefield in the style of *Slay the Spire*
meets team-based PvP. Two players each lock in a 3-hero team and fight it
out with a shared action deck, deterministic damage, and elemental status
interactions. No random damage, no crits, no accuracy rolls — every
outcome is predictable and shown in the interface.

See [`DESIGN.md`](./DESIGN.md) for the full list of rule decisions made
while turning the original design brief into a buildable prototype
(turn structure, deck size, status durations, targeting edge cases,
Team-Up resolution order, and the balance numbers for every card).

## Running it

```bash
npm install
npm run dev        # start the dev server
npm run test       # run the Vitest suite (43 tests, engine-only)
npm run typecheck  # tsc project build, no emit
npm run build      # production build (tsc -b && vite build)
npm run lint        # oxlint
```

## Building the Android app

The game is wrapped as a native Android app with
[Capacitor](https://capacitorjs.com/) — the web build runs inside a
WebView, so the entire engine, UI, and 3D battlefield above are unchanged.
The `android/` folder is a standard Gradle/Android Studio project; only
the final compile step needs tooling this repo doesn't vendor (the
Android SDK), so run that part wherever you already have Android Studio
installed.

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

1. **Hero Selection.** Player 1 picks exactly 3 of the 5 offered heroes
   and locks them in; the device is then passed to Player 2, who does the
   same without seeing Player 1's picks. Both teams are revealed together.
   Once locked, a team cannot change for the rest of the match.
2. **Battle.** Turns alternate between players. On your turn you get 3
   energy and a fresh hand of 5 cards drawn from your personal deck (built
   from your 3 heroes' Attack + Ability cards, 3 copies of each).
   - Click a card in your hand to arm it, then click a highlighted hero on
     the battlefield to target it. Cards that hit all enemies (like Flame
     Wave) resolve immediately with no target click needed.
   - Unused energy does not carry over — spend it or lose it.
   - Click **End Turn** to pass to your opponent.
3. **Team-Ups.** Once both of a Team-Up's required heroes are alive and on
   your roster, its card appears above your hand, ready to play for 3
   energy. Each Team-Up can only be used once per match, and disappears
   permanently if either required hero is defeated.
4. **Victory.** Defeat all 3 of your opponent's heroes. The match stops
   accepting actions immediately once a winner is decided.

Use the **Debug** button in the header to inspect the raw match state at
any time, and **Restart Match** to abandon the current game and return to
hero selection.

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
React or Three.js — every action is a pure function that takes a
`MatchState` and returns a new `MatchState` plus an ordered `GameEvent[]`
list. The UI never mutates game state directly; it only calls engine
functions and renders whatever comes back.

```
src/engine/
  types.ts        Core typed models (Hero, Card, Status, MatchState, GameEvent…)
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

src/state/useMatch.ts     React hook wrapping the engine, tracks the latest
                           batch of events for animation
src/scene/                React Three Fiber battlefield: HeroModel (capsule +
                           HTML health plate), Battlefield (camera + layout),
                           useEventQueue (steps engine events into per-event
                           animation cues one at a time)
src/ui/                    Card hand, HUD, Team-Up bar, combat log, hero
                           selection, victory screen, debug panel
```

Every player action produces an ordered list of `GameEvent`s (e.g.
`CARD_PLAYED`, `DAMAGE_DEALT`, `SHIELD_ABSORBED`, `STATUS_APPLIED`,
`HERO_DEFEATED`, `TEAM_UP_TRIGGERED`, `MATCH_ENDED`…). `useEventQueue`
steps through a fresh batch one event at a time so the 3D scene can
animate a hero lunging forward, a target flashing red on a hit, or a
shield glow — in the exact order the engine produced them. The combat log
panel renders the same events as human-readable text.

The turn system (`turn.ts`) is intentionally isolated from everything
else so alternating turns could later be swapped for simultaneous
planning without touching damage, targeting, or status-effect code.

## What's deliberately out of scope (see DESIGN.md §3)

Ultimates, more than 4 elements, more than 5 heroes, more than 2 Team-Ups,
and true networked/simultaneous hero selection are all left for later —
this prototype is scoped to prove out the deterministic combat loop and
the 3D presentation layer.
