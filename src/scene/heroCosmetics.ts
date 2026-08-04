import type { HeroId } from "../engine/types";

/**
 * Per-hero face/skin identity (DESIGN.md §9) — every hero gets a distinct
 * skin tone, eye color, hair color, and a one-line "small feature" note
 * so no two heroes read as the same person in a different shirt, even at
 * a glance from the default battlefield camera distance.
 */
export interface HeroCosmetics {
  skin: string;
  eye: string;
  hair: string;
  feature: string;
}

export const HERO_COSMETICS: Record<HeroId, HeroCosmetics> = {
  "fire-mage": {
    skin: "#e0a878",
    eye: "#c2621a",
    hair: "#2a1712",
    feature: "ember-freckle",
  },
  "earth-guardian": {
    skin: "#8a5a3a",
    eye: "#4a6a3a",
    hair: "#3a2f1a",
    feature: "stone-chip",
  },
  "water-healer": {
    skin: "#d0b090",
    eye: "#3ab8c9",
    hair: "#1a4a6a",
    feature: "teardrop-mark",
  },
  "spark-duelist": {
    skin: "#c99060",
    eye: "#f0e060",
    hair: "#e8d84a",
    feature: "lightning-scar",
  },
  "undead-assassin": {
    skin: "#a8a0a8",
    eye: "#4ae86a",
    hair: "#1a1a22",
    feature: "brow-scar",
  },
  "charm-gunslinger": {
    skin: "#e0b090",
    eye: "#c2489e",
    hair: "#ff5fc0",
    feature: "visor",
  },
  "spirit-mage": {
    skin: "#d8c8d8",
    eye: "#a86ae0",
    hair: "#e8e8f0",
    feature: "forehead-rune",
  },
};
