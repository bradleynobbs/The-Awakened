import type { CardResolveContext, GameEvent, MatchState, StatusBurn } from "./types";
import { dealDamage } from "./combat";

/**
 * Resolves start-of-round Burn ticks for every hero on either side, in
 * fixed roster order (player1 then player2). There's no more "whose
 * turn" to key this off — see DESIGN.md 5.3.
 */
export function tickStartOfRoundStatuses(state: MatchState, events: GameEvent[]): void {
  for (const playerId of ["player1", "player2"] as const) {
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
}
