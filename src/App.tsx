import { useEffect, useRef, useState } from "react";
import "./App.css";
import type { HeroTrio } from "./engine/match";
import { useOnlineMatch } from "./state/useOnlineMatch";
import { usePracticeMatch } from "./state/usePracticeMatch";
import { isOnlineConfigured } from "./net/supabaseClient";
import { getPreferredLoadout } from "./state/loadout";
import { recordMatchResult } from "./state/objectives";
import { Battle } from "./ui/Battle";
import { ComingSoon } from "./ui/ComingSoon";
import { DebugPanel } from "./ui/DebugPanel";
import { DeckBuilder } from "./ui/DeckBuilder";
import { MainMenu } from "./ui/MainMenu";
import { Matchmaking } from "./ui/Matchmaking";
import { Objectives } from "./ui/Objectives";
import { OnlineHeroSelection } from "./ui/OnlineHeroSelection";
import { Store } from "./ui/Store";
import { VictoryScreen } from "./ui/VictoryScreen";

/** Nav destinations added in §9.25's menu redesign that have nothing
 * real behind them yet — all rendered through the one ComingSoon
 * component below rather than six near-identical screen files. */
const COMING_SOON_SCREENS = {
  events: { title: "Events", icon: "📅", message: "Limited-time events aren't running yet — check back later." },
  leaderboard: { title: "Leaderboard", icon: "🏆", message: "Ranked standings aren't tracked yet." },
  custommatch: {
    title: "Custom Match",
    icon: "🛡",
    message: "Private lobbies with custom rules aren't wired up yet — try Find Match or Practice instead.",
  },
  battlepass: { title: "Battle Pass", icon: "🎫", message: "There's no season pass yet — no currency or purchases exist in this prototype by design." },
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
    online.findOpponent();
  };

  const handleOnlineLeave = () => {
    online.leaveMatch();
    goMenu();
  };

  const handlePracticeLeave = () => {
    practice.leaveMatch();
    goMenu();
  };

  const handleCancelQueueing = () => {
    online.cancelQueueing();
    goMenu();
  };

  const handleOnlineLockIn = (heroIds: HeroTrio) => online.submitHeroSelection(heroIds);
  const handlePracticeLockIn = (heroIds: HeroTrio) => practice.start(heroIds);

  const preferredLoadout = getPreferredLoadout() ?? undefined;

  return (
    <div className="app-root">
      {screen === "menu" && (
        <MainMenu
          online={isOnlineConfigured}
          onFindMatch={handleFindMatch}
          onPracticeMatch={() => setScreen("practice")}
          onDeckBuilder={() => setScreen("deckbuilder")}
          onStore={() => setScreen("store")}
          onObjectives={() => setScreen("objectives")}
          onEvents={() => setScreen("events")}
          onLeaderboard={() => setScreen("leaderboard")}
          onCustomMatch={() => setScreen("custommatch")}
          onBattlePass={() => setScreen("battlepass")}
          onClan={() => setScreen("clan")}
          onProfile={() => setScreen("profile")}
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
          {online.phase === "queueing" && <Matchmaking onCancel={handleCancelQueueing} />}

          {online.phase === "error" && (
            <div className="menu-screen">
              <h1>Something went wrong</h1>
              <p className="menu-warning">{online.error}</p>
              <button className="primary-button" onClick={handleOnlineLeave}>
                Back to Menu
              </button>
            </div>
          )}

          {online.phase === "selecting" && (
            <OnlineHeroSelection
              waitingOnOpponent={online.waitingOnOpponentSelection}
              initialHeroIds={preferredLoadout}
              onLockIn={handleOnlineLockIn}
            />
          )}

          {online.phase === "opponent-left" && (
            <div className="menu-screen">
              <h1>Opponent disconnected</h1>
              <p className="menu-warning">Your opponent left the match.</p>
              <button className="primary-button" onClick={handleOnlineLeave}>
                Back to Menu
              </button>
            </div>
          )}

          {online.phase === "battle" && online.state && online.myRole && !online.state.isMatchOver && (
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

          {online.phase === "battle" &&
            online.state?.isMatchOver &&
            online.state.winnerId &&
            online.myRole && (
              <VictoryScreen winnerId={online.state.winnerId} myRole={online.myRole} onLeave={handleOnlineLeave} />
            )}
        </>
      )}

      {screen === "practice" && (
        <>
          {practice.phase === "selecting" && (
            <OnlineHeroSelection
              waitingOnOpponent={false}
              initialHeroIds={preferredLoadout}
              onLockIn={handlePracticeLockIn}
            />
          )}

          {practice.phase === "battle" && practice.state && !practice.state.isMatchOver && (
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

          {practice.phase === "battle" && practice.state?.isMatchOver && practice.state.winnerId && (
            <VictoryScreen winnerId={practice.state.winnerId} myRole="player1" onLeave={handlePracticeLeave} />
          )}
        </>
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
