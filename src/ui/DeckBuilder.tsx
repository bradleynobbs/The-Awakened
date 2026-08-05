import { useState } from "react";
import { HERO_LIST } from "../engine/heroes";
import type { HeroId } from "../engine/types";
import type { HeroTrio } from "../engine/match";
import { getPreferredLoadout, savePreferredLoadout } from "../state/loadout";
import { HeroCard } from "./HeroCard";

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
          match — you can still change it there. Each hero's deck is fixed: 3 copies each of
          their Attack, Ability, and Support card, shown below.
        </p>

        <div className="hero-select-grid">
          {HERO_LIST.map((hero) => {
            const isSelected = selected.includes(hero.id);
            const index = selected.indexOf(hero.id);
            return (
              <button
                key={hero.id}
                className={`hero-select-card${isSelected ? " selected" : ""}`}
                onClick={() => toggle(hero.id)}
              >
                {isSelected && <span className="pick-badge">{index + 1}</span>}
                <HeroCard hero={hero} />
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
