import type { CSSProperties } from "react";
import type { HeroDefinition } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_ICON, HERO_PORTRAIT, ROLE_ICON } from "./heroVisuals";
import { useLongPress } from "./useLongPress";

interface DeckSlotCardProps {
  hero: HeroDefinition | null;
  /** Omit to render a non-interactive slot — used for the read-only
   * "YOUR DECK" / "OPPONENT'S DECK" reveal rows in Battle Preparation,
   * where tapping a slot isn't meant to do anything. In the Deck
   * Builder's own "PICK 5 DEMIGODS" row, a filled slot's tap removes
   * that hero from the deck instead — there's no separate remove
   * button in the mockup this matches, so the slot itself is it. */
  onClick?: () => void;
  /** Deck Builder only: opens the full-screen detail panel. Battle
   * Preparation never sets this — a slot's onClick there already means
   * something else (draft pick), so long-press-for-info would be a
   * confusing second meaning layered on the same gesture. */
  onLongPress?: () => void;
  emptyLabel?: string;
  /** Drafting mode (Battle Preparation's "pick 3 of your 5"): when set,
   * a bright glow only appears once this hero has actually been
   * picked, rather than unconditionally (which is what every other
   * use of this card wants — "this slot is filled," full stop). */
  selected?: boolean;
}

/** One slot in a 5-wide deck row, rebuilt to match a supplied mockup
 * (§9.47 — see DESIGN.md): a colored glowing border tinted to the
 * hero's own element, the element as a small icon top-left, the
 * hero's name, and a small gold-tinted role icon underneath —
 * deliberately lighter than HeroCollectionCard (no stats, no ability
 * count), since 5 of these sit in a single un-scrolled row and
 * there's no room for more. An empty slot is a dark card with a
 * subtle purple border and an "Add Demigod" placeholder. Shared
 * between the Deck Builder's own "PICK 5 DEMIGODS" row and Battle
 * Preparation's reveal/draft rows. */
export function DeckSlotCard({ hero, onClick, onLongPress, emptyLabel = "Add Demigod", selected }: DeckSlotCardProps) {
  const { handlers, consumeIfLongPress } = useLongPress(onLongPress);

  if (!hero) {
    return (
      <button type="button" className="deck-slot-card empty" onClick={onClick} disabled={!onClick}>
        <span className="deck-slot-plus">+</span>
        <span className="deck-slot-empty-label">{emptyLabel}</span>
      </button>
    );
  }

  const portrait = HERO_PORTRAIT[hero.id];
  const picked = selected === true;

  return (
    <button
      type="button"
      className={`deck-slot-card filled${picked ? " picked" : ""}${selected === false ? " draft-unpicked" : ""}`}
      style={{ "--element-color": ELEMENT_COLOR[hero.element] } as CSSProperties}
      disabled={!onClick}
      {...handlers}
      onClick={() => {
        if (!consumeIfLongPress()) onClick?.();
      }}
    >
      <div className="deck-slot-portrait-wrap">
        {portrait ? (
          <img className="deck-slot-portrait" src={portrait} alt="" />
        ) : (
          <img className="deck-slot-portrait deck-slot-fallback-icon" src={ROLE_ICON[hero.role]} alt="" />
        )}
        <span className="deck-slot-element-badge">
          <img src={ELEMENT_ICON[hero.element]} alt={hero.element} />
        </span>
      </div>
      <span className="deck-slot-name">{hero.name}</span>
      <img className="deck-slot-role-icon" src={ROLE_ICON[hero.role]} alt={hero.role} />
    </button>
  );
}
