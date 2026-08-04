import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { Element, HeroId, HeroInstance, Role } from "../engine/types";
import { ELEMENT_COLOR } from "../ui/heroVisuals";
import { HERO_COSMETICS } from "./heroCosmetics";

export type AnimCue = "attacking" | "hit" | "healed" | "shielded" | null;

interface HeroSpriteProps {
  hero: HeroInstance;
  /** 1 = faces right (drawn as-is), -1 = faces left (mirrored). Also the
   * lunge/attack direction, so allies (facing 1) lunge right toward the
   * enemy column and enemies (facing -1) lunge left toward the ally one. */
  facing: 1 | -1;
  cue: AnimCue;
  isTargetable: boolean;
  isSelectedTarget: boolean;
  isFocused: boolean;
  onClick: () => void;
}

const FLASH_CLASS: Record<Exclude<AnimCue, null | "attacking">, string> = {
  hit: "flash-hit",
  healed: "flash-heal",
  shielded: "flash-shield",
};

// ---------- shared chassis (every hero stands on the same skeleton; only
// torso size, colors, hair, and gear vary) — a flat, thick-outlined
// "Brawl-Stars-ish" cartoon body drawn once in side profile facing right,
// then mirrored per-instance via a CSS transform for facing left. ----------
const GROUND_Y = 190;
const LEG_HEIGHT = 54;
const LEG_TOP_Y = GROUND_Y - LEG_HEIGHT;
const TORSO_CENTER_X = 68;
const HEAD_RADIUS = 25;

const TORSO_WIDTH: Record<Role, number> = {
  Mage: 38,
  Support: 40,
  Tank: 56,
  Brawler: 46,
  Speedster: 36,
  Gunslinger: 42,
};
const TORSO_HEIGHT: Record<Role, number> = {
  Mage: 74,
  Support: 70,
  Tank: 78,
  Brawler: 74,
  Speedster: 66,
  Gunslinger: 72,
};

const OUTLINE = "#14121c";
const OUTLINE_W = 4;

interface Chassis {
  torsoTop: number;
  torsoBottom: number;
  torsoLeft: number;
  torsoRight: number;
  headCx: number;
  headCy: number;
  frontHandX: number;
  frontHandY: number;
  backHandX: number;
  backHandY: number;
}

function buildChassis(role: Role): Chassis {
  const width = TORSO_WIDTH[role];
  const height = TORSO_HEIGHT[role];
  const torsoBottom = LEG_TOP_Y;
  const torsoTop = torsoBottom - height;
  return {
    torsoTop,
    torsoBottom,
    torsoLeft: TORSO_CENTER_X - width / 2,
    torsoRight: TORSO_CENTER_X + width / 2,
    headCx: TORSO_CENTER_X + 6,
    headCy: torsoTop - HEAD_RADIUS - 5,
    frontHandX: TORSO_CENTER_X + width / 2 + 34,
    frontHandY: torsoTop + 18,
    backHandX: TORSO_CENTER_X - width / 2 - 6,
    backHandY: torsoTop + 40,
  };
}

