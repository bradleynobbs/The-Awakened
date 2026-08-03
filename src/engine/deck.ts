import type { CardInstance, GameEvent, HeroId, PlayerId, PlayerState } from "./types";
import { HERO_DEFINITIONS } from "./heroes";
import { shuffle, type Rng } from "./rng";

export const COPIES_PER_CARD = 3;
export const STARTING_HAND_SIZE = 5;

export function buildDeck(playerId: PlayerId, heroIds: HeroId[]): PlayerState["cardsById"] {
  const cardsById: PlayerState["cardsById"] = {};
  for (const heroId of heroIds) {
    const def = HERO_DEFINITIONS[heroId];
    for (const card of [def.attack, def.ability]) {
      for (let copy = 0; copy < COPIES_PER_CARD; copy++) {
        const instanceId = `${playerId}:${card.id}:${copy}`;
        cardsById[instanceId] = { instanceId, cardId: card.id, heroId };
      }
    }
  }
  return cardsById;
}

export function initialDrawPile(cardsById: Record<string, CardInstance>, rng: Rng): string[] {
  return shuffle(Object.keys(cardsById), rng);
}

/** Draws up to `count` cards into the hand, reshuffling discard into draw when the draw pile runs dry. */
export function drawCards(
  player: PlayerState,
  count: number,
  rng: Rng,
  events: GameEvent[],
): void {
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (player.drawPile.length === 0) {
      if (player.discardPile.length === 0) break;
      player.drawPile = shuffle(player.discardPile, rng);
      player.discardPile = [];
      events.push({ type: "CARDS_DRAWN", playerId: player.id, reshuffled: true, count: 0 });
    }
    const next = player.drawPile.shift();
    if (!next) break;
    player.hand.push(next);
    drawn.push(next);
  }
  if (drawn.length > 0) {
    events.push({ type: "CARDS_DRAWN", playerId: player.id, cardInstanceIds: drawn, count: drawn.length });
  }
}

export function discardHand(player: PlayerState, events: GameEvent[]): void {
  if (player.hand.length === 0) return;
  player.discardPile.push(...player.hand);
  events.push({ type: "HAND_DISCARDED", playerId: player.id, count: player.hand.length });
  player.hand = [];
}

export function discardPlayedCard(player: PlayerState, cardInstanceId: string): void {
  player.hand = player.hand.filter((id) => id !== cardInstanceId);
  player.discardPile.push(cardInstanceId);
}
