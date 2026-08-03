import { isTeamUpAvailable, rosterTeamUps } from "../engine/teamup";
import type { MatchState, PlayerId } from "../engine/types";

interface TeamUpBarProps {
  state: MatchState;
  playerId: PlayerId;
  onPlay: (teamUpId: string) => void;
}

export function TeamUpBar({ state, playerId, onPlay }: TeamUpBarProps) {
  const teamUps = rosterTeamUps(state, playerId);
  if (teamUps.length === 0) return null;

  const player = state.players[playerId];

  return (
    <div className="teamup-bar">
      {teamUps.map((teamUp) => {
        const used = player.usedTeamUps.includes(teamUp.id);
        const available = isTeamUpAvailable(state, playerId, teamUp);
        const affordable = player.energy >= teamUp.cost;
        const playable = available && affordable;
        let reason = "";
        if (used) reason = "Already used this match.";
        else if (!available) reason = "A required hero has been defeated.";
        else if (!affordable) reason = `Needs ${teamUp.cost} energy.`;

        return (
          <button
            key={teamUp.id}
            className={`teamup-card${playable ? " ready" : " locked"}`}
            disabled={!playable}
            onClick={() => playable && onPlay(teamUp.id)}
            title={reason}
          >
            <div className="teamup-name">
              ⚔ {teamUp.name} <span className="teamup-cost">{teamUp.cost}⚡</span>
            </div>
            <div className="teamup-desc">{teamUp.description}</div>
            {reason && <div className="teamup-reason">{reason}</div>}
          </button>
        );
      })}
    </div>
  );
}
