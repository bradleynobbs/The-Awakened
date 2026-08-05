import type { TeamUpDefinition } from "./types";
import { applyBurn, applyWet, dealDamage, dealSparkDamage, getHero, livingHeroes, removeWetPublic } from "./combat";
import { otherPlayer } from "./combat";

/**
 * Inferna + Tydra.
 * Resolution order (see DESIGN.md 1.12): damage all enemies, then remove Wet
 * from anyone hit, then apply Burn to all enemies.
 */
export const steamSurge: TeamUpDefinition = {
  id: "steam-surge",
  heroId: "teamup",
  kind: "teamup",
  name: "Steam Surge",
  cost: 3,
  targetType: "allEnemies",
  element: "combined",
  description:
    "Inferna + Tydra: deal 6 damage to all enemies, remove Wet from anyone hit, then apply Burn to all enemies.",
  requiredHeroes: ["fire-mage", "water-healer"],
  resolve: (ctx) => {
    const enemyId = otherPlayer(ctx.playerId);
    for (const hero of livingHeroes(ctx.state, enemyId)) {
      const wasWet = hero.statuses.some((s) => s.type === "wet");
      dealDamage(ctx, { targetId: hero.instanceId, amount: 6 });
      if (wasWet) removeWetPublic(ctx, hero.instanceId);
      const stillAlive = !getHero(ctx.state, hero.instanceId).isDefeated;
      if (stillAlive) applyBurn(ctx, hero.instanceId);
    }
  },
};

/**
 * Tydra + Spark Duelist.
 * Resolution order (see DESIGN.md 1.12): apply Wet to all enemies, then deal
 * Spark damage (base + Wet bonus) to each, consuming the Wet just applied.
 */
export const thunderTide: TeamUpDefinition = {
  id: "thunder-tide",
  heroId: "teamup",
  kind: "teamup",
  name: "Thunder Tide",
  cost: 3,
  targetType: "allEnemies",
  element: "combined",
  description:
    "Tydra + Spark Duelist: apply Wet to all enemies, then deal 4 (+3 Wet bonus) Spark damage to each.",
  requiredHeroes: ["water-healer", "spark-duelist"],
  resolve: (ctx) => {
    const enemyId = otherPlayer(ctx.playerId);
    const targets = livingHeroes(ctx.state, enemyId).map((h) => h.instanceId);
    for (const targetId of targets) {
      applyWet(ctx, targetId);
    }
    for (const targetId of targets) {
      dealSparkDamage(ctx, {
        targetId,
        baseDamage: 4,
        bonusDamage: 3,
        triggerPassive: false,
      });
    }
  },
};

export const TEAM_UP_DEFINITIONS: TeamUpDefinition[] = [steamSurge, thunderTide];
