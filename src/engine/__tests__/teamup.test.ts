import { describe, expect, it } from "vitest";
import { createMatch, playTeamUp } from "../match";
import { createSeededRng } from "../rng";
import { availableTeamUps, isTeamUpAvailable } from "../teamup";
import { steamSurge, thunderTide } from "../teamups";
import type { HeroId } from "../types";
import { getHeroFrom } from "./helpers";

const P1: [HeroId, HeroId, HeroId] = ["fire-mage", "water-healer", "shadow-assassin"];
const P2: [HeroId, HeroId, HeroId] = ["lightning-duelist", "shadow-assassin", "fire-mage"];

describe("Team-Up availability", () => {
  it("is available once both required heroes are on the roster and alive", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    expect(isTeamUpAvailable(state, "player1", steamSurge)).toBe(true);
    expect(availableTeamUps(state, "player1").map((t) => t.id)).toContain("steam-surge");
  });

  it("is unavailable when the roster doesn't include both required heroes", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    // player1 has no Lightning Duelist, so Thunder Tide can never unlock this match.
    expect(isTeamUpAvailable(state, "player1", thunderTide)).toBe(false);
  });

  it("becomes unavailable once a required hero is defeated", () => {
    const state = createMatch(P1, P2, createSeededRng(1));
    expect(isTeamUpAvailable(state, "player1", steamSurge)).toBe(true);

    getHeroFrom(state, "player1", "water-healer").isDefeated = true;
    expect(isTeamUpAvailable(state, "player1", steamSurge)).toBe(false);
  });

  it("is unavailable once already used", () => {
    let state = createMatch(P1, P2, createSeededRng(1));
    state = playTeamUp(state, "player1", "steam-surge");
    expect(isTeamUpAvailable(state, "player1", steamSurge)).toBe(false);
    expect(() => playTeamUp(state, "player1", "steam-surge")).toThrow(/not currently available/i);
  });
});

// A roster with no Shadow Assassin, so its "reduced first hit" passive
// doesn't skew the uniform per-hero damage assertions below.
const P2_NO_PASSIVE: [HeroId, HeroId, HeroId] = ["lightning-duelist", "fire-mage", "water-healer"];

describe("Team-Up resolution", () => {
  it("Steam Surge damages, clears Wet, then applies Burn to all enemies in order", () => {
    let state = createMatch(P1, P2_NO_PASSIVE, createSeededRng(1));
    getHeroFrom(state, "player2", "fire-mage").statuses.push({ type: "wet" });

    const before = state.players.player2.heroes.map((h) => h.currentHp);
    state = playTeamUp(state, "player1", "steam-surge");

    state.players.player2.heroes.forEach((hero, i) => {
      expect(hero.currentHp).toBe(before[i] - 6);
      expect(hero.statuses.some((s) => s.type === "burn")).toBe(true);
    });
    expect(getHeroFrom(state, "player2", "fire-mage").statuses.some((s) => s.type === "wet")).toBe(
      false,
    );
    expect(state.players.player1.usedTeamUps).toContain("steam-surge");
  });

  it("Thunder Tide applies Wet then deals Wet-boosted Lightning damage to all enemies", () => {
    let state = createMatch(
      ["water-healer", "lightning-duelist", "shadow-assassin"],
      P2_NO_PASSIVE,
      createSeededRng(1),
    );
    const before = state.players.player2.heroes.map((h) => h.currentHp);
    state = playTeamUp(state, "player1", "thunder-tide");

    state.players.player2.heroes.forEach((hero, i) => {
      expect(hero.currentHp).toBe(before[i] - 7); // 4 base + 3 Wet bonus
      expect(hero.statuses.some((s) => s.type === "wet")).toBe(false);
    });
  });
});
