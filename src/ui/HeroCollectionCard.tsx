import type { CSSProperties } from "react";
import type { HeroDefinition } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_ICON, HERO_CARD_ART, HERO_COLLECTION_ART, ROLE_ICON } from "./heroVisuals";
import { useLongPress } from "./useLongPress";

interface HeroCollectionCardProps {
  hero: HeroDefinition;
  selected: boolean;
  onSelect: () => void;
  onInfo: () => void;
}

/** A "Choose Your Demigods" grid card, rebuilt to match a supplied
 * mockup almost exactly (§9.47 — see DESIGN.md): full-bleed portrait,
 * a colored glowing border matching the hero's element (reusing the
 * same ELEMENT_COLOR token the roster banner and element badges
 * already use elsewhere, rather than a second palette just for this
 * screen), the element as a small icon badge top-left, role as plain
 * colored text top-right (no role icon here — that's a deliberate
 * mockup choice, not an oversight), and a footer of name / "3
 * Abilities" / HP-Attack-Defence. No ability text, no lore — those
 * live only in the full-screen detail panel now.
 *
 * The mockup's card has no separate ⓘ button, so a plain tap now
 * toggles the hero in/out of the deck directly and a long-press opens
 * the detail panel instead (see useLongPress). */
export function HeroCollectionCard({ hero, selected, onSelect, onInfo }: HeroCollectionCardProps) {
  const art = HERO_COLLECTION_ART[hero.id] ?? HERO_CARD_ART[hero.id];
  const { handlers, consumeIfLongPress } = useLongPress(onInfo);

  return (
    <button
      type="button"
      className={`hero-collection-card${selected ? " selected" : ""}`}
      style={{ "--element-color": ELEMENT_COLOR[hero.element] } as CSSProperties}
      {...handlers}
      onClick={() => {
        if (!consumeIfLongPress()) onSelect();
      }}
    >
      <div className="hero-collection-portrait-wrap">
        {art ? (
          <img className="hero-collection-portrait" src={art} alt="" />
        ) : (
          <div className="hero-collection-portrait-fallback">
            <img src={ROLE_ICON[hero.role]} className="hero-card-fallback-icon" alt="" />
          </div>
        )}
        <span className="collection-card-element-badge">
          <img src={ELEMENT_ICON[hero.element]} alt={hero.element} />
        </span>
        <span className="collection-card-role-label">{hero.role}</span>
        {selected && <span className="collection-card-tick">✓</span>}
      </div>
      <div className="collection-card-footer">
        <span className="collection-card-name">{hero.name}</span>
        <span className="collection-card-abilities-line">3 Abilities</span>
        <span className="collection-card-stats">
          <span className="collection-card-stat collection-card-stat-hp">❤ {hero.maxHp}</span>
          <span className="collection-card-stat collection-card-stat-atk">🗡 {hero.stats.attack}</span>
          <span className="collection-card-stat collection-card-stat-def">🛡 {hero.stats.defense}</span>
        </span>
      </div>
    </button>
  );
}
