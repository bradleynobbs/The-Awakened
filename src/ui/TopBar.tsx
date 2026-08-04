import { roundEnergyBudget } from "../engine/turn";
import type { MatchState, PlayerId } from "../engine/types";

interface TopBarProps {
  state: MatchState;
  myRole: PlayerId;
  isReady: boolean;
  isBattlePhase: boolean;
  onLeave: () => void;
  onToggleLog: () => void;
}

export function TopBar({ state, myRole, isReady, isBattlePhase, onLeave, onToggleLog }: TopBarProps) {
  const me = state.players[myRole];
  const label = isBattlePhase ? "⚔️ Battle!" : isReady ? "Waiting for opponent…" : "Plan your actions";

  return (
    <div className="top-bar">
      <button className="icon-button" onClick={onLeave} aria-label="Leave match">
        ←
      </button>
      <div className={`turn-pill${isBattlePhase ? " battling" : isReady ? "" : " mine"}`}>
        Round {state.roundNumber} — {label}
      </div>
      <div className="energy-pill">⚡ {me.energy}/{roundEnergyBudget(me)}</div>
      <button className="icon-button" onClick={onToggleLog} aria-label="Battle log">
        📜
      </button>
    </div>
  );
}
