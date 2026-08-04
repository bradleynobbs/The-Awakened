import type {
  CardInstanceId,
  CardResolveContext,
  GameEvent,
  HeroId,
  HeroInstance,
  MatchState,
  PlayerId,
  PlayerState,
  QueuedAction,
  QueuedActionId,
  TargetSelection,
} from "./types";
import { IllegalActionError } from "./errors";
import { HERO_DEFINITIONS } from "./heroes";
import { getCardDefinition } from "./cards";
import { TEAM_UP_DEFINITIONS } from "./teamups";
import { isTeamUpAvailable } from "./teamup";
import { validateTargets } from "./targeting";
import { buildDeck, discardHand, initialDrawPile } from "./deck";
import { beginRound } from "./turn";
import { getHero } from "./combat";
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
    queuedActions: [],
    isReady: false,
  };
}

/**
 * Creates a fresh match. Both players plan and resolve every round
 * together — see DESIGN.md section 5 — so there's no "who goes first"
 * for the match itself; player1-first only still matters as the fixed
 * tie-break for interleaving a round's resolution order (DESIGN.md 5.2).
 */
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
    roundNumber: 0,
    winnerId: null,
    isMatchOver: false,
    log: [],
  };

  beginRound(state, rng, events);
  state.log.push(...events);
  return state;
}

function assertMatchActive(state: MatchState): void {
  if (state.isMatchOver) {
    throw new IllegalActionError("The match has already ended.");
  }
}

function assertCanEditQueue(state: MatchState, playerId: PlayerId): void {
  assertMatchActive(state);
  if (state.players[playerId].isReady) {
    throw new IllegalActionError("You've already readied up this round.");
  }
}

function teamUpCost(teamUpId: string): number {
  const teamUp = TEAM_UP_DEFINITIONS.find((t) => t.id === teamUpId);
  if (!teamUp) throw new IllegalActionError(`Unknown Team-Up: ${teamUpId}`);
  return teamUp.cost;
}

/** Queues a card from hand for this round's Fight phase. Returns a new MatchState. */
export function queueCard(
  inputState: MatchState,
  playerId: PlayerId,
  cardInstanceId: CardInstanceId,
  targets: TargetSelection = {},
): MatchState {
  assertCanEditQueue(inputState, playerId);

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
    throw new IllegalActionError("Not enough energy to queue this card.");
  }

  validateTargets(state, playerId, cardDef, targets);

  player.energy -= cardDef.cost;
  events.push({ type: "ENERGY_SPENT", playerId, amount: cardDef.cost, remaining: player.energy });

  player.hand = player.hand.filter((id) => id !== cardInstanceId);

  const action: QueuedAction = {
    id: cardInstanceId,
    playerId,
    kind: "card",
    cardInstanceId,
    sourceHeroInstanceId: sourceHero.instanceId,
    targets,
  };
  player.queuedActions.push(action);
  events.push({
    type: "ACTION_QUEUED",
    playerId,
    kind: "card",
    cardInstanceId,
    cardName: cardDef.name,
    heroId: sourceHero.heroId,
    sourceHeroInstanceId: sourceHero.instanceId,
    targets,
  });

  state.log.push(...events);
  return state;
}

/** Queues a Team-Up for this round's Fight phase. Returns a new MatchState. */
export function queueTeamUp(inputState: MatchState, playerId: PlayerId, teamUpId: string): MatchState {
  assertCanEditQueue(inputState, playerId);

  const state = structuredClone(inputState);
  const events: GameEvent[] = [];
  const player = state.players[playerId];

  const teamUp = TEAM_UP_DEFINITIONS.find((t) => t.id === teamUpId);
  if (!teamUp) throw new IllegalActionError(`Unknown Team-Up: ${teamUpId}`);
  if (player.queuedActions.some((a) => a.kind === "teamup" && a.teamUpId === teamUpId)) {
    throw new IllegalActionError("This Team-Up is already queued this round.");
  }
  if (!isTeamUpAvailable(state, playerId, teamUp)) {
    throw new IllegalActionError("This Team-Up is not currently available.");
  }
  if (player.energy < teamUp.cost) {
    throw new IllegalActionError("Not enough energy for this Team-Up.");
  }

  player.energy -= teamUp.cost;
  events.push({ type: "ENERGY_SPENT", playerId, amount: teamUp.cost, remaining: player.energy });

  const action: QueuedAction = {
    id: `teamup:${teamUpId}`,
    playerId,
    kind: "teamup",
    teamUpId,
    targets: {},
  };
  player.queuedActions.push(action);
  events.push({ type: "ACTION_QUEUED", playerId, kind: "teamup", teamUpId, teamUpName: teamUp.name });

  state.log.push(...events);
  return state;
}

