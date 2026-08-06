import { describe, expect, it } from "vitest";
import { chooseBotAction } from "../bot";
import { getHero } from "../combat";
import { createMatch } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, putInHand } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "cragor", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["zera", "undead-assassin", "fire-mage"];

describe("chooseBotAction", () => {
  it("picks an affordable card with a living, correctly-sided target", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    state.players.player2.energy = 3;
    putInHand(state, "player2", "quick-strike"); // singleEnemy, 1 energy

    const action = chooseBotAction(state, "player2", createSeededRng(7));
    expect(action).not.toBeNull();
    expect(state.players.player2.hand).toContain(action!.cardInstanceId);

    const target = getHero(state, action!.targets.primaryTargetId!);
    expect(target.isDefeated).toBe(false);
    expect(target.ownerId).toBe("player1");
  });

  it("returns null (end turn) when nothing in hand is affordable", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    state.players.player2.energy = 0;
    const action = chooseBotAction(state, "player2");
    expect(action).toBeNull();
  });

  it("returns null when the hand is empty", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    state.players.player2.hand = [];
    const action = chooseBotAction(state, "player2");
    expect(action).toBeNull();
  });

  it("omits the secondary target for a two-enemy card once only one enemy remains", () => {
    const state = createMatch(
      ["water-healer", "zera", "undead-assassin"],
      P1,
      createSeededRng(1),
    );
    getHeroFrom(state, "player2", "cragor").isDefeated = true;
    getHeroFrom(state, "player2", "water-healer").isDefeated = true;
    // Clear the hand so twin-volt (an enemy-targeting card) is the only
    // option — otherwise the bot could shuffle into an ally-targeting
    // support card instead, which this test isn't about.
    state.players.player1.hand = [];
    putInHand(state, "player1", "twin-volt");

    const action = chooseBotAction(state, "player1", createSeededRng(2));
    expect(action).not.toBeNull();
    expect(action!.targets.primaryTargetId).toBeDefined();
    expect(action!.targets.secondaryTargetId).toBeUndefined();
    expect(getHero(state, action!.targets.primaryTargetId!).heroId).toBe("fire-mage");
  });

  it("never targets a defeated hero", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    state.players.player2.energy = 3;
    const defeated = getHeroFrom(state, "player1", "fire-mage");
    defeated.isDefeated = true;
    putInHand(state, "player2", "quick-strike");

    let sawAnAction = false;
    for (let seed = 0; seed < 20; seed++) {
      const action = chooseBotAction(state, "player2", createSeededRng(seed));
      if (!action?.targets.primaryTargetId) continue;
      sawAnAction = true;
      expect(action.targets.primaryTargetId).not.toBe(defeated.instanceId);
    }
    expect(sawAnAction).toBe(true);
  });
});
