import { useCallback, useRef, useState } from "react";
import {
  createMatch,
  endTurn as engineEndTurn,
  playCard as enginePlayCard,
  playTeamUp as enginePlayTeamUp,
} from "../engine/match";
import type { CardInstanceId, GameEvent, MatchState, PlayerId, TargetSelection } from "../engine/types";
import type { HeroTrio } from "../engine/match";

export interface UseMatchApi {
  state: MatchState | null;
  /** Only the events produced by the most recent action, in order. */
  pendingEvents: GameEvent[];
  error: string | null;
  start: (player1Heroes: HeroTrio, player2Heroes: HeroTrio) => void;
  playCard: (playerId: PlayerId, cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  playTeamUp: (playerId: PlayerId, teamUpId: string) => void;
  endTurn: (playerId: PlayerId) => void;
  clearError: () => void;
  reset: () => void;
}

export function useMatch(): UseMatchApi {
  const [state, setState] = useState<MatchState | null>(null);
  const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<MatchState | null>(null);
  stateRef.current = state;

  const start = useCallback((player1Heroes: HeroTrio, player2Heroes: HeroTrio) => {
    const next = createMatch(player1Heroes, player2Heroes);
    setState(next);
    setPendingEvents(next.log);
    setError(null);
  }, []);

  const runAction = useCallback((fn: (s: MatchState) => MatchState) => {
    const current = stateRef.current;
    if (!current) return;
    try {
      const prevLogLength = current.log.length;
      const next = fn(current);
      setState(next);
      setPendingEvents(next.log.slice(prevLogLength));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const playCard = useCallback(
    (playerId: PlayerId, cardInstanceId: CardInstanceId, targets: TargetSelection = {}) => {
      runAction((s) => enginePlayCard(s, playerId, cardInstanceId, targets));
    },
    [runAction],
  );

  const playTeamUp = useCallback(
    (playerId: PlayerId, teamUpId: string) => {
      runAction((s) => enginePlayTeamUp(s, playerId, teamUpId));
    },
    [runAction],
  );

  const endTurn = useCallback(
    (playerId: PlayerId) => {
      runAction((s) => engineEndTurn(s, playerId, Math.random));
    },
    [runAction],
  );

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setState(null);
    setPendingEvents([]);
    setError(null);
  }, []);

  return { state, pendingEvents, error, start, playCard, playTeamUp, endTurn, clearError, reset };
}
