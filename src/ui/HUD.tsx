import type { MatchState, PlayerId } from "../engine/types";

interface HUDProps {
  state: MatchState;
  onEndTurn: () => void;
  onCancelTargeting: () => void;
  isTargeting: boolean;
}

function PlayerPanel({ state, playerId }: { state: MatchState; playerId: PlayerId }) {
  const player = state.players[playerId];
  const isActive = state.activePlayerId === playerId;
  return (
    <div className={`player-panel${isActive ? " active" : ""}`}>
      <div className="player-panel-title">
        {playerId === "player1" ? "Player 1" : "Player 2"}
        {isActive && <span className="turn-badge">Current Turn</span>}
      </div>
      <div className="player-panel-stats">
        <span>⚡ {player.energy}/3 Energy</span>
        <span>🂠 Draw {player.drawPile.length}</span>
        <span>🗑 Discard {player.discardPile.length}</span>
        <span>✋ Hand {player.hand.length}</span>
      </div>
    </div>
  );
}

export function HUD({ state, onEndTurn, onCancelTargeting, isTargeting }: HUDProps) {
  return (
    <div className="hud-bar">
      <PlayerPanel state={state} playerId="player1" />
      <div className="hud-center">
        <div className="turn-number">Turn {state.turnNumber}</div>
        {isTargeting ? (
          <button className="secondary-button" onClick={onCancelTargeting}>
            Cancel Targeting
          </button>
        ) : (
          <button className="primary-button" onClick={onEndTurn}>
            End Turn
          </button>
        )}
      </div>
      <PlayerPanel state={state} playerId="player2" />
    </div>
  );
}
