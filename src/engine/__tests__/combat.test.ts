import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putInHand, readyBoth } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "earth-guardian", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["spark-duelist", "undead-assassin", "fire-mage"];

describe("damage and healing", () => {
  it("deals fixed damage with no shield in the way", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "stone-strike");
    const target = heroInstanceId("player2", "spark-duelist");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target }));

    const hero = getHeroFrom(next, "player2", "spark-duelist");
    expect(hero.currentHp).toBe(hero.maxHp - 5);
  });

  it("heals a damaged ally, capped at max HP, with a first-heal bonus", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const ally = getHeroFrom(state, "player1", "earth-guardian");
    ally.currentHp = ally.maxHp - 10;

    const cardId = putInHand(state, "player1", "restoring-current");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: ally.instanceId }));

    const healedAlly = getHeroFrom(next, "player1", "earth-guardian");
    // First heal this match: 7 base, ×130% Water Healer's Healing Power
    // stat (DESIGN.md §8.2), rounded: round(7 * 1.3) = 9.
    expect(healedAlly.currentHp).toBe(ally.maxHp - 10 + 9);
    expect(next.players.player1.hasUsedFirstHeal).toBe(true);
  });

  it("does not heal above max HP", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const ally = getHeroFrom(state, "player1", "earth-guardian");
    ally.currentHp = ally.maxHp - 2;

    const cardId = putInHand(state, "player1", "restoring-current");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: ally.instanceId }));

    expect(getHeroFrom(next, "player1", "earth-guardian").currentHp).toBe(ally.maxHp);
  });
});

describe("shield absorption", () => {
  it("absorbs damage with shield before touching HP", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "spark-duelist");
    target.shield = 3;

    const cardId = putInHand(state, "player1", "stone-strike"); // 5 damage
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target.instanceId }));

    const hit = getHeroFrom(next, "player2", "spark-duelist");
    expect(hit.shield).toBe(0);
    expect(hit.currentHp).toBe(hit.maxHp - 2); // 5 damage - 3 absorbed
    expect(next.log.some((e) => e.type === "SHIELD_ABSORBED")).toBe(true);
  });

  it("fully absorbs damage that doesn't exceed the shield", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "spark-duelist");
    target.shield = 10;

    const cardId = putInHand(state, "player1", "stone-strike"); // 5 damage
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target.instanceId }));

    const hit = getHeroFrom(next, "player2", "spark-duelist");
    expect(hit.shield).toBe(5);
    expect(hit.currentHp).toBe(hit.maxHp);
  });
});
