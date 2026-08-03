import type { MatchState, PlayerId } from "../engine/types";

interface TopBarProps {
  state: MatchState;
  myRole: PlayerId;
  isMyTurn: boolean;
  onLeave: () => void;
  onToggleLog: () => void;
}

export function TopBar({ state, myRole, isMyTurn, onLeave, onToggleLog }: TopBarProps) {
  const me = state.players[myRole];

  return (
    <div className="top-bar">
      <button className="icon-button" onClick={onLeave} aria-label="Leave match">
        ←
      </button>
      <div className={`turn-pill${isMyTurn ? " mine" : ""}`}>
        {isMyTurn ? "Your Turn" : "Opponent's Turn"}
      </div>
      <div className="energy-pill">⚡ {me.energy}/3</div>
      <button className="icon-button" onClick={onToggleLog} aria-label="Battle log">
        📜
      </button>
    </div>
  );
}
