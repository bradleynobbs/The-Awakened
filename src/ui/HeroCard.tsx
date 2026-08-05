import type { HeroDefinition } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_SYMBOL, HERO_PORTRAIT, ROLE_ICON } from "./heroVisuals";

interface HeroCardProps {
  hero: HeroDefinition;
  /** Deck Builder shows the full numeric stat grid too; the hero-select
   * screen (mid-match-flow, 17 of these in one scrolling grid) stays
   * without it — the 4 ability rows are already the bulk of the card. */
  showStats?: boolean;
}

/** §9.29: a trading-card-style presentation for a hero's kit — real
 * portrait art (falling back to the existing role-icon-on-disc for
 * heroes without dedicated art yet, same as the roster panel),
 * role/element corner badges, a name banner, and all 4 of a hero's
 * abilities (Attack/Ability/Support/Passive) — modeled on a supplied
 * reference card design. Shared by DeckBuilder and OnlineHeroSelection
 * (the two screens the request named — "team builder" and "where you
 * select your card before a game") rather than styling just one hero
 * specially, which would look broken sitting in the same grid as 16
 * others left on the old plain card. */
export function HeroCard({ hero, showStats }: HeroCardProps) {
  const portrait = HERO_PORTRAIT[hero.id];
  const color = ELEMENT_COLOR[hero.element];

  return (
    <>
      <div className="hero-card-portrait-wrap" style={{ borderColor: color }}>
        {portrait ? (
          <img src={portrait} className="hero-card-portrait" alt="" />
        ) : (
          <div className="hero-card-portrait-fallback" style={{ background: color }}>
            <img src={ROLE_ICON[hero.role]} className="hero-card-fallback-icon" alt="" />
          </div>
        )}
        <span className="hero-card-badge hero-card-badge-role">
          <img src={ROLE_ICON[hero.role]} alt={hero.role} />
        </span>
        <span className="hero-card-badge hero-card-badge-element" style={{ color }}>
          {ELEMENT_SYMBOL[hero.element]}
        </span>
      </div>

      <div className="hero-card-name-banner" style={{ borderColor: color }}>
        <span className="hero-card-name">{hero.name}</span>
        <span className="hero-card-subrole">
          {hero.role} · {hero.element}
        </span>
      </div>

      <div className="hero-card-abilities">
        <AbilityRow label={hero.attack.name} cost={hero.attack.cost} desc={hero.attack.description} />
        <AbilityRow label={hero.ability.name} cost={hero.ability.cost} desc={hero.ability.description} />
        <AbilityRow label={hero.support.name} cost={hero.support.cost} desc={hero.support.description} />
        <AbilityRow label={hero.passive.name} desc={hero.passive.description} passive />
      </div>

      {showStats && (
        <div className="deck-builder-stat-grid">
          <span>⚔️ ATK {hero.stats.attack}</span>
          <span>🛡️ DEF {hero.stats.defense}</span>
          <span>🏃 SPD {hero.stats.speed}</span>
          <span>🎯 ACC {hero.stats.accuracy}</span>
          <span>💨 EVA {hero.stats.evasion}</span>
          <span>✨ CRIT {hero.stats.criticalChance}</span>
          <span>💥 CRIT DMG {hero.stats.criticalDamage}%</span>
          <span>⚡ ENERGY +{hero.stats.energy}</span>
          <span>⏱️ CDR {hero.stats.cooldownReduction}</span>
          <span>💚 HEAL {hero.stats.healingPower}%</span>
          <span>🔷 SHIELD {hero.stats.shieldStrength}%</span>
        </div>
      )}
    </>
  );
}

function AbilityRow({
  label,
  desc,
  cost,
  passive,
}: {
  label: string;
  desc: string;
  cost?: number;
  passive?: boolean;
}) {
  return (
    <div className={`hero-card-ability-row${passive ? " passive" : ""}`}>
      <span className="hero-card-ability-icon" aria-hidden="true">
        {passive ? "◆" : "⬡"}
      </span>
      <span className="hero-card-ability-copy">
        <span className="hero-card-ability-label">
          {label}
          {cost !== undefined && <span className="hero-card-ability-cost"> {cost}⚡</span>}
        </span>
        <span className="hero-card-ability-desc">{desc}</span>
      </span>
    </div>
  );
}
