import { describe, expect, it } from "vitest";
import { createMatch, queueCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putCopyInHand, putInHand, readyBoth } from "./helpers";

describe("Charm (damage-reduction debuff)", () => {
  const P1: [HeroId, HeroId, HeroId] = ["charm-gunslinger", "water-healer", "fire-mage"];
  const P2: [HeroId, HeroId, HeroId] = ["undead-assassin", "cragor", "erosalina"];

  it("reduces the charmed hero's next hit, then clears", () => {
    // Kairo (speed 11) needs to out-pace whoever it charms so
    // the debuff lands *before* that hero's own attack, under the
    // speed-sorted order (DESIGN.md §8.5) — Mourn (speed 13) would be
    // too fast for that, and both remaining Spark heroes (Zera 12, Amp
    // 14) now are too, so Erosalina (speed 10) is the target here instead.
    let state = createMatch(P1, P2, createSeededRng(1));

    const calledShotId = putInHand(state, "player1", "called-shot");
    state = queueCard(state, "player1", calledShotId, {
      primaryTargetId: heroInstanceId("player2", "erosalina"),
    });
    const heartpiercerId = putInHand(state, "player2", "heartpiercer");
    state = queueCard(state, "player2", heartpiercerId, {
      primaryTargetId: heroInstanceId("player1", "water-healer"),
    });

    state = readyBoth(state);

    // Called Shot: (4 base + 1 Attack) = 5, neutral Charm-vs-Charm
    // matchup (×1), minus 0 Defense = 5.
    const target = getHeroFrom(state, "player2", "erosalina");
    expect(target.currentHp).toBe(target.maxHp - 5);
    expect(target.statuses.some((s) => s.type === "charm")).toBe(false);

    // Heartpiercer: 5 base, minus Charm's -3 = 2, + 1 Attack = 3,
    // × 1 (Charm-vs-Water is neutral, §8.3), minus 1 Defense = 2.
    const healer = getHeroFrom(state, "player1", "water-healer");
    expect(healer.currentHp).toBe(healer.maxHp - 2);

    expect(state.log.some((e) => e.type === "STATUS_APPLIED" && e.status === "charm")).toBe(true);
    expect(state.log.some((e) => e.type === "STATUS_REMOVED" && e.status === "charm")).toBe(true);
  });

  it("does not stack when applied twice before being consumed", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    state.players.player1.energy = 4; // two 2-cost ability cards this round

    const shotA = putCopyInHand(state, "player1", "called-shot", 0);
    const shotB = putCopyInHand(state, "player1", "called-shot", 1);
    state = queueCard(state, "player1", shotA, {
      primaryTargetId: heroInstanceId("player2", "erosalina"),
    });
    state = queueCard(state, "player1", shotB, {
      primaryTargetId: heroInstanceId("player2", "erosalina"),
    });

    state = readyBoth(state);

    const target = getHeroFrom(state, "player2", "erosalina");
    const charmStatuses = target.statuses.filter((s) => s.type === "charm");
    expect(charmStatuses).toHaveLength(1);
    const charm = charmStatuses[0];
    expect(charm.type === "charm" ? charm.damageReduction : null).toBe(3);
  });

  it("Steady Aim: Kairo deals +1 to a target that's already Charmed", () => {
    let state = createMatch(P1, P2, createSeededRng(1));

    const calledShotId = putInHand(state, "player1", "called-shot");
    state = queueCard(state, "player1", calledShotId, {
      primaryTargetId: heroInstanceId("player2", "undead-assassin"),
    });
    const quickdrawId = putInHand(state, "player1", "quickdraw");
    state = queueCard(state, "player1", quickdrawId, {
      primaryTargetId: heroInstanceId("player2", "undead-assassin"),
    });

    state = readyBoth(state);

    // Called Shot: 4 dmg reduced to 1 by the target's own first-hit passive.
    // Quickdraw: 5 base + 1 Steady Aim bonus (target still Charmed) = 6,
    // no further passive reduction since the first hit already used it up.
    const target = getHeroFrom(state, "player2", "undead-assassin");
    expect(target.currentHp).toBe(target.maxHp - 1 - 6);
    // Quickdraw only reads the target's Charm for its bonus — it doesn't
    // consume it. Only the charmed hero's own next hit does that.
    expect(target.statuses.some((s) => s.type === "charm")).toBe(true);
  });
});
