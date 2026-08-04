import { useMemo, useState } from "react";
import { getCardDefinition } from "../engine/cards";
import { livingHeroes, otherPlayer } from "../engine/combat";
import type {
  CardInstanceId,
  HeroInstanceId,
  MatchState,
  PlayerId,
  QueuedActionId,
  TargetSelection,
} from "../engine/types";
import { Battlefield } from "../scene/Battlefield";
import { useEventQueue } from "../scene/useEventQueue";
import { CardHand } from "./CardHand";
import { CombatLog } from "./CombatLog";
import { LatestEventToast } from "./LatestEventToast";
import { PlannedActions } from "./PlannedActions";
import { TeamUpBar } from "./TeamUpBar";
import { TopBar } from "./TopBar";

interface BattleProps {
  state: MatchState;
  myRole: PlayerId;
  pendingEvents: MatchState["log"];
  error: string | null;
  onClearError: () => void;
  onQueueCard: (cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  onQueueTeamUp: (teamUpId: string) => void;
  onUnqueueAction: (queuedActionId: QueuedActionId) => void;
  onReady: () => void;
  onLeave: () => void;
}

export function Battle({
  state,
  myRole,
  pendingEvents,
  error,
  onClearError,
  onQueueCard,
  onQueueTeamUp,
  onUnqueueAction,
  onReady,
  onLeave,
}: BattleProps) {
  const [armedCardId, setArmedCardId] = useState<CardInstanceId | null>(null);
  const [pendingTargets, setPendingTargets] = useState<TargetSelection>({});
  const [logOpen, setLogOpen] = useState(false);
  const activeEvent = useEventQueue(pendingEvents);
  const isReady = state.players[myRole].isReady;
  const canAct = !isReady;

  const armedCardDef = armedCardId
    ? getCardDefinition(state.players[myRole].cardsById[armedCardId].cardId)
    : null;

  const targeting = useMemo(() => {
    if (!armedCardDef || !canAct) return { playerId: null as PlayerId | null, heroIds: [] as HeroInstanceId[] };
    const targetPlayerId = armedCardDef.targetType === "singleAlly" ? myRole : otherPlayer(myRole);
    let heroIds = livingHeroes(state, targetPlayerId).map((h) => h.instanceId);
    if (armedCardDef.targetType === "twoEnemies" && pendingTargets.primaryTargetId) {
      heroIds = heroIds.filter((id) => id !== pendingTargets.primaryTargetId);
    }
    return { playerId: targetPlayerId, heroIds };
  }, [armedCardDef, canAct, myRole, state, pendingTargets]);

  const resetTargeting = () => {
    setArmedCardId(null);
    setPendingTargets({});
  };

  const handleCardClick = (cardInstanceId: CardInstanceId) => {
    if (!canAct) return;
    const instance = state.players[myRole].cardsById[cardInstanceId];
    const cardDef = getCardDefinition(instance.cardId);
    if (cardDef.targetType === "allEnemies") {
      onQueueCard(cardInstanceId, {});
      return;
    }
    setArmedCardId(cardInstanceId);
    setPendingTargets({});
  };

  const handleSelectTarget = (heroInstanceId: HeroInstanceId) => {
    if (!armedCardId || !armedCardDef) return;

    if (armedCardDef.targetType === "twoEnemies") {
      if (!pendingTargets.primaryTargetId) {
        const remaining = targeting.heroIds.filter((id) => id !== heroInstanceId);
        if (remaining.length === 0) {
          onQueueCard(armedCardId, { primaryTargetId: heroInstanceId });
          resetTargeting();
        } else {
          setPendingTargets({ primaryTargetId: heroInstanceId });
        }
      } else {
        onQueueCard(armedCardId, {
          primaryTargetId: pendingTargets.primaryTargetId,
          secondaryTargetId: heroInstanceId,
        });
        resetTargeting();
      }
      return;
    }

    onQueueCard(armedCardId, { primaryTargetId: heroInstanceId });
    resetTargeting();
  };

  const selectedTargetIds = pendingTargets.primaryTargetId ? [pendingTargets.primaryTargetId] : [];

  return (
    <div className="battle-screen">
      <TopBar state={state} myRole={myRole} isReady={isReady} onLeave={onLeave} onToggleLog={() => setLogOpen(true)} />

      {error && (
        <div className="error-toast" onClick={onClearError}>
          {error}
        </div>
      )}

      <div className="battle-main">
        <Battlefield
          state={state}
          myRole={myRole}
          activeEvent={activeEvent}
          targetablePlayerId={targeting.playerId}
          targetableHeroIds={targeting.heroIds}
          selectedTargetIds={selectedTargetIds}
          onSelectTarget={handleSelectTarget}
        />
        <LatestEventToast state={state} myRole={myRole} />
      </div>

      <CombatLog state={state} myRole={myRole} open={logOpen} onClose={() => setLogOpen(false)} />

      <PlannedActions state={state} myRole={myRole} canEdit={canAct} onUnqueue={onUnqueueAction} />

      <TeamUpBar state={state} playerId={myRole} canAct={canAct} onQueue={onQueueTeamUp} />

      <div className="hand-tray">
        <CardHand state={state} playerId={myRole} canAct={canAct} armedCardId={armedCardId} onCardClick={handleCardClick} />
        {canAct && (
          <button
            className={`end-turn-fab${armedCardId ? " cancel" : ""}`}
            onClick={() => {
              if (armedCardId) {
                resetTargeting();
              } else {
                onReady();
              }
            }}
          >
            {armedCardId ? "Cancel" : "Fight!"}
          </button>
        )}
      </div>
    </div>
  );
}
