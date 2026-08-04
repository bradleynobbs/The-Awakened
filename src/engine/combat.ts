import type {
  CardResolveContext,
  HeroInstance,
  HeroInstanceId,
  MatchState,
  PlayerId,
} from "./types";
import { IllegalActionError } from "./errors";

export function getHero(
  state: MatchState,
  instanceId: HeroInstanceId,
): HeroInstance {
  for (const player of Object.values(state.players)) {
    const hero = player.heroes.find((h) => h.instanceId === instanceId);
    if (hero) return hero;
  }
  throw new IllegalActionError(`Unknown hero instance: ${instanceId}`);
}

export function otherPlayer(playerId: PlayerId): PlayerId {
  return playerId === "player1" ? "player2" : "player1";
}

export function livingHeroes(
  state: MatchState,
  ownerId: PlayerId,
): HeroInstance[] {
  return state.players[ownerId].heroes.filter((h) => !h.isDefeated);
}

function hasBurn(hero: HeroInstance): boolean {
  return hero.statuses.some((s) => s.type === "burn");
}

/** Removes a defeated hero's cards from their owner's draw/discard/hand. */
function purgeDefeatedHeroCards(state: MatchState, hero: HeroInstance): void {
  const player = state.players[hero.ownerId];
  const belongsToDeadHero = (cardInstanceId: string) =>
    player.cardsById[cardInstanceId]?.heroId === hero.heroId;

  player.drawPile = player.drawPile.filter((id) => !belongsToDeadHero(id));
  player.discardPile = player.discardPile.filter(
    (id) => !belongsToDeadHero(id),
  );
  player.hand = player.hand.filter((id) => !belongsToDeadHero(id));
}

function checkVictory(ctx: CardResolveContext): void {
  const { state, events } = ctx;
  if (state.isMatchOver) return;
  for (const owner of ["player1", "player2"] as PlayerId[]) {
    const allDefeated = state.players[owner].heroes.every((h) => h.isDefeated);
    if (allDefeated) {
      const winnerId = otherPlayer(owner);
      state.isMatchOver = true;
      state.winnerId = winnerId;
      events.push({ type: "MATCH_ENDED", winnerId, loserId: owner });
      return;
    }
  }
}

export interface DealDamageOptions {
  targetId: HeroInstanceId;
  amount: number;
  sourceHeroInstanceId?: HeroInstanceId;
  /** Direct card hits count for Undead Assassin's passive; status ticks (Burn) do not. */
  isDirectHit?: boolean;
}

/** Applies fixed damage, resolving passives, shields, defeat, and victory. Returns actual HP lost. */
export function dealDamage(
  ctx: CardResolveContext,
  { targetId, amount, sourceHeroInstanceId, isDirectHit = true }: DealDamageOptions,
): number {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return 0;

  let total = amount;
  let firePassiveBonus = 0;
  let empowerBonus = 0;
  let charmReduction = 0;

  if (sourceHeroInstanceId) {
    const source = getHero(state, sourceHeroInstanceId);
    if (source.heroId === "fire-mage" && hasBurn(target)) {
      firePassiveBonus = 1;
      total += firePassiveBonus;
    }
    const empowerIdx = source.statuses.findIndex((s) => s.type === "empower");
    if (empowerIdx !== -1) {
      const empower = source.statuses[empowerIdx];
      empowerBonus = empower.type === "empower" ? empower.bonusDamage : 0;
      total += empowerBonus;
      source.statuses.splice(empowerIdx, 1);
    }
    const charmIdx = source.statuses.findIndex((s) => s.type === "charm");
    if (charmIdx !== -1) {
      const charm = source.statuses[charmIdx];
      charmReduction = charm.type === "charm" ? charm.damageReduction : 0;
      total = Math.max(1, total - charmReduction);
      source.statuses.splice(charmIdx, 1);
    }
    if (source.heroId === "charm-gunslinger" && target.statuses.some((s) => s.type === "charm")) {
      total += 1;
    }
  }

  let firstHitReduction = 0;
  if (isDirectHit && target.heroId === "undead-assassin" && !target.hasTakenFirstHit) {
    target.hasTakenFirstHit = true;
    firstHitReduction = Math.min(3, total - 1);
    total = Math.max(1, total - 3);
  }

  const shieldAbsorbed = Math.min(target.shield, total);
  target.shield -= shieldAbsorbed;
  const remaining = total - shieldAbsorbed;

  const wouldBeLethal = remaining >= target.currentHp;
  const cheatedDeath = wouldBeLethal && target.heroId === "spirit-mage" && !target.hasCheatedDeath;
  if (cheatedDeath) {
    target.currentHp = 1;
    target.hasCheatedDeath = true;
  } else {
    target.currentHp = Math.max(0, target.currentHp - remaining);
  }

  if (shieldAbsorbed > 0) {
    events.push({
      type: "SHIELD_ABSORBED",
      targetId,
      amount: shieldAbsorbed,
      remainingShield: target.shield,
    });
  }

  events.push({
    type: "DAMAGE_DEALT",
    targetId,
    sourceHeroInstanceId,
    amount: remaining,
    firePassiveBonus,
    empowerBonus,
    charmReduction,
    firstHitReduction,
    targetHpAfter: target.currentHp,
  });

  if (empowerBonus > 0 && sourceHeroInstanceId) {
    events.push({ type: "STATUS_REMOVED", targetId: sourceHeroInstanceId, status: "empower" });
  }
  if (charmReduction > 0 && sourceHeroInstanceId) {
    events.push({ type: "STATUS_REMOVED", targetId: sourceHeroInstanceId, status: "charm" });
  }
  if (cheatedDeath) {
    events.push({ type: "SURVIVED_LETHAL", targetId });
  }

  if (target.currentHp === 0 && !target.isDefeated) {
    target.isDefeated = true;
    purgeDefeatedHeroCards(state, target);
    events.push({ type: "HERO_DEFEATED", heroInstanceId: targetId, ownerId: target.ownerId });
    checkVictory(ctx);
  }

  return remaining;
}

