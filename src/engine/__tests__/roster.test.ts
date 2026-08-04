import { describe, expect, it } from "vitest";
import { HERO_LIST } from "../heroes";

describe("hero roster composition", () => {
  it("has exactly 7 heroes, one per element, with no duplicate elements", () => {
    const elements = HERO_LIST.map((h) => h.element).sort();
    expect(elements).toEqual(
      ["charm", "earth", "fire", "spark", "spirit", "undead", "water"].sort(),
    );
  });

  it("only uses the 6 currently-supported roles", () => {
    const roles = new Set(HERO_LIST.map((h) => h.role));
    for (const role of roles) {
      expect(["Mage", "Brawler", "Tank", "Speedster", "Gunslinger", "Support"]).toContain(role);
    }
    // Every role has at least one hero (Mage is used twice, by design).
    expect(roles.size).toBe(6);
  });

  it("gives every hero an attack, ability, and support card", () => {
    for (const hero of HERO_LIST) {
      expect(hero.attack.kind).toBe("attack");
      expect(hero.ability.kind).toBe("ability");
      expect(hero.support.kind).toBe("support");
    }
  });
});
