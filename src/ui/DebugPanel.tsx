import type { MatchState } from "../engine/types";

interface DebugPanelProps {
  state: MatchState;
}

/** Raw state inspector for development/debugging. Not part of normal play. */
export function DebugPanel({ state }: DebugPanelProps) {
  return (
    <pre className="debug-panel">
      {JSON.stringify(
        state,
        (key, value) => (key === "log" ? `[${(value as unknown[]).length} events]` : value),
        2,
      )}
    </pre>
  );
}
