import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { DoubleSide, type Group } from "three";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { HeroId, HeroInstance, Role } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_SYMBOL } from "../ui/heroVisuals";
import { ElementAura } from "./ElementAura";
import { HeroFace } from "./HeroFace";
import { HERO_COSMETICS } from "./heroCosmetics";
import { HERO_PORTRAITS } from "../ui/heroPortraits";

export type AnimCue = "attacking" | "hit" | "healed" | "shielded" | null;

interface HeroModelProps {
  hero: HeroInstance;
  position: [number, number, number];
  facing: 1 | -1;
  cue: AnimCue;
  isTargetable: boolean;
  isSelectedTarget: boolean;
  onClick: () => void;
}

const FLASH_COLOR: Record<Exclude<AnimCue, null | "attacking">, string> = {
  hit: "#ff4444",
  healed: "#43d17a",
  shielded: "#4aa8ff",
};

const DEFEATED_SKIN = "#8a8288";
const PANTS_COLOR = "#2b2b34";
const METAL_COLOR = "#c6c8d2";
const WOOD_COLOR = "#4a3524";
const CHARM_HAIR_COLOR = "#ff5fc0";
const VISOR_COLOR = "#14121c";

/** Torso silhouette per role — a cylinder frustum, so robes vs. armor come
 * for free from just picking top/bottom radii (wider at bottom = robe flare,
 * wider at top = armored chest). */
const TORSO_SHAPE: Record<Role, { top: number; bottom: number; height: number }> = {
  Mage: { top: 0.19, bottom: 0.33, height: 0.6 },
  Support: { top: 0.21, bottom: 0.29, height: 0.58 },
  Tank: { top: 0.35, bottom: 0.26, height: 0.55 },
  Brawler: { top: 0.27, bottom: 0.24, height: 0.55 },
  Speedster: { top: 0.21, bottom: 0.18, height: 0.5 },
  Gunslinger: { top: 0.24, bottom: 0.3, height: 0.56 },
};

interface BodyMat {
  transparent: true;
  opacity: number;
  emissive: string;
  emissiveIntensity: number;
}

