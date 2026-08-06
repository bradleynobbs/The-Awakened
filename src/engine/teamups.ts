import type { TeamUpDefinition } from "./types";
import { applyBurn, dealDamage, getHero, livingHeroes, removeWetPublic } from "./combat";
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

export const TEAM_UP_DEFINITIONS: TeamUpDefinition[] = [steamSurge];
