import type { MatchState, PlayerId, TeamUpDefinition } from "./types";
import { TEAM_UP_DEFINITIONS } from "./teamups";

/** A Team-Up is available once both required heroes are on the roster and alive, and it hasn't been used. */
export function isTeamUpAvailable(
  state: MatchState,
  playerId: PlayerId,
  teamUp: TeamUpDefinition,
): boolean {
  const player = state.players[playerId];
  if (player.usedTeamUps.includes(teamUp.id)) return false;

  return teamUp.requiredHeroes.every((heroId) => {
    if (!player.heroIds.includes(heroId)) return false;
    const hero = player.heroes.find((h) => h.heroId === heroId);
    return hero !== undefined && !hero.isDefeated;
  });
}

export function availableTeamUps(state: MatchState, playerId: PlayerId): TeamUpDefinition[] {
  return TEAM_UP_DEFINITIONS.filter((teamUp) => isTeamUpAvailable(state, playerId, teamUp));
}

/** Team-Ups whose required heroes are all on the roster (alive or not) — used to show "why" one exists at all. */
export function rosterTeamUps(state: MatchState, playerId: PlayerId): TeamUpDefinition[] {
  const player = state.players[playerId];
  return TEAM_UP_DEFINITIONS.filter((teamUp) =>
    teamUp.requiredHeroes.every((heroId) => player.heroIds.includes(heroId)),
  );
}
