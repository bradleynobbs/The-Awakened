import type { HeroDefinition } from "../engine/types";
import { ELEMENT_ICON, HERO_CARD_ART, ROLE_ICON } from "./heroVisuals";

interface HeroCardProps {
  hero: HeroDefinition;
}

/** §9.29 built a trading-card-style hero presentation; §9.30 replaced
 * it with this one against a much more specific brief: matte black +
 * gunmetal/silver metal frame (no per-element colored border — that
 * lives on the parent `.hero-select-card` button, now neutral),
 * character art filling the card's entire upper half (a wider "chest
 * and shoulders" crop — HERO_CARD_ART, not the tighter HERO_PORTRAIT
 * headshot the roster panel uses), a name plate with nothing else on
 * it, and exactly 3 ability panels (Attack/Ability/Support) — no
 * stats, no cost numbers, no Passive row, all deliberately dropped
 * per the brief's own "Remove" list. Split into the layers the brief
 * itself suggested — frame (the parent button's CSS, unchanged per
 * hero), portrait, corner badges, text — so a new hero only ever
 * needs a new HERO_CARD_ART entry, never a design change here. */
export function HeroCard({ hero }: HeroCardProps) {
  const art = HERO_CARD_ART[hero.id];

  return (
    <>
      <div className="hero-card-portrait-wrap">
        {art ? (
          <img src={art} className="hero-card-portrait" alt="" />
        ) : (
          <div className="hero-card-portrait-fallback">
            <img src={ROLE_ICON[hero.role]} className="hero-card-fallback-icon" alt="" />
          </div>
        )}
        <span className="hero-card-badge hero-card-badge-role">
          <img src={ROLE_ICON[hero.role]} alt={hero.role} />
        </span>
        <span className="hero-card-badge hero-card-badge-element">
          <img src={ELEMENT_ICON[hero.element]} alt={hero.element} />
        </span>
      </div>

      <div className="hero-card-name-plate">
        <span className="hero-card-name">{hero.name}</span>
      </div>

      <div className="hero-card-abilities">
        <AbilityPanel label={hero.attack.name} desc={hero.attack.description} />
        <AbilityPanel label={hero.ability.name} desc={hero.ability.description} />
        <AbilityPanel label={hero.support.name} desc={hero.support.description} />
      </div>
    </>
  );
}

function AbilityPanel({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="hero-card-ability-panel">
      <span className="hero-card-ability-icon" aria-hidden="true">
        ⬡
      </span>
      <span className="hero-card-ability-copy">
        <span className="hero-card-ability-label">{label}</span>
        <span className="hero-card-ability-desc">{desc}</span>
      </span>
    </div>
  );
}
