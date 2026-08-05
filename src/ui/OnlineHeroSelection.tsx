import { useState } from "react";
import { HERO_LIST } from "../engine/heroes";
import { createTeamSelection, lockSelection, toggleHero } from "../engine/selection";
import type { TeamSelectionState } from "../engine/selection";
import type { HeroId } from "../engine/types";
import type { HeroTrio } from "../engine/match";
import { ELEMENT_COLOR } from "./heroVisuals";
import { HeroCard } from "./HeroCard";

const OFFERED: HeroId[] = HERO_LIST.map((h) => h.id);

interface OnlineHeroSelectionProps {
  waitingOnOpponent: boolean;
  /** Pre-fills selection, e.g. from a Deck Builder loadout. Still freely editable. */
  initialHeroIds?: HeroTrio;
  onLockIn: (heroIds: HeroTrio) => void;
}

export function OnlineHeroSelection({ waitingOnOpponent, initialHeroIds, onLockIn }: OnlineHeroSelectionProps) {
  const [selection, setSelection] = useState<TeamSelectionState>(() => ({
    ...createTeamSelection("player1", OFFERED),
    selected: initialHeroIds ? [...initialHeroIds] : [],
  }));

  const handleToggle = (heroId: HeroId) => {
    if (waitingOnOpponent) return;
    try {
      setSelection(toggleHero(selection, heroId));
    } catch {
      // Selecting a 4th hero or an unavailable hero: ignored in the UI.
    }
  };

  const handleLockIn = () => {
    const locked = lockSelection(selection);
    setSelection(locked);
    onLockIn(locked.selected as HeroTrio);
  };

  if (waitingOnOpponent) {
    return (
      <div className="selection-screen">
        <div className="spinner" />
        <h1>Waiting for opponent…</h1>
        <p className="selection-hint">Your team is locked in. Your opponent is still choosing.</p>
      </div>
    );
  }

  return (
    <div className="selection-screen">
      <h1>Choose Your 3 Heroes</h1>
      <p className="selection-hint">
        Pick exactly 3 of the {HERO_LIST.length} heroes below. Once locked in, your team cannot
        change for the rest of the match.
      </p>
      <div className="hero-select-grid">
        {HERO_LIST.map((hero) => {
          const selected = selection.selected.includes(hero.id);
          const index = selection.selected.indexOf(hero.id);
          return (
            <button
              key={hero.id}
              className={`hero-select-card${selected ? " selected" : ""}`}
              style={{ borderColor: ELEMENT_COLOR[hero.element] }}
              onClick={() => handleToggle(hero.id)}
            >
              {selected && <span className="pick-badge">{index + 1}</span>}
              <HeroCard hero={hero} />
            </button>
          );
        })}
      </div>
      <button
        className="primary-button"
        disabled={selection.selected.length !== 3}
        onClick={handleLockIn}
      >
        Lock In Team ({selection.selected.length}/3)
      </button>
    </div>
  );
}
