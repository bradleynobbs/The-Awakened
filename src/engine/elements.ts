import type { Element } from "./types";

/**
 * The 7-element cycle from DESIGN.md §8.3. Each element beats the next two
 * elements clockwise, loses to the previous two, and is neutral to the
 * remaining two — a balanced 2-win/2-loss/2-neutral split for every
 * element, guaranteed by construction rather than hand-tuned.
 */
const ELEMENT_CYCLE: Element[] = ["fire", "earth", "spark", "water", "spirit", "undead", "charm"];

export const CRIT_THRESHOLD = 50;
const ADVANTAGE_MULTIPLIER = 1.25;
const DISADVANTAGE_MULTIPLIER = 0.8;

/** Attacker's damage multiplier against a target's element. Damage-only — see §8.3. */
export function elementalMultiplier(attackerElement: Element, targetElement: Element): number {
  const from = ELEMENT_CYCLE.indexOf(attackerElement);
  const to = ELEMENT_CYCLE.indexOf(targetElement);
  const diff = (to - from + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length;
  if (diff === 1 || diff === 2) return ADVANTAGE_MULTIPLIER;
  if (diff === ELEMENT_CYCLE.length - 1 || diff === ELEMENT_CYCLE.length - 2) {
    return DISADVANTAGE_MULTIPLIER;
  }
  return 1;
}
