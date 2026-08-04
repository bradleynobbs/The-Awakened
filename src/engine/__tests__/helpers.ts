import { setReady } from "../match";
import { otherPlayer } from "../combat";
import type { CardInstanceId, HeroId, MatchState, PlayerId } from "../types";

export function heroInstanceId(playerId: PlayerId, heroId: HeroId): string {
  return `${playerId}:${heroId}`;
}

export function findCardInstanceId(state: MatchState, playerId: PlayerId, cardId: string): CardInstanceId {
  const player = state.players[playerId];
  const found = Object.values(player.cardsById).find((c) => c.cardId === cardId);
  if (!found) throw new Error(`No card instance for ${cardId} on ${playerId}`);
  return found.instanceId;
}

/** Forces a specific card copy into a player's hand (removing it from draw/discard first). */
export function putInHand(state: MatchState, playerId: PlayerId, cardId: string): CardInstanceId {
  const id = findCardInstanceId(state, playerId, cardId);
  return forceIntoHand(state, playerId, id);
}

/**
 * Forces a specific numbered copy (0, 1, 2 — see COPIES_PER_CARD) into
 * hand. Needed when a test wants several distinct instances of the same
 * card queued in one round, since putInHand always resolves to the same
 * first-matching instance regardless of where it currently sits.
 */
export function putCopyInHand(state: MatchState, playerId: PlayerId, cardId: string, copy: number): CardInstanceId {
  return forceIntoHand(state, playerId, `${playerId}:${cardId}:${copy}`);
}

function forceIntoHand(state: MatchState, playerId: PlayerId, id: CardInstanceId): CardInstanceId {
  const player = state.players[playerId];
  player.drawPile = player.drawPile.filter((c) => c !== id);
  player.discardPile = player.discardPile.filter((c) => c !== id);
  if (!player.hand.includes(id)) player.hand.push(id);
  return id;
}

export function getHeroFrom(state: MatchState, playerId: PlayerId, heroId: HeroId) {
  const hero = state.players[playerId].heroes.find((h) => h.heroId === heroId);
  if (!hero) throw new Error(`Hero ${heroId} not found for ${playerId}`);
  return hero;
}

/**
 * Readies `firstPlayer` (whatever they've queued so far) then the other
 * player (with no further actions of their own), triggering resolution.
 * Standard way to close out a round in tests when only one side has
 * anything queued.
 */
export function readyBoth(state: MatchState, firstPlayer: PlayerId = "player1"): MatchState {
  let s = setReady(state, firstPlayer);
  s = setReady(s, otherPlayer(firstPlayer));
  return s;
}
