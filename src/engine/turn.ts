import type { GameEvent, MatchState, PlayerState } from "./types";
import { drawCards, STARTING_HAND_SIZE } from "./deck";
import { tickStartOfRoundStatuses } from "./status";
import { HERO_DEFINITIONS } from "./heroes";
import type { Rng } from "./rng";

export const STARTING_ENERGY = 3;

/** Base energy plus each living roster hero's Energy stat (DESIGN.md §8.2). */
export function roundEnergyBudget(player: PlayerState): number {
  const bonus = player.heroes
    .filter((h) => !h.isDefeated)
    .reduce((sum, h) => sum + HERO_DEFINITIONS[h.heroId].stats.energy, 0);
  return STARTING_ENERGY + bonus;
}

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
    player.energy = roundEnergyBudget(player);
    player.isReady = false;
    drawCards(player, STARTING_HAND_SIZE, rng, events);
  }
}
