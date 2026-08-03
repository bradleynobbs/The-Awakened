import type {
  CardInstanceId,
  CardResolveContext,
  GameEvent,
  HeroId,
  HeroInstance,
  MatchState,
  PlayerId,
  PlayerState,
  TargetSelection,
} from "./types";
import { IllegalActionError } from "./errors";
import { HERO_DEFINITIONS } from "./heroes";
import { getCardDefinition } from "./cards";
import { TEAM_UP_DEFINITIONS } from "./teamups";
import { isTeamUpAvailable } from "./teamup";
import { validateTargets } from "./targeting";
import { buildDeck, discardPlayedCard, initialDrawPile } from "./deck";
import { beginPlayerTurn, endPlayerTurn } from "./turn";
import { otherPlayer } from "./combat";
import { type Rng } from "./rng";

export type HeroTrio = [HeroId, HeroId, HeroId];

function createPlayerState(id: PlayerId, heroIds: HeroTrio, rng: Rng): PlayerState {
  const cardsById = buildDeck(id, heroIds);
  const heroes: HeroInstance[] = heroIds.map((heroId) => {
    const def = HERO_DEFINITIONS[heroId];
    return {
      instanceId: `${id}:${heroId}`,
      heroId,
      ownerId: id,
      currentHp: def.maxHp,
      maxHp: def.maxHp,
      shield: def.startingShield,
      statuses: [],
      isDefeated: false,
      hasTakenFirstHit: false,
    };
  });

  return {
    id,
    heroIds,
    heroes,
    drawPile: initialDrawPile(cardsById, rng),
    discardPile: [],
    hand: [],
    cardsById,
    energy: 0,
    usedTeamUps: [],
    hasUsedFirstHeal: false,
  };
}

/** Creates a fresh match. Player 1 always acts first (see DESIGN.md 1.5). */
export function createMatch(
  player1HeroIds: HeroTrio,
  player2HeroIds: HeroTrio,
  rng: Rng = Math.random,
): MatchState {
  const events: GameEvent[] = [
    { type: "MATCH_STARTED", player1HeroIds, player2HeroIds },
  ];

  const state: MatchState = {
    players: {
      player1: createPlayerState("player1", player1HeroIds, rng),
      player2: createPlayerState("player2", player2HeroIds, rng),
    },
    activePlayerId: "player1",
    turnNumber: 0,
    winnerId: null,
    isMatchOver: false,
    log: [],
  };

  beginPlayerTurn(state, "player1", rng, events);
  state.log.push(...events);
  return state;
}

function assertActionable(state: MatchState, playerId: PlayerId): void {
  if (state.isMatchOver) {
    throw new IllegalActionError("The match has already ended.");
  }
  if (state.activePlayerId !== playerId) {
    throw new IllegalActionError("It is not this player's turn.");
  }
}

/** Plays a card from hand. Returns a new MatchState; does not mutate the input. */
export function playCard(
  inputState: MatchState,
  playerId: PlayerId,
  cardInstanceId: CardInstanceId,
  targets: TargetSelection = {},
): MatchState {
  assertActionable(inputState, playerId);

  const state = structuredClone(inputState);
  const events: GameEvent[] = [];
  const player = state.players[playerId];

  if (!player.hand.includes(cardInstanceId)) {
    throw new IllegalActionError("That card is not in hand.");
  }

  const cardInstance = player.cardsById[cardInstanceId];
  const cardDef = getCardDefinition(cardInstance.cardId);
  const sourceHero = player.heroes.find((h) => h.heroId === cardInstance.heroId);

  if (!sourceHero || sourceHero.isDefeated) {
    throw new IllegalActionError("The hero for this card has been defeated.");
  }
  if (player.energy < cardDef.cost) {
    throw new IllegalActionError("Not enough energy to play this card.");
  }

  validateTargets(state, playerId, cardDef, targets);

  player.energy -= cardDef.cost;
  events.push({ type: "ENERGY_SPENT", playerId, amount: cardDef.cost, remaining: player.energy });

  discardPlayedCard(player, cardInstanceId);
  events.push({
    type: "CARD_PLAYED",
    playerId,
    cardInstanceId,
    cardId: cardDef.id,
    cardName: cardDef.name,
    heroId: sourceHero.heroId,
    sourceHeroInstanceId: sourceHero.instanceId,
    targets,
  });

  const ctx: CardResolveContext = {
    state,
    events,
    playerId,
    sourceHeroInstanceId: sourceHero.instanceId,
    targets,
  };
  cardDef.resolve(ctx);

  state.log.push(...events);
  return state;
}

/** Plays a Team-Up card (always targets all living enemies). Returns a new MatchState. */
export function playTeamUp(
  inputState: MatchState,
  playerId: PlayerId,
  teamUpId: string,
): MatchState {
  assertActionable(inputState, playerId);

  const state = structuredClone(inputState);
  const events: GameEvent[] = [];
  const player = state.players[playerId];

  const teamUp = TEAM_UP_DEFINITIONS.find((t) => t.id === teamUpId);
  if (!teamUp) throw new IllegalActionError(`Unknown Team-Up: ${teamUpId}`);
  if (!isTeamUpAvailable(state, playerId, teamUp)) {
    throw new IllegalActionError("This Team-Up is not currently available.");
  }
  if (player.energy < teamUp.cost) {
    throw new IllegalActionError("Not enough energy for this Team-Up.");
  }

  player.energy -= teamUp.cost;
  events.push({ type: "ENERGY_SPENT", playerId, amount: teamUp.cost, remaining: player.energy });

  player.usedTeamUps.push(teamUp.id);
  events.push({
    type: "TEAM_UP_TRIGGERED",
    playerId,
    teamUpId: teamUp.id,
    teamUpName: teamUp.name,
    requiredHeroes: teamUp.requiredHeroes,
  });

  const ctx: CardResolveContext = { state, events, playerId, targets: {} };
  teamUp.resolve(ctx);

  state.log.push(...events);
  return state;
}

/** Ends the active player's turn, discarding their hand and starting the opponent's turn. */
export function endTurn(
  inputState: MatchState,
  playerId: PlayerId,
  rng: Rng = Math.random,
): MatchState {
  assertActionable(inputState, playerId);

  const state = structuredClone(inputState);
  const events: GameEvent[] = [];

  endPlayerTurn(state, playerId, events);
  if (!state.isMatchOver) {
    beginPlayerTurn(state, otherPlayer(playerId), rng, events);
  }

  state.log.push(...events);
  return state;
}
