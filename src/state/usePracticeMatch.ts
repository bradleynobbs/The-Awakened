import { useCallback, useEffect, useRef, useState } from "react";
import { chooseBotAction } from "../engine/bot";
import { createMatch, endTurn as engineEndTurn, playCard as enginePlayCard, playTeamUp as enginePlayTeamUp } from "../engine/match";
import type { HeroTrio } from "../engine/match";
import { HERO_LIST } from "../engine/heroes";
import { shuffle } from "../engine/rng";
import type { CardInstanceId, GameEvent, HeroId, MatchState, TargetSelection } from "../engine/types";

export type PracticePhase = "selecting" | "battle";

const BOT_ROLE = "player2";
const ME_ROLE = "player1";
const BOT_ACTION_DELAY_MS = 700;

function randomBotTeam(): HeroTrio {
  const shuffled = shuffle(
    HERO_LIST.map((h) => h.id),
    Math.random,
  );
  return shuffled.slice(0, 3) as HeroTrio;
}

export interface UsePracticeMatchApi {
  phase: PracticePhase;
  state: MatchState | null;
  pendingEvents: GameEvent[];
  error: string | null;
  start: (myHeroes: HeroTrio) => void;
  playCard: (cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  playTeamUp: (teamUpId: string) => void;
  endTurn: () => void;
  leaveMatch: () => void;
  clearError: () => void;
}

/** Local, offline vs-bot mode for trying out gameplay solo — no network involved. */
export function usePracticeMatch(): UsePracticeMatchApi {
  const [phase, setPhase] = useState<PracticePhase>("selecting");
  const [state, setState] = useState<MatchState | null>(null);
  const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<MatchState | null>(null);
  stateRef.current = state;

  const start = useCallback((myHeroes: HeroTrio) => {
    const next = createMatch(myHeroes, randomBotTeam());
    setState(next);
    setPendingEvents(next.log);
    setPhase("battle");
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
    (cardInstanceId: CardInstanceId, targets: TargetSelection = {}) => {
      runAction((s) => enginePlayCard(s, ME_ROLE, cardInstanceId, targets));
    },
    [runAction],
  );

  const playTeamUp = useCallback(
    (teamUpId: string) => {
      runAction((s) => enginePlayTeamUp(s, ME_ROLE, teamUpId));
    },
    [runAction],
  );

  const endTurn = useCallback(() => {
    runAction((s) => engineEndTurn(s, ME_ROLE, Math.random));
  }, [runAction]);

  const clearError = useCallback(() => setError(null), []);

  const leaveMatch = useCallback(() => {
    setState(null);
    setPendingEvents([]);
    setError(null);
    setPhase("selecting");
  }, []);

  // Drives the bot's turn: takes one affordable action at a time (with a
  // short pause so animations can play), then ends its turn once nothing
  // is left to play.
  useEffect(() => {
    if (!state || state.isMatchOver || state.activePlayerId !== BOT_ROLE) return;
    let cancelled = false;

    const takeTurn = () => {
      const timer = setTimeout(() => {
        if (cancelled) return;
        const current = stateRef.current;
        if (!current || current.isMatchOver || current.activePlayerId !== BOT_ROLE) return;

        const action = chooseBotAction(current, BOT_ROLE);
        if (!action) {
          runAction((s) => engineEndTurn(s, BOT_ROLE, Math.random));
          return;
        }
        try {
          const next = enginePlayCard(current, BOT_ROLE, action.cardInstanceId, action.targets);
          setState(next);
          setPendingEvents(next.log.slice(current.log.length));
        } catch {
          // The bot proposed something illegal (shouldn't happen — chooseBotAction
          // mirrors the engine's own validation). There's no player to unstick a
          // stalled bot turn, so just end it rather than soft-locking the match.
          runAction((s) => engineEndTurn(s, BOT_ROLE, Math.random));
        }
      }, BOT_ACTION_DELAY_MS);
      return () => clearTimeout(timer);
    };

    const cleanup = takeTurn();
    return () => {
      cancelled = true;
      cleanup();
    };
    // Re-runs after every state change while it's still the bot's turn,
    // so it keeps taking actions until it ends its turn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, runAction]);

  return { phase, state, pendingEvents, error, start, playCard, playTeamUp, endTurn, leaveMatch, clearError };
}

export type { HeroId };