/** Un-queues a previously queued action, refunding its energy (and returning a card to hand). */
export function unqueueAction(
  inputState: MatchState,
  playerId: PlayerId,
  queuedActionId: QueuedActionId,
): MatchState {
  assertCanEditQueue(inputState, playerId);

  const state = structuredClone(inputState);
  const events: GameEvent[] = [];
  const player = state.players[playerId];

  const index = player.queuedActions.findIndex((a) => a.id === queuedActionId);
  if (index === -1) throw new IllegalActionError("That action isn't queued.");
  const [action] = player.queuedActions.splice(index, 1);

  const cost = action.kind === "card" ? getCardDefinition(player.cardsById[action.cardInstanceId!].cardId).cost : teamUpCost(action.teamUpId!);
  player.energy += cost;
  events.push({ type: "ENERGY_REFUNDED", playerId, amount: cost, remaining: player.energy });

  if (action.kind === "card") {
    player.hand.push(action.cardInstanceId!);
  }
  events.push({ type: "ACTION_UNQUEUED", playerId, kind: action.kind, id: action.id });

  state.log.push(...events);
  return state;
}

/**
 * Marks a player ready. Once both players are ready, the round resolves
 * immediately (DESIGN.md 5.2) and, if the match isn't over, the next
 * round's planning phase begins automatically.
 */
export function setReady(inputState: MatchState, playerId: PlayerId, rng: Rng = Math.random): MatchState {
  assertMatchActive(inputState);

  const state = structuredClone(inputState);
  const events: GameEvent[] = [];
  state.players[playerId].isReady = true;
  events.push({ type: "PLAYER_READY", playerId });

  if (state.players.player1.isReady && state.players.player2.isReady) {
    resolveRound(state, rng, events);
  }

  state.log.push(...events);
  return state;
}

function interleavedQueue(state: MatchState): QueuedAction[] {
  const p1 = state.players.player1.queuedActions;
  const p2 = state.players.player2.queuedActions;
  const result: QueuedAction[] = [];
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    if (p1[i]) result.push(p1[i]);
    if (p2[i]) result.push(p2[i]);
  }
  return result;
}

function resolveRound(state: MatchState, rng: Rng, events: GameEvent[]): void {
  for (const action of interleavedQueue(state)) {
    if (state.isMatchOver) break;
    const player = state.players[action.playerId];

    if (action.kind === "card") {
      resolveQueuedCard(state, player, action, events);
    } else {
      resolveQueuedTeamUp(state, player, action, events);
    }
  }

  state.players.player1.queuedActions = [];
  state.players.player2.queuedActions = [];

  if (state.isMatchOver) return;

  events.push({ type: "ROUND_RESOLVED", roundNumber: state.roundNumber });
  discardHand(state.players.player1, events);
  discardHand(state.players.player2, events);
  beginRound(state, rng, events);
}

function resolveQueuedCard(state: MatchState, player: PlayerState, action: QueuedAction, events: GameEvent[]): void {
  const cardInstanceId = action.cardInstanceId!;
  const instance = player.cardsById[cardInstanceId];
  const cardDef = getCardDefinition(instance.cardId);
  const sourceHero = state.players[action.playerId].heroes.find(
    (h) => h.instanceId === action.sourceHeroInstanceId,
  )!;

  player.discardPile.push(cardInstanceId);

  if (sourceHero.isDefeated) {
    events.push({
      type: "ACTION_FIZZLED",
      playerId: action.playerId,
      kind: "card",
      cardInstanceId,
      reason: "source-defeated",
    });
    return;
  }

  let targets = action.targets;

  if (cardDef.targetType === "singleEnemy" || cardDef.targetType === "singleAlly") {
    if (getHero(state, targets.primaryTargetId!).isDefeated) {
      events.push({
        type: "ACTION_FIZZLED",
        playerId: action.playerId,
        kind: "card",
        cardInstanceId,
        reason: "target-defeated",
      });
      return;
    }
  }

  if (cardDef.targetType === "twoEnemies") {
    if (getHero(state, targets.primaryTargetId!).isDefeated) {
      events.push({
        type: "ACTION_FIZZLED",
        playerId: action.playerId,
        kind: "card",
        cardInstanceId,
        reason: "target-defeated",
      });
      return;
    }
    if (targets.secondaryTargetId && getHero(state, targets.secondaryTargetId).isDefeated) {
      events.push({
        type: "ACTION_FIZZLED",
        playerId: action.playerId,
        kind: "card",
        cardInstanceId,
        reason: "secondary-target-defeated",
      });
      targets = { primaryTargetId: targets.primaryTargetId };
    }
  }

  events.push({
    type: "CARD_PLAYED",
    playerId: action.playerId,
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
    playerId: action.playerId,
    sourceHeroInstanceId: sourceHero.instanceId,
    targets,
  };
  cardDef.resolve(ctx);
}

function resolveQueuedTeamUp(state: MatchState, player: PlayerState, action: QueuedAction, events: GameEvent[]): void {
  const teamUp = TEAM_UP_DEFINITIONS.find((t) => t.id === action.teamUpId)!;

  if (!isTeamUpAvailable(state, action.playerId, teamUp)) {
    events.push({
      type: "ACTION_FIZZLED",
      playerId: action.playerId,
      kind: "teamup",
      teamUpId: teamUp.id,
      reason: "required-hero-defeated",
    });
    return;
  }

  player.usedTeamUps.push(teamUp.id);
  events.push({
    type: "TEAM_UP_TRIGGERED",
    playerId: action.playerId,
    teamUpId: teamUp.id,
    teamUpName: teamUp.name,
    requiredHeroes: teamUp.requiredHeroes,
  });

  const ctx: CardResolveContext = { state, events, playerId: action.playerId, targets: {} };
  teamUp.resolve(ctx);
}
