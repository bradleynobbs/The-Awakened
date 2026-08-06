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
  "water-healer": {
    skin: "#d0b090",
    eye: "#3ab8c9",
    hair: "#1a4a6a",
    feature: "teardrop-mark",
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
  // The ten heroes below all ship with real illustrated art (see REAL_ART
  // in HeroSprite.tsx) from day one, so the SVG chassis these cosmetics
  // feed never actually renders for them — these values exist purely to
  // satisfy Record<HeroId, HeroCosmetics>'s completeness requirement.
  torrent: {
    skin: "#c8dce8",
    eye: "#1a6ab8",
    hair: "#2a5a8a",
    feature: "water-mark",
  },
  zera: {
    skin: "#d8b878",
    eye: "#e8c020",
    hair: "#e8d040",
    feature: "spark-scar",
  },
  orin: {
    skin: "#c8b898",
    eye: "#4a9868",
    hair: "#c8c8c8",
    feature: "leaf-mark",
  },
  sorrow: {
    skin: "#a87858",
    eye: "#5a7a3a",
    hair: "#3a3020",
    feature: "crystal-vein",
  },
  kharos: {
    skin: "#c8c0b8",
    eye: "#8a5ac8",
    hair: "#3a3a3a",
    feature: "bone-crack",
  },
  flint: {
    skin: "#e8d0c0",
    eye: "#d87020",
    hair: "#e8e0d8",
    feature: "ember-tuft",
  },
  erosalina: {
    skin: "#f0c8b8",
    eye: "#e878a8",
    hair: "#f0a8c8",
    feature: "heart-blush",
  },
  rune: {
    skin: "#c0a888",
    eye: "#3ac8b8",
    hair: "#d8d8d0",
    feature: "spirit-tattoo",
  },
  amp: {
    skin: "#d0a068",
    eye: "#f0d820",
    hair: "#e8c820",
    feature: "static-fringe",
  },
  cragor: {
    skin: "#8a6a48",
    eye: "#6a8a4a",
    hair: "#2a2318",
    feature: "moss-patch",
  },
};