/** Per-hero hair silhouette, drawn in the same facing-right space as the body. */
function Hair({ heroId, c }: { heroId: HeroId; c: Chassis }) {
  const { hair } = HERO_COSMETICS[heroId];
  switch (heroId) {
    case "fire-mage":
      return (
        <>
          {/* swept fringe */}
          <path
            d={`M ${c.headCx - 20} ${c.headCy - 8} Q ${c.headCx - 4} ${c.headCy - 30} ${c.headCx + 14} ${c.headCy - 18} Q ${c.headCx} ${c.headCy - 6} ${c.headCx - 18} ${c.headCy + 2} Z`}
            fill={hair}
            stroke={OUTLINE}
            strokeWidth={OUTLINE_W}
            strokeLinejoin="round"
          />
          {/* bun at the back */}
          <circle cx={c.headCx - 22} cy={c.headCy - 14} r={11} fill={hair} stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        </>
      );
    case "earth-guardian":
      return (
        <path
          d={`M ${c.headCx - 22} ${c.headCy - 2} Q ${c.headCx} ${c.headCy - 32} ${c.headCx + 22} ${c.headCy - 4} Q ${c.headCx} ${c.headCy - 16} ${c.headCx - 22} ${c.headCy - 2} Z`}
          fill={hair}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_W}
          strokeLinejoin="round"
        />
      );
    case "water-healer":
      return (
        <path
          d={`M ${c.headCx - 24} ${c.headCy - 10} Q ${c.headCx - 2} ${c.headCy - 34} ${c.headCx + 20} ${c.headCy - 10}
              Q ${c.headCx + 6} ${c.headCy + 20} ${c.headCx - 14} ${c.headCy + 46}
              Q ${c.headCx - 30} ${c.headCy + 20} ${c.headCx - 24} ${c.headCy - 10} Z`}
          fill={hair}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_W}
          strokeLinejoin="round"
        />
      );
    case "spark-duelist":
      return (
        <>
          {[-1, 0, 1].map((i) => (
            <path
              key={i}
              d={`M ${c.headCx + i * 9 - 5} ${c.headCy - 12} L ${c.headCx + i * 9} ${c.headCy - 30 + Math.abs(i) * 8} L ${c.headCx + i * 9 + 5} ${c.headCy - 12} Z`}
              fill={hair}
              stroke={OUTLINE}
              strokeWidth={OUTLINE_W}
              strokeLinejoin="round"
            />
          ))}
        </>
      );
    case "undead-assassin":
      // Mostly covered by the hood (RoleGear); just a dark sliver at the hairline.
      return (
        <path
          d={`M ${c.headCx - 20} ${c.headCy - 4} Q ${c.headCx} ${c.headCy - 22} ${c.headCx + 18} ${c.headCy - 6} L ${c.headCx + 16} ${c.headCy + 2} Q ${c.headCx - 2} ${c.headCy - 10} ${c.headCx - 20} ${c.headCy - 4} Z`}
          fill={hair}
        />
      );
    case "charm-gunslinger":
      return (
        <>
          {/* ponytail sweeping back */}
          <path
            d={`M ${c.headCx - 20} ${c.headCy - 6} Q ${c.headCx - 40} ${c.headCy + 4} ${c.headCx - 34} ${c.headCy + 30}
                Q ${c.headCx - 20} ${c.headCy + 14} ${c.headCx - 18} ${c.headCy - 4} Z`}
            fill={hair}
            stroke={OUTLINE}
            strokeWidth={OUTLINE_W}
            strokeLinejoin="round"
          />
          {/* sharp asymmetric spike up front */}
          <path
            d={`M ${c.headCx + 6} ${c.headCy - 16} L ${c.headCx + 20} ${c.headCy - 34} L ${c.headCx + 14} ${c.headCy - 10} Z`}
            fill={hair}
            stroke={OUTLINE}
            strokeWidth={OUTLINE_W}
            strokeLinejoin="round"
          />
        </>
      );
    case "spirit-mage":
      return (
        <path
          d={`M ${c.headCx - 24} ${c.headCy - 12} Q ${c.headCx} ${c.headCy - 36} ${c.headCx + 20} ${c.headCy - 12}
              Q ${c.headCx + 4} ${c.headCy + 30} ${c.headCx - 10} ${c.headCy + 64}
              Q ${c.headCx - 32} ${c.headCy + 24} ${c.headCx - 24} ${c.headCy - 12} Z`}
          fill={hair}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_W}
          strokeLinejoin="round"
          opacity={0.95}
        />
      );
    default:
      return null;
  }
}

