import { useState } from "react";
import { HERO_LIST } from "../engine/heroes";
import { createTeamSelection, lockSelection, toggleHero } from "../engine/selection";
import type { TeamSelectionState } from "../engine/selection";
import type { HeroId, PlayerId } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_SYMBOL } from "./heroVisuals";
import type { HeroTrio } from "../engine/match";

const OFFERED: HeroId[] = HERO_LIST.map((h) => h.id);

interface HeroSelectionProps {
  onComplete: (player1: HeroTrio, player2: HeroTrio) => void;
}

type Phase = "player1" | "pass-device" | "player2" | "reveal";

export function HeroSelection({ onComplete }: HeroSelectionProps) {
  const [phase, setPhase] = useState<Phase>("player1");
  const [p1Selection, setP1Selection] = useState<TeamSelectionState>(() =>
    createTeamSelection("player1", OFFERED),
  );
  const [p2Selection, setP2Selection] = useState<TeamSelectionState>(() =>
    createTeamSelection("player2", OFFERED),
  );

  const activePlayer: PlayerId | null =
    phase === "player1" ? "player1" : phase === "player2" ? "player2" : null;
  const activeSelection = activePlayer === "player1" ? p1Selection : p2Selection;

  const handleToggle = (heroId: HeroId) => {
    if (!activePlayer) return;
    try {
      if (activePlayer === "player1") {
        setP1Selection(toggleHero(p1Selection, heroId));
      } else {
        setP2Selection(toggleHero(p2Selection, heroId));
      }
    } catch {
      // Selecting a 4th hero or an unavailable hero: ignored in the UI.
    }
  };

  const handleLockIn = () => {
    if (activePlayer === "player1") {
      setP1Selection(lockSelection(p1Selection));
      setPhase("pass-device");
    } else if (activePlayer === "player2") {
      setP2Selection(lockSelection(p2Selection));
      setPhase("reveal");
    }
  };

  if (phase === "pass-device") {
    return (
      <div className="selection-screen pass-device">
        <h1>Player 1's team is locked in.</h1>
        <p>Pass the device to Player 2. Player 1's picks stay hidden until both teams are revealed.</p>
        <button className="primary-button" onClick={() => setPhase("player2")}>
          I'm Player 2 — Continue
        </button>
      </div>
    );
  }

  if (phase === "reveal") {
    return (
      <div className="selection-screen reveal">
        <h1>Teams Revealed</h1>
        <div className="reveal-teams">
          <RevealTeam label="Player 1" heroIds={p1Selection.selected} />
          <RevealTeam label="Player 2" heroIds={p2Selection.selected} />
        </div>
        <button
          className="primary-button"
          onClick={() =>
            onComplete(p1Selection.selected as HeroTrio, p2Selection.selected as HeroTrio)
          }
        >
          Begin Battle
        </button>
      </div>
    );
  }

  return (
    <div className="selection-screen">
      <h1>{activePlayer === "player1" ? "Player 1" : "Player 2"}: Choose Your 3 Heroes</h1>
      <p className="selection-hint">
        Pick exactly 3 of the 5 heroes below. Once locked in, your team cannot change for the rest
        of the match.
      </p>
      <div className="hero-select-grid">
        {HERO_LIST.map((hero) => {
          const selected = activeSelection.selected.includes(hero.id);
          const index = activeSelection.selected.indexOf(hero.id);
          return (
            <button
              key={hero.id}
              className={`hero-select-card${selected ? " selected" : ""}`}
              style={{ borderColor: ELEMENT_COLOR[hero.element] }}
              onClick={() => handleToggle(hero.id)}
            >
              {selected && <span className="pick-badge">{index + 1}</span>}
              <span className="hero-symbol" style={{ color: ELEMENT_COLOR[hero.element] }}>
                {ELEMENT_SYMBOL[hero.element]}
              </span>
              <span className="hero-select-name">{hero.name}</span>
              <span className="hero-select-role">
                {hero.role} · {hero.element}
              </span>
              <span className="hero-select-hp">{hero.maxHp} HP</span>
              <span className="hero-select-passive">{hero.passive.description}</span>
            </button>
          );
        })}
      </div>
      <button
        className="primary-button"
        disabled={activeSelection.selected.length !== 3}
        onClick={handleLockIn}
      >
        Lock In Team ({activeSelection.selected.length}/3)
      </button>
    </div>
  );
}

function RevealTeam({ label, heroIds }: { label: string; heroIds: HeroId[] }) {
  return (
    <div className="reveal-team">
      <h2>{label}</h2>
      <ul>
        {heroIds.map((id) => {
          const hero = HERO_LIST.find((h) => h.id === id)!;
          return (
            <li key={id} style={{ color: ELEMENT_COLOR[hero.element] }}>
              {ELEMENT_SYMBOL[hero.element]} {hero.name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
