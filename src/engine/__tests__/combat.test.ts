import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putInHand, readyBoth } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "cragor", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["zera", "undead-assassin", "fire-mage"];

describe("damage and healing", () => {
  it("deals fixed damage with no shield in the way", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "boulder-toss");
    const target = heroInstanceId("player2", "zera");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target }));

    // Boulder Toss: 5 base + 0 Attack (Cragor), × 1.25 (Earth beats
    // Spark, §8.3) = 6.25 -> 6, minus 0 Defense (Zera) = 6.
    const hero = getHeroFrom(next, "player2", "zera");
    expect(hero.currentHp).toBe(hero.maxHp - 6);
  });

  it("heals a damaged ally, capped at max HP, with a first-heal bonus", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const ally = getHeroFrom(state, "player1", "cragor");
    ally.currentHp = ally.maxHp - 10;

    const cardId = putInHand(state, "player1", "restoring-current");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: ally.instanceId }));

    const healedAlly = getHeroFrom(next, "player1", "cragor");
    // First heal this match: 7 base, ×130% Tydra's Healing Power
    // stat (DESIGN.md §8.2), rounded: round(7 * 1.3) = 9.
    expect(healedAlly.currentHp).toBe(ally.maxHp - 10 + 9);
    expect(next.players.player1.hasUsedFirstHeal).toBe(true);
  });

  it("does not heal above max HP", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const ally = getHeroFrom(state, "player1", "cragor");
    ally.currentHp = ally.maxHp - 2;

    const cardId = putInHand(state, "player1", "restoring-current");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: ally.instanceId }));

    expect(getHeroFrom(next, "player1", "cragor").currentHp).toBe(ally.maxHp);
  });
});

describe("shield absorption", () => {
  it("absorbs damage with shield before touching HP", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "zera");
    target.shield = 3;

    const cardId = putInHand(state, "player1", "boulder-toss"); // 6 damage (see above)
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target.instanceId }));

    const hit = getHeroFrom(next, "player2", "zera");
    expect(hit.shield).toBe(0);
    expect(hit.currentHp).toBe(hit.maxHp - 3); // 6 damage - 3 absorbed
    expect(next.log.some((e) => e.type === "SHIELD_ABSORBED")).toBe(true);
  });

  it("fully absorbs damage that doesn't exceed the shield", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "zera");
    target.shield = 10;

    const cardId = putInHand(state, "player1", "boulder-toss"); // 6 damage (see above)
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target.instanceId }));

    const hit = getHeroFrom(next, "player2", "zera");
    expect(hit.shield).toBe(4);
    expect(hit.currentHp).toBe(hit.maxHp);
  });
});
