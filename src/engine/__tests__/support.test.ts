import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putInHand, readyBoth } from "./helpers";

const P2: [HeroId, HeroId, HeroId] = ["undead-assassin", "spark-duelist", "water-healer"];

describe("Empower (damage-boost support buff)", () => {
  it("adds bonus damage to the empowered hero's next hit, then is consumed", () => {
    // Mourn (speed 13) needs to out-pace Inferna (speed 9) so
    // its buff resolves *before* Fire Bolt tries to consume it, under the
    // new speed-sorted order (DESIGN.md §8.5) — Tydra (speed 7)
    // would now be too slow for this same-round setup.
    const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "undead-assassin", "earth-guardian"];
    let state = createMatch(P1, P2, createSeededRng(1));

    const supportId = putInHand(state, "player1", "marked-opening");
    state = queueCard(state, "player1", supportId, {
      primaryTargetId: heroInstanceId("player1", "fire-mage"),
    });
    const boltId = putInHand(state, "player1", "fire-bolt");
    state = queueCard(state, "player1", boltId, {
      primaryTargetId: heroInstanceId("player2", "undead-assassin"),
    });

    state = readyBoth(state);

    const fireMage = getHeroFrom(state, "player1", "fire-mage");
    expect(fireMage.statuses.some((s) => s.type === "empower")).toBe(false);

    // Fire Bolt: 5 base + 6 Empower (Marked Opening) + 2 Attack = 13,
    // × 0.8 (Fire is disadvantaged against Undead, §8.3) = 10.4 -> 10,
    // 0 Defense, then Mourn's own passive reduces its first hit
    // taken by 3 -> 7. Fire Bolt also applies Burn, and resolving rolls
    // straight into the next round, which ticks Burn once immediately
    // (DESIGN.md 5.3) — so there's a further 3 damage on top.
    const target = getHeroFrom(state, "player2", "undead-assassin");
    expect(target.currentHp).toBe(target.maxHp - 7 - 3);

    expect(state.log.some((e) => e.type === "STATUS_APPLIED" && e.status === "empower")).toBe(true);
    expect(state.log.some((e) => e.type === "STATUS_REMOVED" && e.status === "empower")).toBe(true);
  });

  it("persists across rounds, unconsumed, until the empowered hero actually deals damage", () => {
    const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "water-healer", "earth-guardian"];
    let state = createMatch(P1, P2, createSeededRng(1));

    const supportId = putInHand(state, "player1", "encouraging-current");
    state = queueCard(state, "player1", supportId, {
      primaryTargetId: heroInstanceId("player1", "fire-mage"),
    });
    state = readyBoth(state); // round 1: only the buff resolves

    let fireMage = getHeroFrom(state, "player1", "fire-mage");
    expect(fireMage.statuses.some((s) => s.type === "empower")).toBe(true);

    const boltId = putInHand(state, "player1", "fire-bolt");
    state = queueCard(state, "player1", boltId, {
      primaryTargetId: heroInstanceId("player2", "spark-duelist"),
    });
    state = readyBoth(state); // round 2: the buff finally gets consumed

    fireMage = getHeroFrom(state, "player1", "fire-mage");
    expect(fireMage.statuses.some((s) => s.type === "empower")).toBe(false);
    const target = getHeroFrom(state, "player2", "spark-duelist");
    // (5 base + 4 Empower + 2 Attack) × 1.25 (Fire beats Spark, §8.3) =
    // 13.75 -> 14, minus 1 Defense = 13, then Burn ticks once immediately
    // on the round-3 transition (DESIGN.md 5.3): 13 + 3 = 16.
    expect(target.currentHp).toBe(target.maxHp - 13 - 3);
  });

  it("overwrites rather than stacks when re-applied before being consumed", () => {
    const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "water-healer", "undead-assassin"];
    let state = createMatch(P1, P2, createSeededRng(1));
    state.players.player1.energy = 4; // two 2-cost support cards this round

    const kindleId = putInHand(state, "player1", "kindle-spirit");
    state = queueCard(state, "player1", kindleId, {
      primaryTargetId: heroInstanceId("player1", "water-healer"),
    });
    const markedId = putInHand(state, "player1", "marked-opening");
    state = queueCard(state, "player1", markedId, {
      primaryTargetId: heroInstanceId("player1", "water-healer"),
    });

    state = readyBoth(state);

    const healer = getHeroFrom(state, "player1", "water-healer");
    const empower = healer.statuses.find((s) => s.type === "empower");
    expect(empower).toBeDefined();
    // Mourn (speed 13) is faster than Inferna (speed 9), so
    // Marked Opening (+6) resolves *first* under the new speed-sorted
    // order (DESIGN.md §8.5) and Kindle Spirit (+4) resolves second,
    // overwriting it — not 10, and not the first value.
    expect(empower && empower.type === "empower" ? empower.bonusDamage : null).toBe(4);
  });
});

describe("Static Charge (Spark support, Wet-aware Empower)", () => {
  const P1: [HeroId, HeroId, HeroId] = ["spark-duelist", "fire-mage", "water-healer"];

  it("grants only the base bonus when the ally isn't Wet", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "static-charge");
    state = queueCard(state, "player1", cardId, {
      primaryTargetId: heroInstanceId("player1", "fire-mage"),
    });
    state = readyBoth(state);

    const target = getHeroFrom(state, "player1", "fire-mage");
    const empower = target.statuses.find((s) => s.type === "empower");
    expect(empower && empower.type === "empower" ? empower.bonusDamage : null).toBe(4);
  });

  it("grants the boosted bonus and cleanses Wet when the ally is Wet", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    getHeroFrom(state, "player1", "fire-mage").statuses.push({ type: "wet" });

    const cardId = putInHand(state, "player1", "static-charge");
    state = queueCard(state, "player1", cardId, {
      primaryTargetId: heroInstanceId("player1", "fire-mage"),
    });
    state = readyBoth(state);

    const target = getHeroFrom(state, "player1", "fire-mage");
    expect(target.statuses.some((s) => s.type === "wet")).toBe(false);
    const empower = target.statuses.find((s) => s.type === "empower");
    expect(empower && empower.type === "empower" ? empower.bonusDamage : null).toBe(7);
  });
});

describe("Guardian's Watch (allAllies support)", () => {
  const P1: [HeroId, HeroId, HeroId] = ["earth-guardian", "fire-mage", "water-healer"];

  it("grants Shield to every living allied hero", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "guardians-watch");
    state = queueCard(state, "player1", cardId, {});
    state = readyBoth(state);

    // Earth Guardian starts with 4 Shield from its passive. Guardian's
    // Watch's 3 Shield is scaled by the caster's (Earth Guardian's) 125%
    // Shield Strength stat: round(3 × 1.25) = 4, so every ally gets +4.
    expect(getHeroFrom(state, "player1", "earth-guardian").shield).toBe(8);
    expect(getHeroFrom(state, "player1", "fire-mage").shield).toBe(4);
    expect(getHeroFrom(state, "player1", "water-healer").shield).toBe(4);
  });

  it("skips defeated allies", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    getHeroFrom(state, "player1", "fire-mage").isDefeated = true;

    const cardId = putInHand(state, "player1", "guardians-watch");
    state = queueCard(state, "player1", cardId, {});
    state = readyBoth(state);

    expect(getHeroFrom(state, "player1", "fire-mage").shield).toBe(0);
    expect(getHeroFrom(state, "player1", "water-healer").shield).toBe(4);
  });
});
