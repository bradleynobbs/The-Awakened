import type { CardDefinition, HeroDefinition } from "./types";
import { addShield, dealDamage, dealLightningDamage, getHero, healHero, applyBurn, applyWet, livingHeroes } from "./combat";
import { otherPlayer } from "./combat";

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
  heroId: "lightning-duelist",
  kind: "attack",
  name: "Charged Slash",
  cost: 1,
  targetType: "singleEnemy",
  element: "lightning",
  description: "Deal 5 damage; +3 and remove Wet if the target is Wet.",
  resolve: (ctx) => {
    dealLightningDamage(ctx, {
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
  heroId: "lightning-duelist",
  kind: "ability",
  name: "Chain Spark",
  cost: 2,
  targetType: "twoEnemies",
  element: "lightning",
  description:
    "Deal 4 damage to one enemy and 2 to another; each gets +3 and loses Wet if Wet.",
  resolve: (ctx) => {
    dealLightningDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      baseDamage: 4,
      bonusDamage: 3,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
      triggerPassive: true,
    });
    if (ctx.targets.secondaryTargetId) {
      dealLightningDamage(ctx, {
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
  heroId: "shadow-assassin",
  kind: "attack",
  name: "Quick Strike",
  cost: 1,
  targetType: "singleEnemy",
  element: "shadow",
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
  heroId: "shadow-assassin",
  kind: "ability",
  name: "Execute",
  cost: 2,
  targetType: "singleEnemy",
  element: "shadow",
  description: `Deal 4 damage; +${EXECUTE_BONUS_DAMAGE} if the target is at or below ${EXECUTE_THRESHOLD_FRACTION * 100}% max HP.`,
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    const target = getHero(ctx.state, targetId);
    const isLowHealth = target.currentHp <= target.maxHp * EXECUTE_THRESHOLD_FRACTION;
    const amount = 4 + (isLowHealth ? EXECUTE_BONUS_DAMAGE : 0);
    dealDamage(ctx, { targetId, amount, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
  },
};

export const HERO_DEFINITIONS: Record<HeroDefinition["id"], HeroDefinition> = {
  "fire-mage": {
    id: "fire-mage",
    name: "Fire Mage",
    role: "Mage",
    element: "fire",
    maxHp: 18,
    startingShield: 0,
    attack: fireBolt,
    ability: flameWave,
    passive: {
      name: "Kindling Focus",
      description: "This hero deals +1 damage to targets that already have Burn.",
    },
  },
  "earth-guardian": {
    id: "earth-guardian",
    name: "Earth Guardian",
    role: "Defender",
    element: "earth",
    maxHp: 24,
    startingShield: 4,
    attack: stoneStrike,
    ability: fortify,
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
    attack: tidalShot,
    ability: restoringCurrent,
    passive: {
      name: "First Tide",
      description: "This player's first healing card each match restores 1 additional HP.",
    },
  },
  "lightning-duelist": {
    id: "lightning-duelist",
    name: "Lightning Duelist",
    role: "Fighter",
    element: "lightning",
    maxHp: 20,
    startingShield: 0,
    attack: chargedSlash,
    ability: chainSpark,
    passive: {
      name: "Storm Reflex",
      description: "Gains 2 Shield after triggering a Water + Lightning interaction.",
    },
  },
  "shadow-assassin": {
    id: "shadow-assassin",
    name: "Shadow Assassin",
    role: "Assassin",
    element: "shadow",
    maxHp: 16,
    startingShield: 0,
    attack: quickStrike,
    ability: execute,
    passive: {
      name: "Evasive Instinct",
      description: "The first attack against this hero each match deals 3 less damage (min 1).",
    },
  },
};

export const HERO_LIST: HeroDefinition[] = Object.values(HERO_DEFINITIONS);
