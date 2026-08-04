import { getCardDefinition } from "./cards";
import { livingHeroes, otherPlayer } from "./combat";
import type { Rng } from "./rng";
import { shuffle } from "./rng";
import type { CardInstanceId, MatchState, PlayerId, TargetSelection } from "./types";

export interface BotAction {
  cardInstanceId: CardInstanceId;
  targets: TargetSelection;
}

/**
 * Picks one action for a simple practice-mode opponent: the first
 * affordable, playable card in a shuffled hand, with a random valid
 * target. Returns null when nothing is playable, meaning the bot should
 * end its turn. Doesn't use Team-Ups — kept deliberately simple, this is
 * a punching bag for solo testing, not a serious AI.
 */
export function chooseBotAction(
  state: MatchState,
  role: PlayerId,
  rng: Rng = Math.random,
): BotAction | null {
  const player = state.players[role];
  const hand = shuffle(player.hand, rng);
  const enemyId = otherPlayer(role);

  for (const cardInstanceId of hand) {
    const instance = player.cardsById[cardInstanceId];
    const cardDef = getCardDefinition(instance.cardId);
    if (cardDef.cost > player.energy) continue;

    const sourceHero = player.heroes.find((h) => h.heroId === instance.heroId);
    if (!sourceHero || sourceHero.isDefeated) continue;

    switch (cardDef.targetType) {
      case "allEnemies":
      case "allAllies":
        return { cardInstanceId, targets: {} };

      case "singleEnemy": {
        const enemies = livingHeroes(state, enemyId);
        if (enemies.length === 0) continue;
        const target = enemies[Math.floor(rng() * enemies.length)];
        return { cardInstanceId, targets: { primaryTargetId: target.instanceId } };
      }

      case "singleAlly": {
        const allies = livingHeroes(state, role);
        if (allies.length === 0) continue;
        const target = allies[Math.floor(rng() * allies.length)];
        return { cardInstanceId, targets: { primaryTargetId: target.instanceId } };
      }

      case "twoEnemies": {
        const enemies = livingHeroes(state, enemyId);
        if (enemies.length === 0) continue;
        const primary = enemies[Math.floor(rng() * enemies.length)];
        const rest = enemies.filter((h) => h.instanceId !== primary.instanceId);
        if (rest.length === 0) {
          return { cardInstanceId, targets: { primaryTargetId: primary.instanceId } };
        }
        const secondary = rest[Math.floor(rng() * rest.length)];
        return {
          cardInstanceId,
          targets: { primaryTargetId: primary.instanceId, secondaryTargetId: secondary.instanceId },
        };
      }
    }
  }

  return null;
}
