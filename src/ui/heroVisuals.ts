import type { Element, Role } from "../engine/types";

export const ROLE_SYMBOL: Record<Role, string> = {
  Mage: "\u{1FA84}",
  Brawler: "\u{1F44A}",
  Tank: "\u{1F6E1}\u{FE0F}",
  Speedster: "\u{1F4A8}",
  Gunslinger: "\u{1F52B}",
  Support: "\u{1F49A}",
};

export const ELEMENT_COLOR: Record<Element, string> = {
  fire: "#e2582b",
  water: "#2f8fd6",
  spark: "#c9a13b",
  earth: "#5a7a4a",
  undead: "#6e5a72",
  charm: "#d6559e",
  spirit: "#7ecbc4",
};

export const ELEMENT_SYMBOL: Record<Element, string> = {
  fire: "\u{1F525}",
  water: "\u{1F4A7}",
  spark: "⚡",
  earth: "\u{1FAA8}",
  undead: "\u{1F480}",
  charm: "\u{1F498}",
  spirit: "\u{1F47B}",
};
