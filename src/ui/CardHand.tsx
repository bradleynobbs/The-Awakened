import { getCardDefinition } from "../engine/cards";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { CardInstanceId, MatchState, PlayerId } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_SYMBOL } from "./heroVisuals";

const TARGET_LABEL: Record<string, string> = {
  singleEnemy: "1 Enemy",
  singleAlly: "1 Ally",
  allEnemies: "All Enemies",
  twoEnemies: "2 Enemies",
};

interface CardHandProps {
  state: MatchState;
  playerId: PlayerId;
  canAct: boolean;
  armedCardId: CardInstanceId | null;
  onCardClick: (cardInstanceId: CardInstanceId) => void;
}

export function CardHand({ state, playerId, canAct, armedCardId, onCardClick }: CardHandProps) {
  const player = state.players[playerId];

  return (
    <div className="card-hand">
      {player.hand.map((cardInstanceId) => {
        const instance = player.cardsById[cardInstanceId];
        const cardDef = getCardDefinition(instance.cardId);
        const heroDef = HERO_DEFINITIONS[instance.heroId];
        const heroAlive = player.heroes.find((h) => h.heroId === instance.heroId && !h.isDefeated);
        const affordable = player.energy >= cardDef.cost;
        const playable = canAct && Boolean(heroAlive) && affordable;
        const armed = armedCardId === cardInstanceId;

        return (
          <button
            key={cardInstanceId}
            className={`hand-card${armed ? " armed" : ""}${!playable ? " unplayable" : ""}`}
            style={{ borderColor: heroDef ? ELEMENT_COLOR[heroDef.element] : "#888" }}
            onClick={() => playable && onCardClick(cardInstanceId)}
            disabled={!playable}
          >
            <div className="hand-card-top">
              <span className="hand-card-cost">{cardDef.cost}⚡</span>
              <span className="hand-card-element">
                {heroDef ? ELEMENT_SYMBOL[heroDef.element] : ""}
              </span>
            </div>
            <div className="hand-card-name">{cardDef.name}</div>
            <div className="hand-card-hero">{heroDef?.name}</div>
            <div className="hand-card-target">{TARGET_LABEL[cardDef.targetType]}</div>
            <div className="hand-card-desc">{cardDef.description}</div>
          </button>
        );
      })}
      {player.hand.length === 0 && <div className="hand-empty">Hand is empty.</div>}
    </div>
  );
}
