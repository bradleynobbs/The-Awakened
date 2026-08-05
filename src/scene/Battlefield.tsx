import { useMemo, type CSSProperties } from "react";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { GameEvent, HeroInstanceId, MatchState, PlayerId } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_SYMBOL, HERO_PORTRAIT, ROLE_ICON } from "../ui/heroVisuals";
import { HeroSprite, type AnimCue } from "./HeroSprite";
import arenaBackground from "../assets/backgrounds/arena-plaza.jpg";

/** Approximate torch positions in arena-plaza.jpg, as percentages of the
 * image so they track reasonably well under `background-size: cover`
 * regardless of container aspect (see App.css's battlefield atmosphere
 * comment). Four torches: the two foreground braziers on the outer
 * banners, and the two on the inner pillars. Slightly different
 * animation-delay per torch so they don't flicker in lockstep. */
const TORCH_POSITIONS: { left: string; top: string; delay: string }[] = [
  { left: "4%", top: "34%", delay: "0s" },
  { left: "34%", top: "34%", delay: "0.5s" },
  { left: "66%", top: "34%", delay: "0.9s" },
  { left: "96%", top: "34%", delay: "0.3s" },
];

/** Which health-bar color tier to show — a flat "always green" bar doesn't
 * communicate danger the way a game health bar should. */
function hpTier(currentHp: number, maxHp: number): "hp-high" | "hp-mid" | "hp-low" {
  const pct = maxHp > 0 ? currentHp / maxHp : 0;
  if (pct <= 0.25) return "hp-low";
  if (pct <= 0.5) return "hp-mid";
  return "hp-high";
}

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
      {state.players[playerId].heroes.map((hero) => (
        <div key={hero.instanceId} className="hero-slot">
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
      ))}
    </div>
  );
}

/** The name/HP/role/element status panel, now a persistent roster pinned
 * to the battlefield's outer edge (§9.19) instead of floating above each
 * moving sprite — "your" team's roster reads top-to-bottom on the far
 * left, the opponent's mirrored on the far right, both independent of
 * wherever the scattered formation actually put each fighter. */
function TeamRoster({
  state,
  playerId,
  side,
}: {
  state: MatchState;
  playerId: PlayerId;
  side: "ally" | "enemy";
}) {
  return (
    <div className={`team-roster team-roster-${side}`}>
      {state.players[playerId].heroes.map((hero) => {
        const def = HERO_DEFINITIONS[hero.heroId];
        const portrait = HERO_PORTRAIT[hero.heroId];
        return (
          <div
            key={hero.instanceId}
            className={`roster-entry${hero.isDefeated ? " defeated" : ""}`}
            style={{ "--element-color": ELEMENT_COLOR[def.element] } as CSSProperties}
          >
            <div className="roster-avatar">
              {portrait ? (
                <img src={portrait} alt={def.name} className="roster-avatar-img" />
              ) : (
                <img src={ROLE_ICON[def.role]} alt={def.role} className="roster-avatar-fallback-icon" />
              )}
            </div>
            <div className="roster-banner">
              <div className="roster-name-row">
                <span className="roster-name-text">{def.name}</span>
                <span className="roster-emblems">
                  <span className="roster-emblem-badge" title={def.role}>
                    <img className="roster-role-icon" src={ROLE_ICON[def.role]} alt={def.role} />
                  </span>
                  <span className="roster-emblem-badge" title={def.element}>
                    <span className="roster-element-icon">{ELEMENT_SYMBOL[def.element]}</span>
                  </span>
                </span>
              </div>
              <div className="roster-hpbar">
                <div
                  className={`roster-hpfill ${hpTier(hero.currentHp, hero.maxHp)}`}
                  style={{ width: `${Math.max(0, (hero.currentHp / hero.maxHp) * 100)}%` }}
                />
                <span className="roster-hptext">
                  {hero.currentHp}/{hero.maxHp}
                </span>
              </div>
            </div>
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
      <div className="battlefield-rift-glow" />
      {TORCH_POSITIONS.map((t, i) => (
        <div
          key={i}
          className="battlefield-torch-glow"
          style={{ left: t.left, top: t.top, animationDelay: t.delay }}
        />
      ))}
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
      <TeamRoster state={state} playerId={myRole} side="ally" />
      <TeamRoster state={state} playerId={opponentRole} side="enemy" />
    </div>
  );
}
