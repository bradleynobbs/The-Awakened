import { useEffect, useState } from "react";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { HeroTrio } from "../engine/match";
import { createTeamSelection, lockSelection, toggleHero } from "../engine/selection";
import type { TeamSelectionState } from "../engine/selection";
import type { HeroId } from "../engine/types";
import { DeckSlotCard } from "./DeckSlotCard";

interface BattlePrepProps {
  myDeck: HeroId[];
  /** Null until the opponent's deck has actually arrived — only ever
   * happens for online matches; practice mode's bot deck is generated
   * up front so this is never null there. */
  opponentDeck: HeroId[] | null;
  /** True once the underlying match actually exists (both players'
   * 3-fighter picks are resolved) — the cue to play the reveal
   * cinematic and then hand off to the battle screen. Deliberately a
   * prop rather than something this component decides for itself: the
   * match itself is created by usePracticeMatch/useOnlineMatch, not
   * here, so this is the one signal this component needs from them. */
  matchReady: boolean;
  /** Best-effort: the opponent's chosen 3, once known. Guaranteed
   * non-null by the time matchReady is true. */
  opponentPick: HeroTrio | null;
  onSubmitPick: (trio: HeroTrio) => void;
  onCinematicDone: () => void;
}

type Stage = "reveal" | "draft" | "waiting" | "cinematic";

/**
 * The "build 5, reveal 5, choose 3" flow (§9.46 — see DESIGN.md): both
 * players' full 5-hero decks are shown side by side, then each player
 * secretly drafts 3 of their own 5 to actually fight with, blind to
 * the opponent's draft, before a short reveal plays and the battle
 * begins. Reuses engine/selection.ts's TeamSelectionState for the
 * draft step itself — it's already exactly "pick exactly 3 from an
 * offered list, locking once done," just offered a 5-hero deck
 * instead of the full roster this time.
 */
export function BattlePrep({
  myDeck,
  opponentDeck,
  matchReady,
  opponentPick,
  onSubmitPick,
  onCinematicDone,
}: BattlePrepProps) {
  const [stage, setStage] = useState<Stage>("reveal");
  const [selection, setSelection] = useState<TeamSelectionState>(() => createTeamSelection("player1", myDeck));

  useEffect(() => {
    if (stage === "waiting" && matchReady) setStage("cinematic");
  }, [stage, matchReady]);

  useEffect(() => {
    if (stage !== "cinematic") return;
    const timer = setTimeout(onCinematicDone, 1600);
    return () => clearTimeout(timer);
  }, [stage, onCinematicDone]);

  const handleToggle = (heroId: HeroId) => {
    try {
      setSelection(toggleHero(selection, heroId));
    } catch {
      // Already 3 picked and this is a 4th: ignored, same convention as
      // the old hero-selection screen this replaces.
    }
  };

  const handleReady = () => {
    const locked = lockSelection(selection);
    setSelection(locked);
    const trio = locked.selected as HeroTrio;
    onSubmitPick(trio);
    setStage(opponentPick ? "cinematic" : "waiting");
  };

  if (stage === "reveal") {
    if (!opponentDeck) {
      return (
        <div className="selection-screen battle-prep-screen">
          <div className="spinner" />
          <h1 className="font-display">Battle Preparation</h1>
          <p className="selection-hint">Waiting for your opponent to reveal their deck…</p>
        </div>
      );
    }
    return (
      <div className="selection-screen battle-prep-screen">
        <h1 className="font-display">Battle Preparation</h1>
        <p className="selection-hint">
          Both decks are revealed before anyone picks. Study the enemy — you'll choose your 3
          fighters next.
        </p>
        <span className="battle-prep-deck-label">YOUR DECK</span>
        <div className="deck-slot-row battle-prep-deck-row">
          {myDeck.map((id) => (
            <DeckSlotCard key={id} hero={HERO_DEFINITIONS[id]} />
          ))}
        </div>
        <span className="battle-prep-vs">VS</span>
        <span className="battle-prep-deck-label">OPPONENT'S DECK</span>
        <div className="deck-slot-row battle-prep-deck-row">
          {opponentDeck.map((id) => (
            <DeckSlotCard key={id} hero={HERO_DEFINITIONS[id]} />
          ))}
        </div>
        <button className="primary-button" onClick={() => setStage("draft")}>
          Continue
        </button>
      </div>
    );
  }

  if (stage === "draft") {
    return (
      <div className="selection-screen battle-prep-screen">
        <h1 className="font-display">Select Your 3 Fighters</h1>
        <p className="selection-hint">
          Tap 3 of your 5 to bring into this battle. Your opponent is choosing at the same time,
          blind to your pick.
        </p>
        <div className="deck-slot-row battle-prep-draft-row">
          {myDeck.map((id) => (
            <DeckSlotCard
              key={id}
              hero={HERO_DEFINITIONS[id]}
              selected={selection.selected.includes(id)}
              onClick={() => handleToggle(id)}
            />
          ))}
        </div>
        <button className="primary-button" disabled={selection.selected.length !== 3} onClick={handleReady}>
          Ready ({selection.selected.length}/3)
        </button>
      </div>
    );
  }

  if (stage === "waiting") {
    return (
      <div className="selection-screen battle-prep-screen">
        <div className="spinner" />
        <h1 className="font-display">Fighters Locked In</h1>
        <p className="selection-hint">Waiting for your opponent to choose their fighters…</p>
      </div>
    );
  }

  // stage === "cinematic" — both picks are guaranteed known by now.
  const myTrio = selection.selected as HeroTrio;
  return (
    <div className="selection-screen battle-prep-screen battle-reveal-screen">
      <span className="battle-prep-deck-label">YOUR FIGHTERS</span>
      <div className="deck-slot-row battle-reveal-row">
        {myTrio.map((id, i) => (
          <div key={id} className="battle-reveal-card" style={{ animationDelay: `${i * 0.15}s` }}>
            <DeckSlotCard hero={HERO_DEFINITIONS[id]} />
          </div>
        ))}
      </div>
      <span className="battle-prep-vs">VS</span>
      <span className="battle-prep-deck-label">THEIR FIGHTERS</span>
      <div className="deck-slot-row battle-reveal-row">
        {(opponentPick ?? myTrio).map((id, i) => (
          <div key={id} className="battle-reveal-card" style={{ animationDelay: `${0.45 + i * 0.15}s` }}>
            <DeckSlotCard hero={HERO_DEFINITIONS[id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
