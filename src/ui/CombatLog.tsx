import { useEffect, useRef } from "react";
import type { MatchState } from "../engine/types";
import { describeEvent } from "./eventText";

interface CombatLogProps {
  state: MatchState;
}

export function CombatLog({ state }: CombatLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  const lines = state.log
    .map((event) => describeEvent(state, event))
    .filter((line): line is string => Boolean(line));

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length]);

  return (
    <div className="combat-log">
      {lines.map((line, i) => (
        <div key={i} className="combat-log-line">
          {line}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
