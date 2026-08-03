import { useEffect, useState } from "react";
import type { GameEvent } from "../engine/types";

const STEP_MS = 500;

/**
 * Steps through a freshly-arrived batch of engine events one at a time,
 * exposing whichever event is "current" so the 3D scene can animate them
 * in the same order the engine produced them.
 */
export function useEventQueue(events: GameEvent[]): GameEvent | null {
  const [queue, setQueue] = useState<GameEvent[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;
    setQueue(events);
    setIndex(0);
  }, [events]);

  useEffect(() => {
    if (index >= queue.length) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [index, queue]);

  return index < queue.length ? queue[index] : null;
}
