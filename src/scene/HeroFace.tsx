import { HERO_COSMETICS } from "./heroCosmetics";
import type { HeroId } from "../engine/types";

interface BodyMat {
  transparent: true;
  opacity: number;
  emissive: string;
  emissiveIntensity: number;
}

interface HeroFaceProps {
  heroId: HeroId;
  mat: BodyMat;
  headY: number;
  headTopY: number;
  headRadius: number;
  facing: 1 | -1;
}

/**
 * Per-hero hairstyle + one small identifying feature (DESIGN.md §9) — the
 * "no two characters should feel similar" rule, layered on top of the
 * shared body rig and role gear rather than replacing any of it.
 */
export function HeroFace({ heroId, mat, headY, headTopY, headRadius, facing }: HeroFaceProps) {
  const { hair, eye } = HERO_COSMETICS[heroId];
  const eyeZ = -facing * headRadius * 0.95;

  const hairStyle = (() => {
    switch (heroId) {
      case "fire-mage":
        return (
          <>
            <mesh position={[0, headTopY - 0.06, 0]} scale={[1, 0.6, 1]}>
              <sphereGeometry args={[headRadius * 0.95, 10, 8]} />
              <meshStandardMaterial color={hair} {...mat} />
            </mesh>
            {[-0.08, 0.08].map((x, i) => (
              <mesh key={i} position={[x, headTopY, -0.05]} rotation={[0.5, 0, 0]}>
                <coneGeometry args={[0.03, 0.14, 6]} />
                <meshStandardMaterial color={hair} {...mat} />
              </mesh>
            ))}
          </>
        );
      case "earth-guardian":
        return (
          <>
            <mesh position={[0, headTopY - 0.09, 0]} scale={[1, 0.35, 1]}>
              <sphereGeometry args={[headRadius * 0.98, 10, 8]} />
              <meshStandardMaterial color={hair} {...mat} />
            </mesh>
            <mesh position={[headRadius * 0.75, headY, 0]}>
              <boxGeometry args={[0.035, 0.035, 0.035]} />
              <meshStandardMaterial color="#8a9a80" roughness={0.9} {...mat} />
            </mesh>
          </>
        );
      case "water-healer":
        return (
          <>
            <mesh position={[0, headTopY - 0.1, 0]} scale={[1.02, 0.5, 1.02]}>
              <sphereGeometry args={[headRadius, 10, 8]} />
              <meshStandardMaterial color={hair} {...mat} />
            </mesh>
            {[-1, 1].map((side, i) => (
              <mesh key={i} position={[side * headRadius * 0.85, headY - 0.18, 0]} rotation={[0, 0, side * 0.15]}>
                <coneGeometry args={[0.05, 0.4, 8]} />
                <meshStandardMaterial color={hair} {...mat} />
              </mesh>
            ))}
          </>
        );
      case "spark-duelist":
        return (
          <>
            {[-0.09, 0, 0.09].map((x, i) => (
              <mesh key={i} position={[x, headTopY + 0.02, 0]}>
                <coneGeometry args={[0.035, 0.16 - Math.abs(x) * 0.4, 6]} />
                <meshStandardMaterial color={hair} {...mat} emissive={hair} emissiveIntensity={0.3} />
              </mesh>
            ))}
          </>
        );
      case "undead-assassin":
        // Mostly covered by the Speedster hood (RoleGear) — just a sliver
        // of hair at the front hairline for depth.
        return (
          <mesh position={[0, headY + headRadius * 0.5, eyeZ * 0.9]} scale={[0.9, 0.4, 0.5]}>
            <sphereGeometry args={[headRadius * 0.9, 8, 6]} />
            <meshStandardMaterial color={hair} {...mat} />
          </mesh>
        );
      case "charm-gunslinger":
        return (
          <>
            <mesh position={[0, headTopY - 0.02, -0.06 * facing]} rotation={[-facing * 0.5, 0, 0]}>
              <coneGeometry args={[0.09, 0.42, 8]} />
              <meshStandardMaterial color={hair} {...mat} />
            </mesh>
            <mesh position={[-0.14, headTopY - 0.02, 0]} rotation={[0, 0, 0.5]}>
              <coneGeometry args={[0.05, 0.2, 6]} />
              <meshStandardMaterial color={hair} {...mat} />
            </mesh>
            <mesh position={[0.14, headTopY - 0.02, 0]} rotation={[0, 0, -0.5]}>
              <coneGeometry args={[0.05, 0.2, 6]} />
              <meshStandardMaterial color={hair} {...mat} />
            </mesh>
          </>
        );
      case "spirit-mage":
        return (
          <>
            <mesh position={[0, headTopY - 0.08, 0]} scale={[1.03, 0.55, 1.03]}>
              <sphereGeometry args={[headRadius, 10, 8]} />
              <meshStandardMaterial color={hair} {...mat} emissive={hair} emissiveIntensity={0.15} />
            </mesh>
            {[-1, 1].map((side, i) => (
              <mesh key={i} position={[side * headRadius * 0.7, headY - 0.28, -0.02]} rotation={[0.1, 0, side * 0.1]}>
                <coneGeometry args={[0.045, 0.55, 8]} />
                <meshStandardMaterial color={hair} {...mat} emissive={hair} emissiveIntensity={0.1} />
              </mesh>
            ))}
          </>
        );
      default:
        return null;
    }
  })();

  const feature = (() => {
    switch (heroId) {
      case "fire-mage":
        return (
          <mesh position={[0.05, headY - 0.03, eyeZ]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color="#ff8a3d" emissive="#ff6a1f" emissiveIntensity={1} />
          </mesh>
        );
      case "water-healer":
        return (
          <mesh position={[-0.07, headY - 0.05, eyeZ]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={0.8} />
          </mesh>
        );
      case "spark-duelist":
        return (
          <>
            <mesh position={[0.08, headY + 0.03, eyeZ]} rotation={[0, 0, 0.6]}>
              <boxGeometry args={[0.05, 0.012, 0.01]} />
              <meshStandardMaterial color="#e8e0d0" />
            </mesh>
            <mesh position={[0.1, headY, eyeZ]} rotation={[0, 0, -0.6]}>
              <boxGeometry args={[0.05, 0.012, 0.01]} />
              <meshStandardMaterial color="#e8e0d0" />
            </mesh>
          </>
        );
      case "undead-assassin":
        return (
          <mesh position={[-0.02, headY + 0.05, eyeZ]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.09, 0.012, 0.01]} />
            <meshStandardMaterial color="#5a5060" />
          </mesh>
        );
      case "spirit-mage":
        return (
          <mesh position={[0, headY + 0.07, eyeZ]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
            <meshStandardMaterial color="#c89ef0" emissive="#a86ae0" emissiveIntensity={1.1} />
          </mesh>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      {hairStyle}
      {feature}
    </>
  );
}
