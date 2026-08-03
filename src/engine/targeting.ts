import type { CardDefinition, MatchState, PlayerId, TargetSelection } from "./types";
import { IllegalActionError } from "./errors";
import { getHero, livingHeroes, otherPlayer } from "./combat";

/** Validates a target selection for a card before it is allowed to resolve. */
export function validateTargets(
  state: MatchState,
  playerId: PlayerId,
  card: CardDefinition,
  targets: TargetSelection,
): void {
  const enemyId = otherPlayer(playerId);

  switch (card.targetType) {
    case "allEnemies":
      return;

    case "singleEnemy": {
      const target = requireTarget(targets.primaryTargetId, "singleEnemy");
      const hero = getHero(state, target);
      if (hero.ownerId !== enemyId || hero.isDefeated) {
        throw new IllegalActionError("Target must be a living enemy hero.");
      }
      return;
    }

    case "singleAlly": {
      const target = requireTarget(targets.primaryTargetId, "singleAlly");
      const hero = getHero(state, target);
      if (hero.ownerId !== playerId || hero.isDefeated) {
        throw new IllegalActionError("Target must be a living allied hero.");
      }
      return;
    }

    case "twoEnemies": {
      const primary = requireTarget(targets.primaryTargetId, "twoEnemies primary");
      const primaryHero = getHero(state, primary);
      if (primaryHero.ownerId !== enemyId || primaryHero.isDefeated) {
        throw new IllegalActionError("Primary target must be a living enemy hero.");
      }
      const livingEnemyCount = livingHeroes(state, enemyId).length;
      if (livingEnemyCount >= 2) {
        if (!targets.secondaryTargetId) {
          throw new IllegalActionError("A second, different enemy target is required.");
        }
        if (targets.secondaryTargetId === primary) {
          throw new IllegalActionError("Primary and secondary targets must differ.");
        }
        const secondaryHero = getHero(state, targets.secondaryTargetId);
        if (secondaryHero.ownerId !== enemyId || secondaryHero.isDefeated) {
          throw new IllegalActionError("Secondary target must be a living enemy hero.");
        }
      } else if (targets.secondaryTargetId) {
        throw new IllegalActionError("Only one enemy remains; no secondary target allowed.");
      }
      return;
    }
  }
}

function requireTarget(id: string | undefined, label: string): string {
  if (!id) throw new IllegalActionError(`Missing required target: ${label}`);
  return id;
}
