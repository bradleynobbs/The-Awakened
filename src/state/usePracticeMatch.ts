import { useCallback, useEffect, useRef, useState } from "react";
import { chooseBotAction } from "../engine/bot";
import {
  createMatch,
  queueCard as engineQueueCard,
  queueTeamUp as engineQueueTeamUp,
  setReady as engineSetReady,
  unqueueAction as engineUnqueueAction,
} from "../engine/match";
import type { HeroTrio } from "../engine/match";
import { HERO_LIST } from "../engine/heroes";
import { shuffle } from "../engine/rng";
import type {
  CardInstanceId,
  GameEvent,
  HeroId,
  MatchState,
  QueuedActionId,
  TargetSelection,
} from "../engine/types";

export type PracticePhase = "selecting" | "battle";

const BOT_ROLE = "player2";
const ME_ROLE = "player1";

function randomBotTeam(): HeroTrio {
  const shuffled = shuffle(
    HERO_LIST.map((h) => h.id),
    Math.random,
  );
  return shuffled.slice(0, 3) as HeroTrio;
}

/** Builds the bot's full plan for the current round in one pass, blind to the human's plan. */
function botPlanRound(state: MatchState): MatchState {
  let s = state;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const action = chooseBotAction(s, BOT_ROLE);
    if (!action) break;
    try {
      s = engineQueueCard(s, BOT_ROLE, action.cardInstanceId, action.targets);
    } catch {
      break;
    }
  }
  return engineSetReady(s, BOT_ROLE);
}

export interface UsePracticeMatchApi {
  phase: PracticePhase;
  state: MatchState | null;
  pendingEvents: GameEvent[];
  error: string | null;
  start: (myHeroes: HeroTrio) => void;
  queueCard: (cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  queueTeamUp: (teamUpId: string) => void;
  unqueueAction: (queuedActionId: QueuedActionId) => void;
  setReady: () => void;
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
  const botPlannedRoundRef = useRef<number>(0);

  const start = useCallback((myHeroes: HeroTrio) => {
    const withMyTeam = createMatch(myHeroes, randomBotTeam());
    const withBotPlan = botPlanRound(withMyTeam);
    botPlannedRoundRef.current = withBotPlan.roundNumber;
    setState(withBotPlan);
    setPendingEvents(withBotPlan.log);
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

  const queueCard = useCallback(
    (cardInstanceId: CardInstanceId, targets: TargetSelection = {}) => {
      runAction((s) => engineQueueCard(s, ME_ROLE, cardInstanceId, targets));
    },
    [runAction],
  );

  const queueTeamUp = useCallback(
    (teamUpId: string) => {
      runAction((s) => engineQueueTeamUp(s, ME_ROLE, teamUpId));
    },
    [runAction],
  );

  const unqueueAction = useCallback(
    (queuedActionId: QueuedActionId) => {
      runAction((s) => engineUnqueueAction(s, ME_ROLE, queuedActionId));
    },
    [runAction],
  );

  const setReady = useCallback(() => {
    runAction((s) => engineSetReady(s, ME_ROLE));
  }, [runAction]);

  const clearError = useCallback(() => setError(null), []);

  const leaveMatch = useCallback(() => {
    setState(null);
    setPendingEvents([]);
    setError(null);
    setPhase("selecting");
    botPlannedRoundRef.current = 0;
  }, []);

  // Whenever a new round starts, the bot plans its whole round in one
  // shot (blind to the human's plan, same as a real opponent would be)
  // and readies up immediately — resolution then waits only on the
  // human readying up.
  useEffect(() => {
    if (!state || state.isMatchOver) return;
    if (botPlannedRoundRef.current === state.roundNumber) return;
    botPlannedRoundRef.current = state.roundNumber;
    const withBotPlan = botPlanRound(state);
    setState(withBotPlan);
    setPendingEvents(withBotPlan.log.slice(state.log.length));
  }, [state]);

  return {
    phase,
    state,
    pendingEvents,
    error,
    start,
    queueCard,
    queueTeamUp,
    unqueueAction,
    setReady,
    leaveMatch,
    clearError,
  };
}

export type { HeroId };
