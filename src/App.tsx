import { useState } from "react";
import "./App.css";
import type { HeroTrio } from "./engine/match";
import { useOnlineMatch } from "./state/useOnlineMatch";
import { isOnlineConfigured } from "./net/supabaseClient";
import { Battle } from "./ui/Battle";
import { DebugPanel } from "./ui/DebugPanel";
import { MainMenu } from "./ui/MainMenu";
import { Matchmaking } from "./ui/Matchmaking";
import { OnlineHeroSelection } from "./ui/OnlineHeroSelection";
import { VictoryScreen } from "./ui/VictoryScreen";

export default function App() {
  const match = useOnlineMatch();
  const [debugOpen, setDebugOpen] = useState(false);

  const handleLockIn = (heroIds: HeroTrio) => {
    match.submitHeroSelection(heroIds);
  };

  return (
    <div className="app-root">
      {match.phase === "idle" && (
        <MainMenu online={isOnlineConfigured} onFindMatch={match.findOpponent} />
      )}

      {match.phase === "queueing" && <Matchmaking onCancel={match.cancelQueueing} />}

      {match.phase === "error" && (
        <div className="menu-screen">
          <h1>Something went wrong</h1>
          <p className="menu-warning">{match.error}</p>
          <button className="primary-button" onClick={match.leaveMatch}>
            Back to Menu
          </button>
        </div>
      )}

      {match.phase === "selecting" && (
        <OnlineHeroSelection waitingOnOpponent={match.waitingOnOpponentSelection} onLockIn={handleLockIn} />
      )}

      {match.phase === "opponent-left" && (
        <div className="menu-screen">
          <h1>Opponent disconnected</h1>
          <p className="menu-warning">Your opponent left the match.</p>
          <button className="primary-button" onClick={match.leaveMatch}>
            Back to Menu
          </button>
        </div>
      )}

      {match.phase === "battle" && match.state && match.myRole && !match.state.isMatchOver && (
        <Battle
          state={match.state}
          myRole={match.myRole}
          pendingEvents={match.pendingEvents}
          error={match.error}
          onClearError={match.clearError}
          onPlayCard={match.playCard}
          onPlayTeamUp={match.playTeamUp}
          onEndTurn={match.endTurn}
          onLeave={match.leaveMatch}
        />
      )}

      {match.phase === "battle" && match.state?.isMatchOver && match.state.winnerId && match.myRole && (
        <VictoryScreen winnerId={match.state.winnerId} myRole={match.myRole} onLeave={match.leaveMatch} />
      )}

      <button
        className="debug-toggle"
        onClick={() => setDebugOpen((v) => !v)}
        aria-label="Toggle debug panel"
      >
        🐞
      </button>
      {debugOpen && match.state && <DebugPanel state={match.state} />}
    </div>
  );
}
