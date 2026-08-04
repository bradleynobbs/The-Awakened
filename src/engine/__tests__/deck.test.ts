import { describe, expect, it } from "vitest";
import { buildDeck, COPIES_PER_CARD, initialDrawPile } from "../deck";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";

describe("deck creation", () => {
  const heroIds: HeroId[] = ["fire-mage", "water-healer", "shadow-assassin"];

  it("creates 3 copies each of the selected heroes' attack, ability, and support cards", () => {
    const cardsById = buildDeck("player1", heroIds);
    const cards = Object.values(cardsById);
    expect(cards).toHaveLength(heroIds.length * 3 * COPIES_PER_CARD);

    const countFor = (cardId: string) => cards.filter((c) => c.cardId === cardId).length;
    expect(countFor("fire-bolt")).toBe(COPIES_PER_CARD);
    expect(countFor("flame-wave")).toBe(COPIES_PER_CARD);
    expect(countFor("kindle-spirit")).toBe(COPIES_PER_CARD);
    expect(countFor("tidal-shot")).toBe(COPIES_PER_CARD);
    expect(countFor("restoring-current")).toBe(COPIES_PER_CARD);
    expect(countFor("encouraging-current")).toBe(COPIES_PER_CARD);
    expect(countFor("quick-strike")).toBe(COPIES_PER_CARD);
    expect(countFor("execute")).toBe(COPIES_PER_CARD);
    expect(countFor("marked-opening")).toBe(COPIES_PER_CARD);
  });

  it("does not include cards from heroes that weren't selected", () => {
    const cardsById = buildDeck("player1", heroIds);
    const cardIds = new Set(Object.values(cardsById).map((c) => c.cardId));
    expect(cardIds.has("stone-strike")).toBe(false);
    expect(cardIds.has("fortify")).toBe(false);
    expect(cardIds.has("guardians-watch")).toBe(false);
    expect(cardIds.has("charged-slash")).toBe(false);
    expect(cardIds.has("static-charge")).toBe(false);
  });

  it("shuffles the full deck into the initial draw pile deterministically for a given seed", () => {
    const cardsById = buildDeck("player1", heroIds);
    const pileA = initialDrawPile(cardsById, createSeededRng(42));
    const pileB = initialDrawPile(cardsById, createSeededRng(42));
    expect(pileA).toEqual(pileB);
    expect(new Set(pileA)).toEqual(new Set(Object.keys(cardsById)));
  });
});
