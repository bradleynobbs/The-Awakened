import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { GameEvent, HeroInstanceId, MatchState, PlayerId } from "../engine/types";
import { HeroModel, type AnimCue } from "./HeroModel";

interface BattlefieldProps {
  state: MatchState;
  /** Whichever team should render nearest the camera — always "you", online. */
  myRole: PlayerId;
  activeEvent: GameEvent | null;
  targetablePlayerId: PlayerId | null;
  targetableHeroIds: HeroInstanceId[];
  selectedTargetIds: HeroInstanceId[];
  onSelectTarget: (heroId: HeroInstanceId) => void;
}

// Kept tight so all 3 heroes per side stay on-screen on narrow/portrait
// (phone) viewports, where the horizontal field of view is much smaller
// than on a wide desktop window.
const X_SLOTS = [-1.5, 0, 1.5];

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

function focusXForEvent(state: MatchState, event: GameEvent | null): number | null {
  if (!event) return null;
  const e = event as Record<string, unknown>;
  const id = (e.sourceHeroInstanceId ?? e.targetId ?? e.heroInstanceId) as string | undefined;
  if (!id) return null;
  for (const player of Object.values(state.players)) {
    const index = player.heroes.findIndex((h) => h.instanceId === id);
    if (index !== -1) return X_SLOTS[index] * 0.4;
  }
  return null;
}

function CameraRig({ focusX }: { focusX: number | null }) {
  const { camera } = useThree();
  const targetX = useRef(0);
  useFrame((_, delta) => {
    targetX.current = focusX ?? 0;
    camera.position.x += (targetX.current - camera.position.x) * Math.min(1, delta * 3);
    camera.lookAt(targetX.current * 0.3, 0.6, 0);
  });
  return null;
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
  const focusX = useMemo(() => focusXForEvent(state, activeEvent), [state, activeEvent]);
  const opponentRole: PlayerId = myRole === "player1" ? "player2" : "player1";
  const teamZ: Record<PlayerId, number> = { [myRole]: 2.4, [opponentRole]: -2.8 } as Record<PlayerId, number>;
  const facing: Record<PlayerId, 1 | -1> = { [myRole]: 1, [opponentRole]: -1 } as Record<PlayerId, 1 | -1>;

  return (
    <Canvas shadows camera={{ position: [0, 6.2, 10.5], fov: 50 }}>
      <Suspense fallback={null}>
        <color attach="background" args={["#0c0f16"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 8, 4]} intensity={1.1} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 12]} />
          <meshStandardMaterial color="#1a2030" />
        </mesh>
        <gridHelper args={[16, 16, "#2a3350", "#232a3d"]} position={[0, 0.01, 0]} />

        {(["player1", "player2"] as PlayerId[]).map((playerId) =>
          state.players[playerId].heroes.map((hero, index) => (
            <HeroModel
              key={hero.instanceId}
              hero={hero}
              position={[X_SLOTS[index], 0, teamZ[playerId]]}
              facing={facing[playerId]}
              cue={cues[hero.instanceId] ?? null}
              isTargetable={
                targetablePlayerId === playerId && targetableHeroIds.includes(hero.instanceId)
              }
              isSelectedTarget={selectedTargetIds.includes(hero.instanceId)}
              onClick={() => onSelectTarget(hero.instanceId)}
            />
          )),
        )}

        <CameraRig focusX={focusX} />
        <OrbitControls enableRotate={false} enablePan={false} minDistance={7} maxDistance={13} />
      </Suspense>
    </Canvas>
  );
}
