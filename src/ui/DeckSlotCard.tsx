import type { CSSProperties } from "react";
import type { HeroDefinition } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_ICON, HERO_PORTRAIT, ROLE_ICON } from "./heroVisuals";

interface DeckSlotCardProps {
  hero: HeroDefinition | null;
  /** Omit to render a non-interactive slot — used for the read-only
   * "YOUR DECK" / "OPPONENT'S DECK" reveal rows in Battle Preparation,
   * where tapping a slot isn't meant to do anything. */
  onClick?: () => void;
  emptyLabel?: string;
  /** Drafting mode (Battle Preparation's "pick 3 of your 5"): when set,
   * the tick and a bright glow only appear once this hero has actually
   * been picked, rather than unconditionally (which is what every
   * other use of this card wants — "this slot is filled," full stop). */
  selected?: boolean;
}

/** One slot in a 5-wide deck row — either a filled hero (portrait,
 * name, role/element icons, a border tinted to the hero's own
 * element, and a tick marking it as chosen) or an empty "Add Demigod"
 * placeholder. Shared between the Deck Builder's own "MY DECK" row
 * and Battle Preparation's deck-reveal rows (§9.46 — see DESIGN.md). */
export function DeckSlotCard({ hero, onClick, emptyLabel = "Add Demigod", selected }: DeckSlotCardProps) {
  if (!hero) {
    return (
      <button type="button" className="deck-slot-card empty" onClick={onClick} disabled={!onClick}>
        <span className="deck-slot-plus">+</span>
        <span className="deck-slot-empty-label">{emptyLabel}</span>
      </button>
    );
  }

  const portrait = HERO_PORTRAIT[hero.id];
  const showTick = selected === undefined ? true : selected;
  const picked = selected === true;

  return (
    <button
      type="button"
      className={`deck-slot-card filled${picked ? " picked" : ""}${selected === false ? " draft-unpicked" : ""}`}
      style={{ "--element-color": ELEMENT_COLOR[hero.element] } as CSSProperties}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="deck-slot-portrait-wrap">
        {portrait ? (
          <img className="deck-slot-portrait" src={portrait} alt="" />
        ) : (
          <img className="deck-slot-portrait deck-slot-fallback-icon" src={ROLE_ICON[hero.role]} alt="" />
        )}
        {showTick && <span className="deck-slot-tick">✓</span>}
      </div>
      <span className="deck-slot-name">{hero.name}</span>
      <span className="deck-slot-badges">
        <img className="deck-slot-icon deck-slot-icon-role" src={ROLE_ICON[hero.role]} alt={hero.role} />
        <img className="deck-slot-icon" src={ELEMENT_ICON[hero.element]} alt={hero.element} />
      </span>
    </button>
  );
}
