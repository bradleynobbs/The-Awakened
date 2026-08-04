import { useState } from "react";
import { HERO_LIST } from "../engine/heroes";
import type { HeroId } from "../engine/types";
import type { HeroTrio } from "../engine/match";
import { getPreferredLoadout, savePreferredLoadout } from "../state/loadout";
import { ELEMENT_COLOR, ELEMENT_SYMBOL } from "./heroVisuals";

interface DeckBuilderProps {
  onBack: () => void;
}

export function DeckBuilder({ onBack }: DeckBuilderProps) {
  const [selected, setSelected] = useState<HeroId[]>(() => getPreferredLoadout() ?? []);
  const [saved, setSaved] = useState(false);

  const toggle = (heroId: HeroId) => {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(heroId)) return prev.filter((id) => id !== heroId);
      if (prev.length >= 3) return prev;
      return [...prev, heroId];
    });
  };

  const handleSave = () => {
    if (selected.length !== 3) return;
    savePreferredLoadout(selected as HeroTrio);
    setSaved(true);
  };

  return (
    <div className="screen-with-header">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <span className="screen-header-title">Deck Builder</span>
      </div>

      <div className="selection-screen deck-builder-body">
        <p className="selection-hint">
          Choose your preferred 3 heroes. This loadout pre-fills team selection when you start a
          match — you can still change it there. Each hero's deck is fixed: 3 copies of their
          Attack and 3 of their Ability card.
        </p>

        <div className="hero-select-grid">
          {HERO_LIST.map((hero) => {
            const isSelected = selected.includes(hero.id);
            const index = selected.indexOf(hero.id);
            return (
              <button
                key={hero.id}
                className={`hero-select-card${isSelected ? " selected" : ""}`}
                style={{ borderColor: ELEMENT_COLOR[hero.element] }}
                onClick={() => toggle(hero.id)}
              >
                {isSelected && <span className="pick-badge">{index + 1}</span>}
                <span className="hero-symbol" style={{ color: ELEMENT_COLOR[hero.element] }}>
                  {ELEMENT_SYMBOL[hero.element]}
                </span>
                <span className="hero-select-name">{hero.name}</span>
                <span className="hero-select-role">
                  {hero.role} · {hero.element}
                </span>
                <span className="hero-select-hp">{hero.maxHp} HP</span>
                <div className="deck-builder-cards">
                  <div className="deck-builder-card-line">
                    <b>{hero.attack.name}</b> ({hero.attack.cost}⚡) — {hero.attack.description}
                  </div>
                  <div className="deck-builder-card-line">
                    <b>{hero.ability.name}</b> ({hero.ability.cost}⚡) — {hero.ability.description}
                  </div>
                  <div className="deck-builder-card-line passive">
                    <b>Passive:</b> {hero.passive.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button className="primary-button" disabled={selected.length !== 3} onClick={handleSave}>
          {saved ? "Saved ✓" : `Save Loadout (${selected.length}/3)`}
        </button>
      </div>
    </div>
  );
}
