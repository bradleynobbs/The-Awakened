import type { GameEvent, MatchState } from "./types";
import { drawCards, STARTING_HAND_SIZE } from "./deck";
import { tickStartOfRoundStatuses } from "./status";
import type { Rng } from "./rng";

export const STARTING_ENERGY = 3;

/**
 * Starts a new round for both players at once: ticks Burn for every
 * Burning hero on either side, then resets both players to 3 energy and
 * draws both back up to a full hand. See DESIGN.md section 5 — rounds
 * replaced alternating turns, so there's no single "active player" to
 * start a turn for anymore.
 */
export function beginRound(state: MatchState, rng: Rng, events: GameEvent[]): void {
  state.roundNumber += 1;
  events.push({ type: "ROUND_STARTED", roundNumber: state.roundNumber });

  tickStartOfRoundStatuses(state, events);
  if (state.isMatchOver) return;

  for (const playerId of ["player1", "player2"] as const) {
    const player = state.players[playerId];
    player.energy = STARTING_ENERGY;
    player.isReady = false;
    drawCards(player, STARTING_HAND_SIZE, rng, events);
  }
}
