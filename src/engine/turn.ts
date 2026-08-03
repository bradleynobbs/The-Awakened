import type { GameEvent, MatchState, PlayerId } from "./types";
import { drawCards, discardHand, STARTING_HAND_SIZE } from "./deck";
import { tickStartOfTurnStatuses } from "./status";
import type { Rng } from "./rng";

export const STARTING_ENERGY = 3;

/**
 * Starts `playerId`'s turn: resets energy, ticks start-of-turn statuses
 * (Burn), then draws back up to a full hand. Isolated here so the
 * alternating-turn structure can later be swapped for simultaneous
 * planning without touching draw/status/energy logic (see DESIGN.md 3).
 */
export function beginPlayerTurn(
  state: MatchState,
  playerId: PlayerId,
  rng: Rng,
  events: GameEvent[],
): void {
  state.activePlayerId = playerId;
  state.turnNumber += 1;
  const player = state.players[playerId];
  player.energy = STARTING_ENERGY;
  events.push({ type: "TURN_STARTED", playerId, turnNumber: state.turnNumber });

  tickStartOfTurnStatuses(state, playerId, events);
  if (state.isMatchOver) return;

  drawCards(player, STARTING_HAND_SIZE, rng, events);
}

export function endPlayerTurn(state: MatchState, playerId: PlayerId, events: GameEvent[]): void {
  const player = state.players[playerId];
  discardHand(player, events);
  events.push({ type: "TURN_ENDED", playerId, turnNumber: state.turnNumber });
}
