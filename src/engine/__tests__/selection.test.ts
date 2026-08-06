import { describe, expect, it } from "vitest";
import { createTeamSelection, lockSelection, toggleHero } from "../selection";
import type { HeroId } from "../types";

const OFFERED: HeroId[] = [
  "fire-mage",
  "cragor",
  "water-healer",
  "zera",
  "undead-assassin",
  "charm-gunslinger",
  "orin",
];

describe("hero selection", () => {
  it("selects exactly 3 of the 7 offered heroes", () => {
    let state = createTeamSelection("player1", OFFERED);
    state = toggleHero(state, "fire-mage");
    state = toggleHero(state, "cragor");
    state = toggleHero(state, "water-healer");
    expect(state.selected).toEqual(["fire-mage", "cragor", "water-healer"]);
  });

  it("rejects a 4th selection", () => {
    let state = createTeamSelection("player1", OFFERED);
    state = toggleHero(state, "fire-mage");
    state = toggleHero(state, "cragor");
    state = toggleHero(state, "water-healer");
    expect(() => toggleHero(state, "zera")).toThrow(/Only 3 heroes/);
  });

  it("allows deselecting before locking", () => {
    let state = createTeamSelection("player1", OFFERED);
    state = toggleHero(state, "fire-mage");
    state = toggleHero(state, "fire-mage");
    expect(state.selected).toEqual([]);
  });

  it("requires exactly 3 heroes before locking in", () => {
    let state = createTeamSelection("player1", OFFERED);
    state = toggleHero(state, "fire-mage");
    expect(() => lockSelection(state)).toThrow(/Exactly 3 heroes/);
  });

  it("prevents team changes after the selection is locked", () => {
    let state = createTeamSelection("player1", OFFERED);
    state = toggleHero(state, "fire-mage");
    state = toggleHero(state, "cragor");
    state = toggleHero(state, "water-healer");
    state = lockSelection(state);
    expect(state.isLocked).toBe(true);
    expect(() => toggleHero(state, "undead-assassin")).toThrow(/locked/);
  });
});
