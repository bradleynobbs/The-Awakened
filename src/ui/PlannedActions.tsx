import { getCardDefinition } from "../engine/cards";
import type { MatchState, PlayerId, QueuedActionId } from "../engine/types";

interface PlannedActionsProps {
  state: MatchState;
  myRole: PlayerId;
  canEdit: boolean;
  onUnqueue: (id: QueuedActionId) => void;
}

/** Shows only the local player's own queued actions — never the opponent's (blind planning, DESIGN.md 5.1). */
export function PlannedActions({ state, myRole, canEdit, onUnqueue }: PlannedActionsProps) {
  const queued = state.players[myRole].queuedActions;
  if (queued.length === 0) return null;

  return (
    <div className="planned-actions">
      <div className="planned-actions-label">Planned this round</div>
      <div className="planned-actions-list">
        {queued.map((action) => {
          const cardId = action.kind === "card" ? state.players[myRole].cardsById[action.cardInstanceId!].cardId : action.teamUpId!;
          const cardDef = getCardDefinition(cardId);
          return (
            <div key={action.id} className="planned-action-chip">
              <span>{cardDef.name}</span>
              {canEdit && (
                <button
                  className="planned-action-remove"
                  onClick={() => onUnqueue(action.id)}
                  aria-label={`Remove ${cardDef.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
