import { describe, expect, it } from "vitest";
import { createMatch, queueCard, queueTeamUp, setReady, unqueueAction } from "../match";
import { createSeededRng } from "../rng";
import type { GameEvent, HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putCopyInHand, putInHand, readyBoth } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["earth-guardian", "fire-mage", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["undead-assassin", "spark-duelist", "water-healer"];

describe("resolution order", () => {
  it("resolves fastest hero first (Speed stat), not player1-first (DESIGN.md §8.5)", () => {
    let state = createMatch(P1, P2, createSeededRng(1));

    // Speeds: Mourn 13 > Spark Duelist 10 > Inferna 9 > Earth
    // Guardian 4 — a fully-determined order with no ties, regardless of
    // which player queued first.
    const p1a = putInHand(state, "player1", "stone-strike"); // Earth Guardian, speed 4
    const p1b = putInHand(state, "player1", "fire-bolt"); // Inferna, speed 9
    const p2a = putInHand(state, "player2", "quick-strike"); // Mourn, speed 13
    const p2b = putInHand(state, "player2", "charged-slash"); // Spark Duelist, speed 10

    state = queueCard(state, "player1", p1a, { primaryTargetId: heroInstanceId("player2", "spark-duelist") });
    state = queueCard(state, "player2", p2a, { primaryTargetId: heroInstanceId("player1", "fire-mage") });
    state = queueCard(state, "player1", p1b, { primaryTargetId: heroInstanceId("player2", "water-healer") });
    state = queueCard(state, "player2", p2b, { primaryTargetId: heroInstanceId("player1", "water-healer") });

    state = readyBoth(state);

    const order = state.log
      .filter((e): e is GameEvent & { playerId: string } => e.type === "CARD_PLAYED")
      .map((e) => e.playerId);
    expect(order).toEqual(["player2", "player2", "player1", "player1"]);
  });

  it("stops resolving further queued actions the instant the match ends", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    for (const heroId of P2) {
      getHeroFrom(state, "player2", heroId).currentHp = 1;
    }

    // Three lethal hits queued, plus a fourth that would never get to run.
    const strikes = [0, 1, 2].map((i) => putCopyInHand(state, "player1", "stone-strike", i));
    P2.forEach((heroId, i) => {
      state = queueCard(state, "player1", strikes[i], { primaryTargetId: heroInstanceId("player2", heroId) });
    });

    state = readyBoth(state);

    expect(state.isMatchOver).toBe(true);
    const cardPlayedCount = state.log.filter((e) => e.type === "CARD_PLAYED").length;
    expect(cardPlayedCount).toBe(3);
  });
});

describe("unqueueing", () => {
  it("refunds energy and returns the card to hand", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "stone-strike");
    state = queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player2", "undead-assassin") });
    expect(state.players.player1.energy).toBe(3); // 4 (3 base + Inferna's Energy stat) - 1
    expect(state.players.player1.hand).not.toContain(cardId);

    const queuedId = state.players.player1.queuedActions[0].id;
    state = unqueueAction(state, "player1", queuedId);

    expect(state.players.player1.energy).toBe(4);
    expect(state.players.player1.hand).toContain(cardId);
    expect(state.players.player1.queuedActions).toHaveLength(0);
  });

  it("cannot edit the queue after readying up", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "stone-strike");
    state = queueCard(state, "player1", cardId, { primaryTargetId: heroInstanceId("player2", "undead-assassin") });
    state = setReady(state, "player1");

    const otherCardId = putInHand(state, "player1", "fire-bolt");
    expect(() => queueCard(state, "player1", otherCardId, {})).toThrow(/readied/i);

    const queuedId = state.players.player1.queuedActions[0].id;
    expect(() => unqueueAction(state, "player1", queuedId)).toThrow(/readied/i);
  });
});

