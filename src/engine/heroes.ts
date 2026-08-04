import type { CardDefinition, HeroDefinition, HeroId } from "./types";
import {
  addShield,
  applyBurn,
  applyCharm,
  applyEmpower,
  applyWet,
  dealDamage,
  dealSparkDamage,
  getHero,
  healHero,
  livingHeroes,
  otherPlayer,
  removeWetPublic,
} from "./combat";

const fireBolt: CardDefinition = {
  id: "fire-bolt",
  heroId: "fire-mage",
  kind: "attack",
  name: "Fire Bolt",
  cost: 1,
  targetType: "singleEnemy",
  element: "fire",
  description: "Deal 5 damage and apply Burn (2 ticks, 3 damage each).",
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    dealDamage(ctx, { targetId, amount: 5, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    applyBurn(ctx, targetId);
  },
};

const flameWave: CardDefinition = {
  id: "flame-wave",
  heroId: "fire-mage",
  kind: "ability",
  name: "Flame Wave",
  cost: 2,
  targetType: "allEnemies",
  element: "fire",
  description: "Deal 3 damage to all enemy heroes.",
  resolve: (ctx) => {
    const enemyId = otherPlayer(ctx.playerId);
    for (const hero of livingHeroes(ctx.state, enemyId)) {
      dealDamage(ctx, { targetId: hero.instanceId, amount: 3, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    }
  },
};

const stoneStrike: CardDefinition = {
  id: "stone-strike",
  heroId: "earth-guardian",
  kind: "attack",
  name: "Stone Strike",
  cost: 1,
  targetType: "singleEnemy",
  element: "earth",
  description: "Deal 5 damage to one enemy.",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 5,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
  },
};

const fortify: CardDefinition = {
  id: "fortify",
  heroId: "earth-guardian",
  kind: "ability",
  name: "Fortify",
  cost: 2,
  targetType: "singleAlly",
  element: "earth",
  description: "Grant 6 Shield to one allied hero.",
  resolve: (ctx) => {
    addShield(ctx, ctx.targets.primaryTargetId!, 6);
  },
};

const tidalShot: CardDefinition = {
  id: "tidal-shot",
  heroId: "water-healer",
  kind: "attack",
  name: "Tidal Shot",
  cost: 1,
  targetType: "singleEnemy",
  element: "water",
  description: "Deal 3 damage and apply Wet to one enemy.",
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    dealDamage(ctx, { targetId, amount: 3, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    applyWet(ctx, targetId);
  },
};

const restoringCurrent: CardDefinition = {
  id: "restoring-current",
  heroId: "water-healer",
  kind: "ability",
  name: "Restoring Current",
  cost: 2,
  targetType: "singleAlly",
  element: "water",
  description: "Heal one ally for 6 (7 on this player's first heal of the match).",
  resolve: (ctx) => {
    const player = ctx.state.players[ctx.playerId];
    const amount = player.hasUsedFirstHeal ? 6 : 7;
    healHero(ctx, ctx.targets.primaryTargetId!, amount);
    player.hasUsedFirstHeal = true;
  },
};

const chargedSlash: CardDefinition = {
  id: "charged-slash",
  heroId: "spark-duelist",
  kind: "attack",
  name: "Charged Slash",
  cost: 1,
  targetType: "singleEnemy",
  element: "spark",
  description: "Deal 5 damage; +3 and remove Wet if the target is Wet.",
  resolve: (ctx) => {
    dealSparkDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      baseDamage: 5,
      bonusDamage: 3,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
      triggerPassive: true,
    });
  },
};

const chainSpark: CardDefinition = {
  id: "chain-spark",
  heroId: "spark-duelist",
  kind: "ability",
  name: "Chain Spark",
  cost: 2,
  targetType: "twoEnemies",
  element: "spark",
  description:
    "Deal 4 damage to one enemy and 2 to another; each gets +3 and loses Wet if Wet.",
  resolve: (ctx) => {
    dealSparkDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      baseDamage: 4,
      bonusDamage: 3,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
      triggerPassive: true,
    });
    if (ctx.targets.secondaryTargetId) {
      dealSparkDamage(ctx, {
        targetId: ctx.targets.secondaryTargetId,
        baseDamage: 2,
        bonusDamage: 3,
        sourceHeroInstanceId: ctx.sourceHeroInstanceId,
        triggerPassive: true,
      });
    }
  },
};

const quickStrike: CardDefinition = {
  id: "quick-strike",
  heroId: "undead-assassin",
  kind: "attack",
  name: "Quick Strike",
  cost: 1,
  targetType: "singleEnemy",
  element: "undead",
  description: "Deal 5 damage to one enemy.",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 5,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
  },
};

const EXECUTE_THRESHOLD_FRACTION = 0.3;
const EXECUTE_BONUS_DAMAGE = 6;

