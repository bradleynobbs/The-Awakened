import { afterEach, describe, expect, it } from "vitest";
import { elementalMultiplier, CRIT_THRESHOLD } from "../elements";
import { effectiveCardCost, HERO_DEFINITIONS } from "../heroes";
import { getCardDefinition } from "../cards";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { Element, HeroId } from "../types";
import { heroInstanceId, putInHand, readyBoth } from "./helpers";

const ELEMENTS: Element[] = ["fire", "earth", "spark", "water", "spirit", "undead", "charm"];

describe("elemental advantage web (DESIGN.md §8.3)", () => {
  it("is neutral against itself", () => {
    for (const el of ELEMENTS) {
      expect(elementalMultiplier(el, el)).toBe(1);
    }
  });

  it("gives every element exactly 2 favorable, 2 unfavorable, and 2 neutral match-ups", () => {
    for (const attacker of ELEMENTS) {
      const results = ELEMENTS.filter((d) => d !== attacker).map((defender) =>
        elementalMultiplier(attacker, defender),
      );
      expect(results.filter((m) => m > 1)).toHaveLength(2);
      expect(results.filter((m) => m < 1)).toHaveLength(2);
      expect(results.filter((m) => m === 1)).toHaveLength(2);
    }
  });

  it("is symmetric: if A beats B, B loses to A", () => {
    for (const a of ELEMENTS) {
      for (const b of ELEMENTS) {
        if (a === b) continue;
        const forward = elementalMultiplier(a, b);
        const backward = elementalMultiplier(b, a);
        if (forward > 1) expect(backward).toBeLessThan(1);
        if (forward < 1) expect(backward).toBeGreaterThan(1);
      }
    }
  });
});

describe("effectiveCardCost (Cooldown Reduction, DESIGN.md §8.2)", () => {
  it("discounts a hero's Ability/Support cards by their Cooldown Reduction, floored at 1", () => {
    const restoringCurrent = getCardDefinition("restoring-current"); // Tydra ability, cost 2, CDR 1
    expect(effectiveCardCost(restoringCurrent, "water-healer")).toBe(1);
  });

  it("never discounts Attack cards", () => {
    const tidalShot = getCardDefinition("tidal-shot"); // Tydra attack, cost 1
    expect(effectiveCardCost(tidalShot, "water-healer")).toBe(1);
  });

  it("leaves cost unchanged for heroes with no Cooldown Reduction", () => {
    const fortify = getCardDefinition("fortify"); // Earth Guardian ability, cost 2, CDR 0
    expect(effectiveCardCost(fortify, "earth-guardian")).toBe(2);
  });
});

describe("Cooldown Reduction end-to-end", () => {
  const P1: [HeroId, HeroId, HeroId] = ["water-healer", "fire-mage", "earth-guardian"];
  const P2: [HeroId, HeroId, HeroId] = ["spark-duelist", "undead-assassin", "charm-gunslinger"];

  it("queuing a discounted card only spends the discounted amount", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "restoring-current"); // cost 2, CDR 1 -> 1
    const next = queueCard(state, "player1", cardId, {
      primaryTargetId: heroInstanceId("player1", "fire-mage"),
    });
    // Round budget is 3 base + 1 (Inferna's Energy stat) = 4.
    expect(next.players.player1.energy).toBe(4 - 1);
  });
});

describe("Accuracy vs. Evasion and Critical Chance thresholds", () => {
  const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "water-healer", "earth-guardian"];
  const P2: [HeroId, HeroId, HeroId] = ["undead-assassin", "spark-duelist", "charm-gunslinger"];

  afterEach(() => {
    // Base hero kits never cross the graze/crit thresholds on their own
    // (§8.2) — these tests briefly push a stat past it to prove the
    // mechanism works, then restore it so no other test sees the change.
    HERO_DEFINITIONS["fire-mage"].stats.accuracy = 100;
    HERO_DEFINITIONS["fire-mage"].stats.criticalChance = 10;
  });

  it("halves damage into a graze when Accuracy is below the target's Evasion", () => {
    HERO_DEFINITIONS["fire-mage"].stats.accuracy = 0; // below Mourn's 25 Evasion

    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const next = readyBoth(
      queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player2", "undead-assassin") }),
    );

    const grazeEvent = next.log.find((e) => e.type === "DAMAGE_DEALT" && e.sourceHeroInstanceId);
    expect(grazeEvent && (grazeEvent as { wasGraze?: boolean }).wasGraze).toBe(true);
  });

  it("always crits once Critical Chance reaches the threshold", () => {
    HERO_DEFINITIONS["fire-mage"].stats.criticalChance = CRIT_THRESHOLD;

    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const next = readyBoth(
      queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player2", "spark-duelist") }),
    );

    const hitEvent = next.log.find((e) => e.type === "DAMAGE_DEALT" && e.sourceHeroInstanceId);
    expect(hitEvent && (hitEvent as { wasCrit?: boolean }).wasCrit).toBe(true);
  });
});
