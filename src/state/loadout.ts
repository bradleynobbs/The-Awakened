import { HERO_LIST } from "../engine/heroes";
import type { HeroId } from "../engine/types";

const STORAGE_KEY = "the-awakened:deck";
const ALL_HERO_IDS = new Set(HERO_LIST.map((h) => h.id));

/** The Deck Builder's persistent squad — the pool both Battle
 * Preparation reveal screens and the eventual "pick 3" draft (see
 * DESIGN.md) draw from. Not the 3 heroes that actually enter a
 * given match — that's decided fresh every game by the draft. */
export const DECK_SIZE = 5;

/** The player's saved deck, in slot order (may have empty trailing
 * slots while it's still being built — a complete deck has exactly
 * DECK_SIZE entries). Returns [] if nothing has been saved yet. */
export function getDeck(): HeroId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is HeroId => typeof id === "string" && ALL_HERO_IDS.has(id as HeroId)).slice(0, DECK_SIZE);
  } catch {
    return [];
  }
}

export function saveDeck(heroIds: HeroId[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(heroIds.slice(0, DECK_SIZE)));
}

export function isDeckComplete(deck: HeroId[]): boolean {
  return deck.length === DECK_SIZE;
}
