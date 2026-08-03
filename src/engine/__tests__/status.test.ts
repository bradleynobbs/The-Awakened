import { describe, expect, it } from "vitest";
import { createMatch, endTurn, playCard } from "../match";
import { createSeededRng } from "../rng";
import type { HeroId } from "../types";
import { getHeroFrom, heroInstanceId, putInHand } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "earth-guardian", "water-healer"];
const P2: [HeroId, HeroId, HeroId] = ["lightning-duelist", "shadow-assassin", "fire-mage"];

describe("Burn timing", () => {
  it("ticks for 2 turns at the start of the burned hero's controller's turn, then expires", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "fire-mage");
    state = playCard(state, "player1", cardId, { primaryTargetId: target });

    const afterBolt = getHeroFrom(state, "player2", "fire-mage");
    expect(afterBolt.statuses.some((s) => s.type === "burn")).toBe(true);
    const hpAfterBolt = afterBolt.currentHp;

    // player1 ends turn -> player2's turn starts -> Burn ticks once (3 dmg)
    state = endTurn(state, "player1", createSeededRng(2));
    expect(state.log.some((e) => e.type === "STATUS_TRIGGERED")).toBe(true);
    expect(getHeroFrom(state, "player2", "fire-mage").currentHp).toBe(hpAfterBolt - 3);

    // player2 -> player1 (no tick, burn is on player2's hero) -> player1 -> player2 (2nd tick, expires)
    state = endTurn(state, "player2", createSeededRng(3));
    state = endTurn(state, "player1", createSeededRng(4));

    const finalHero = getHeroFrom(state, "player2", "fire-mage");
    expect(finalHero.currentHp).toBe(hpAfterBolt - 6);
    expect(finalHero.statuses.some((s) => s.type === "burn")).toBe(false);
    expect(state.log.some((e) => e.type === "STATUS_REMOVED" && (e as { status?: string }).status === "burn")).toBe(
      true,
    );
  });
});

describe("Wet and Lightning interaction", () => {
  it("adds bonus damage and removes Wet when a Lightning card hits a Wet target", () => {
    let state = createMatch(
      ["water-healer", "lightning-duelist", "shadow-assassin"],
      P2,
      createSeededRng(1),
    );
    const tidal = putInHand(state, "player1", "tidal-shot");
    const target = heroInstanceId("player2", "fire-mage");
    state = playCard(state, "player1", tidal, { primaryTargetId: target });

    expect(getHeroFrom(state, "player2", "fire-mage").statuses.some((s) => s.type === "wet")).toBe(
      true,
    );

    const slash = putInHand(state, "player1", "charged-slash");
    const hpBeforeSlash = getHeroFrom(state, "player2", "fire-mage").currentHp;
    state = playCard(state, "player1", slash, { primaryTargetId: target });

    const afterSlash = getHeroFrom(state, "player2", "fire-mage");
    expect(afterSlash.currentHp).toBe(hpBeforeSlash - 8); // 5 base + 3 Wet bonus
    expect(afterSlash.statuses.some((s) => s.type === "wet")).toBe(false);

    // Lightning Duelist passive: gains 2 shield after the interaction
    expect(getHeroFrom(state, "player1", "lightning-duelist").shield).toBe(2);
  });

  it("deals no bonus damage when the target isn't Wet", () => {
    const state = createMatch(
      ["water-healer", "lightning-duelist", "shadow-assassin"],
      P2,
      createSeededRng(1),
    );
    const slash = putInHand(state, "player1", "charged-slash");
    const target = heroInstanceId("player2", "fire-mage");
    const before = getHeroFrom(state, "player2", "fire-mage").currentHp;
    const next = playCard(state, "player1", slash, { primaryTargetId: target });

    expect(getHeroFrom(next, "player2", "fire-mage").currentHp).toBe(before - 5);
    expect(getHeroFrom(next, "player1", "lightning-duelist").shield).toBe(0);
  });
});

describe("Fire Mage passive", () => {
  it("adds +1 damage against a target that is already burning", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const boltA = putInHand(state, "player1", "fire-bolt");
    const target = heroInstanceId("player2", "lightning-duelist");
    state = playCard(state, "player1", boltA, { primaryTargetId: target });
    const hpAfterFirst = getHeroFrom(state, "player2", "lightning-duelist").currentHp;

    const boltB = putInHand(state, "player1", "fire-bolt");
    state.players.player1.energy = 3;
    state = playCard(state, "player1", boltB, { primaryTargetId: target });

    // second bolt: base 5 + 1 passive bonus, target was already burning
    expect(getHeroFrom(state, "player2", "lightning-duelist").currentHp).toBe(hpAfterFirst - 6);
  });
});

describe("Shadow Assassin passive", () => {
  it("reduces the first attack taken each match by 3, minimum 1", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    const cardId = putInHand(state, "player1", "stone-strike"); // 5 damage
    const target = heroInstanceId("player2", "shadow-assassin");
    const next = playCard(state, "player1", cardId, { primaryTargetId: target });

    const hero = getHeroFrom(next, "player2", "shadow-assassin");
    expect(hero.currentHp).toBe(hero.maxHp - 2); // 5 - 3
    expect(hero.hasTakenFirstHit).toBe(true);
  });

  it("does not reduce subsequent hits", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    const target = heroInstanceId("player2", "shadow-assassin");
    const first = putInHand(state, "player1", "stone-strike");
    state = playCard(state, "player1", first, { primaryTargetId: target });
    const hpAfterFirst = getHeroFrom(state, "player2", "shadow-assassin").currentHp;

    state.players.player1.energy = 3;
    const second = putInHand(state, "player1", "stone-strike");
    state = playCard(state, "player1", second, { primaryTargetId: target });

    expect(getHeroFrom(state, "player2", "shadow-assassin").currentHp).toBe(hpAfterFirst - 5);
  });
});

describe("Execute threshold", () => {
  const P1_WITH_ASSASSIN: [HeroId, HeroId, HeroId] = ["fire-mage", "water-healer", "shadow-assassin"];

  it("deals bonus damage once the target is at or below 30% max HP", () => {
    const state = createMatch(P1_WITH_ASSASSIN, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "lightning-duelist");
    target.currentHp = Math.floor(target.maxHp * 0.3);

    const cardId = putInHand(state, "player1", "execute");
    const next = playCard(state, "player1", cardId, { primaryTargetId: target.instanceId });

    expect(getHeroFrom(next, "player2", "lightning-duelist").currentHp).toBe(0);
  });

  it("deals only base damage above the threshold", () => {
    const state = createMatch(P1_WITH_ASSASSIN, P2, createSeededRng(1));
    const target = getHeroFrom(state, "player2", "lightning-duelist");
    const startHp = target.currentHp;

    const cardId = putInHand(state, "player1", "execute");
    const next = playCard(state, "player1", cardId, { primaryTargetId: target.instanceId });

    expect(getHeroFrom(next, "player2", "lightning-duelist").currentHp).toBe(startHp - 4);
  });
});
