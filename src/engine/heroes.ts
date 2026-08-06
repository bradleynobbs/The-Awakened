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

// ---------- Second wave: one more hero per element (§9.20) ----------

const riptideStrike: CardDefinition = {
  id: "riptide-strike",
  heroId: "torrent",
  kind: "attack",
  name: "Riptide Strike",
  cost: 1,
  targetType: "singleEnemy",
  element: "water",
  description: "Deal 5 damage and apply Wet to one enemy.",
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    dealDamage(ctx, { targetId, amount: 5, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    applyWet(ctx, targetId);
  },
};

const undertow: CardDefinition = {
  id: "undertow",
  heroId: "torrent",
  kind: "ability",
  name: "Undertow",
  cost: 2,
  targetType: "singleAlly",
  element: "water",
  description: "Grant 7 Shield to one allied hero.",
  resolve: (ctx) => {
    addShield(ctx, ctx.targets.primaryTargetId!, 7);
  },
};

const tidalBarrier: CardDefinition = {
  id: "tidal-barrier",
  heroId: "torrent",
  kind: "support",
  name: "Tidal Barrier",
  cost: 2,
  targetType: "allAllies",
  element: "water",
  description: "Grant 3 Shield to every allied hero.",
  resolve: (ctx) => {
    for (const hero of livingHeroes(ctx.state, ctx.playerId)) {
      addShield(ctx, hero.instanceId, 3);
    }
  },
};

const staticSnipe: CardDefinition = {
  id: "static-snipe",
  heroId: "zera",
  kind: "attack",
  name: "Static Snipe",
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
    });
  },
};

const twinVolt: CardDefinition = {
  id: "twin-volt",
  heroId: "zera",
  kind: "ability",
  name: "Twin Volt",
  cost: 2,
  targetType: "twoEnemies",
  element: "spark",
  description: "Deal 4 damage to one enemy and 2 to another; each gets +3 and loses Wet if Wet.",
  resolve: (ctx) => {
    dealSparkDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      baseDamage: 4,
      bonusDamage: 3,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
    if (ctx.targets.secondaryTargetId) {
      dealSparkDamage(ctx, {
        targetId: ctx.targets.secondaryTargetId,
        baseDamage: 2,
        bonusDamage: 3,
        sourceHeroInstanceId: ctx.sourceHeroInstanceId,
      });
    }
  },
};

const focusedCharge: CardDefinition = {
  id: "focused-charge",
  heroId: "zera",
  kind: "support",
  name: "Focused Charge",
  cost: 2,
  targetType: "singleAlly",
  element: "spark",
  description: "Empower one ally: their next damage-dealing action deals +5 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 5);
  },
};

