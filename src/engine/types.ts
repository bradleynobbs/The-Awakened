// Core typed models for the battle engine.
// The engine is pure data + pure functions: nothing here knows about
// rendering, animation, or React. See DESIGN.md for the rules these
// types encode.

export type PlayerId = "player1" | "player2";

export type HeroId =
  | "fire-mage"
  | "earth-guardian"
  | "water-healer"
  | "lightning-duelist"
  | "shadow-assassin";

export type Element = "fire" | "water" | "lightning" | "earth" | "shadow";

export type Role =
  | "Fighter"
  | "Defender"
  | "Support"
  | "Assassin"
  | "Controller"
  | "Mage";

export type TargetType =
  | "singleEnemy"
  | "singleAlly"
  | "allEnemies"
  | "twoEnemies";

export type CardKind = "attack" | "ability" | "teamup";

/** A unique instance id for a hero on the battlefield: `${ownerId}:${heroId}`. */
export type HeroInstanceId = string;

/** A unique instance id for a copy of a card sitting in a deck/hand/discard. */
export type CardInstanceId = string;

export interface StatusBurn {
  type: "burn";
  /** How many more start-of-turn ticks this Burn will deal before expiring. */
  remainingTriggers: number;
  damagePerTrigger: number;
}

export interface StatusWet {
  type: "wet";
}

export type StatusEffect = StatusBurn | StatusWet;

export interface HeroDefinition {
  id: HeroId;
  name: string;
  role: Role;
  element: Element;
  maxHp: number;
  startingShield: number;
  attack: CardDefinition;
  ability: CardDefinition;
  passive: {
    name: string;
    description: string;
  };
}

export interface TargetSelection {
  primaryTargetId?: HeroInstanceId;
  secondaryTargetId?: HeroInstanceId;
}

export interface CardResolveContext {
  state: MatchState;
  events: GameEvent[];
  playerId: PlayerId;
  /** The hero instance that owns/plays this card (undefined for team-ups). */
  sourceHeroInstanceId?: HeroInstanceId;
  targets: TargetSelection;
}

export interface CardDefinition {
  id: string;
  heroId: HeroId | "teamup";
  kind: CardKind;
  name: string;
  cost: number;
  targetType: TargetType;
  element: Element | "combined";
  description: string;
  /** Fixed, deterministic resolution. Mutates ctx.state and pushes ctx.events. */
  resolve: (ctx: CardResolveContext) => void;
}

export interface TeamUpDefinition extends CardDefinition {
  kind: "teamup";
  requiredHeroes: [HeroId, HeroId];
}

export interface HeroInstance {
  instanceId: HeroInstanceId;
  heroId: HeroId;
  ownerId: PlayerId;
  currentHp: number;
  maxHp: number;
  shield: number;
  statuses: StatusEffect[];
  isDefeated: boolean;
  /** Shadow Assassin passive: has this hero already taken its first reduced hit? */
  hasTakenFirstHit: boolean;
}

export interface CardInstance {
  instanceId: CardInstanceId;
  cardId: string;
  heroId: HeroId;
}

export interface PlayerState {
  id: PlayerId;
  heroIds: [HeroId, HeroId, HeroId];
  heroes: HeroInstance[];
  drawPile: CardInstanceId[];
  discardPile: CardInstanceId[];
  hand: CardInstanceId[];
  cardsById: Record<CardInstanceId, CardInstance>;
  energy: number;
  usedTeamUps: string[];
  hasUsedFirstHeal: boolean;
}

export type GameEventType =
  | "MATCH_STARTED"
  | "TURN_STARTED"
  | "CARDS_DRAWN"
  | "HAND_DISCARDED"
  | "ENERGY_SPENT"
  | "CARD_PLAYED"
  | "DAMAGE_DEALT"
  | "SHIELD_ABSORBED"
  | "HEAL_APPLIED"
  | "SHIELD_GAINED"
  | "STATUS_APPLIED"
  | "STATUS_REMOVED"
  | "STATUS_TRIGGERED"
  | "HERO_DEFEATED"
  | "TEAM_UP_AVAILABLE"
  | "TEAM_UP_TRIGGERED"
  | "TURN_ENDED"
  | "MATCH_ENDED";

export interface GameEvent {
  type: GameEventType;
  [key: string]: unknown;
}

export interface MatchState {
  players: Record<PlayerId, PlayerState>;
  activePlayerId: PlayerId;
  turnNumber: number;
  winnerId: PlayerId | null;
  isMatchOver: boolean;
  /** Full ordered history of every event since match start. */
  log: GameEvent[];
}