function RoleGear({
  role,
  heroId,
  clothColor,
  mat,
  headTopY,
  facing,
  headRadius,
}: {
  role: Role;
  heroId: HeroId;
  clothColor: string;
  mat: BodyMat;
  headTopY: number;
  facing: 1 | -1;
  headRadius: number;
}) {
  switch (role) {
    case "Mage":
      return (
        <group position={[0.4, 0, 0]} rotation={[0, 0, -0.12]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0} {...mat} />
          </mesh>
          <mesh position={[0, 1.52, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial
              color={clothColor}
              {...mat}
              emissive={clothColor}
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      );
    case "Tank":
      return (
        <>
          <mesh position={[-0.46, 0.95, 0.05]}>
            <boxGeometry args={[0.07, 0.5, 0.36]} />
            <meshStandardMaterial color={METAL_COLOR} roughness={0.3} metalness={0.75} {...mat} />
          </mesh>
          <mesh position={[-0.33, 1.15, 0]}>
            <boxGeometry args={[0.16, 0.12, 0.24]} />
            <meshStandardMaterial color={METAL_COLOR} roughness={0.3} metalness={0.75} {...mat} />
          </mesh>
          <mesh position={[0.33, 1.15, 0]}>
            <boxGeometry args={[0.16, 0.12, 0.24]} />
            <meshStandardMaterial color={METAL_COLOR} roughness={0.3} metalness={0.75} {...mat} />
          </mesh>
        </>
      );
    case "Support":
      return (
        <mesh position={[0, headTopY + 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.022, 8, 20]} />
          <meshStandardMaterial
            color="#ffe9a8"
            {...mat}
            emissive="#ffe9a8"
            emissiveIntensity={0.6}
          />
        </mesh>
      );
    case "Brawler":
      return (
        <group position={[0.42, 0.85, 0]} rotation={[0, 0, -0.18]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.08, 0.62, 0.03]} />
            <meshStandardMaterial color={METAL_COLOR} roughness={0.3} metalness={0.75} {...mat} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.12, 0.1, 0.06]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0} {...mat} />
          </mesh>
        </group>
      );
    case "Speedster":
      return (
        <>
          <mesh position={[0, headTopY - 0.05, 0]}>
            <coneGeometry args={[0.25, 0.32, 8]} />
            <meshStandardMaterial color={clothColor} {...mat} />
          </mesh>
          <mesh position={[0, 0.85, -0.16]} rotation={[0.15, 0, 0]}>
            <planeGeometry args={[0.42, 0.85]} />
            <meshStandardMaterial
              color={clothColor}
              {...mat}
              side={DoubleSide}
            />
          </mesh>
        </>
      );
    case "Gunslinger": {
      const pistol = (
        <>
          <mesh position={[0.4, 0.78, 0]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.05, 0.16, 0.08]} />
            <meshStandardMaterial color={METAL_COLOR} roughness={0.3} metalness={0.75} {...mat} />
          </mesh>
          <mesh position={[0.4, 0.7, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
            <meshStandardMaterial color={METAL_COLOR} roughness={0.3} metalness={0.75} {...mat} />
          </mesh>
        </>
      );

      if (heroId === "charm-gunslinger") {
        // Original look (not a copy of any existing character): sharp,
        // cartoony idol-meets-gunslinger — a dark visor instead of a plain
        // hat. The ponytail/hair spikes live in HeroFace alongside every
        // other hero's hairstyle.
        const eyeZ = -facing * headRadius * 0.95;
        return (
          <>
            {pistol}
            <mesh position={[0, headTopY - 0.1, eyeZ]}>
              <boxGeometry args={[0.24, 0.05, 0.02]} />
              <meshStandardMaterial color={VISOR_COLOR} {...mat} emissive={CHARM_HAIR_COLOR} emissiveIntensity={0.3} />
            </mesh>
          </>
        );
      }

      return (
        <>
          {pistol}
          <mesh position={[0, headTopY + 0.02, 0]}>
            <cylinderGeometry args={[0.27, 0.27, 0.03, 12]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0} {...mat} />
          </mesh>
          <mesh position={[0, headTopY + 0.09, 0]}>
            <cylinderGeometry args={[0.13, 0.16, 0.12, 10]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} metalness={0} {...mat} />
          </mesh>
        </>
      );
    }
    default:
      return null;
  }
}

