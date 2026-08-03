import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { HERO_DEFINITIONS } from "../engine/heroes";
import type { HeroInstance } from "../engine/types";
import { ELEMENT_COLOR, ELEMENT_SYMBOL } from "../ui/heroVisuals";

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

  const baseColor = hero.isDefeated ? "#3a3a3a" : ELEMENT_COLOR[def.element];
  const color = flash ?? baseColor;
  const burn = hero.statuses.find((s) => s.type === "burn");
  const wet = hero.statuses.some((s) => s.type === "wet");

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (isTargetable) onClick();
      }}
    >
      <mesh
        position={[0, hero.isDefeated ? 0.3 : 0.9, 0]}
        scale={hero.isDefeated ? [1, 0.3, 1] : [1, 1, 1]}
      >
        <capsuleGeometry args={[0.45, 1.1, 4, 10]} />
        <meshStandardMaterial
          color={color}
          opacity={hero.isDefeated ? 0.35 : 1}
          transparent
          emissive={isSelectedTarget ? "#ffffff" : "#000000"}
          emissiveIntensity={isSelectedTarget ? 0.4 : 0}
        />
      </mesh>
      {isTargetable && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.72, 32]} />
          <meshBasicMaterial color="#ffd24a" />
        </mesh>
      )}
      <Html position={[0, 2.05, 0]} center distanceFactor={8} occlude={false}>
        <div className={`hero-plate${hero.isDefeated ? " defeated" : ""}`}>
          <div className="hero-plate-name">
            {ELEMENT_SYMBOL[def.element]} {def.name}
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
          </div>
        </div>
      </Html>
    </group>
  );
}
