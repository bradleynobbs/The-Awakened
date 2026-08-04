import type { Element, HeroId, Role } from "../engine/types";
import mageIcon from "../assets/roles/mage.png";
import brawlerIcon from "../assets/roles/brawler.png";
import tankIcon from "../assets/roles/tank.png";
import speedsterIcon from "../assets/roles/speedster.png";
import rangerIcon from "../assets/roles/ranger.png";
import supportIcon from "../assets/roles/support.png";
import infernaPortrait from "../assets/heroes/inferna-portrait.png";
import mournPortrait from "../assets/heroes/mourn-portrait.png";
import kairoPortrait from "../assets/heroes/kairo-portrait.png";

/** Cropped headshots for the roster panel (§9.19) — only exists for
 * heroes with real illustrated art (see REAL_ART in HeroSprite.tsx).
 * Heroes still on the shared vector chassis fall back to their role
 * icon on a plain element-colored disc (HeroPortrait in Battlefield.tsx). */
export const HERO_PORTRAIT: Partial<Record<HeroId, string>> = {
  "fire-mage": infernaPortrait,
  "undead-assassin": mournPortrait,
  "charm-gunslinger": kairoPortrait,
};

/** Illustrated role emblems (replacing the earlier emoji placeholders) —
 * matching metallic target-ring frames, one motif per role. */
export const ROLE_ICON: Record<Role, string> = {
  Mage: mageIcon,
  Brawler: brawlerIcon,
  Tank: tankIcon,
  Speedster: speedsterIcon,
  Ranger: rangerIcon,
  Support: supportIcon,
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
