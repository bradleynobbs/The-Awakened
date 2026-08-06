import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useOnlineMatch } from "./state/useOnlineMatch";
import { usePracticeMatch } from "./state/usePracticeMatch";
import { isOnlineConfigured } from "./net/supabaseClient";
import { getDeck, isDeckComplete } from "./state/loadout";
import { recordMatchResult } from "./state/objectives";
import { Battle } from "./ui/Battle";
import { BattlePrep } from "./ui/BattlePrep";
import { BottomTabs } from "./ui/BottomTabs";
import type { BottomTab } from "./ui/BottomTabs";
import { ComingSoon } from "./ui/ComingSoon";
import { DebugPanel } from "./ui/DebugPanel";
import { DeckBuilder } from "./ui/DeckBuilder";
import { MainMenu } from "./ui/MainMenu";
import { Matchmaking } from "./ui/Matchmaking";
import { Objectives } from "./ui/Objectives";
import { Store } from "./ui/Store";
import { VictoryScreen } from "./ui/VictoryScreen";

/** Nav destinations added in §9.25's menu redesign that have nothing
 * real behind them yet — all rendered through the one ComingSoon
 * component below rather than six near-identical screen files. */
const COMING_SOON_SCREENS = {
  events: { title: "Events", icon: "📅", message: "Limited-time events aren't running yet — check back later." },
  leaderboard: { title: "Leaderboard", icon: "🏆", message: "Ranked standings aren't tracked yet." },
  clan: { title: "Clan", icon: "🛡", message: "Clans/guilds aren't built yet." },
  profile: { title: "Profile", icon: "👤", message: "A dedicated profile screen isn't built yet." },
} as const;

type ComingSoonKey = keyof typeof COMING_SOON_SCREENS;

