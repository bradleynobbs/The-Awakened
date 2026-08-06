import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import type { HeroId, MatchState, PlayerId, QueuedAction } from "../engine/types";

export type MatchMessage =
  /** Sent once, right on entering Battle Preparation, so each client can
   *  show the opponent's full 5-hero deck in the reveal step (§9.46) —
   *  distinct from "hero_selection" below, which is the secret 3-of-5
   *  draft pick that follows it. */
  | { type: "deck_reveal"; role: PlayerId; heroIds: HeroId[] }
  | { type: "hero_selection"; role: PlayerId; heroIds: HeroId[] }
  /** Sent once when a player readies up, carrying their full queued-actions
   *  list for that round so player1's client (the sole resolver — see
   *  DESIGN.md 5.4) can merge it in without either client rendering the
   *  opponent's plan before it resolves. */
  | { type: "ready"; role: PlayerId; queuedActions: QueuedAction[] }
  | { type: "state_sync"; state: MatchState }
  | { type: "leave"; role: PlayerId };

export interface MatchChannelHandle {
  send: (message: MatchMessage) => void;
  leave: () => void;
}

const BROADCAST_EVENT = "game";

/**
 * Joins the Realtime channel for one match. Delivers every MatchMessage
 * the opponent sends via onMessage, and reports opponent presence via
 * onPresenceChange (used to show "opponent disconnected" — see
 * DESIGN.md 4.3). Does not deliver a client's own broadcasts back to
 * itself.
 */
export function joinMatchChannel(
  matchId: string,
  localIdentity: string,
  handlers: {
    onMessage: (message: MatchMessage) => void;
    onPresenceChange: (opponentPresent: boolean) => void;
  },
): MatchChannelHandle {
  const supabase = getSupabaseClient();
  const channel: RealtimeChannel = supabase.channel(`match:${matchId}`, {
    config: { presence: { key: localIdentity }, broadcast: { self: false } },
  });

  const checkPresence = () => {
    const state = channel.presenceState();
    const opponentPresent = Object.keys(state).some((key) => key !== localIdentity);
    handlers.onPresenceChange(opponentPresent);
  };

  channel
    .on("broadcast", { event: BROADCAST_EVENT }, ({ payload }) => {
      handlers.onMessage(payload as MatchMessage);
    })
    .on("presence", { event: "sync" }, checkPresence)
    .on("presence", { event: "join" }, checkPresence)
    .on("presence", { event: "leave" }, checkPresence)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ joinedAt: Date.now() });
      }
    });

  return {
    send: (message) => {
      channel.send({ type: "broadcast", event: BROADCAST_EVENT, payload: message });
    },
    leave: () => {
      supabase.removeChannel(channel);
    },
  };
}
