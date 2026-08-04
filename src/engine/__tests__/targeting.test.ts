import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putInHand } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "earth-guardian", "water-healer"];
const P1_WITH_DUELIST: [HeroId, HeroId, HeroId] = ["fire-mage", "spark-duelist", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["spark-duelist", "undead-assassin", "fire-mage"];

describe("target validation", () => {
  it("accepts a valid single-enemy target", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "fire-mage");
    expect(() => queueCard(state, "player1", cardId, { primaryTargetId: target })).not.toThrow();
  });

  it("rejects a single-enemy card aimed at an ally", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const ally = heroInstanceId("player1", "earth-guardian");
    expect(() => queueCard(state, "player1", cardId, { primaryTargetId: ally })).toThrow(/enemy/i);
  });

  it("rejects a single-ally card aimed at an enemy", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fortify");
    const enemy = heroInstanceId("player2", "fire-mage");
    expect(() => queueCard(state, "player1", cardId, { primaryTargetId: enemy })).toThrow(/allied/i);
  });

  it("rejects targeting a defeated hero", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const deadHero = getHeroFrom(state, "player2", "fire-mage");
    deadHero.isDefeated = true;
    deadHero.currentHp = 0;

    const cardId = putInHand(state, "player1", "fire-bolt");
    expect(() =>
      queueCard(state, "player1", cardId, { primaryTargetId: deadHero.instanceId }),
    ).toThrow(/living/i);
  });

  it("requires a distinct secondary target for Chain Spark when 2+ enemies are alive", () => {
    const state = createMatch(P1_WITH_DUELIST, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "chain-spark");
    const primary = heroInstanceId("player2", "spark-duelist");
    expect(() => queueCard(state, "player1", cardId, { primaryTargetId: primary })).toThrow(
      /second/i,
    );
  });

  it("allows Chain Spark with just a primary target once only one enemy remains", () => {
    const state = createMatch(P1_WITH_DUELIST, P2, createSeededRng(1));
    getHeroFrom(state, "player2", "undead-assassin").isDefeated = true;
    getHeroFrom(state, "player2", "fire-mage").isDefeated = true;

    const cardId = putInHand(state, "player1", "chain-spark");
    const primary = heroInstanceId("player2", "spark-duelist");
    expect(() => queueCard(state, "player1", cardId, { primaryTargetId: primary })).not.toThrow();
  });

  it("resolves an all-enemies card without requiring explicit targets", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "flame-wave");
    expect(() => queueCard(state, "player1", cardId, {})).not.toThrow();
  });
});
