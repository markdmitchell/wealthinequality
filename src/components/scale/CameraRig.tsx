import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { WealthStep } from "@/data/wealthSteps";

interface Props {
  step: WealthStep;
  reducedMotion: boolean;
}

type Controls = {
  target: THREE.Vector3;
  update: () => void;
  minDistance: number;
  maxDistance: number;
};

export function CameraRig({ step, reducedMotion }: Props) {
  const controlsRef = useRef<Controls | null>(null);
  const camera = useThree((s) => s.camera);
  const flying = useRef(true);
  const desired = useRef({
    target: new THREE.Vector3(step.x, 0, 0),
    dist: step.radius * 3.9,
  });

  useEffect(() => {
    desired.current.target.set(step.x, 0, 0);
    desired.current.dist = step.radius * 3.9;
    flying.current = true;

    const controls = controlsRef.current;
    if (controls) {
      controls.minDistance = step.radius * 1.25;
      controls.maxDistance = step.radius * 60;
    }

    if (reducedMotion && controls) {
      controls.target.copy(desired.current.target);
      const dir = new THREE.Vector3(0.35, 0.22, 1).normalize();
      camera.position.copy(controls.target).addScaledVector(dir, desired.current.dist);
      controls.update();
      flying.current = false;
    }
  }, [step, reducedMotion, camera]);

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls || !flying.current) return;
    const delta = Math.min(rawDelta, 0.05);
    // Frame-rate independent easing.
    const k = 1 - Math.exp(-2.6 * delta);

    const dir = camera.position.clone().sub(controls.target);
    let dist = dir.length();
    if (dist < 1e-6) {
      dir.set(0.35, 0.22, 1);
      dist = 1;
    }
    dir.normalize();

    controls.target.lerp(desired.current.target, k);
    dist += (desired.current.dist - dist) * k;
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.update();

    const settled =
      controls.target.distanceTo(desired.current.target) < desired.current.dist * 0.004 &&
      Math.abs(dist - desired.current.dist) < desired.current.dist * 0.004;
    if (settled) flying.current = false;
  });

  return (
    <OrbitControls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={controlsRef as any}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      enablePan={false}
      zoomSpeed={0.7}
      rotateSpeed={0.6}
      onStart={() => {
        flying.current = false;
      }}
    />
  );
}