const execute: CardDefinition = {
  id: "execute",
  heroId: "undead-assassin",
  kind: "ability",
  name: "Execute",
  cost: 2,
  targetType: "singleEnemy",
  element: "undead",
  description: `Deal 4 damage; +${EXECUTE_BONUS_DAMAGE} if the target is at or below ${EXECUTE_THRESHOLD_FRACTION * 100}% max HP.`,
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    const target = getHero(ctx.state, targetId);
    const isLowHealth = target.currentHp <= target.maxHp * EXECUTE_THRESHOLD_FRACTION;
    const amount = 4 + (isLowHealth ? EXECUTE_BONUS_DAMAGE : 0);
    dealDamage(ctx, { targetId, amount, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
  },
};

const kindleSpirit: CardDefinition = {
  id: "kindle-spirit",
  heroId: "fire-mage",
  kind: "support",
  name: "Kindle Spirit",
  cost: 2,
  targetType: "singleAlly",
  element: "fire",
  description: "Empower one ally: their next damage-dealing action deals +4 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 4);
  },
};

const guardiansWatch: CardDefinition = {
  id: "guardians-watch",
  heroId: "earth-guardian",
  kind: "support",
  name: "Guardian's Watch",
  cost: 2,
  targetType: "allAllies",
  element: "earth",
  description: "Grant 3 Shield to every allied hero.",
  resolve: (ctx) => {
    for (const hero of livingHeroes(ctx.state, ctx.playerId)) {
      addShield(ctx, hero.instanceId, 3);
    }
  },
};

const encouragingCurrent: CardDefinition = {
  id: "encouraging-current",
  heroId: "water-healer",
  kind: "support",
  name: "Encouraging Current",
  cost: 2,
  targetType: "singleAlly",
  element: "water",
  description: "Empower one ally: their next damage-dealing action deals +4 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 4);
  },
};

const staticCharge: CardDefinition = {
  id: "static-charge",
  heroId: "spark-duelist",
  kind: "support",
  name: "Static Charge",
  cost: 2,
  targetType: "singleAlly",
  element: "spark",
  description: "Empower one ally for +4 damage (+7 total and cleanses Wet, if they're currently Wet).",
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    const target = getHero(ctx.state, targetId);
    const isWet = target.statuses.some((s) => s.type === "wet");
    applyEmpower(ctx, targetId, isWet ? 7 : 4);
    if (isWet) removeWetPublic(ctx, targetId);
  },
};

const markedOpening: CardDefinition = {
  id: "marked-opening",
  heroId: "undead-assassin",
  kind: "support",
  name: "Marked Opening",
  cost: 2,
  targetType: "singleAlly",
  element: "undead",
  description: "Empower one ally: their next damage-dealing action deals +6 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 6);
  },
};

const quickdraw: CardDefinition = {
  id: "quickdraw",
  heroId: "charm-gunslinger",
  kind: "attack",
  name: "Quickdraw",
  cost: 1,
  targetType: "singleEnemy",
  element: "charm",
  description: "Deal 5 damage to one enemy (+1 if they're currently Charmed).",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 5,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
  },
};

const calledShot: CardDefinition = {
  id: "called-shot",
  heroId: "charm-gunslinger",
  kind: "ability",
  name: "Called Shot",
  cost: 2,
  targetType: "singleEnemy",
  element: "charm",
  description: "Deal 4 damage and Charm one enemy: their next damage-dealing action deals 3 less (min 1).",
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    dealDamage(ctx, { targetId, amount: 4, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    applyCharm(ctx, targetId, 3);
  },
};

const coverFire: CardDefinition = {
  id: "cover-fire",
  heroId: "charm-gunslinger",
  kind: "support",
  name: "Cover Fire",
  cost: 2,
  targetType: "singleAlly",
  element: "charm",
  description: "Empower one ally: their next damage-dealing action deals +5 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 5);
  },
};

const spiritBolt: CardDefinition = {
  id: "spirit-bolt",
  heroId: "spirit-mage",
  kind: "attack",
  name: "Spirit Bolt",
  cost: 1,
  targetType: "singleEnemy",
  element: "spirit",
  description: "Deal 4 damage to one enemy and heal this hero for 2.",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 4,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
    if (ctx.sourceHeroInstanceId) healHero(ctx, ctx.sourceHeroInstanceId, 2);
  },
};

const soulSiphon: CardDefinition = {
  id: "soul-siphon",
  heroId: "spirit-mage",
  kind: "ability",
  name: "Soul Siphon",
  cost: 2,
  targetType: "singleEnemy",
  element: "spirit",
  description: "Deal 6 damage to one enemy and heal this hero for 4.",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 6,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
    if (ctx.sourceHeroInstanceId) healHero(ctx, ctx.sourceHeroInstanceId, 4);
  },
};

const spiritWard: CardDefinition = {
  id: "spirit-ward",
  heroId: "spirit-mage",
  kind: "support",
  name: "Spirit Ward",
  cost: 2,
  targetType: "singleAlly",
  element: "spirit",
  description: "Heal one ally for 5.",
  resolve: (ctx) => {
    healHero(ctx, ctx.targets.primaryTargetId!, 5);
  },
};

