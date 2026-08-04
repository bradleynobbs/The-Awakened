import { roundEnergyBudget } from "../engine/turn";
import type { MatchState, PlayerId } from "../engine/types";

interface TopBarProps {
  state: MatchState;
  myRole: PlayerId;
  isReady: boolean;
  onLeave: () => void;
  onToggleLog: () => void;
}

export function TopBar({ state, myRole, isReady, onLeave, onToggleLog }: TopBarProps) {
  const me = state.players[myRole];

  return (
    <div className="top-bar">
      <button className="icon-button" onClick={onLeave} aria-label="Leave match">
        ←
      </button>
      <div className={`turn-pill${isReady ? "" : " mine"}`}>
        Round {state.roundNumber} — {isReady ? "Waiting for opponent…" : "Plan your actions"}
      </div>
      <div className="energy-pill">⚡ {me.energy}/{roundEnergyBudget(me)}</div>
      <button className="icon-button" onClick={onToggleLog} aria-label="Battle log">
        📜
      </button>
    </div>
  );
}
