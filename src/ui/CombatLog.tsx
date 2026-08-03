import { useEffect, useRef } from "react";
import type { MatchState, PlayerId } from "../engine/types";
import { describeEvent } from "./eventText";

interface CombatLogProps {
  state: MatchState;
  myRole: PlayerId;
  open: boolean;
  onClose: () => void;
}

/** Full battle history, hidden behind a toggle — see LatestEventToast for the always-visible bit. */
export function CombatLog({ state, myRole, open, onClose }: CombatLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  const lines = state.log
    .map((event) => describeEvent(state, event, myRole))
    .filter((line): line is string => Boolean(line));

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length, open]);

  if (!open) return null;

  return (
    <div className="log-sheet-backdrop" onClick={onClose}>
      <div className="log-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="log-sheet-header">
          <span>Battle Log</span>
          <button className="icon-button" onClick={onClose} aria-label="Close log">
            ✕
          </button>
        </div>
        <div className="log-sheet-body">
          {lines.map((line, i) => (
            <div key={i} className="combat-log-line">
              {line}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