type Screen = "menu" | "deckbuilder" | "store" | "objectives" | "online" | "practice" | ComingSoonKey;

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const online = useOnlineMatch();
  const practice = usePracticeMatch();
  const [debugOpen, setDebugOpen] = useState(false);
  const recorded = useRef({ online: false, practice: false });
  /** Battle Preparation (§9.46 — see DESIGN.md) plays a short reveal
   * cinematic once both players' 3-fighter picks are known, which for
   * an online match happens at the exact moment the underlying match
   * is created (useOnlineMatch flips phase straight to "battle" with
   * no pause of its own for an animation). These two flags are what
   * let BattlePrep keep rendering for a beat *after* that instead of
   * being unmounted immediately in favor of the battle screen — see
   * the screen === "online"/"practice" blocks below. */
  const [onlineRevealDone, setOnlineRevealDone] = useState(false);
  const [practiceRevealDone, setPracticeRevealDone] = useState(false);
  const onlineDeckSentRef = useRef(false);
  const deck = getDeck();
  const deckComplete = isDeckComplete(deck);

  useEffect(() => {
    if (online.phase === "selecting" && !onlineDeckSentRef.current) {
      onlineDeckSentRef.current = true;
      online.submitDeck(deck);
    }
  }, [online, online.phase, deck]);

  useEffect(() => {
    if (!online.state) {
      recorded.current.online = false;
      return;
    }
    if (online.state.isMatchOver && online.myRole && !recorded.current.online) {
      recorded.current.online = true;
      recordMatchResult(online.state.winnerId === online.myRole);
    }
  }, [online.state, online.myRole]);

  useEffect(() => {
    if (!practice.state) {
      recorded.current.practice = false;
      return;
    }
    if (practice.state.isMatchOver && !recorded.current.practice) {
      recorded.current.practice = true;
      recordMatchResult(practice.state.winnerId === "player1");
    }
  }, [practice.state]);

  const goMenu = () => setScreen("menu");

  const handleFindMatch = () => {
    setScreen("online");
    if (!deckComplete) return; // the "online" screen itself shows the incomplete-deck notice
    onlineDeckSentRef.current = false;
    setOnlineRevealDone(false);
    online.findOpponent();
  };

  const handlePracticeMatch = () => {
    setScreen("practice");
    setPracticeRevealDone(false);
  };

  const handleOnlineLeave = () => {
    online.leaveMatch();
    onlineDeckSentRef.current = false;
    setOnlineRevealDone(false);
    goMenu();
  };

  const handlePracticeLeave = () => {
    practice.leaveMatch();
    setPracticeRevealDone(false);
    goMenu();
  };

  const handleCancelQueueing = () => {
    online.cancelQueueing();
    goMenu();
  };

  /** §9.26: the bottom tabs are a persistent, app-wide sibling (not
   * owned by MainMenu) so they're clickable from every meta/menu
   * screen, not just the menu itself — the concrete complaint was the
   * Deck Builder screen having no way back to Home except the header's
   * back arrow. Hidden during the actual match flow (online/practice,
   * every phase) since that's a focused session with its own "leave"
   * mechanism — tapping "Clan" mid-battle isn't a real use case, and
   * showing tabs there would compete with Battle's own hand-tray UI
   * for the bottom of the screen. */
  const bottomTabsScreen: Partial<Record<Screen, BottomTab | null>> = {
    menu: "home",
    deckbuilder: "decks",
    store: "store",
    objectives: null,
    events: null,
    leaderboard: null,
    clan: "clan",
    profile: "profile",
  };
  const activeTab = bottomTabsScreen[screen];
  const showBottomTabs = activeTab !== undefined;

  return (
    <div className="app-root">
      {screen === "menu" && (
        <MainMenu
          online={isOnlineConfigured}
          onFindMatch={handleFindMatch}
          onPracticeMatch={handlePracticeMatch}
          onDeckBuilder={() => setScreen("deckbuilder")}
          onStore={() => setScreen("store")}
          onObjectives={() => setScreen("objectives")}
          onEvents={() => setScreen("events")}
          onLeaderboard={() => setScreen("leaderboard")}
        />
      )}

      {screen === "deckbuilder" && <DeckBuilder onBack={goMenu} />}
      {screen === "store" && <Store onBack={goMenu} />}
      {screen === "objectives" && <Objectives onBack={goMenu} />}
      {(Object.keys(COMING_SOON_SCREENS) as ComingSoonKey[]).map(
        (key) =>
          screen === key && <ComingSoon key={key} {...COMING_SOON_SCREENS[key]} onBack={goMenu} />,
      )}

      {screen === "online" && (
        <>
          {!deckComplete && (
            <div className="menu-screen">
              <h1>Build Your Deck First</h1>
              <p className="menu-warning">
                You need a full 5-hero deck before finding a match — head to the Deck Builder to
                pick your 5.
              </p>
              <button className="primary-button" onClick={() => setScreen("deckbuilder")}>
                Go to Deck Builder
              </button>
            </div>
          )}

          {deckComplete && online.phase === "queueing" && <Matchmaking onCancel={handleCancelQueueing} />}

          {deckComplete && online.phase === "error" && (
            <div className="menu-screen">
              <h1>Something went wrong</h1>
              <p className="menu-warning">{online.error}</p>
              <button className="primary-button" onClick={handleOnlineLeave}>
                Back to Menu
              </button>
            </div>
          )}

          {/* Battle Preparation stays mounted through a beat of "battle" phase too — see
           * onlineRevealDone's own comment above — so its cinematic reveal has time to
           * play instead of being cut off the instant the match is actually created. */}
          {deckComplete &&
            (online.phase === "selecting" || (online.phase === "battle" && !onlineRevealDone)) && (
              <BattlePrep
                myDeck={deck}
                opponentDeck={online.opponentDeck}
                matchReady={online.phase === "battle"}
                opponentPick={online.opponentPick}
                onSubmitPick={online.submitHeroSelection}
                onCinematicDone={() => setOnlineRevealDone(true)}
              />
            )}

          {deckComplete && online.phase === "opponent-left" && (
            <div className="menu-screen">
              <h1>Opponent disconnected</h1>
              <p className="menu-warning">Your opponent left the match.</p>
              <button className="primary-button" onClick={handleOnlineLeave}>
                Back to Menu
              </button>
            </div>
          )}

          {deckComplete &&
            onlineRevealDone &&
            online.phase === "battle" &&
            online.state &&
            online.myRole &&
            !online.state.isMatchOver && (
              <Battle
                state={online.state}
                myRole={online.myRole}
                pendingEvents={online.pendingEvents}
                error={online.error}
                onClearError={online.clearError}
                onQueueCard={online.queueCard}
                onQueueTeamUp={online.queueTeamUp}
                onUnqueueAction={online.unqueueAction}
                onReady={online.setReady}
                onLeave={handleOnlineLeave}
              />
            )}

          {deckComplete &&
            onlineRevealDone &&
            online.phase === "battle" &&
            online.state?.isMatchOver &&
            online.state.winnerId &&
            online.myRole && (
              <VictoryScreen winnerId={online.state.winnerId} myRole={online.myRole} onLeave={handleOnlineLeave} />
            )}
        </>
      )}

      {screen === "practice" && (
        <>
          {!deckComplete && (
            <div className="menu-screen">
              <h1>Build Your Deck First</h1>
              <p className="menu-warning">
                You need a full 5-hero deck before starting a practice match — head to the Deck
                Builder to pick your 5.
              </p>
              <button className="primary-button" onClick={() => setScreen("deckbuilder")}>
                Go to Deck Builder
              </button>
            </div>
          )}

          {deckComplete && (practice.phase === "selecting" || (practice.phase === "battle" && !practiceRevealDone)) && (
            <BattlePrep
              myDeck={deck}
              opponentDeck={practice.botDeck}
              matchReady={practice.phase === "battle"}
              opponentPick={practice.botPick}
              onSubmitPick={practice.start}
              onCinematicDone={() => setPracticeRevealDone(true)}
            />
          )}

          {deckComplete &&
            practiceRevealDone &&
            practice.phase === "battle" &&
            practice.state &&
            !practice.state.isMatchOver && (
              <Battle
                state={practice.state}
                myRole="player1"
                pendingEvents={practice.pendingEvents}
                error={practice.error}
                onClearError={practice.clearError}
                onQueueCard={practice.queueCard}
                onQueueTeamUp={practice.queueTeamUp}
                onUnqueueAction={practice.unqueueAction}
                onReady={practice.setReady}
                onLeave={handlePracticeLeave}
              />
            )}

          {deckComplete &&
            practiceRevealDone &&
            practice.phase === "battle" &&
            practice.state?.isMatchOver &&
            practice.state.winnerId && (
              <VictoryScreen winnerId={practice.state.winnerId} myRole="player1" onLeave={handlePracticeLeave} />
            )}
        </>
      )}

      {showBottomTabs && (
        <BottomTabs
          active={activeTab ?? null}
          onHome={goMenu}
          onDecks={() => setScreen("deckbuilder")}
          onStore={() => setScreen("store")}
          onClan={() => setScreen("clan")}
          onProfile={() => setScreen("profile")}
        />
      )}

      <button
        className="debug-toggle"
        onClick={() => setDebugOpen((v) => !v)}
        aria-label="Toggle debug panel"
      >
        🐞
      </button>
      {debugOpen && (online.state ?? practice.state) && (
        <DebugPanel state={(online.state ?? practice.state)!} />
      )}
    </div>
  );
}