describe("fizzling", () => {
  it("fizzles when the source hero is defeated before its queued action resolves", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    getHeroFrom(state, "player1", "fire-mage").currentHp = 1;

    // player1 queues two actions: a harmless strike first, then a Fire
    // Bolt from fire-mage second. player2 queues one killing blow from
    // Mourn (speed 13) on fire-mage (speed 9) — being faster,
    // the kill resolves before Fire Bolt regardless of queue order.
    const strikeId = putInHand(state, "player1", "stone-strike");
    state = queueCard(state, "player1", strikeId, {
      primaryTargetId: heroInstanceId("player2", "undead-assassin"),
    });
    const boltId = putInHand(state, "player1", "fire-bolt");
    state = queueCard(state, "player1", boltId, {
      primaryTargetId: heroInstanceId("player2", "spark-duelist"),
    });

    const killId = putInHand(state, "player2", "quick-strike");
    state = queueCard(state, "player2", killId, { primaryTargetId: heroInstanceId("player1", "fire-mage") });

    state = readyBoth(state);

    expect(getHeroFrom(state, "player1", "fire-mage").isDefeated).toBe(true);
    // Fire Bolt's target never took damage — the action fizzled instead.
    const boltTarget = getHeroFrom(state, "player2", "spark-duelist");
    expect(boltTarget.currentHp).toBe(boltTarget.maxHp);
    expect(
      state.log.some((e) => e.type === "ACTION_FIZZLED" && e.reason === "source-defeated"),
    ).toBe(true);
  });

  it("fizzles a singleEnemy action whose target was defeated by an earlier action this round", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    // player2's undead-assassin already at 1 HP.
    getHeroFrom(state, "player2", "undead-assassin").currentHp = 1;

    // player1 queues two hits at the same target: the first (resolves
    // first, player1 goes first in the interleave) kills it, so the
    // second should fizzle instead of double-killing it.
    const first = putCopyInHand(state, "player1", "stone-strike", 0);
    const second = putCopyInHand(state, "player1", "stone-strike", 1);
    state = queueCard(state, "player1", first, { primaryTargetId: heroInstanceId("player2", "undead-assassin") });
    state = queueCard(state, "player1", second, { primaryTargetId: heroInstanceId("player2", "undead-assassin") });

    state = readyBoth(state);

    expect(
      state.log.some((e) => e.type === "ACTION_FIZZLED" && e.reason === "target-defeated"),
    ).toBe(true);
  });

  it("partially fizzles Chain Spark when only the secondary target dies first, resolving the primary hit anyway", () => {
    // Mourn (speed 13) needs to out-pace Spark Duelist (speed
    // 10, Chain Spark's caster) so its kill resolves first under the new
    // speed-sorted order (DESIGN.md §8.5) — swapped in for Inferna,
    // which at speed 9 would now resolve *after* Chain Spark instead.
    let state = createMatch(
      ["water-healer", "undead-assassin", "spark-duelist"] as [HeroId, HeroId, HeroId],
      P2,
      createSeededRng(1),
    );
    // Kill the secondary target with a first-resolving action, then Chain
    // Spark (slower, resolves second) should still land its primary hit.
    getHeroFrom(state, "player2", "water-healer").currentHp = 1;

    const killId = putInHand(state, "player1", "quick-strike");
    state = queueCard(state, "player1", killId, { primaryTargetId: heroInstanceId("player2", "water-healer") });

    const chainSparkId = putInHand(state, "player1", "chain-spark");
    state = queueCard(state, "player1", chainSparkId, {
      primaryTargetId: heroInstanceId("player2", "spark-duelist"),
      secondaryTargetId: heroInstanceId("player2", "water-healer"),
    });

    state = readyBoth(state);

    expect(getHeroFrom(state, "player2", "water-healer").isDefeated).toBe(true);
    expect(
      state.log.some((e) => e.type === "ACTION_FIZZLED" && e.reason === "secondary-target-defeated"),
    ).toBe(true);
    // Primary target still took Chain Spark's hit: 4 base + 2 Attack = 6,
    // neutral Spark-vs-Spark matchup (×1), minus 1 Defense = 5.
    const primary = getHeroFrom(state, "player2", "spark-duelist");
    expect(primary.currentHp).toBe(primary.maxHp - 5);
  });

  it("fizzles a Team-Up if a required hero is defeated by an earlier action this round", () => {
    let state = createMatch(
      ["fire-mage", "water-healer", "earth-guardian"] as [HeroId, HeroId, HeroId],
      P2,
      createSeededRng(1),
    );
    getHeroFrom(state, "player1", "water-healer").currentHp = 1;
    state.players.player1.energy = 4; // stone-strike (1) + steam-surge (3)

    // Team-Ups always resolve last (they use a fixed baseline Speed lower
    // than any hero's — DESIGN.md §8.5), so player2's kill on water-healer
    // (from Mourn) always lands before Steam Surge does here,
    // regardless of what else player1 queues alongside it.
    const strikeId = putInHand(state, "player1", "stone-strike");
    state = queueCard(state, "player1", strikeId, {
      primaryTargetId: heroInstanceId("player2", "undead-assassin"),
    });
    state = queueTeamUp(state, "player1", "steam-surge");

    const killId = putInHand(state, "player2", "quick-strike");
    state = queueCard(state, "player2", killId, { primaryTargetId: heroInstanceId("player1", "water-healer") });

    state = readyBoth(state);

    expect(getHeroFrom(state, "player1", "water-healer").isDefeated).toBe(true);
    expect(state.players.player1.usedTeamUps).not.toContain("steam-surge");
    expect(
      state.log.some((e) => e.type === "ACTION_FIZZLED" && e.reason === "required-hero-defeated"),
    ).toBe(true);
  });
});