/** Per-role held gear / headgear, anchored at the shared hand/head points. */
function RoleGear({ role, heroId, c, clothColor }: { role: Role; heroId: HeroId; c: Chassis; clothColor: string }) {
  switch (role) {
    case "Mage":
      // Inferna channels fire bare-handed instead (see the Inferna overlay below).
      if (heroId === "fire-mage") return null;
      return (
        <>
          <line x1={c.frontHandX} y1={c.frontHandY} x2={c.frontHandX + 10} y2={c.frontHandY - 70} stroke="#4a3524" strokeWidth={6} strokeLinecap="round" />
          <circle cx={c.frontHandX + 12} cy={c.frontHandY - 76} r={10} fill={clothColor} stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        </>
      );
    case "Tank":
      return (
        <>
          <circle cx={c.torsoRight - 4} cy={c.torsoTop + 8} r={13} fill="#c6c8d2" stroke={OUTLINE} strokeWidth={OUTLINE_W} />
          <circle cx={c.frontHandX} cy={c.frontHandY + 8} r={13} fill="#c6c8d2" stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        </>
      );
    case "Support":
      return (
        <ellipse
          cx={c.headCx}
          cy={c.headCy - HEAD_RADIUS - 14}
          rx={22}
          ry={7}
          fill="none"
          stroke="#ffe9a8"
          strokeWidth={5}
        />
      );
    case "Brawler":
      return (
        <rect
          x={c.frontHandX - 4}
          y={c.frontHandY - 46}
          width={10}
          height={50}
          rx={4}
          fill="#c6c8d2"
          stroke={OUTLINE}
          strokeWidth={OUTLINE_W}
          transform={`rotate(24 ${c.frontHandX} ${c.frontHandY})`}
        />
      );
    case "Speedster":
      return (
        <path
          d={`M ${c.headCx - 24} ${c.headCy - 20} Q ${c.headCx} ${c.headCy - 44} ${c.headCx + 22} ${c.headCy - 18}
              Q ${c.headCx + 10} ${c.headCy - 4} ${c.headCx - 8} ${c.headCy - 2} Q ${c.headCx - 20} ${c.headCy - 4} ${c.headCx - 24} ${c.headCy - 20} Z`}
          fill="#232733"
          stroke={OUTLINE}
          strokeWidth={OUTLINE_W}
          strokeLinejoin="round"
        />
      );
    case "Gunslinger": {
      const pistol = (
        <>
          <rect x={c.frontHandX} y={c.frontHandY - 5} width={22} height={10} rx={2} fill="#c6c8d2" stroke={OUTLINE} strokeWidth={3} />
          <rect x={c.frontHandX - 2} y={c.frontHandY + 4} width={8} height={14} rx={2} fill="#c6c8d2" stroke={OUTLINE} strokeWidth={3} />
        </>
      );
      if (heroId === "charm-gunslinger") {
        return (
          <>
            {pistol}
            <rect x={c.headCx - 14} y={c.headCy - 3} width={30} height={9} rx={3} fill="#14121c" stroke={OUTLINE} strokeWidth={2} opacity={0.92} />
          </>
        );
      }
      return pistol;
    }
    default:
      return null;
  }
}

/** Inferna's bespoke look — a cropped black jacket with glowing lava-crack
 * seams over a fitted tank top, plus a bare-handed flame instead of gear. */
