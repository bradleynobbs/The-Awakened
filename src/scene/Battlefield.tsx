import { useMemo } from "react";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { GameEvent, HeroInstanceId, MatchState, PlayerId } from "../engine/types";
import { ELEMENT_SYMBOL } from "../ui/heroVisuals";
import { HeroSprite, type AnimCue } from "./HeroSprite";
import arenaBackground from "../assets/backgrounds/arena-rift.jpg";

interface BattlefieldProps {
  state: MatchState;
  /** Whichever team should render on the left, nearest the player — always "you", online. */
  myRole: PlayerId;
  activeEvent: GameEvent | null;
  targetablePlayerId: PlayerId | null;
  targetableHeroIds: HeroInstanceId[];
  selectedTargetIds: HeroInstanceId[];
  onSelectTarget: (heroId: HeroInstanceId) => void;
}

function cuesForEvent(event: GameEvent | null): Record<HeroInstanceId, AnimCue> {
  const cues: Record<HeroInstanceId, AnimCue> = {};
  if (!event) return cues;
  const e = event as Record<string, unknown>;

  switch (event.type) {
    case "CARD_PLAYED":
      if (e.sourceHeroInstanceId) cues[e.sourceHeroInstanceId as string] = "attacking";
      break;
    case "DAMAGE_DEALT":
      if ((e.amount as number) > 0) cues[e.targetId as string] = "hit";
      break;
    case "STATUS_TRIGGERED":
      cues[e.targetId as string] = "hit";
      break;
    case "HEAL_APPLIED":
      if ((e.amount as number) > 0) cues[e.targetId as string] = "healed";
      break;
    case "SHIELD_GAINED":
      cues[e.targetId as string] = "shielded";
      break;
  }
  return cues;
}

/** Which hero instance(s) the active event revolves around — used to give
 * that hero a brief spotlight highlight, replacing the old 3D camera dolly. */
function focusIdsForEvent(event: GameEvent | null): Set<HeroInstanceId> {
  const ids = new Set<HeroInstanceId>();
  if (!event) return ids;
  const e = event as Record<string, unknown>;
  for (const key of ["sourceHeroInstanceId", "targetId", "heroInstanceId"]) {
    const id = e[key] as string | undefined;
    if (id) ids.add(id);
  }
  return ids;
}

function Formation({
  state,
  playerId,
  facing,
  cues,
  focusIds,
  targetablePlayerId,
  targetableHeroIds,
  selectedTargetIds,
  onSelectTarget,
}: {
  state: MatchState;
  playerId: PlayerId;
  facing: 1 | -1;
  cues: Record<HeroInstanceId, AnimCue>;
  focusIds: Set<HeroInstanceId>;
  targetablePlayerId: PlayerId | null;
  targetableHeroIds: HeroInstanceId[];
  selectedTargetIds: HeroInstanceId[];
  onSelectTarget: (heroId: HeroInstanceId) => void;
}) {
  return (
    <div className={`formation ${facing === 1 ? "formation-left" : "formation-right"}`}>
      {state.players[playerId].heroes.map((hero) => {
        const def = HERO_DEFINITIONS[hero.heroId];
        return (
          <div key={hero.instanceId} className="hero-slot">
            <div className={`hero-plate${hero.isDefeated ? " defeated" : ""}`}>
              <div className="hero-plate-name">
                {ELEMENT_SYMBOL[def.element]} {def.name}
                <span className="hero-plate-speed" title="Speed — decides resolution order">
                  🏃{def.stats.speed}
                </span>
              </div>
              <div className="hero-plate-hpbar">
                <div
                  className="hero-plate-hpfill"
                  style={{ width: `${Math.max(0, (hero.currentHp / hero.maxHp) * 100)}%` }}
                />
              </div>
              <div className="hero-plate-stats">
                <span>
                  {hero.currentHp}/{hero.maxHp} HP
                </span>
                {hero.shield > 0 && <span className="badge shield">🛡{hero.shield}</span>}
              </div>
            </div>
            <HeroSprite
              hero={hero}
              facing={facing}
              cue={cues[hero.instanceId] ?? null}
              isTargetable={targetablePlayerId === playerId && targetableHeroIds.includes(hero.instanceId)}
              isSelectedTarget={selectedTargetIds.includes(hero.instanceId)}
              isFocused={focusIds.has(hero.instanceId)}
              onClick={() => onSelectTarget(hero.instanceId)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function Battlefield({
  state,
  myRole,
  activeEvent,
  targetablePlayerId,
  targetableHeroIds,
  selectedTargetIds,
  onSelectTarget,
}: BattlefieldProps) {
  const cues = useMemo(() => cuesForEvent(activeEvent), [activeEvent]);
  const focusIds = useMemo(() => focusIdsForEvent(activeEvent), [activeEvent]);
  const opponentRole: PlayerId = myRole === "player1" ? "player2" : "player1";

  return (
    <div className="battlefield-2d">
      <div className="battlefield-bg" style={{ backgroundImage: `url(${arenaBackground})` }} />
      <div className="battlefield-scrim" />
      <Formation
        state={state}
        playerId={myRole}
        facing={1}
        cues={cues}
        focusIds={focusIds}
        targetablePlayerId={targetablePlayerId}
        targetableHeroIds={targetableHeroIds}
        selectedTargetIds={selectedTargetIds}
        onSelectTarget={onSelectTarget}
      />
      <Formation
        state={state}
        playerId={opponentRole}
        facing={-1}
        cues={cues}
        focusIds={focusIds}
        targetablePlayerId={targetablePlayerId}
        targetableHeroIds={targetableHeroIds}
        selectedTargetIds={selectedTargetIds}
        onSelectTarget={onSelectTarget}
      />
    </div>
  );
}
