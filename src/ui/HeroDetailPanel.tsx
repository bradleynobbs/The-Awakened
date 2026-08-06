import type { HeroDefinition } from "../engine/types";
import { HeroCard } from "./HeroCard";

interface HeroDetailPanelProps {
  hero: HeroDefinition;
  inDeck: boolean;
  deckFull: boolean;
  onClose: () => void;
  onToggleDeck: () => void;
}

/** Full-screen "everything about this hero" panel, opened from the
 * Deck Builder collection grid's ⓘ button (§9.46). Reuses HeroCard —
 * the same portrait/badge/ability-panel frame the hero-select cards
 * already use elsewhere — as the header, then appends the sections
 * the brief asks for that HeroCard alone doesn't cover: lore, a
 * numeric stat block, and Passive/Ultimate/Skins. Ultimate and Skins
 * have no real data behind them yet (no unlock system, no cosmetics
 * system), so both render as plain "not yet" stubs rather than
 * fabricated content — consistent with how the rest of the app (see
 * ComingSoon.tsx) marks features that don't exist yet. */
export function HeroDetailPanel({ hero, inDeck, deckFull, onClose, onToggleDeck }: HeroDetailPanelProps) {
  const abilities = [hero.attack, hero.ability, hero.support];

  return (
    <div className="hero-detail-overlay" role="dialog" aria-modal="true" aria-label={`${hero.name} details`}>
      <div className="hero-detail-panel">
        <button className="icon-button hero-detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="hero-select-card hero-detail-card-frame">
          <HeroCard hero={hero} />
        </div>

        <div className="hero-detail-sections">
          <section className="hero-detail-section">
            <h3>Lore</h3>
            <p className="hero-detail-lore">{hero.lore}</p>
          </section>

          <section className="hero-detail-section">
            <h3>Stats</h3>
            <div className="hero-detail-stat-grid">
              <div className="hero-detail-stat">
                <span className="hero-detail-stat-label">HP</span>
                <span className="hero-detail-stat-value">{hero.maxHp}</span>
              </div>
              <div className="hero-detail-stat">
                <span className="hero-detail-stat-label">Attack</span>
                <span className="hero-detail-stat-value">{hero.stats.attack}</span>
              </div>
              <div className="hero-detail-stat">
                <span className="hero-detail-stat-label">Defence</span>
                <span className="hero-detail-stat-value">{hero.stats.defense}</span>
              </div>
              <div className="hero-detail-stat">
                <span className="hero-detail-stat-label">Speed</span>
                <span className="hero-detail-stat-value">{hero.stats.speed}</span>
              </div>
            </div>
          </section>

          <section className="hero-detail-section">
            <h3>Abilities</h3>
            {abilities.map((card) => (
              <div key={card.id} className="hero-detail-ability">
                <span className="hero-detail-ability-cost">{card.cost}⚡</span>
                <span className="hero-detail-ability-copy">
                  <span className="hero-detail-ability-name">{card.name}</span>
                  <span className="hero-detail-ability-desc">{card.description}</span>
                </span>
              </div>
            ))}
          </section>

          <section className="hero-detail-section">
            <h3>Passive — {hero.passive.name}</h3>
            <p>{hero.passive.description}</p>
          </section>

          <section className="hero-detail-section hero-detail-stub">
            <h3>🔒 Ultimate</h3>
            <p>Not yet unlocked.</p>
          </section>

          <section className="hero-detail-section hero-detail-stub">
            <h3>🎨 Skins</h3>
            <p>Coming soon.</p>
          </section>
        </div>

        <button className="primary-button hero-detail-action" onClick={onToggleDeck}>
          {inDeck ? "Remove from Deck" : deckFull ? "Replace a Demigod…" : "Add to Deck"}
        </button>
      </div>
    </div>
  );
}
