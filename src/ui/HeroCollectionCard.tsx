import type { HeroDefinition } from "../engine/types";
import { ELEMENT_ICON, HERO_CARD_ART, ROLE_ICON } from "./heroVisuals";

interface HeroCollectionCardProps {
  hero: HeroDefinition;
  selected: boolean;
  onSelect: () => void;
  onInfo: () => void;
}

/** A compact card for the Deck Builder's "Choose Your Demigods" grid —
 * deliberately lighter than the full HeroCard trading-card design
 * (§9.30): a smaller portrait, a numeric HP/Attack/Defence row instead
 * of full ability text, and a "3 Abilities" pill in place of the
 * actual ability panels, which only appear in the full-screen detail
 * panel (see HeroDetailPanel). Tapping the card body toggles the
 * hero in/out of the deck (matches this genre's fast-build
 * convention — Snap, Clash Royale); the small ⓘ button is a separate
 * hit target for opening that detail panel, since the spec asks for
 * both "tap to select" and "tap to see everything" and a card can't
 * sensibly do both from the same tap. */
export function HeroCollectionCard({ hero, selected, onSelect, onInfo }: HeroCollectionCardProps) {
  const art = HERO_CARD_ART[hero.id];

  return (
    <div className={`hero-collection-card${selected ? " selected" : ""}`}>
      <button type="button" className="hero-collection-tap" onClick={onSelect}>
        <div className="hero-collection-portrait-wrap">
          {art ? (
            <img className="hero-collection-portrait" src={art} alt="" />
          ) : (
            <div className="hero-collection-portrait-fallback">
              <img src={ROLE_ICON[hero.role]} className="hero-card-fallback-icon" alt="" />
            </div>
          )}
          <span className="hero-card-badge hero-card-badge-role hero-collection-badge">
            <img src={ROLE_ICON[hero.role]} alt={hero.role} />
          </span>
          <span className="hero-card-badge hero-card-badge-element hero-collection-badge">
            <img src={ELEMENT_ICON[hero.element]} alt={hero.element} />
          </span>
          {selected && <span className="hero-collection-tick">✓</span>}
        </div>
        <span className="hero-collection-name">{hero.name}</span>
        <span className="hero-collection-stats">
          <span className="hero-collection-stat" title="Health">
            ❤ {hero.maxHp}
          </span>
          <span className="hero-collection-stat" title="Attack">
            ⚔ {hero.stats.attack}
          </span>
          <span className="hero-collection-stat" title="Defence">
            🛡 {hero.stats.defense}
          </span>
        </span>
        <span className="hero-collection-abilities-pill">3 Abilities</span>
      </button>
      <button
        type="button"
        className="hero-collection-info-btn"
        onClick={onInfo}
        aria-label={`${hero.name} details`}
      >
        ⓘ
      </button>
    </div>
  );
}
