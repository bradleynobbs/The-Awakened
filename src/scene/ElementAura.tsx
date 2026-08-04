import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { Element } from "../engine/types";

interface ElementAuraProps {
  element: Element;
  opacity: number;
}

/**
 * A small, cheap set of animated shapes per element — "glowing energy,
 * not physical armor" (DESIGN.md §9): a few emissive primitives bobbing
 * or orbiting via a shared useFrame clock, not a real particle system.
 * Kept tiny and low-alpha so it reads as an accent, not a distraction
 * from the readable silhouette underneath.
 */
export function ElementAura({ element, opacity }: ElementAuraProps) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.children.forEach((child, i) => {
      const phase = t * 1.4 + i * 2.1;
      child.position.y += Math.sin(phase) * 0.0008;
      child.rotation.y = phase;
    });
  });

  const auraOpacity = opacity * 0.85;

  switch (element) {
    case "fire":
      return (
        <group ref={ref}>
          {[0.1, 0.28, 0.46].map((y, i) => (
            <mesh key={i} position={[i % 2 === 0 ? -0.28 : 0.28, y, 0.15]}>
              <sphereGeometry args={[0.035, 6, 6]} />
              <meshStandardMaterial
                color="#ff8a3d"
                emissive="#ff6a1f"
                emissiveIntensity={1.2}
                transparent
                opacity={auraOpacity}
              />
            </mesh>
          ))}
        </group>
      );
    case "water":
      return (
        <group ref={ref}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.015, 8, 24]} />
            <meshStandardMaterial
              color="#4ac8e0"
              emissive="#2fa8c9"
              emissiveIntensity={0.8}
              transparent
              opacity={auraOpacity * 0.6}
            />
          </mesh>
          {[0.35, 0.55].map((y, i) => (
            <mesh key={i} position={[i === 0 ? -0.25 : 0.25, y, 0.1]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial
                color="#bfeaf5"
                emissive="#7fd8ea"
                emissiveIntensity={0.6}
                transparent
                opacity={auraOpacity * 0.5}
              />
            </mesh>
          ))}
        </group>
      );
    case "earth":
      return (
        <group ref={ref}>
          {[[-0.3, 0.5], [0.32, 0.7]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.05]} rotation={[0.4, 0.6, 0]}>
              <boxGeometry args={[0.08, 0.06, 0.08]} />
              <meshStandardMaterial
                color="#6a8a52"
                emissive="#3f5a34"
                emissiveIntensity={0.4}
                roughness={0.9}
                transparent
                opacity={auraOpacity}
              />
            </mesh>
          ))}
        </group>
      );
    case "spark":
      return (
        <group ref={ref}>
          {[[-0.32, 0.65], [0.3, 0.45]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.12]} rotation={[0, 0, i === 0 ? 0.3 : -0.3]}>
              <boxGeometry args={[0.03, 0.14, 0.02]} />
              <meshStandardMaterial
                color="#fff3a0"
                emissive="#f5e042"
                emissiveIntensity={1.4}
                transparent
                opacity={auraOpacity}
              />
            </mesh>
          ))}
        </group>
      );
    case "spirit":
      return (
        <group ref={ref}>
          {[0.4, 0.65].map((y, i) => (
            <mesh key={i} position={[i === 0 ? -0.3 : 0.28, y, 0.05]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial
                color="#d8b6f0"
                emissive="#a86ae0"
                emissiveIntensity={0.9}
                transparent
                opacity={auraOpacity * 0.7}
              />
            </mesh>
          ))}
        </group>
      );
    case "undead":
      return (
        <group ref={ref}>
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.03, 8, 20]} />
            <meshStandardMaterial
              color="#2a5a3a"
              emissive="#3fae5a"
              emissiveIntensity={0.5}
              transparent
              opacity={auraOpacity * 0.5}
            />
          </mesh>
          <mesh position={[0.2, 0.55, 0.1]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial
              color="#3fae5a"
              emissive="#3fae5a"
              emissiveIntensity={1}
              transparent
              opacity={auraOpacity}
            />
          </mesh>
        </group>
      );
    case "charm":
      return (
        <group ref={ref}>
          {[[-0.28, 0.6], [0.3, 0.42]].map(([x, y], i) => (
            <mesh
              key={i}
              position={[x, y, 0.1]}
              rotation={[0, 0, i === 0 ? 0.4 : -0.5]}
              scale={[1.4, 0.5, 1]}
            >
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial
                color="#ffb8e0"
                emissive="#ff8ac9"
                emissiveIntensity={0.9}
                transparent
                opacity={auraOpacity * 0.7}
              />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}