export function HeroModel({
  hero,
  position,
  facing,
  cue,
  isTargetable,
  isSelectedTarget,
  onClick,
}: HeroModelProps) {
  const def = HERO_DEFINITIONS[hero.heroId];
  const groupRef = useRef<Group>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const lunge = useRef(0);

  useEffect(() => {
    if (cue === "attacking") {
      lunge.current = 1;
    } else if (cue) {
      setFlash(FLASH_COLOR[cue]);
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
  }, [cue]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    lunge.current = Math.max(0, lunge.current - delta * 2.2);
    const forwardOffset = lunge.current * 0.6 * facing;
    groupRef.current.position.z = position[2] - forwardOffset;
  });

  const clothColor = hero.isDefeated ? "#3a3a3a" : ELEMENT_COLOR[def.element];
  const skinColor = hero.isDefeated ? DEFEATED_SKIN : HERO_COSMETICS[def.id].skin;
  const eyeColor = HERO_COSMETICS[def.id].eye;
  const opacity = hero.isDefeated ? 0.35 : 1;
  const burn = hero.statuses.find((s) => s.type === "burn");
  const wet = hero.statuses.some((s) => s.type === "wet");
  const empower = hero.statuses.find((s) => s.type === "empower");
  const charm = hero.statuses.find((s) => s.type === "charm");

  const mat: BodyMat = {
    transparent: true,
    opacity,
    emissive: flash ?? (isSelectedTarget ? "#ffffff" : "#000000"),
    emissiveIntensity: flash ? 0.9 : isSelectedTarget ? 0.4 : 0,
  };

  const torso = TORSO_SHAPE[def.role];
  // Longer legs than the original chibi-proportioned rig, for a more
  // "semi-realistic but still cartoony" silhouette (DESIGN.md §9).
  const legTop = 0.7;
  const torsoTop = legTop + torso.height;
  const headRadius = def.role === "Tank" ? 0.21 : 0.19;
  const headY = torsoTop + 0.07 + headRadius;
  const headTopY = headY + headRadius;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (isTargetable) onClick();
      }}
    >
      <group
        rotation={hero.isDefeated ? [Math.PI / 2.3, 0, 0] : [0, 0, 0]}
        position={hero.isDefeated ? [0, 0.04, 0.3] : [0, 0, 0]}
      >
        {/* legs */}
        <mesh position={[-0.14, legTop / 2, 0]}>
          <cylinderGeometry args={[0.1, 0.11, legTop, 10]} />
          <meshStandardMaterial color={PANTS_COLOR} roughness={0.85} metalness={0.05} {...mat} />
        </mesh>
        <mesh position={[0.14, legTop / 2, 0]}>
          <cylinderGeometry args={[0.1, 0.11, legTop, 10]} />
          <meshStandardMaterial color={PANTS_COLOR} roughness={0.85} metalness={0.05} {...mat} />
        </mesh>

        {/* torso */}
        <mesh position={[0, legTop + torso.height / 2, 0]}>
          <cylinderGeometry args={[torso.top, torso.bottom, torso.height, 12]} />
          <meshStandardMaterial color={clothColor} roughness={0.75} metalness={0.05} {...mat} />
        </mesh>

        {/* arms */}
        <mesh position={[-(torso.top + 0.14), legTop + torso.height - 0.2, 0]} rotation={[0, 0, 0.14]}>
          <cylinderGeometry args={[0.07, 0.075, 0.5, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0} {...mat} />
        </mesh>
        <mesh position={[torso.top + 0.14, legTop + torso.height - 0.2, 0]} rotation={[0, 0, -0.14]}>
          <cylinderGeometry args={[0.07, 0.075, 0.5, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0} {...mat} />
        </mesh>

        {/* head */}
        <mesh position={[0, headY, 0]}>
          <sphereGeometry args={[headRadius, 18, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} metalness={0} {...mat} />
        </mesh>
        {/* eyes, on the side facing the opponent */}
        <mesh position={[-0.06, headY, -facing * headRadius * 0.85]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0.06, headY, -facing * headRadius * 0.85]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={0.25} />
        </mesh>

        <HeroFace heroId={def.id} mat={mat} headY={headY} headTopY={headTopY} headRadius={headRadius} facing={facing} />

        <RoleGear
          role={def.role}
          heroId={def.id}
          clothColor={clothColor}
          mat={mat}
          headTopY={headTopY}
          facing={facing}
          headRadius={headRadius}
        />

        <ElementAura element={def.element} opacity={opacity} />
      </group>

      {isTargetable && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.72, 32]} />
          <meshBasicMaterial color="#ffd24a" />
        </mesh>
      )}
      <Html position={[0, 2.05, 0]} center distanceFactor={8} occlude={false}>
        <div className={`hero-plate${hero.isDefeated ? " defeated" : ""}`}>
          <div className="hero-plate-name">
            {HERO_PORTRAITS[def.id] ? (
              <img
                className="hero-plate-portrait"
                src={HERO_PORTRAITS[def.id]!.portrait}
                alt={def.name}
              />
            ) : (
              <span>{ELEMENT_SYMBOL[def.element]} </span>
            )}
            {def.name}
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
            {burn && <span className="badge burn">🔥{burn.remainingTriggers}</span>}
            {wet && <span className="badge wet">💧</span>}
            {empower && empower.type === "empower" && (
              <span className="badge empower">💪+{empower.bonusDamage}</span>
            )}
            {charm && charm.type === "charm" && (
              <span className="badge charm">💫-{charm.damageReduction}</span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}
