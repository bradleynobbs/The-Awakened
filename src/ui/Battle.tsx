import { useMemo, useState } from "react";
import { getCardDefinition } from "../engine/cards";
import { livingHeroes, otherPlayer } from "../engine/combat";
import type { CardInstanceId, HeroInstanceId, MatchState, PlayerId, TargetSelection } from "../engine/types";
import { Battlefield } from "../scene/Battlefield";
import { useEventQueue } from "../scene/useEventQueue";
import { CardHand } from "./CardHand";
import { CombatLog } from "./CombatLog";
import { HUD } from "./HUD";
import { TeamUpBar } from "./TeamUpBar";

interface BattleProps {
  state: MatchState;
  pendingEvents: MatchState["log"];
  error: string | null;
  onClearError: () => void;
  onPlayCard: (playerId: PlayerId, cardInstanceId: CardInstanceId, targets?: TargetSelection) => void;
  onPlayTeamUp: (playerId: PlayerId, teamUpId: string) => void;
  onEndTurn: (playerId: PlayerId) => void;
}

export function Battle({
  state,
  pendingEvents,
  error,
  onClearError,
  onPlayCard,
  onPlayTeamUp,
  onEndTurn,
}: BattleProps) {
  const [armedCardId, setArmedCardId] = useState<CardInstanceId | null>(null);
  const [pendingTargets, setPendingTargets] = useState<TargetSelection>({});
  const activeEvent = useEventQueue(pendingEvents);
  const activePlayer = state.activePlayerId;

  const armedCardDef = armedCardId
    ? getCardDefinition(state.players[activePlayer].cardsById[armedCardId].cardId)
    : null;

  const targeting = useMemo(() => {
    if (!armedCardDef) return { playerId: null as PlayerId | null, heroIds: [] as HeroInstanceId[] };
    const targetPlayerId =
      armedCardDef.targetType === "singleAlly" ? activePlayer : otherPlayer(activePlayer);
    let heroIds = livingHeroes(state, targetPlayerId).map((h) => h.instanceId);
    if (armedCardDef.targetType === "twoEnemies" && pendingTargets.primaryTargetId) {
      heroIds = heroIds.filter((id) => id !== pendingTargets.primaryTargetId);
    }
    return { playerId: targetPlayerId, heroIds };
  }, [armedCardDef, activePlayer, state, pendingTargets]);

  const resetTargeting = () => {
    setArmedCardId(null);
    setPendingTargets({});
  };

  const handleCardClick = (cardInstanceId: CardInstanceId) => {
    const instance = state.players[activePlayer].cardsById[cardInstanceId];
    const cardDef = getCardDefinition(instance.cardId);
    if (cardDef.targetType === "allEnemies") {
      onPlayCard(activePlayer, cardInstanceId, {});
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
          onPlayCard(activePlayer, armedCardId, { primaryTargetId: heroInstanceId });
          resetTargeting();
        } else {
          setPendingTargets({ primaryTargetId: heroInstanceId });
        }
      } else {
        onPlayCard(activePlayer, armedCardId, {
          primaryTargetId: pendingTargets.primaryTargetId,
          secondaryTargetId: heroInstanceId,
        });
        resetTargeting();
      }
      return;
    }

    onPlayCard(activePlayer, armedCardId, { primaryTargetId: heroInstanceId });
    resetTargeting();
  };

  const selectedTargetIds = pendingTargets.primaryTargetId ? [pendingTargets.primaryTargetId] : [];

  return (
    <div className="battle-screen">
      <HUD
        state={state}
        onEndTurn={() => {
          resetTargeting();
          onEndTurn(activePlayer);
        }}
        onCancelTargeting={resetTargeting}
        isTargeting={Boolean(armedCardId)}
      />

      {error && (
        <div className="error-toast" onClick={onClearError}>
          {error}
        </div>
      )}

      <div className="battle-main">
        <Battlefield
          state={state}
          activeEvent={activeEvent}
          targetablePlayerId={targeting.playerId}
          targetableHeroIds={targeting.heroIds}
          selectedTargetIds={selectedTargetIds}
          onSelectTarget={handleSelectTarget}
        />
        <CombatLog state={state} />
      </div>

      <TeamUpBar state={state} playerId={activePlayer} onPlay={(id) => onPlayTeamUp(activePlayer, id)} />
      <CardHand state={state} playerId={activePlayer} armedCardId={armedCardId} onCardClick={handleCardClick} />
    </div>
  );
}
