import type { CardResolveContext, GameEvent, MatchState, PlayerId, StatusBurn } from "./types";
import { dealDamage } from "./combat";

/** Resolves start-of-turn Burn ticks for every one of `playerId`'s heroes, in roster order. */
export function tickStartOfTurnStatuses(
  state: MatchState,
  playerId: PlayerId,
  events: GameEvent[],
): void {
  const player = state.players[playerId];
  for (const hero of player.heroes) {
    if (hero.isDefeated) continue;
    const burn = hero.statuses.find((s): s is StatusBurn => s.type === "burn");
    if (!burn) continue;

    const ctx: CardResolveContext = { state, events, playerId, targets: {} };
    dealDamage(ctx, { targetId: hero.instanceId, amount: burn.damagePerTrigger, isDirectHit: false });
    events.push({ type: "STATUS_TRIGGERED", targetId: hero.instanceId, status: "burn", amount: burn.damagePerTrigger });

    if (state.isMatchOver) return;

    burn.remainingTriggers -= 1;
    if (burn.remainingTriggers <= 0) {
      hero.statuses = hero.statuses.filter((s) => s !== burn);
      events.push({ type: "STATUS_REMOVED", targetId: hero.instanceId, status: "burn" });
    }
  }
}
