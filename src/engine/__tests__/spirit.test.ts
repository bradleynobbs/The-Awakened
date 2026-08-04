import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putInHand, readyBoth } from "./helpers";

const P2: [HeroId, HeroId, HeroId] = ["earth-guardian", "fire-mage", "water-healer"];

describe("Spirit lifesteal cards", () => {
  const P1: [HeroId, HeroId, HeroId] = ["spirit-mage", "fire-mage", "water-healer"];

  it("Spirit Bolt deals damage and heals the caster", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    getHeroFrom(state, "player1", "spirit-mage").currentHp = 10;

    const cardId = putInHand(state, "player1", "spirit-bolt");
    state = queueCard(state, "player1", cardId, {
      primaryTargetId: heroInstanceId("player2", "water-healer"),
    });
    state = readyBoth(state);

    // (4 base + 2 Attack) × 0.8 (Spirit vs. Water disadvantage, §8.3) =
    // 4.8 -> 5, minus 1 Defense = 4 (coincidentally unchanged from the
    // pre-stat-system flat number). Self-heal 2 × 110% = 2.2 -> 2, also
    // coincidentally unchanged.
    expect(getHeroFrom(state, "player2", "water-healer").currentHp).toBe(20 - 4);
    expect(getHeroFrom(state, "player1", "spirit-mage").currentHp).toBe(12);
  });

  it("Soul Siphon deals more damage and heals more", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    getHeroFrom(state, "player1", "spirit-mage").currentHp = 10;

    const cardId = putInHand(state, "player1", "soul-siphon");
    state = queueCard(state, "player1", cardId, {
      primaryTargetId: heroInstanceId("player2", "water-healer"),
    });
    state = readyBoth(state);

    // (6 base + 2 Attack) × 0.8 (Spirit is disadvantaged against Water,
    // §8.3) = 6.4 -> 6, minus 1 Defense = 5.
    expect(getHeroFrom(state, "player2", "water-healer").currentHp).toBe(20 - 5);
    // Self-heal 4 × 110% Healing Power = 4.4 -> 4 (rounds down).
    expect(getHeroFrom(state, "player1", "spirit-mage").currentHp).toBe(14);
  });

  it("Spirit Ward heals an ally for 5", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    getHeroFrom(state, "player1", "fire-mage").currentHp = 10;

    const cardId = putInHand(state, "player1", "spirit-ward");
    state = queueCard(state, "player1", cardId, {
      primaryTargetId: heroInstanceId("player1", "fire-mage"),
    });
    state = readyBoth(state);

    // 5 base × 110% Healing Power (Spirit Mage, the caster) = 5.5 -> 6.
    expect(getHeroFrom(state, "player1", "fire-mage").currentHp).toBe(16);
  });
});

describe("Lingering Spirit passive", () => {
  const P1: [HeroId, HeroId, HeroId] = ["earth-guardian", "fire-mage", "water-healer"];
  const WITH_SPIRIT: [HeroId, HeroId, HeroId] = ["spirit-mage", "undead-assassin", "spark-duelist"];

  it("survives one lethal hit at 1 HP, then can be defeated normally afterward", () => {
    let state = createMatch(P1, WITH_SPIRIT, createSeededRng(1));
    getHeroFrom(state, "player2", "spirit-mage").currentHp = 3;

    const firstStrike = putInHand(state, "player1", "stone-strike");
    state = queueCard(state, "player1", firstStrike, {
      primaryTargetId: heroInstanceId("player2", "spirit-mage"),
    });
    state = readyBoth(state); // round 1

    let spiritMage = getHeroFrom(state, "player2", "spirit-mage");
    expect(spiritMage.currentHp).toBe(1);
    expect(spiritMage.isDefeated).toBe(false);
    expect(spiritMage.hasCheatedDeath).toBe(true);
    expect(state.log.some((e) => e.type === "SURVIVED_LETHAL")).toBe(true);

    const secondStrike = putInHand(state, "player1", "stone-strike");
    state = queueCard(state, "player1", secondStrike, {
      primaryTargetId: heroInstanceId("player2", "spirit-mage"),
    });
    state = readyBoth(state); // round 2

    spiritMage = getHeroFrom(state, "player2", "spirit-mage");
    expect(spiritMage.currentHp).toBe(0);
    expect(spiritMage.isDefeated).toBe(true);
    expect(
      state.log.filter((e) => e.type === "SURVIVED_LETHAL"),
    ).toHaveLength(1); // didn't trigger a second time
  });
});
