import infernaPortrait from "../assets/heroes/inferna-portrait.jpg";
import infernaSplash from "../assets/heroes/inferna-splash.jpg";
import type { HeroId } from "../engine/types";

/**
 * Real character art, where it exists — everyone else still uses the
 * procedural low-poly rig (see DESIGN.md §9) and heroCosmetics.ts. A
 * hero with a portrait here gets it shown on their Deck Builder card,
 * hand cards, and battlefield hero plate; heroes without one fall back
 * to the existing emoji/symbol treatment.
 */
export const HERO_PORTRAITS: Partial<Record<HeroId, { portrait: string; splash: string }>> = {
  "fire-mage": { portrait: infernaPortrait, splash: infernaSplash },
};
