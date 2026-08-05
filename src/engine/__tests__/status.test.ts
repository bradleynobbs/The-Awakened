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

    // Fire Bolt: 5 base + 2 Attack (Inferna) = 7, neutral Fire-vs-Fire
    // matchup (×1), 0 Defense. Resolving then rolls straight into the next
    // round, and Burn ticks once at the start of every round (DESIGN.md
    // 5.3, unaffected by stats — see §8.2) — so the Burn Fire Bolt just
    // applied has already ticked once here too: 7 (bolt) + 3 (first tick).
    let hero = getHeroFrom(state, "player2", "fire-mage");
    expect(hero.currentHp).toBe(maxHp - 7 - 3);
    expect(hero.statuses.some((s) => s.type === "burn")).toBe(true);
    expect(state.log.some((e) => e.type === "STATUS_TRIGGERED")).toBe(true);

    // An empty round (nobody queues anything): Burn ticks a second time and expires.
    state = readyBoth(state);
    hero = getHeroFrom(state, "player2", "fire-mage");
    expect(hero.currentHp).toBe(maxHp - 7 - 3 - 3);
    expect(hero.statuses.some((s) => s.type === "burn")).toBe(false);
    expect(
      state.log.some((e) => e.type === "STATUS_REMOVED" && (e as { status?: string }).status === "burn"),
    ).toBe(true);
  });
});

describe("Wet and Spark interaction", () => {
  it("adds bonus damage and removes Wet when a Spark card hits a Wet target", () => {
    let state = createMatch(
      ["water-healer", "spark-duelist", "undead-assassin"],
      P2,
      createSeededRng(1),
    );
    const target = heroInstanceId("player2", "fire-mage");
    const hpBefore = getHeroFrom(state, "player2", "fire-mage").currentHp;

    // Tydra (speed 7) is slower than Spark Duelist (speed 10), so
    // queuing both in the same round would resolve Charged Slash *first*
    // under the new speed-sorted order (DESIGN.md §8.5) — the opposite of
    // what this test needs. Splitting across two rounds sidesteps that
    // and additionally proves Wet survives the round boundary.
    const tidal = putInHand(state, "player1", "tidal-shot");
    state = readyBoth(queueCard(state, "player1", tidal, { primaryTargetId: target }));

    // Tidal Shot: 3 base + 0 Attack (Tydra), neutral Water-vs-Fire
    // matchup (×1), 0 Defense.
    const afterTidal = getHeroFrom(state, "player2", "fire-mage");
    expect(afterTidal.currentHp).toBe(hpBefore - 3);
    expect(afterTidal.statuses.some((st) => st.type === "wet")).toBe(true);

    const slash = putInHand(state, "player1", "charged-slash");
    state = readyBoth(queueCard(state, "player1", slash, { primaryTargetId: target }));

    // Charged Slash: (5 base + 3 Wet bonus + 2 Attack) × 0.8 (Spark is
    // disadvantaged against Fire in the elemental web, §8.3) = 8, 0 Defense.
    const afterSlash = getHeroFrom(state, "player2", "fire-mage");
    expect(afterSlash.currentHp).toBe(hpBefore - 3 - 8);
    expect(afterSlash.statuses.some((st) => st.type === "wet")).toBe(false);

    // Spark Duelist passive: gains 2 shield after the interaction
    expect(getHeroFrom(state, "player1", "spark-duelist").shield).toBe(2);
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

    // (5 base + 2 Attack) × 0.8 (Spark vs. Fire disadvantage) = 5.6 -> 6, 0 Defense.
    expect(getHeroFrom(next, "player2", "fire-mage").currentHp).toBe(before - 6);
    expect(getHeroFrom(next, "player1", "spark-duelist").shield).toBe(0);
  });
});

describe("Inferna passive", () => {
  it("adds +1 damage against a target that is already burning", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const boltA = putCopyInHand(state, "player1", "fire-bolt", 0);
    const boltB = putCopyInHand(state, "player1", "fire-bolt", 1);
    const target = heroInstanceId("player2", "spark-duelist");
    const maxHp = getHeroFrom(state, "player2", "spark-duelist").maxHp;

    let s = queueCard(state, "player1", boltA, { primaryTargetId: target });
    s = queueCard(s, "player1", boltB, { primaryTargetId: target });
    s = readyBoth(s);

    // Bolt 1: (5 base + 2 Attack) × 1.25 (Fire beats Spark, §8.3) = 8.75 ->
    // 9, minus 1 Defense = 8. Target not yet burning; Bolt 1 then applies Burn.
    // Bolt 2: (5 base + 1 passive bonus + 2 Attack) × 1.25 = 10, minus 1
    // Defense = 9, target now burning for the passive bonus.
    // Round-transition Burn tick: 3 more (flat, unaffected by stats).
    const hero = getHeroFrom(s, "player2", "spark-duelist");
    expect(hero.currentHp).toBe(maxHp - 8 - 9 - 3);
  });
});

describe("Mourn passive", () => {
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
