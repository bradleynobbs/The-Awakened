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
