import type { CardDefinition } from "./types";
import { HERO_LIST } from "./heroes";
import { TEAM_UP_DEFINITIONS } from "./teamups";

const registry = new Map<string, CardDefinition>();
for (const hero of HERO_LIST) {
  registry.set(hero.attack.id, hero.attack);
  registry.set(hero.ability.id, hero.ability);
}
for (const teamUp of TEAM_UP_DEFINITIONS) {
  registry.set(teamUp.id, teamUp);
}

export function getCardDefinition(cardId: string): CardDefinition {
  const def = registry.get(cardId);
  if (!def) throw new Error(`Unknown card id: ${cardId}`);
  return def;
}

export const ALL_CARD_DEFINITIONS: CardDefinition[] = Array.from(registry.values());
