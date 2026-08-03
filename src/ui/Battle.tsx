import { useMemo, useState } from "react";
import { getCardDefinition } from "../engine/cards";
import { livingHeroes, otherPlayer } from "../engine/combat";
import type { CardInstanceId, HeroInstanceId, MatchState, PlayerId, TargetSelection } from "../engine/types";
import { Battlefield } from "../scene/Battlefield";
import { useEventQueue } from "../scene/useEventQueue";
import { CardHand } from "./CardHand";
import { CombatLog } from "./CombatLog";
import { LatestEventToast } from "./LatestEventToast";
import { TeamUpBar } from "./TeamUpBar";
import { TopBar } from "./TopBar";

interface BattleProps {
  state: MatchState;
  myRole: PlayerId;
  pendingEvents: MatchState["log"];
  error: string | null;
  onClearError: () => void;
  onPlayCard: (cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  onPlayTeamUp: (teamUpId: string) => void;
  onEndTurn: () => void;
  onLeave: () => void;
}

export function Battle({
  state,
  myRole,
  pendingEvents,
  error,
  onClearError,
  onPlayCard,
  onPlayTeamUp,
  onEndTurn,
  onLeave,
}: BattleProps) {
  const [armedCardId, setArmedCardId] = useState<CardInstanceId | null>(null);
  const [pendingTargets, setPendingTargets] = useState<TargetSelection>({});
  const [logOpen, setLogOpen] = useState(false);
  const activeEvent = useEventQueue(pendingEvents);
  const isMyTurn = state.activePlayerId === myRole;

  const armedCardDef = armedCardId
    ? getCardDefinition(state.players[myRole].cardsById[armedCardId].cardId)
    : null;

  const targeting = useMemo(() => {
    if (!armedCardDef || !isMyTurn) return { playerId: null as PlayerId | null, heroIds: [] as HeroInstanceId[] };
    const targetPlayerId = armedCardDef.targetType === "singleAlly" ? myRole : otherPlayer(myRole);
    let heroIds = livingHeroes(state, targetPlayerId).map((h) => h.instanceId);
    if (armedCardDef.targetType === "twoEnemies" && pendingTargets.primaryTargetId) {
      heroIds = heroIds.filter((id) => id !== pendingTargets.primaryTargetId);
    }
    return { playerId: targetPlayerId, heroIds };
  }, [armedCardDef, isMyTurn, myRole, state, pendingTargets]);

  const resetTargeting = () => {
    setArmedCardId(null);
    setPendingTargets({});
  };

  const handleCardClick = (cardInstanceId: CardInstanceId) => {
    if (!isMyTurn) return;
    const instance = state.players[myRole].cardsById[cardInstanceId];
    const cardDef = getCardDefinition(instance.cardId);
    if (cardDef.targetType === "allEnemies") {
      onPlayCard(cardInstanceId, {});
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
          onPlayCard(armedCardId, { primaryTargetId: heroInstanceId });
          resetTargeting();
        } else {
          setPendingTargets({ primaryTargetId: heroInstanceId });
        }
      } else {
        onPlayCard(armedCardId, {
          primaryTargetId: pendingTargets.primaryTargetId,
          secondaryTargetId: heroInstanceId,
        });
        resetTargeting();
      }
      return;
    }

    onPlayCard(armedCardId, { primaryTargetId: heroInstanceId });
    resetTargeting();
  };

  const selectedTargetIds = pendingTargets.primaryTargetId ? [pendingTargets.primaryTargetId] : [];

  return (
    <div className="battle-screen">
      <TopBar
        state={state}
        myRole={myRole}
        isMyTurn={isMyTurn}
        onLeave={onLeave}
        onToggleLog={() => setLogOpen(true)}
      />

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

      <TeamUpBar state={state} playerId={myRole} isMyTurn={isMyTurn} onPlay={onPlayTeamUp} />

      <div className="hand-tray">
        <CardHand
          state={state}
          playerId={myRole}
          isMyTurn={isMyTurn}
          armedCardId={armedCardId}
          onCardClick={handleCardClick}
        />
        {isMyTurn && (
          <button
            className={`end-turn-fab${armedCardId ? " cancel" : ""}`}
            onClick={() => {
              if (armedCardId) {
                resetTargeting();
              } else {
                onEndTurn();
              }
            }}
          >
            {armedCardId ? "Cancel" : "End Turn"}
          </button>
        )}
      </div>
    </div>
  );
}
