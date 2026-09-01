import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { isLuminous, type WealthStep } from "@/data/wealthSteps";
import { clouds, flare, glow, ring, surfaceTexture } from "./textures";

interface Props {
  step: WealthStep;
  /** Emphasised body for the current step. */
  active: boolean;
  /** The permanent median-household reference. */
  reference?: boolean;
  animate: boolean;
}

/** Below this angular size the body is drawn as a fixed-size marker instead. */
const MIN_ANGULAR = 0.004;

export function CelestialBody({ step, animate }: Props) {
  const fullRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Sprite>(null);
  const camera = useThree((s) => s.camera);
  const [clamped, setClamped] = useState(false);

  const luminous = isLuminous(step.bodyType);
  const surface = useMemo(
    () => surfaceTexture(step.bodyType, step.color),
    [step.bodyType, step.color],
  );
  const glowMap = useMemo(() => glow(step.color), [step.color]);
  const flareMap = useMemo(() => (luminous ? flare(step.color) : null), [luminous, step.color]);
  const ringMap = useMemo(
    () => (step.bodyType === "gas" ? ring(step.color) : null),
    [step.bodyType, step.color],
  );
  const cloudMap = useMemo(() => (step.bodyType === "earth" ? clouds() : null), [step.bodyType]);

  const spin = 0.06 / Math.max(0.35, Math.cbrt(step.radiusRatio));
  const center = useMemo(() => new THREE.Vector3(step.x, step.y, 0), [step.x, step.y]);

  useFrame((state, rawDelta) => {
    const dist = Math.max(1e-6, camera.position.distanceTo(center));
    // Angular radius: how much of the view this body actually occupies.
    const tooSmall = step.radius / dist < MIN_ANGULAR;
    if (tooSmall !== clamped) setClamped(tooSmall);

    if (fullRef.current) fullRef.current.visible = !tooSmall;
    if (markerRef.current) {
      markerRef.current.visible = tooSmall;
      // Constant apparent size, so a speck never disappears entirely.
      const s = dist * 0.012;
      markerRef.current.scale.setScalar(s);
    }

    if (!animate || tooSmall) return;
    const delta = Math.min(rawDelta, 0.05);
    if (bodyRef.current) bodyRef.current.rotation.y += spin * delta;
    if (cloudRef.current) cloudRef.current.rotation.y += spin * 1.35 * delta;
    if (flareRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
      const s = step.radius * 9 * pulse;
      flareRef.current.scale.set(s, s, 1);
    }
  });

  const segments = step.radius > 100 ? 64 : 48;


  return (
    <group position={[step.x, step.y, 0]}>
      <group ref={fullRef}>
        <mesh ref={bodyRef}>
          <sphereGeometry args={[step.radius, segments, segments]} />
          {luminous ? (
            <meshBasicMaterial map={surface} toneMapped={false} />
          ) : (
            <meshStandardMaterial
              map={surface}
              roughness={step.bodyType === "ice" ? 0.35 : 0.85}
              metalness={0.05}
            />
          )}
        </mesh>

        {cloudMap && (
          <mesh ref={cloudRef}>
            <sphereGeometry args={[step.radius * 1.015, 48, 48]} />
            <meshStandardMaterial map={cloudMap} transparent opacity={0.42} depthWrite={false} />
          </mesh>
        )}

        {/* Atmospheric shell */}
        <mesh>
          <sphereGeometry args={[step.radius * 1.05, 32, 32]} />
          <meshBasicMaterial
            color={step.color}
            transparent
            opacity={luminous ? 0.3 : 0.14}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {ringMap && (
          <mesh rotation={[Math.PI / 3.2, 0, 0]}>
            <ringGeometry args={[step.radius * 1.4, step.radius * 2.2, 96]} />
            <meshBasicMaterial
              map={ringMap}
              side={THREE.DoubleSide}
              transparent
              depthWrite={false}
            />
          </mesh>
        )}

        <sprite scale={[step.radius * 3.5, step.radius * 3.5, 1]}>
          <spriteMaterial
            map={glowMap}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={luminous ? 0.9 : 0.45}
          />
        </sprite>

        {flareMap && (
          <sprite ref={flareRef} scale={[step.radius * 9, step.radius * 9, 1]}>
            <spriteMaterial
              map={flareMap}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              transparent
              opacity={0.55}
            />
          </sprite>
        )}

        {luminous && (
          <pointLight color={step.color} intensity={2.4} distance={step.radius * 40} decay={1.4} />
        )}
      </group>

      {/* Fixed-size marker for bodies too small to see at this zoom. */}
      <group ref={markerRef} visible={false}>
        <mesh renderOrder={5}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={step.color} toneMapped={false} depthTest={false} />
        </mesh>
        <sprite scale={[6, 6, 1]}>
          <spriteMaterial
            map={glowMap}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            transparent
            opacity={0.85}
          />
        </sprite>
      </group>

    </group>
  );
}

