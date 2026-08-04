import { describe, expect, it } from "vitest";
import { createMatch, queueCard, setReady } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putCopyInHand, putInHand, readyBoth } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "earth-guardian", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["spark-duelist", "undead-assassin", "fire-mage"];

describe("defeated heroes", () => {
  it("cannot act once defeated", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const hero = getHeroFrom(state, "player1", "fire-mage");
    hero.isDefeated = true;
    hero.currentHp = 0;

    const cardId = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "fire-mage");

    expect(() => queueCard(state, "player1", cardId, { primaryTargetId: target })).toThrow(
      /defeated/i,
    );
  });
});

describe("victory detection", () => {
  it("declares a winner once all 3 enemy heroes are defeated, and stops the match", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    for (const heroId of P2) {
      getHeroFrom(state, "player2", heroId).currentHp = 1;
    }

    // Queue a lethal Stone Strike (3 distinct copies) against each enemy —
    // nothing resolves yet, we're still just planning.
    P2.forEach((heroId, i) => {
      const cardId = putCopyInHand(state, "player1", "stone-strike", i);
      state = queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player2", heroId) });
    });
    expect(state.isMatchOver).toBe(false);

    state = readyBoth(state);

    expect(state.isMatchOver).toBe(true);
    expect(state.winnerId).toBe("player1");
    expect(state.log.some((e) => e.type === "MATCH_ENDED")).toBe(true);
  });

  it("rejects any further action once the match has ended", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    for (const heroId of P2) {
      getHeroFrom(state, "player2", heroId).currentHp = 1;
    }
    P2.forEach((heroId, i) => {
      const cardId = putCopyInHand(state, "player1", "stone-strike", i);
      state = queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player2", heroId) });
    });
    state = readyBoth(state);
    expect(state.isMatchOver).toBe(true);

    expect(() => setReady(state, "player2", createSeededRng(2))).toThrow(/already ended/i);

    const cardId = putInHand(state, "player1", "stone-strike");
    expect(() =>
      queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player1", "earth-guardian") }),
    ).toThrow(/already ended/i);
  });
});