function InfernaOverlay({ c }: { c: Chassis }) {
  const jacketBottom = c.torsoTop + (c.torsoBottom - c.torsoTop) * 0.62;
  const cracks = [
    { x1: c.torsoLeft + 6, y1: c.torsoTop + 10, x2: c.torsoLeft + 16, y2: c.torsoTop + 26 },
    { x1: c.torsoLeft + 16, y1: c.torsoTop + 26, x2: c.torsoLeft + 8, y2: c.torsoTop + 42 },
    { x1: c.torsoRight - 10, y1: c.torsoTop + 14, x2: c.torsoRight - 20, y2: c.torsoTop + 32 },
    { x1: c.torsoRight - 20, y1: c.torsoTop + 32, x2: c.torsoRight - 8, y2: c.torsoTop + 48 },
    { x1: TORSO_CENTER_X, y1: c.torsoTop + 4, x2: TORSO_CENTER_X - 6, y2: jacketBottom - 8 },
  ];
  return (
    <>
      {/* cropped jacket over the base tank top */}
      <rect
        x={c.torsoLeft - 3}
        y={c.torsoTop}
        width={c.torsoRight - c.torsoLeft + 6}
        height={jacketBottom - c.torsoTop}
        rx={10}
        fill="#171514"
        stroke={OUTLINE}
        strokeWidth={OUTLINE_W}
      />
      {/* collar */}
      <path
        d={`M ${TORSO_CENTER_X - 10} ${c.torsoTop} L ${TORSO_CENTER_X - 2} ${c.torsoTop - 12} L ${TORSO_CENTER_X + 8} ${c.torsoTop} Z`}
        fill="#171514"
        stroke={OUTLINE}
        strokeWidth={3}
      />
      {/* glowing lava-crack seams */}
      {cracks.map((cr, i) => (
        <line key={i} x1={cr.x1} y1={cr.y1} x2={cr.x2} y2={cr.y2} stroke="#ff7a2a" strokeWidth={3.4} strokeLinecap="round" className="glow-line" />
      ))}
      {/* flame cupped in the front hand */}
      <circle cx={c.frontHandX + 4} cy={c.frontHandY + 2} r={11} fill="#ff8a3d" className="glow-line" />
      <circle cx={c.frontHandX + 4} cy={c.frontHandY + 2} r={5} fill="#ffd9a0" />
    </>
  );
}

/** A handful of small floating accent shapes per element — cheap ambient
 * "magic," not a real particle system. Animated purely via CSS. */
function ElementAura({ element }: { element: Element }) {
  const color = ELEMENT_COLOR[element];
  const positions = [
    { x: 18, y: 60 },
    { x: 118, y: 90 },
    { x: 30, y: 130 },
  ];
  return (
    <g className="hero-aura">
      {positions.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} fill={color} className={`aura-mote aura-mote-${i}`} />
      ))}
    </g>
  );
}

