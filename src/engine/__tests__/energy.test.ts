import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { heroInstanceId, putInHand, readyBoth } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "earth-guardian", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["spark-duelist", "undead-assassin", "fire-mage"];

describe("energy management", () => {
  // P1's Inferna has the Energy stat (+1), so the round budget is 3 base
  // + 1 = 4, not the flat 3 every hero used to grant (DESIGN.md §8.2).
  it("starts each round with 3 base energy plus each living hero's Energy stat, and spends it when a card is queued", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    expect(state.players.player1.energy).toBe(4);

    const cardId = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "fire-mage");
    const next = queueCard(state, "player1", cardId, { primaryTargetId: target });

    expect(next.players.player1.energy).toBe(3);
    expect(
      next.log.some((e) => e.type === "ENERGY_SPENT" && (e as { amount?: number }).amount === 1),
    ).toBe(true);
  });

  it("refuses to queue a card without enough energy", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    state.players.player1.energy = 1;
    const cardId = putInHand(state, "player1", "flame-wave"); // costs 2

    expect(() => queueCard(state, "player1", cardId, {})).toThrow(/energy/i);
  });

  it("resets to the same round budget next round regardless of how much was spent or left over", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "fire-mage");
    state = queueCard(state, "player1", cardId, { primaryTargetId: target });
    expect(state.players.player1.energy).toBe(3); // 3 of 4 energy left unspent this round

    state = readyBoth(state);
    expect(state.players.player1.energy).toBe(4);
  });
});
