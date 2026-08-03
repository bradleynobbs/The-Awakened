import type { MatchState, PlayerId } from "../engine/types";
import { describeEvent } from "./eventText";

interface LatestEventToastProps {
  state: MatchState;
  myRole: PlayerId;
}

/** A single-line, always-visible readout of the most recent meaningful event. */
export function LatestEventToast({ state, myRole }: LatestEventToastProps) {
  let latest: string | null = null;
  for (let i = state.log.length - 1; i >= 0 && !latest; i--) {
    latest = describeEvent(state, state.log[i], myRole);
  }
  if (!latest) return null;

  return (
    <div className="latest-event-toast" key={state.log.length}>
      {latest}
    </div>
  );
}
