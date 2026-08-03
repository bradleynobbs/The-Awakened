import { useState } from "react";
import { isTeamUpAvailable, rosterTeamUps } from "../engine/teamup";
import type { MatchState, PlayerId } from "../engine/types";

interface TeamUpBarProps {
  state: MatchState;
  playerId: PlayerId;
  isMyTurn: boolean;
  onPlay: (teamUpId: string) => void;
}

export function TeamUpBar({ state, playerId, isMyTurn, onPlay }: TeamUpBarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const teamUps = rosterTeamUps(state, playerId);
  if (teamUps.length === 0) return null;

  const player = state.players[playerId];

  return (
    <div className="teamup-bar">
      {teamUps.map((teamUp) => {
        const used = player.usedTeamUps.includes(teamUp.id);
        const available = isTeamUpAvailable(state, playerId, teamUp);
        const affordable = player.energy >= teamUp.cost;
        const playable = isMyTurn && available && affordable;
        const expanded = expandedId === teamUp.id;
        let reason = "";
        if (used) reason = "Already used this match";
        else if (!available) reason = "A required hero has been defeated";
        else if (!affordable) reason = `Needs ${teamUp.cost} energy`;

        return (
          <div key={teamUp.id} className={`teamup-pill${playable ? " ready" : " locked"}`}>
            <button
              className="teamup-pill-header"
              onClick={() => setExpandedId(expanded ? null : teamUp.id)}
            >
              <span>⚔ {teamUp.name}</span>
              <span className="teamup-cost">{teamUp.cost}⚡</span>
            </button>
            {expanded && (
              <div className="teamup-pill-details">
                <p>{teamUp.description}</p>
                {reason && <p className="teamup-reason">{reason}</p>}
                <button
                  className="teamup-play-button"
                  disabled={!playable}
                  onClick={() => {
                    if (!playable) return;
                    onPlay(teamUp.id);
                    setExpandedId(null);
                  }}
                >
                  Play
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
