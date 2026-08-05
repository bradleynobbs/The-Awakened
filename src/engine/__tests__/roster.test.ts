import { describe, expect, it } from "vitest";
import { HERO_LIST } from "../heroes";

describe("hero roster composition", () => {
  it("has 17 heroes covering all 7 elements, each with at least 2 heroes", () => {
    expect(HERO_LIST).toHaveLength(17);
    const counts = new Map<string, number>();
    for (const hero of HERO_LIST) {
      counts.set(hero.element, (counts.get(hero.element) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual(
      ["charm", "earth", "fire", "spark", "spirit", "undead", "water"].sort(),
    );
    for (const [element, count] of counts) {
      expect(count, `${element} should have at least 2 heroes`).toBeGreaterThanOrEqual(2);
    }
  });

  it("only uses the 6 currently-supported roles", () => {
    const roles = new Set(HERO_LIST.map((h) => h.role));
    for (const role of roles) {
      expect(["Mage", "Brawler", "Tank", "Speedster", "Ranger", "Support"]).toContain(role);
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
