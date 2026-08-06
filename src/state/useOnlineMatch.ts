import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMatch,
  queueCard as engineQueueCard,
  queueTeamUp as engineQueueTeamUp,
  setReady as engineSetReady,
  unqueueAction as engineUnqueueAction,
} from "../engine/match";
import type { HeroTrio } from "../engine/match";
import type {
  CardInstanceId,
  GameEvent,
  HeroId,
  MatchState,
  PlayerId,
  QueuedAction,
  QueuedActionId,
  TargetSelection,
} from "../engine/types";
import { getLocalIdentity } from "../net/identity";
import { isOnlineConfigured } from "../net/supabaseClient";
import { findMatch, leaveQueue, waitForMatch } from "../net/matchmaking";
import { joinMatchChannel, type MatchChannelHandle, type MatchMessage } from "../net/matchChannel";

export type OnlinePhase =
  | "idle"
  | "queueing"
  | "selecting"
  | "battle"
  | "opponent-left"
  | "error";

export interface UseOnlineMatchApi {
  phase: OnlinePhase;
  myRole: PlayerId | null;
  opponentPresent: boolean;
  state: MatchState | null;
  pendingEvents: GameEvent[];
  error: string | null;
  /** True once my hero selection has been sent and I'm waiting on the opponent's. */
  waitingOnOpponentSelection: boolean;
  /** True once I've readied up this round and I'm waiting on the opponent's. */
  waitingOnOpponentReady: boolean;
  /** The opponent's full 5-hero deck, once their Battle Preparation
   * reveal has arrived — null until then. */
  opponentDeck: HeroId[] | null;
  /** The opponent's secret 3-fighter draft pick, once it's arrived
   * (guaranteed non-null by the time `state` exists). */
  opponentPick: HeroTrio | null;
  findOpponent: () => void;
  cancelQueueing: () => void;
  /** Broadcasts my full deck for the opponent's Battle Preparation reveal. */
  submitDeck: (heroIds: HeroId[]) => void;
  submitHeroSelection: (heroIds: HeroTrio) => void;
  queueCard: (cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  queueTeamUp: (teamUpId: string) => void;
  unqueueAction: (queuedActionId: QueuedActionId) => void;
  setReady: () => void;
  leaveMatch: () => void;
  clearError: () => void;
}

export function useOnlineMatch(): UseOnlineMatchApi {
  const [phase, setPhase] = useState<OnlinePhase>("idle");
  const [myRole, setMyRole] = useState<PlayerId | null>(null);
  const [opponentPresent, setOpponentPresent] = useState(false);
  const [state, setState] = useState<MatchState | null>(null);
  const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [waitingOnOpponentSelection, setWaitingOnOpponentSelection] = useState(false);
  const [waitingOnOpponentReady, setWaitingOnOpponentReady] = useState(false);
  const [opponentDeck, setOpponentDeck] = useState<HeroId[] | null>(null);
  const [opponentPick, setOpponentPick] = useState<HeroTrio | null>(null);

  const stateRef = useRef<MatchState | null>(null);
  stateRef.current = state;
  const myRoleRef = useRef<PlayerId | null>(null);
  myRoleRef.current = myRole;
  const channelRef = useRef<MatchChannelHandle | null>(null);
  const cancelWaitRef = useRef<(() => void) | null>(null);
  const myHeroesRef = useRef<HeroTrio | null>(null);
  const opponentHeroesRef = useRef<HeroTrio | null>(null);
  /** Player1 only: the opponent's queued actions once they've readied, held
   *  out of rendered state until resolution so nothing ever displays the
   *  opponent's plan early — see DESIGN.md 5.1/5.4. */
  const opponentReadyQueueRef = useRef<QueuedAction[] | null>(null);

  const adoptState = useCallback((next: MatchState) => {
    const prevLogLength = stateRef.current?.log.length ?? 0;
    setState(next);
    setPendingEvents(next.log.slice(prevLogLength));
    setWaitingOnOpponentReady(false);
    opponentReadyQueueRef.current = null;
    setPhase("battle");
  }, []);

  const maybeStartMatch = useCallback(() => {
    if (!myHeroesRef.current || !opponentHeroesRef.current || !myRoleRef.current) return;
    setWaitingOnOpponentSelection(false);
    // Only player1 computes the authoritative initial state (DESIGN.md 4.2) —
    // this sidesteps needing both clients to agree on an RNG seed.
    if (myRoleRef.current !== "player1") return;

    const player1Heroes = myHeroesRef.current;
    const player2Heroes = opponentHeroesRef.current;
    const initial = createMatch(player1Heroes, player2Heroes);
    adoptState(initial);
    channelRef.current?.send({ type: "state_sync", state: initial });
  }, [adoptState]);

  /**
   * Player1 only. Given a base state where I (player1) have already
   * readied, merges in the opponent's stored ready+queue (if it's arrived)
   * and resolves. Takes the base state as a parameter rather than reading
   * a ref so it works correctly whether called right after my own
   * setState (same tick) or from an incoming network message (later tick).
   */
  const attemptHostResolve = useCallback(
    (baseState: MatchState) => {
      const opponentQueue = opponentReadyQueueRef.current;
      if (!opponentQueue || !baseState.players.player1.isReady) return;

      const merged = structuredClone(baseState);
      merged.players.player2.queuedActions = opponentQueue;
      merged.players.player2.isReady = true;

      const resolved = engineSetReady(merged, "player1");
      opponentReadyQueueRef.current = null;
      adoptState(resolved);
      channelRef.current?.send({ type: "state_sync", state: resolved });
    },
    [adoptState],
  );

  const handleChannelMessage = useCallback(
    (message: MatchMessage) => {
      if (message.type === "deck_reveal") {
        setOpponentDeck(message.heroIds);
      } else if (message.type === "hero_selection") {
        opponentHeroesRef.current = message.heroIds as HeroTrio;
        setOpponentPick(message.heroIds as HeroTrio);
        maybeStartMatch();
      } else if (message.type === "ready") {
        // Only the host (player1) ever resolves; player2 just waits for state_sync.
        if (myRoleRef.current !== "player1" || message.role !== "player2") return;
        opponentReadyQueueRef.current = message.queuedActions;
        if (stateRef.current) attemptHostResolve(stateRef.current);
      } else if (message.type === "state_sync") {
        adoptState(message.state);
      } else if (message.type === "leave") {
        setPhase("opponent-left");
      }
    },
    [adoptState, maybeStartMatch, attemptHostResolve],
  );

  const joinChannel = useCallback(
    (matchId: string) => {
      const identity = getLocalIdentity();
      channelRef.current = joinMatchChannel(matchId, identity, {
        onMessage: handleChannelMessage,
        onPresenceChange: setOpponentPresent,
      });
    },
    [handleChannelMessage],
  );

  const findOpponent = useCallback(() => {
    if (!isOnlineConfigured) {
      setError("Online multiplayer isn't configured yet — no Supabase project is connected.");
      setPhase("error");
      return;
    }
    setError(null);
    setPhase("queueing");
    const identity = getLocalIdentity();

    findMatch(identity)
      .then((found) => {
        if (found) {
          setMyRole("player2");
          joinChannel(found.matchId);
          setPhase("selecting");
          return;
        }
        cancelWaitRef.current = waitForMatch(
          identity,
          (match) => {
            setMyRole("player1");
            joinChannel(match.matchId);
            setPhase("selecting");
          },
          (message) => {
            setError(message);
            setPhase("error");
          },
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      });
  }, [joinChannel]);

  const cancelQueueing = useCallback(() => {
    cancelWaitRef.current?.();
    cancelWaitRef.current = null;
    const identity = getLocalIdentity();
    leaveQueue(identity).catch(() => {});
    setPhase("idle");
  }, []);

  const submitDeck = useCallback((heroIds: HeroId[]) => {
    if (!myRoleRef.current) return;
    channelRef.current?.send({ type: "deck_reveal", role: myRoleRef.current, heroIds });
  }, []);

  const submitHeroSelection = useCallback(
    (heroIds: HeroTrio) => {
      myHeroesRef.current = heroIds;
      setWaitingOnOpponentSelection(true);
      channelRef.current?.send({ type: "hero_selection", role: myRoleRef.current!, heroIds });
      maybeStartMatch();
    },
    [maybeStartMatch],
  );

  /** Local-only planning actions: never broadcast (blind planning — DESIGN.md 5.1). */
  const runLocalAction = useCallback((fn: (s: MatchState) => MatchState) => {
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
      const role = myRoleRef.current;
      if (!role) return;
      runLocalAction((s) => engineQueueCard(s, role, cardInstanceId, targets));
    },
    [runLocalAction],
  );

  const queueTeamUp = useCallback(
    (teamUpId: string) => {
      const role = myRoleRef.current;
      if (!role) return;
      runLocalAction((s) => engineQueueTeamUp(s, role, teamUpId));
    },
    [runLocalAction],
  );

  const unqueueAction = useCallback(
    (queuedActionId: QueuedActionId) => {
      const role = myRoleRef.current;
      if (!role) return;
      runLocalAction((s) => engineUnqueueAction(s, role, queuedActionId));
    },
    [runLocalAction],
  );

  const setReady = useCallback(() => {
    const role = myRoleRef.current;
    const current = stateRef.current;
    if (!role || !current) return;
    try {
      const next = engineSetReady(current, role);
      setState(next);
      setPendingEvents(next.log.slice(current.log.length));
      setError(null);
      setWaitingOnOpponentReady(true);

      channelRef.current?.send({ type: "ready", role, queuedActions: current.players[role].queuedActions });

      if (role === "player1") {
        attemptHostResolve(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [attemptHostResolve]);

  const leaveMatch = useCallback(() => {
    channelRef.current?.send({ type: "leave", role: myRoleRef.current ?? "player1" });
    channelRef.current?.leave();
    channelRef.current = null;
    myHeroesRef.current = null;
    opponentHeroesRef.current = null;
    opponentReadyQueueRef.current = null;
    setState(null);
    setPendingEvents([]);
    setMyRole(null);
    setOpponentPresent(false);
    setWaitingOnOpponentSelection(false);
    setWaitingOnOpponentReady(false);
    setOpponentDeck(null);
    setOpponentPick(null);
    setError(null);
    setPhase("idle");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return () => {
      channelRef.current?.leave();
      cancelWaitRef.current?.();
    };
  }, []);

  return {
    phase,
    myRole,
    opponentPresent,
    state,
    pendingEvents,
    error,
    waitingOnOpponentSelection,
    waitingOnOpponentReady,
    opponentDeck,
    opponentPick,
    findOpponent,
    cancelQueueing,
    submitDeck,
    submitHeroSelection,
    queueCard,
    queueTeamUp,
    unqueueAction,
    setReady,
    leaveMatch,
    clearError,
  };
}

// Re-exported so callers don't need a second import for the shared hero-id type.
export type { HeroId };
