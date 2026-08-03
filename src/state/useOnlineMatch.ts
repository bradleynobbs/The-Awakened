import { useCallback, useEffect, useRef, useState } from "react";
import { createMatch, endTurn as engineEndTurn, playCard as enginePlayCard, playTeamUp as enginePlayTeamUp } from "../engine/match";
import type { HeroTrio } from "../engine/match";
import type { CardInstanceId, GameEvent, HeroId, MatchState, PlayerId, TargetSelection } from "../engine/types";
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
  findOpponent: () => void;
  cancelQueueing: () => void;
  submitHeroSelection: (heroIds: HeroTrio) => void;
  playCard: (cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  playTeamUp: (teamUpId: string) => void;
  endTurn: () => void;
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

  const stateRef = useRef<MatchState | null>(null);
  stateRef.current = state;
  const myRoleRef = useRef<PlayerId | null>(null);
  myRoleRef.current = myRole;
  const channelRef = useRef<MatchChannelHandle | null>(null);
  const cancelWaitRef = useRef<(() => void) | null>(null);
  const myHeroesRef = useRef<HeroTrio | null>(null);
  const opponentHeroesRef = useRef<HeroTrio | null>(null);

  const adoptState = useCallback((next: MatchState) => {
    const prevLogLength = stateRef.current?.log.length ?? 0;
    setState(next);
    setPendingEvents(next.log.slice(prevLogLength));
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

  const handleChannelMessage = useCallback(
    (message: MatchMessage) => {
      if (message.type === "hero_selection") {
        opponentHeroesRef.current = message.heroIds as HeroTrio;
        maybeStartMatch();
      } else if (message.type === "state_sync") {
        adoptState(message.state);
      } else if (message.type === "leave") {
        setPhase("opponent-left");
      }
    },
    [adoptState, maybeStartMatch],
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

  const submitHeroSelection = useCallback(
    (heroIds: HeroTrio) => {
      myHeroesRef.current = heroIds;
      setWaitingOnOpponentSelection(true);
      channelRef.current?.send({ type: "hero_selection", role: myRoleRef.current!, heroIds });
      maybeStartMatch();
    },
    [maybeStartMatch],
  );

  const runAction = useCallback(
    (fn: (s: MatchState) => MatchState) => {
      const current = stateRef.current;
      if (!current) return;
      try {
        const next = fn(current);
        adoptState(next);
        channelRef.current?.send({ type: "state_sync", state: next });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [adoptState],
  );

  const playCard = useCallback(
    (cardInstanceId: CardInstanceId, targets: TargetSelection = {}) => {
      const role = myRoleRef.current;
      if (!role) return;
      runAction((s) => enginePlayCard(s, role, cardInstanceId, targets));
    },
    [runAction],
  );

  const playTeamUp = useCallback(
    (teamUpId: string) => {
      const role = myRoleRef.current;
      if (!role) return;
      runAction((s) => enginePlayTeamUp(s, role, teamUpId));
    },
    [runAction],
  );

  const endTurn = useCallback(() => {
    const role = myRoleRef.current;
    if (!role) return;
    runAction((s) => engineEndTurn(s, role, Math.random));
  }, [runAction]);

  const leaveMatch = useCallback(() => {
    channelRef.current?.send({ type: "leave", role: myRoleRef.current ?? "player1" });
    channelRef.current?.leave();
    channelRef.current = null;
    myHeroesRef.current = null;
    opponentHeroesRef.current = null;
    setState(null);
    setPendingEvents([]);
    setMyRole(null);
    setOpponentPresent(false);
    setWaitingOnOpponentSelection(false);
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
    findOpponent,
    cancelQueueing,
    submitHeroSelection,
    playCard,
    playTeamUp,
    endTurn,
    leaveMatch,
    clearError,
  };
}

// Re-exported so callers don't need a second import for the shared hero-id type.
export type { HeroId };