const verdantBolt: CardDefinition = {
  id: "verdant-bolt",
  heroId: "orin",
  kind: "attack",
  name: "Verdant Bolt",
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

const naturesWrath: CardDefinition = {
  id: "natures-wrath",
  heroId: "orin",
  kind: "ability",
  name: "Nature's Wrath",
  cost: 2,
  targetType: "allEnemies",
  element: "spirit",
  description: "Deal 3 damage to all enemy heroes.",
  resolve: (ctx) => {
    const enemyId = otherPlayer(ctx.playerId);
    for (const hero of livingHeroes(ctx.state, enemyId)) {
      dealDamage(ctx, { targetId: hero.instanceId, amount: 3, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    }
  },
};

const verdantWard: CardDefinition = {
  id: "verdant-ward",
  heroId: "orin",
  kind: "support",
  name: "Verdant Ward",
  cost: 2,
  targetType: "singleAlly",
  element: "spirit",
  description: "Heal one ally for 5.",
  resolve: (ctx) => {
    healHero(ctx, ctx.targets.primaryTargetId!, 5);
  },
};

const SORROW_SHIELD_BONUS_DAMAGE = 2;

const crushingFist: CardDefinition = {
  id: "crushing-fist",
  heroId: "sorrow",
  kind: "attack",
  name: "Crushing Fist",
  cost: 1,
  targetType: "singleEnemy",
  element: "earth",
  description: `Deal 5 damage to one enemy; +${SORROW_SHIELD_BONUS_DAMAGE} if they currently have Shield.`,
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    const target = getHero(ctx.state, targetId);
    const amount = 5 + (target.shield > 0 ? SORROW_SHIELD_BONUS_DAMAGE : 0);
    dealDamage(ctx, { targetId, amount, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
  },
};

const seismicSlam: CardDefinition = {
  id: "seismic-slam",
  heroId: "sorrow",
  kind: "ability",
  name: "Seismic Slam",
  cost: 2,
  targetType: "allEnemies",
  element: "earth",
  description: "Deal 3 damage to all enemy heroes.",
  resolve: (ctx) => {
    const enemyId = otherPlayer(ctx.playerId);
    for (const hero of livingHeroes(ctx.state, enemyId)) {
      dealDamage(ctx, { targetId: hero.instanceId, amount: 3, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    }
  },
};

const ironResolve: CardDefinition = {
  id: "iron-resolve",
  heroId: "sorrow",
  kind: "support",
  name: "Iron Resolve",
  cost: 2,
  targetType: "singleAlly",
  element: "earth",
  description: "Empower one ally: their next damage-dealing action deals +5 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 5);
  },
};

const boneCrush: CardDefinition = {
  id: "bone-crush",
  heroId: "kharos",
  kind: "attack",
  name: "Bone Crush",
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

const graveWard: CardDefinition = {
  id: "grave-ward",
  heroId: "kharos",
  kind: "ability",
  name: "Grave Ward",
  cost: 2,
  targetType: "singleAlly",
  element: "undead",
  description: "Grant 8 Shield to one allied hero.",
  resolve: (ctx) => {
    addShield(ctx, ctx.targets.primaryTargetId!, 8);
  },
};

const deathsVigil: CardDefinition = {
  id: "deaths-vigil",
  heroId: "kharos",
  kind: "support",
  name: "Death's Vigil",
  cost: 2,
  targetType: "allAllies",
  element: "undead",
  description: "Grant 3 Shield to every allied hero.",
  resolve: (ctx) => {
    for (const hero of livingHeroes(ctx.state, ctx.playerId)) {
      addShield(ctx, hero.instanceId, 3);
    }
  },
};

const emberNip: CardDefinition = {
  id: "ember-nip",
  heroId: "flint",
  kind: "attack",
  name: "Ember Nip",
  cost: 1,
  targetType: "singleEnemy",
  element: "fire",
  description: "Deal 3 damage and apply Burn (2 ticks, 3 damage each) to one enemy.",
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    dealDamage(ctx, { targetId, amount: 3, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
    applyBurn(ctx, targetId);
  },
};

const FLINT_REKINDLE_SHIELD = 2;

const rekindle: CardDefinition = {
  id: "rekindle",
  heroId: "flint",
  kind: "ability",
  name: "Rekindle",
  cost: 2,
  targetType: "singleAlly",
  element: "fire",
  description: `Heal one ally for 6 and grant ${FLINT_REKINDLE_SHIELD} Shield.`,
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    healHero(ctx, targetId, 6);
    addShield(ctx, targetId, FLINT_REKINDLE_SHIELD);
  },
};

const warmEmbrace: CardDefinition = {
  id: "warm-embrace",
  heroId: "flint",
  kind: "support",
  name: "Warm Embrace",
  cost: 2,
  targetType: "singleAlly",
  element: "fire",
  description: "Empower one ally: their next damage-dealing action deals +4 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 4);
  },
};

const heartpiercer: CardDefinition = {
  id: "heartpiercer",
  heroId: "erosalina",
  kind: "attack",
  name: "Heartpiercer",
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

const lovesSnare: CardDefinition = {
  id: "loves-snare",
  heroId: "erosalina",
  kind: "ability",
  name: "Love's Snare",
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

const roseVolley: CardDefinition = {
  id: "rose-volley",
  heroId: "erosalina",
  kind: "support",
  name: "Rose Volley",
  cost: 2,
  targetType: "singleAlly",
  element: "charm",
  description: "Empower one ally: their next damage-dealing action deals +5 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 5);
  },
};

const wolfsBite: CardDefinition = {
  id: "wolfs-bite",
  heroId: "rune",
  kind: "attack",
  name: "Wolf's Bite",
  cost: 1,
  targetType: "singleEnemy",
  element: "spirit",
  description: "Deal 3 damage to one enemy.",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 3,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
  },
};

const guidingSpirit: CardDefinition = {
  id: "guiding-spirit",
  heroId: "rune",
  kind: "ability",
  name: "Guiding Spirit",
  cost: 2,
  targetType: "singleAlly",
  element: "spirit",
  description: "Heal one ally for 6.",
  resolve: (ctx) => {
    healHero(ctx, ctx.targets.primaryTargetId!, 6);
  },
};

const eldersBlessing: CardDefinition = {
  id: "elders-blessing",
  heroId: "rune",
  kind: "support",
  name: "Elder's Blessing",
  cost: 2,
  targetType: "singleAlly",
  element: "spirit",
  description: "Empower one ally: their next damage-dealing action deals +4 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 4);
  },
};

const liveWire: CardDefinition = {
  id: "live-wire",
  heroId: "amp",
  kind: "attack",
  name: "Live Wire",
  cost: 1,
  targetType: "singleEnemy",
  element: "spark",
  description: "Deal 5 damage to one enemy.",
  resolve: (ctx) => {
    dealDamage(ctx, {
      targetId: ctx.targets.primaryTargetId!,
      amount: 5,
      sourceHeroInstanceId: ctx.sourceHeroInstanceId,
    });
  },
};

const AMP_OVERCHARGE_THRESHOLD_FRACTION = 0.3;
const AMP_OVERCHARGE_BONUS_DAMAGE = 6;

const overcharge: CardDefinition = {
  id: "overcharge",
  heroId: "amp",
  kind: "ability",
  name: "Overcharge",
  cost: 2,
  targetType: "singleEnemy",
  element: "spark",
  description: `Deal 4 damage; +${AMP_OVERCHARGE_BONUS_DAMAGE} if the target is at or below ${AMP_OVERCHARGE_THRESHOLD_FRACTION * 100}% max HP.`,
  resolve: (ctx) => {
    const targetId = ctx.targets.primaryTargetId!;
    const target = getHero(ctx.state, targetId);
    const isLowHealth = target.currentHp <= target.maxHp * AMP_OVERCHARGE_THRESHOLD_FRACTION;
    const amount = 4 + (isLowHealth ? AMP_OVERCHARGE_BONUS_DAMAGE : 0);
    dealDamage(ctx, { targetId, amount, sourceHeroInstanceId: ctx.sourceHeroInstanceId });
  },
};

const jolt: CardDefinition = {
  id: "jolt",
  heroId: "amp",
  kind: "support",
  name: "Jolt",
  cost: 2,
  targetType: "singleAlly",
  element: "spark",
  description: "Empower one ally: their next damage-dealing action deals +6 damage.",
  resolve: (ctx) => {
    applyEmpower(ctx, ctx.targets.primaryTargetId!, 6);
  },
};

const boulderToss: CardDefinition = {
  id: "boulder-toss",
  heroId: "cragor",
  kind: "attack",
  name: "Boulder Toss",
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

const fortressStance: CardDefinition = {
  id: "fortress-stance",
  heroId: "cragor",
  kind: "ability",
  name: "Fortress Stance",
  cost: 2,
  targetType: "singleAlly",
  element: "earth",
  description: "Grant 7 Shield to one allied hero.",
  resolve: (ctx) => {
    addShield(ctx, ctx.targets.primaryTargetId!, 7);
  },
};

const mountainsResolve: CardDefinition = {
  id: "mountains-resolve",
  heroId: "cragor",
  kind: "support",
  name: "Mountain's Resolve",
  cost: 2,
  targetType: "allAllies",
  element: "earth",
  description: "Grant 4 Shield to every allied hero.",
  resolve: (ctx) => {
    for (const hero of livingHeroes(ctx.state, ctx.playerId)) {
      addShield(ctx, hero.instanceId, 4);
    }
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
  "water-healer": {
    id: "water-healer",
    name: "Tydra",
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
    role: "Ranger",
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
  // ---------- Second wave: one more hero per element (§9.20) ----------
  torrent: {
    id: "torrent",
    name: "Torrent",
    role: "Tank",
    element: "water",
    maxHp: 26,
    startingShield: 5,
    stats: {
      attack: 0,
      defense: 4,
      speed: 3,
      accuracy: 100,
      evasion: 0,
      criticalChance: 0,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 130,
    },
    attack: riptideStrike,
    ability: undertow,
    support: tidalBarrier,
    passive: {
      name: "Riptide Wall",
      description: "Begins the match with 5 Shield.",
    },
  },
  zera: {
    id: "zera",
    name: "Zera",
    role: "Ranger",
    element: "spark",
    maxHp: 18,
    startingShield: 0,
    stats: {
      attack: 1,
      defense: 0,
      speed: 12,
      accuracy: 120,
      evasion: 12,
      criticalChance: 35,
      criticalDamage: 130,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: staticSnipe,
    ability: twinVolt,
    support: focusedCharge,
    passive: {
      name: "Storm Focus",
      description: "Extremely high Accuracy and Critical Chance make this hero's hits against Wet targets nearly impossible to avoid.",
    },
  },
  orin: {
    id: "orin",
    name: "Orin",
    role: "Mage",
    element: "spirit",
    maxHp: 17,
    startingShield: 0,
    stats: {
      attack: 2,
      defense: 0,
      speed: 9,
      accuracy: 105,
      evasion: 8,
      criticalChance: 10,
      criticalDamage: 105,
      energy: 1,
      cooldownReduction: 0,
      healingPower: 110,
      shieldStrength: 100,
    },
    attack: verdantBolt,
    ability: naturesWrath,
    support: verdantWard,
    passive: {
      name: "Deep Roots",
      description: "This hero's healing effects are 10% stronger.",
    },
  },
  sorrow: {
    id: "sorrow",
    name: "Sorrow",
    role: "Brawler",
    element: "earth",
    maxHp: 22,
    startingShield: 0,
    stats: {
      attack: 3,
      defense: 2,
      speed: 7,
      accuracy: 100,
      evasion: 5,
      criticalChance: 10,
      criticalDamage: 115,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: crushingFist,
    ability: seismicSlam,
    support: ironResolve,
    passive: {
      name: "Quarry Breaker",
      description: `Deals +${SORROW_SHIELD_BONUS_DAMAGE} damage to Shielded targets.`,
    },
  },
  kharos: {
    id: "kharos",
    name: "Kharos",
    role: "Tank",
    element: "undead",
    maxHp: 28,
    startingShield: 4,
    stats: {
      attack: 1,
      defense: 5,
      speed: 2,
      accuracy: 95,
      evasion: 0,
      criticalChance: 0,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 120,
    },
    attack: boneCrush,
    ability: graveWard,
    support: deathsVigil,
    passive: {
      name: "Undying",
      description: "Begins the match with 4 Shield.",
    },
  },
  flint: {
    id: "flint",
    name: "Flint",
    role: "Support",
    element: "fire",
    maxHp: 19,
    startingShield: 0,
    stats: {
      attack: 0,
      defense: 1,
      speed: 8,
      accuracy: 100,
      evasion: 8,
      criticalChance: 5,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 1,
      healingPower: 120,
      shieldStrength: 100,
    },
    attack: emberNip,
    ability: rekindle,
    support: warmEmbrace,
    passive: {
      name: "Hearth Guardian",
      description: `Rekindle also grants ${FLINT_REKINDLE_SHIELD} Shield to its target.`,
    },
  },
  erosalina: {
    id: "erosalina",
    name: "Erosalina",
    role: "Ranger",
    element: "charm",
    maxHp: 17,
    startingShield: 0,
    stats: {
      attack: 1,
      defense: 0,
      speed: 10,
      accuracy: 118,
      evasion: 12,
      criticalChance: 38,
      criticalDamage: 135,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: heartpiercer,
    ability: lovesSnare,
    support: roseVolley,
    passive: {
      name: "Piercing Heart",
      description: "This hero deals +1 damage to targets that are currently Charmed.",
    },
  },
  rune: {
    id: "rune",
    name: "Rune",
    role: "Support",
    element: "spirit",
    maxHp: 18,
    startingShield: 0,
    stats: {
      attack: 0,
      defense: 1,
      speed: 8,
      accuracy: 100,
      evasion: 8,
      criticalChance: 0,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 1,
      healingPower: 115,
      shieldStrength: 100,
    },
    attack: wolfsBite,
    ability: guidingSpirit,
    support: eldersBlessing,
    passive: {
      name: "Loyal Companion",
      description: "A spirit wolf watches over this hero's allies.",
    },
  },
  amp: {
    id: "amp",
    name: "Amp",
    role: "Speedster",
    element: "spark",
    maxHp: 15,
    startingShield: 0,
    stats: {
      attack: 1,
      defense: 0,
      speed: 14,
      accuracy: 105,
      evasion: 22,
      criticalChance: 20,
      criticalDamage: 120,
      energy: 0,
      cooldownReduction: 1,
      healingPower: 100,
      shieldStrength: 100,
    },
    attack: liveWire,
    ability: overcharge,
    support: jolt,
    passive: {
      name: "Live Current",
      description: "The first attack against this hero each match deals 3 less damage (min 1).",
    },
  },
  cragor: {
    id: "cragor",
    name: "Cragor",
    role: "Tank",
    element: "earth",
    maxHp: 27,
    startingShield: 6,
    stats: {
      attack: 0,
      defense: 4,
      speed: 3,
      accuracy: 100,
      evasion: 0,
      criticalChance: 0,
      criticalDamage: 100,
      energy: 0,
      cooldownReduction: 0,
      healingPower: 100,
      shieldStrength: 135,
    },
    attack: boulderToss,
    ability: fortressStance,
    support: mountainsResolve,
    passive: {
      name: "Mountain Skin",
      description: "Begins the match with 6 Shield.",
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
