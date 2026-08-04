import type { CSSProperties } from "react";
import { HERO_LIST } from "../engine/heroes";
import { getObjectives } from "../state/objectives";
import { ELEMENT_COLOR, ELEMENT_SYMBOL } from "./heroVisuals";

interface MainMenuProps {
  online: boolean;
  onFindMatch: () => void;
  onPracticeMatch: () => void;
  onDeckBuilder: () => void;
  onStore: () => void;
}

export function MainMenu({ online, onFindMatch, onPracticeMatch, onDeckBuilder, onStore }: MainMenuProps) {
  const { daily, weekly } = getObjectives();

  return (
    <div className="menu-root">
      <div className="hero-banner">
        <div className="hero-showcase" aria-hidden="true">
          {HERO_LIST.map((hero, i) => (
            <div
              key={hero.id}
              className="showcase-hero"
              style={{ color: ELEMENT_COLOR[hero.element], "--delay": `${i * 0.4}s` } as CSSProperties}
            >
              <span className="showcase-glow" style={{ background: ELEMENT_COLOR[hero.element] }} />
              <span className="showcase-symbol">{ELEMENT_SYMBOL[hero.element]}</span>
            </div>
          ))}
        </div>
        <h1 className="menu-title">The Awakened</h1>
        <p className="menu-tagline">1v1 tactical card battler</p>
      </div>

      <div className="menu-content">
        <div className="menu-actions">
          <button className="primary-button menu-cta" disabled={!online} onClick={onFindMatch}>
            ⚔ Find Match
          </button>
          <button className="secondary-button" onClick={onPracticeMatch}>
            🎯 Practice vs Bot
          </button>
          <div className="menu-row">
            <button className="menu-tile" onClick={onDeckBuilder}>
              🃏 Deck Builder
            </button>
            <button className="menu-tile" onClick={onStore}>
              🛒 Store
            </button>
          </div>
        </div>

        {!online && (
          <p className="menu-warning">
            Online multiplayer isn't configured yet — try Practice vs Bot instead.
          </p>
        )}

        <div className="objectives-card">
          <ObjectiveGroup title="Daily" objectives={daily} />
          <ObjectiveGroup title="Weekly" objectives={weekly} />
        </div>
      </div>
    </div>
  );
}

function ObjectiveGroup({
  title,
  objectives,
}: {
  title: string;
  objectives: ReturnType<typeof getObjectives>["daily"];
}) {
  return (
    <div className="objective-group">
      <div className="objective-group-title">{title}</div>
      {objectives.map((o) => (
        <div key={o.id} className={`objective-row${o.completed ? " done" : ""}`}>
          <span className="objective-label">
            {o.completed ? "✓" : "○"} {o.label}
          </span>
          <span className="objective-progress">
            {o.progress}/{o.target}
          </span>
        </div>
      ))}
    </div>
  );
}
