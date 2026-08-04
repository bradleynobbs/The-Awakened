import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putCopyInHand, putInHand, readyBoth } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "earth-guardian", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["spark-duelist", "undead-assassin", "fire-mage"];

describe("Burn timing", () => {
  it("ticks once at the start of each round, for 2 rounds, then expires", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "fire-mage");
    const maxHp = getHeroFrom(state, "player2", "fire-mage").maxHp;

    state = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target }));

    // Resolving rolls straight into the next round, and Burn ticks once at
    // the start of every round (DESIGN.md 5.3) — so the Burn Fire Bolt just
    // applied has already ticked once here too: 5 (bolt) + 3 (first tick).
    let hero = getHeroFrom(state, "player2", "fire-mage");
    expect(hero.currentHp).toBe(maxHp - 5 - 3);
    expect(hero.statuses.some((s) => s.type === "burn")).toBe(true);
    expect(state.log.some((e) => e.type === "STATUS_TRIGGERED")).toBe(true);

    // An empty round (nobody queues anything): Burn ticks a second time and expires.
    state = readyBoth(state);
    hero = getHeroFrom(state, "player2", "fire-mage");
    expect(hero.currentHp).toBe(maxHp - 5 - 3 - 3);
    expect(hero.statuses.some((s) => s.type === "burn")).toBe(false);
    expect(
      state.log.some((e) => e.type === "STATUS_REMOVED" && (e as { status?: string }).status === "burn"),
    ).toBe(true);
  });
});

describe("Wet and Spark interaction", () => {
  it("adds bonus damage and removes Wet when a Spark card hits a Wet target", () => {
    const state = createMatch(
      ["water-healer", "spark-duelist", "undead-assassin"],
      P2,
      createSeededRng(1),
    );
    const tidal = putInHand(state, "player1", "tidal-shot");
    const slash = putInHand(state, "player1", "charged-slash");
    const target = heroInstanceId("player2", "fire-mage");
    const hpBefore = getHeroFrom(state, "player2", "fire-mage").currentHp;

    let s = queueCard(state, "player1", tidal, { primaryTargetId: target });
    s = queueCard(s, "player1", slash, { primaryTargetId: target });
    s = readyBoth(s);

    const afterSlash = getHeroFrom(s, "player2", "fire-mage");
    expect(afterSlash.currentHp).toBe(hpBefore - 3 - 8); // Tidal Shot 3, then Charged Slash 5+3 Wet bonus
    expect(afterSlash.statuses.some((st) => st.type === "wet")).toBe(false);

    // Spark Duelist passive: gains 2 shield after the interaction
    expect(getHeroFrom(s, "player1", "spark-duelist").shield).toBe(2);
  });

  it("deals no bonus damage when the target isn't Wet", () => {
    const state = createMatch(
      ["water-healer", "spark-duelist", "undead-assassin"],
      P2,
      createSeededRng(1),
    );
    const slash = putInHand(state, "player1", "charged-slash");
    const target = heroInstanceId("player2", "fire-mage");
    const before = getHeroFrom(state, "player2", "fire-mage").currentHp;
    const next = readyBoth(queueCard(state, "player1", slash, { primaryTargetId: target }));

    expect(getHeroFrom(next, "player2", "fire-mage").currentHp).toBe(before - 5);
    expect(getHeroFrom(next, "player1", "spark-duelist").shield).toBe(0);
  });
});

describe("Fire Mage passive", () => {
  it("adds +1 damage against a target that is already burning", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const boltA = putCopyInHand(state, "player1", "fire-bolt", 0);
    const boltB = putCopyInHand(state, "player1", "fire-bolt", 1);
    const target = heroInstanceId("player2", "spark-duelist");
    const maxHp = getHeroFrom(state, "player2", "spark-duelist").maxHp;

    let s = queueCard(state, "player1", boltA, { primaryTargetId: target });
    s = queueCard(s, "player1", boltB, { primaryTargetId: target });
    s = readyBoth(s);

    // Bolt 1: 5 dmg, target not yet burning, then applies Burn.
    // Bolt 2: 5 + 1 passive bonus, target already burning.
    // Round-transition Burn tick: 3 more.
    const hero = getHeroFrom(s, "player2", "spark-duelist");
    expect(hero.currentHp).toBe(maxHp - 5 - 6 - 3);
  });
});

describe("Undead Assassin passive", () => {
  it("reduces the first attack taken each match by 3, minimum 1", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "stone-strike"); // 5 damage
    const target = heroInstanceId("player2", "undead-assassin");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target }));

    const hero = getHeroFrom(next, "player2", "undead-assassin");
    expect(hero.currentHp).toBe(hero.maxHp - 2); // 5 - 3
    expect(hero.hasTakenFirstHit).toBe(true);
  });

  it("does not reduce subsequent hits", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const target = heroInstanceId("player2", "undead-assassin");
    const first = putCopyInHand(state, "player1", "stone-strike", 0);
    const second = putCopyInHand(state, "player1", "stone-strike", 1);

    let s = queueCard(state, "player1", first, { primaryTargetId: target });
    s = queueCard(s, "player1", second, { primaryTargetId: target });
    s = readyBoth(s);

    const hero = getHeroFrom(s, "player2", "undead-assassin");
    expect(hero.currentHp).toBe(hero.maxHp - 2 - 5); // first hit reduced (5-3=2), second full (5)
  });
});

describe("Execute threshold", () => {
  const P1_WITH_ASSASSIN: [HeroId, HeroId, HeroId] = ["fire-mage", "water-healer", "undead-assassin"];

  it("deals bonus damage once the target is at or below 30% max HP", () => {
    const state = createMatch(P1_WITH_ASSASSIN, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "spark-duelist");
    target.currentHp = Math.floor(target.maxHp * 0.3);

    const cardId = putInHand(state, "player1", "execute");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target.instanceId }));

    expect(getHeroFrom(next, "player2", "spark-duelist").currentHp).toBe(0);
  });

  it("deals only base damage above the threshold", () => {
    const state = createMatch(P1_WITH_ASSASSIN, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "spark-duelist");
    const startHp = target.currentHp;

    const cardId = putInHand(state, "player1", "execute");
    const next = readyBoth(queueCard(state, "player1", cardId, { primaryTargetId: target.instanceId }));

    expect(getHeroFrom(next, "player2", "spark-duelist").currentHp).toBe(startHp - 4);
  });
});
