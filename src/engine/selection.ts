import type { HeroId, PlayerId } from "./types";
import { IllegalActionError } from "./errors";

export const HEROES_OFFERED = 7;
export const TEAM_SIZE = 3;

export interface TeamSelectionState {
  playerId: PlayerId;
  offered: HeroId[];
  selected: HeroId[];
  isLocked: boolean;
}

export function createTeamSelection(playerId: PlayerId, offered: HeroId[]): TeamSelectionState {
  if (offered.length !== HEROES_OFFERED) {
    throw new IllegalActionError(`Exactly ${HEROES_OFFERED} heroes must be offered.`);
  }
  return { playerId, offered, selected: [], isLocked: false };
}

/** Toggles a hero's selection on/off. Throws once locked, or when a 4th pick is attempted. */
export function toggleHero(state: TeamSelectionState, heroId: HeroId): TeamSelectionState {
  if (state.isLocked) {
    throw new IllegalActionError("Team selection is locked and cannot be changed.");
  }
  if (!state.offered.includes(heroId)) {
    throw new IllegalActionError("That hero was not offered to this player.");
  }

  if (state.selected.includes(heroId)) {
    return { ...state, selected: state.selected.filter((id) => id !== heroId) };
  }

  if (state.selected.length >= TEAM_SIZE) {
    throw new IllegalActionError(`Only ${TEAM_SIZE} heroes may be selected.`);
  }

  return { ...state, selected: [...state.selected, heroId] };
}

/** Locks the selection in. Once locked, the 3 chosen heroes cannot change for the rest of the match. */
export function lockSelection(state: TeamSelectionState): TeamSelectionState {
  if (state.selected.length !== TEAM_SIZE) {
    throw new IllegalActionError(`Exactly ${TEAM_SIZE} heroes must be selected before locking in.`);
  }
  return { ...state, isLocked: true };
}
