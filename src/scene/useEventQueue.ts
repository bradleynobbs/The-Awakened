import { useEffect, useState } from "react";
import type { GameEvent, GameEventType } from "../engine/types";

/** How long a genuine combat beat (a hit, a heal, a defeat...) holds the
 * screen so its animation cue is visible, vs. how fast silent bookkeeping
 * (a new round quietly drawing cards) gets skipped through. A round with
 * many hero actions plus trailing next-round setup shouldn't take 10+
 * seconds just because every event waited the same fixed beat. */
const BATTLE_STEP_MS = 500;
const BOOKKEEPING_STEP_MS = 60;

/** Planning/bookkeeping event types that happen constantly while a player
 * is just queuing/unqueuing cards or a new round is quietly starting up —
 * never worth animating or gating interaction on. Everything NOT in this
 * set (CARD_PLAYED, DAMAGE_DEALT, HERO_DEFEATED, ROUND_RESOLVED, etc.) is
 * a genuine "something happened in the fight" event. */
const NON_BATTLE_EVENT_TYPES = new Set<GameEventType>([
  "MATCH_STARTED",
  "ROUND_STARTED",
  "CARDS_DRAWN",
  "HAND_DISCARDED",
  "ENERGY_SPENT",
  "ENERGY_REFUNDED",
  "ACTION_QUEUED",
  "ACTION_UNQUEUED",
  "PLAYER_READY",
  "TEAM_UP_AVAILABLE",
]);

function isBattleEvent(event: GameEvent): boolean {
  return !NON_BATTLE_EVENT_TYPES.has(event.type);
}

function isBattleBatch(batch: GameEvent[]): boolean {
  return batch.some(isBattleEvent);
}

interface EventPlayback {
  /** Whichever event is "current" in the batch, so the battlefield can
   * animate it — null once playback has finished (or nothing queued yet). */
  activeEvent: GameEvent | null;
  /** True from the moment a fresh *battle-relevant* batch arrives until the
   * last event in it has had its turn — used to gate a real "battle phase"
   * (see Battle.tsx) so the next round's planning controls don't unlock
   * while the previous round's attacks are still visibly playing out.
   * Batches that are purely planning bookkeeping (queuing a card, a new
   * round quietly starting) never set this, so routine planning doesn't
   * freeze the UI for a beat after every click. */
  isPlaying: boolean;
}

/**
 * Steps through a freshly-arrived batch of engine events one at a time,
 * exposing whichever event is "current" so the battlefield can animate
 * them in the same order the engine produced them.
 */
export function useEventQueue(events: GameEvent[]): EventPlayback {
  const [queue, setQueue] = useState<GameEvent[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;
    setQueue(events);
    setIndex(0);
  }, [events]);

  useEffect(() => {
    if (index >= queue.length) return;
    const delay = isBattleEvent(queue[index]) ? BATTLE_STEP_MS : BOOKKEEPING_STEP_MS;
    const timer = setTimeout(() => setIndex((i) => i + 1), delay);
    return () => clearTimeout(timer);
  }, [index, queue]);

  return {
    activeEvent: index < queue.length ? queue[index] : null,
    isPlaying: index < queue.length && isBattleBatch(queue),
  };
}
