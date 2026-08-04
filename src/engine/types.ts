// Core typed models for the battle engine.
// The engine is pure data + pure functions: nothing here knows about
// rendering, animation, or React. See DESIGN.md for the rules these
// types encode.

export type PlayerId = "player1" | "player2";

export type HeroId =
  | "fire-mage"
  | "earth-guardian"
  | "water-healer"
  | "spark-duelist"
  | "undead-assassin"
  | "charm-gunslinger"
  | "spirit-mage";

export type Element = "fire" | "water" | "spark" | "earth" | "undead" | "charm" | "spirit";

export type Role =
  | "Mage"
  | "Brawler"
  | "Tank"
  | "Speedster"
  | "Gunslinger"
  | "Support";

export type TargetType =
  | "singleEnemy"
  | "singleAlly"
  | "allEnemies"
  | "allAllies"
  | "twoEnemies";

export type CardKind = "attack" | "ability" | "support" | "teamup";

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

export interface StatusEmpower {
  type: "empower";
  /** Bonus damage added to this hero's next damage-dealing action, then consumed. */
  bonusDamage: number;
}

export interface StatusCharmed {
  type: "charm";
  /** Damage subtracted (floor 1) from this hero's next damage-dealing action, then consumed. */
  damageReduction: number;
}

export type StatusEffect = StatusBurn | StatusWet | StatusEmpower | StatusCharmed;

/**
 * Secondary + Attack/Defense/Speed stats — see DESIGN.md §8. All resolved
 * deterministically (stat-vs-stat comparisons), never against the RNG.
 * Health lives separately as HeroDefinition.maxHp (unchanged since v1).
 */
export interface HeroStats {
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  evasion: number;
  /** Flat threshold value (not a %) — crits when >= CRIT_THRESHOLD. See §8.2. */
  criticalChance: number;
  /** % multiplier applied only when a crit triggers; 100 = no bonus. */
  criticalDamage: number;
  /** Added to this hero's controller's per-round energy budget while alive. */
  energy: number;
  /** Flat energy-cost discount on this hero's Ability/Support cards. */
  cooldownReduction: number;
  /** % multiplier on healing this hero casts; 100 = no bonus. */
  healingPower: number;
  /** % multiplier on Shield this hero grants; 100 = no bonus. */
  shieldStrength: number;
}

export interface HeroDefinition {
  id: HeroId;
  name: string;
  role: Role;
  element: Element;
  maxHp: number;
  startingShield: number;
  stats: HeroStats;
  attack: CardDefinition;
  ability: CardDefinition;
  /** A support card: heals or buffs an ally (or the whole team) rather than hitting an enemy. */
  support: CardDefinition;
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
  /** Undead Assassin passive: has this hero already taken its first reduced hit? */
  hasTakenFirstHit: boolean;
  /** Spirit Mage passive: has this hero already survived a lethal hit at 1 HP this match? */
  hasCheatedDeath: boolean;
}

export interface CardInstance {
  instanceId: CardInstanceId;
  cardId: string;
  heroId: HeroId;
}

/** A unique id for one queued-but-not-yet-resolved action within a round. */
export type QueuedActionId = string;

/**
 * A card or Team-Up a player has committed to for this round's Fight phase
 * but which hasn't resolved yet. See DESIGN.md section 5. Energy is already
 * deducted and (for cards) the card is already out of hand by the time one
 * of these exists — unqueueing reverses both.
 */
export interface QueuedAction {
  id: QueuedActionId;
  playerId: PlayerId;
  kind: "card" | "teamup";
  /** Set for kind "card". */
  cardInstanceId?: CardInstanceId;
  sourceHeroInstanceId?: HeroInstanceId;
  /** Set for kind "teamup". */
  teamUpId?: string;
  targets: TargetSelection;
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
  queuedActions: QueuedAction[];
  isReady: boolean;
}

export type GameEventType =
  | "MATCH_STARTED"
  | "ROUND_STARTED"
  | "CARDS_DRAWN"
  | "HAND_DISCARDED"
  | "ENERGY_SPENT"
  | "ENERGY_REFUNDED"
  | "ACTION_QUEUED"
  | "ACTION_UNQUEUED"
  | "ACTION_FIZZLED"
  | "PLAYER_READY"
  | "CARD_PLAYED"
  | "DAMAGE_DEALT"
  | "SHIELD_ABSORBED"
  | "HEAL_APPLIED"
  | "SHIELD_GAINED"
  | "STATUS_APPLIED"
  | "STATUS_REMOVED"
  | "STATUS_TRIGGERED"
  | "HERO_DEFEATED"
  | "SURVIVED_LETHAL"
  | "TEAM_UP_AVAILABLE"
  | "TEAM_UP_TRIGGERED"
  | "ROUND_RESOLVED"
  | "MATCH_ENDED";

export interface GameEvent {
  type: GameEventType;
  [key: string]: unknown;
}

export interface MatchState {
  players: Record<PlayerId, PlayerState>;
  /** Round number, starting at 1. Both players plan and resolve together each round — see DESIGN.md 5. */
  roundNumber: number;
  winnerId: PlayerId | null;
  isMatchOver: boolean;
  /** Full ordered history of every event since match start. */
  log: GameEvent[];
}