export const HERO_DEFINITIONS: Record<HeroDefinition["id"], HeroDefinition> = {
  "fire-mage": {
    id: "fire-mage",
    name: "Inferna",
    role: "Mage",
    element: "fire",
    maxHp: 18,
    startingShield: 0,
    stats: {
      attack: 2,
      defense: 0,
      speed: 9,
      accuracy: 100,
      evasion: 5,
      criticalChance: 10,
      criticalDamage: 100,
      energy: 1,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: fireBolt,
    ability: flameWave,
    support: kindleSpirit,
    passive: {
      name: "Kindling Focus",
      description: "This hero deals +1 damage to targets that already have Burn.",
    },
  },
  "earth-guardian": {
    id: "earth-guardian",
    name: "Earth Guardian",
    role: "Tank",
    element: "earth",
    maxHp: 24,
    startingShield: 4,
    stats: {
      attack: 0,
      defense: 3,
      speed: 4,
      accuracy: 100,
      evasion: 0,
      criticalChance: 0,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 125,
    },
    attack: stoneStrike,
    ability: fortify,
    support: guardiansWatch,
    passive: {
      name: "Bulwark",
      description: "Begins the match with 4 Shield.",
    },
  },
  "water-healer": {
    id: "water-healer",
    name: "Water Healer",
    role: "Support",
    element: "water",
    maxHp: 20,
    startingShield: 0,
    stats: {
      attack: 0,
      defense: 1,
      speed: 7,
      accuracy: 100,
      evasion: 5,
      criticalChance: 0,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 1,
      healingPower: 130,
      shieldStrength: 100,
    },
    attack: tidalShot,
    ability: restoringCurrent,
    support: encouragingCurrent,
    passive: {
      name: "First Tide",
      description: "This player's first healing card each match restores 1 additional HP.",
    },
  },
  "spark-duelist": {
    id: "spark-duelist",
    name: "Spark Duelist",
    role: "Brawler",
    element: "spark",
    maxHp: 20,
    startingShield: 0,
    stats: {
      attack: 2,
      defense: 1,
      speed: 10,
      accuracy: 100,
      evasion: 10,
      criticalChance: 15,
      criticalDamage: 110,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: chargedSlash,
    ability: chainSpark,
    support: staticCharge,
    passive: {
      name: "Storm Reflex",
      description: "Gains 2 Shield after triggering a Water + Spark interaction.",
    },
  },
  "undead-assassin": {
    id: "undead-assassin",
    name: "Mourn",
    role: "Speedster",
    element: "undead",
    maxHp: 16,
    startingShield: 0,
    stats: {
      attack: 1,
      defense: 0,
      speed: 13,
      accuracy: 100,
      evasion: 25,
      criticalChance: 15,
      criticalDamage: 120,
      energy: 0,
      cooldownReduction: 1,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: quickStrike,
    ability: execute,
    support: markedOpening,
    passive: {
      name: "Evasive Instinct",
      description: "The first attack against this hero each match deals 3 less damage (min 1).",
    },
  },
  "charm-gunslinger": {
    id: "charm-gunslinger",
    name: "Kairo",
    role: "Gunslinger",
    element: "charm",
    maxHp: 17,
    startingShield: 0,
    stats: {
      attack: 1,
      defense: 0,
      speed: 11,
      accuracy: 115,
      evasion: 10,
      criticalChance: 40,
      criticalDamage: 140,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: quickdraw,
    ability: calledShot,
    support: coverFire,
    passive: {
      name: "Steady Aim",
      description: "This hero deals +1 damage to targets that are currently Charmed.",
    },
  },
  "spirit-mage": {
    id: "spirit-mage",
    name: "Spirit Mage",
    role: "Mage",
    element: "spirit",
    maxHp: 16,
    startingShield: 0,
    stats: {
      attack: 2,
      defense: 0,
      speed: 8,
      accuracy: 100,
      evasion: 8,
      criticalChance: 5,
      criticalDamage: 100,
      energy: 1,
      cooldownReduction: 0,
      healingPower: 110,
      shieldStrength: 100,
    },
    attack: spiritBolt,
    ability: soulSiphon,
    support: spiritWard,
    passive: {
      name: "Lingering Spirit",
      description: "The first time this hero would be defeated each match, they survive with 1 HP instead.",
    },
  },
};

export const HERO_LIST: HeroDefinition[] = Object.values(HERO_DEFINITIONS);

/**
 * A card's energy cost after its owning hero's Cooldown Reduction stat
 * (§8.2) — CDR only discounts Ability/Support cards, floored at 1 energy,
 * since Attack cards are already the cheapest tier and Team-Ups aren't
 * owned by a single hero.
 */
export function effectiveCardCost(card: CardDefinition, heroId: HeroId): number {
  if (card.kind === "attack" || card.kind === "teamup") return card.cost;
  const cdr = HERO_DEFINITIONS[heroId].stats.cooldownReduction;
  return Math.max(1, card.cost - cdr);
}
