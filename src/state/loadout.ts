import { HERO_LIST } from "../engine/heroes";
import type { HeroId } from "../engine/types";
import type { HeroTrio } from "../engine/match";

const STORAGE_KEY = "the-awakened:preferred-loadout";
const ALL_HERO_IDS = new Set(HERO_LIST.map((h) => h.id));

/** The player's saved 3-hero loadout from the Deck Builder, if any. */
export function getPreferredLoadout(): HeroTrio | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 3) return null;
    if (!parsed.every((id): id is HeroId => typeof id === "string" && ALL_HERO_IDS.has(id as HeroId))) {
      return null;
    }
    return parsed as HeroTrio;
  } catch {
    return null;
  }
}

export function savePreferredLoadout(heroIds: HeroTrio): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(heroIds));
}
