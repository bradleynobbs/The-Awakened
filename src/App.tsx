import { useState } from "react";
import "./App.css";
import type { HeroTrio } from "./engine/match";
import { useMatch } from "./state/useMatch";
import { Battle } from "./ui/Battle";
import { DebugPanel } from "./ui/DebugPanel";
import { HeroSelection } from "./ui/HeroSelection";
import { VictoryScreen } from "./ui/VictoryScreen";

export default function App() {
  const match = useMatch();
  const [debugOpen, setDebugOpen] = useState(false);

  const handleComplete = (player1: HeroTrio, player2: HeroTrio) => {
    match.start(player1, player2);
  };

  const handleRestart = () => {
    match.reset();
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <span className="app-title">The Awakened</span>
        <div className="app-header-actions">
          {match.state && (
            <button className="text-button" onClick={handleRestart}>
              Restart Match
            </button>
          )}
          <button className="text-button" onClick={() => setDebugOpen((v) => !v)}>
            {debugOpen ? "Hide Debug" : "Debug"}
          </button>
        </div>
      </header>

      {!match.state && <HeroSelection onComplete={handleComplete} />}

      {match.state && !match.state.isMatchOver && (
        <Battle
          state={match.state}
          pendingEvents={match.pendingEvents}
          error={match.error}
          onClearError={match.clearError}
          onPlayCard={match.playCard}
          onPlayTeamUp={match.playTeamUp}
          onEndTurn={match.endTurn}
        />
      )}

      {match.state && match.state.isMatchOver && match.state.winnerId && (
        <VictoryScreen winnerId={match.state.winnerId} onRestart={handleRestart} />
      )}

      {debugOpen && match.state && <DebugPanel state={match.state} />}
    </div>
  );
}