export function HeroSprite({ hero, facing, cue, isTargetable, isSelectedTarget, isFocused, onClick }: HeroSpriteProps) {
  const def = HERO_DEFINITIONS[hero.heroId];
  const [flashClass, setFlashClass] = useState<string | null>(null);
  const [lunging, setLunging] = useState(false);
  const lastCue = useRef<AnimCue>(null);

  useEffect(() => {
    if (cue === lastCue.current) return;
    lastCue.current = cue;
    if (cue === "attacking") {
      setLunging(true);
      const t = setTimeout(() => setLunging(false), 380);
      return () => clearTimeout(t);
    }
    if (cue) {
      setFlashClass(FLASH_CLASS[cue]);
      const t = setTimeout(() => setFlashClass(null), 420);
      return () => clearTimeout(t);
    }
  }, [cue]);

  const cosmetics = HERO_COSMETICS[def.id];
  const isDefeated = hero.isDefeated;
  const skinColor = isDefeated ? "#8a8288" : cosmetics.skin;
  const clothColor = isDefeated ? "#3a3a3a" : ELEMENT_COLOR[def.element];
  const c = buildChassis(def.role);
  const isInferna = def.id === "fire-mage" && !isDefeated;

  const burn = hero.statuses.find((s) => s.type === "burn");
  const wet = hero.statuses.some((s) => s.type === "wet");
  const empower = hero.statuses.find((s) => s.type === "empower");
  const charm = hero.statuses.find((s) => s.type === "charm");

  const wrapClasses = [
    "hero-sprite-wrap",
    isDefeated ? "defeated" : "",
    isTargetable ? "targetable" : "",
    isSelectedTarget ? "selected-target" : "",
    isFocused ? "focused" : "",
    lunging ? "lunging" : "",
    flashClass ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={wrapClasses}
      style={{ "--facing": facing } as CSSProperties}
      onClick={onClick}
      disabled={!isTargetable}
      aria-label={def.name}
    >
      <div className="hero-sprite-ground" />
      <svg className="hero-sprite-svg" viewBox="0 0 160 200" width="100%" height="100%">
        {!isDefeated && <ElementAura element={def.element} />}

        {/* back leg + back arm (drawn first, mostly hidden behind torso) */}
        <rect x={TORSO_CENTER_X - 20} y={LEG_TOP_Y} width={16} height={LEG_HEIGHT} rx={7} fill="#232733" stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        <rect x={c.backHandX - 6} y={c.backHandY - 4} width={12} height={40} rx={6} fill={skinColor} stroke={OUTLINE} strokeWidth={OUTLINE_W} />

        {/* torso */}
        {isInferna ? (
          <>
            <rect x={c.torsoLeft} y={c.torsoTop} width={c.torsoRight - c.torsoLeft} height={c.torsoBottom - c.torsoTop} rx={12} fill="#2b2b34" stroke={OUTLINE} strokeWidth={OUTLINE_W} />
            <InfernaOverlay c={c} />
          </>
        ) : (
          <rect x={c.torsoLeft} y={c.torsoTop} width={c.torsoRight - c.torsoLeft} height={c.torsoBottom - c.torsoTop} rx={12} fill={clothColor} stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        )}

        {/* front leg */}
        <rect x={TORSO_CENTER_X + 4} y={LEG_TOP_Y} width={18} height={LEG_HEIGHT} rx={7} fill="#2b2b34" stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        <ellipse cx={TORSO_CENTER_X + 13} cy={GROUND_Y} rx={12} ry={6} fill="#171514" stroke={OUTLINE} strokeWidth={3} />

        {/* front arm */}
        <rect
          x={c.torsoRight - 6}
          y={c.torsoTop + 8}
          width={14}
          height={44}
          rx={7}
          fill={skinColor}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_W}
          transform={`rotate(-18 ${c.torsoRight} ${c.torsoTop + 8})`}
        />
        <circle cx={c.frontHandX} cy={c.frontHandY} r={9} fill={skinColor} stroke={OUTLINE} strokeWidth={OUTLINE_W} />

        {isInferna && (
          <>
            <circle cx={c.frontHandX + 4} cy={c.frontHandY + 2} r={13} fill="#ff8a3d" className="glow-line" opacity={0.5} />
          </>
        )}

        {/* head */}
        <circle cx={c.headCx} cy={c.headCy} r={HEAD_RADIUS} fill={skinColor} stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        {/* nose bump on the forward edge */}
        <path
          d={`M ${c.headCx + HEAD_RADIUS - 4} ${c.headCy + 2} L ${c.headCx + HEAD_RADIUS + 5} ${c.headCy + 6} L ${c.headCx + HEAD_RADIUS - 4} ${c.headCy + 10} Z`}
          fill={skinColor}
          stroke={OUTLINE}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {/* eye + brow */}
        <circle cx={c.headCx + 9} cy={c.headCy - 2} r={3.6} fill={cosmetics.eye} />
        <line x1={c.headCx + 3} y1={c.headCy - 10} x2={c.headCx + 15} y2={c.headCy - 12} stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />

        <Hair heroId={def.id} c={c} />
        <RoleGear role={def.role} heroId={def.id} c={c} clothColor={clothColor} />
      </svg>

      {burn && <span className="sprite-badge burn">🔥{burn.remainingTriggers}</span>}
      {wet && <span className="sprite-badge wet">💧</span>}
      {empower && empower.type === "empower" && <span className="sprite-badge empower">💪+{empower.bonusDamage}</span>}
      {charm && charm.type === "charm" && <span className="sprite-badge charm">💫-{charm.damageReduction}</span>}
    </button>
  );
}
