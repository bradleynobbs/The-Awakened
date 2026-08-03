import { describe, expect, it } from "vitest";
import { drawCards } from "../deck";
import { createSeededRng } from "../rng";
import type { GameEvent, PlayerState } from "../types";

function makePlayer(overrides: Partial<PlayerState>): PlayerState {
  return {
    id: "player1",
    heroIds: ["fire-mage", "water-healer", "shadow-assassin"],
    heroes: [],
    drawPile: [],
    discardPile: [],
    hand: [],
    cardsById: {},
    energy: 3,
    usedTeamUps: [],
    hasUsedFirstHeal: false,
    ...overrides,
  };
}

describe("drawing cards", () => {
  it("draws the requested number of cards into hand", () => {
    const player = makePlayer({ drawPile: ["a", "b", "c", "d", "e", "f"] });
    const events: GameEvent[] = [];
    drawCards(player, 5, createSeededRng(1), events);
    expect(player.hand).toHaveLength(5);
    expect(player.drawPile).toHaveLength(1);
    expect(events.some((e) => e.type === "CARDS_DRAWN")).toBe(true);
  });

  it("reshuffles the discard pile into the draw pile once it's empty", () => {
    const player = makePlayer({ drawPile: ["a", "b"], discardPile: ["c", "d", "e"] });
    const events: GameEvent[] = [];
    drawCards(player, 5, createSeededRng(7), events);
    expect(player.hand).toHaveLength(5);
    expect(player.drawPile).toHaveLength(0);
    expect(player.discardPile).toHaveLength(0);
  });

  it("draws as many cards as are available when the deck is exhausted", () => {
    const player = makePlayer({ drawPile: ["a"], discardPile: [] });
    const events: GameEvent[] = [];
    drawCards(player, 5, createSeededRng(3), events);
    expect(player.hand).toEqual(["a"]);
  });
});