export function healHero(
  ctx: CardResolveContext,
  targetId: HeroInstanceId,
  amount: number,
): void {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  const before = target.currentHp;
  target.currentHp = Math.min(target.maxHp, target.currentHp + amount);
  const healed = target.currentHp - before;
  events.push({ type: "HEAL_APPLIED", targetId, amount: healed });
}

export function addShield(
  ctx: CardResolveContext,
  targetId: HeroInstanceId,
  amount: number,
): void {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  target.shield += amount;
  events.push({ type: "SHIELD_GAINED", targetId, amount, totalShield: target.shield });
}

export function applyBurn(ctx: CardResolveContext, targetId: HeroInstanceId): void {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  const existing = target.statuses.find((s) => s.type === "burn");
  if (existing && existing.type === "burn") {
    existing.remainingTriggers = 2;
  } else {
    target.statuses.push({ type: "burn", remainingTriggers: 2, damagePerTrigger: 3 });
  }
  events.push({ type: "STATUS_APPLIED", targetId, status: "burn" });
}

export function applyWet(ctx: CardResolveContext, targetId: HeroInstanceId): void {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  if (target.statuses.some((s) => s.type === "wet")) return;
  target.statuses.push({ type: "wet" });
  events.push({ type: "STATUS_APPLIED", targetId, status: "wet" });
}

/** Buffs an ally's next damage-dealing action; overwrites rather than stacks, like Burn's refresh. */
export function applyEmpower(ctx: CardResolveContext, targetId: HeroInstanceId, bonusDamage: number): void {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  const existing = target.statuses.find((s) => s.type === "empower");
  if (existing && existing.type === "empower") {
    existing.bonusDamage = bonusDamage;
  } else {
    target.statuses.push({ type: "empower", bonusDamage });
  }
  events.push({ type: "STATUS_APPLIED", targetId, status: "empower" });
}

/** Debuffs an enemy's next damage-dealing action; overwrites rather than stacks, like Empower. */
export function applyCharm(ctx: CardResolveContext, targetId: HeroInstanceId, damageReduction: number): void {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  const existing = target.statuses.find((s) => s.type === "charm");
  if (existing && existing.type === "charm") {
    existing.damageReduction = damageReduction;
  } else {
    target.statuses.push({ type: "charm", damageReduction });
  }
  events.push({ type: "STATUS_APPLIED", targetId, status: "charm" });
}

function removeWet(ctx: CardResolveContext, targetId: HeroInstanceId): boolean {
  const { state, events } = ctx;
  const target = getHero(state, targetId);
  const idx = target.statuses.findIndex((s) => s.type === "wet");
  if (idx === -1) return false;
  target.statuses.splice(idx, 1);
  events.push({ type: "STATUS_REMOVED", targetId, status: "wet" });
  return true;
}

/**
 * Deals base damage to a target, adding the Spark bonus and consuming
 * Wet if present. When `triggerPassive` is set and the hit is Wet-boosted,
 * the Spark Duelist source gains its passive shield.
 */
export function dealSparkDamage(
  ctx: CardResolveContext,
  {
    targetId,
    baseDamage,
    bonusDamage,
    sourceHeroInstanceId,
    triggerPassive,
  }: {
    targetId: HeroInstanceId;
    baseDamage: number;
    bonusDamage: number;
    sourceHeroInstanceId?: HeroInstanceId;
    triggerPassive: boolean;
  },
): void {
  const { state } = ctx;
  const target = getHero(state, targetId);
  if (target.isDefeated) return;
  const isWet = target.statuses.some((s) => s.type === "wet");
  const amount = baseDamage + (isWet ? bonusDamage : 0);
  dealDamage(ctx, { targetId, amount, sourceHeroInstanceId });
  if (isWet) {
    removeWet(ctx, targetId);
    if (triggerPassive && sourceHeroInstanceId) {
      const source = getHero(state, sourceHeroInstanceId);
      if (source.heroId === "spark-duelist" && !source.isDefeated) {
        addShield(ctx, sourceHeroInstanceId, 2);
      }
    }
  }
}

/** Team-Up variant: removes Wet from every hit target without triggering hero passives. */
export function removeWetPublic(ctx: CardResolveContext, targetId: HeroInstanceId): boolean {
  return removeWet(ctx, targetId);
}
