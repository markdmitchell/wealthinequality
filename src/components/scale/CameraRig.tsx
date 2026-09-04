import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { REFERENCE_STEP, type WealthStep } from "@/data/wealthSteps";

interface Props {
  /** Bodies that must all be inside the frame. */
  framed: WealthStep[];
  reducedMotion: boolean;
  onView?: ((viewWidth: number) => void) | undefined;
}

type Controls = {
  target: THREE.Vector3;
  update: () => void;
  minDistance: number;
  maxDistance: number;
};

/** Distance needed to fit a span horizontally and vertically. */
function fitDistance(spanX: number, spanY: number, fovDeg: number, aspect: number) {
  const vFov = (fovDeg * Math.PI) / 180;
  const distV = spanY / 2 / Math.tan(vFov / 2);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const distH = spanX / 2 / Math.tan(hFov / 2);
  return Math.max(distV, distH);
}

export function CameraRig({ framed, reducedMotion, onView }: Props) {
  const controlsRef = useRef<Controls | null>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const flying = useRef(true);
  const desired = useRef({ target: new THREE.Vector3(), dist: 100 });
  const lastReport = useRef(0);

  // Recompute the framing whenever the framed set or the viewport changes.
  useEffect(() => {
    const aspect = Math.max(0.4, size.width / Math.max(1, size.height));
    const main = framed[framed.length - 1] ?? REFERENCE_STEP;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const s of framed) {
      minX = Math.min(minX, s.x - s.radius);
      maxX = Math.max(maxX, s.x + s.radius);
      minY = Math.min(minY, s.y - s.radius);
      maxY = Math.max(maxY, s.y + s.radius);
    }
    if (!Number.isFinite(minX)) {
      minX = main.x - main.radius;
      maxX = main.x + main.radius;
      minY = main.y - main.radius;
      maxY = main.y + main.radius;
    }

    // Fit into the region of the viewport the UI does not cover, then shift the
    // aim so the framed bodies sit in that region rather than behind the panels.
    const wide = size.width >= 1024;
    const padL = wide ? 0.31 : 0.04;
    const padR = wide ? 0.13 : 0.04;
    const padT = 0.09;
    const padB = wide ? 0.06 : 0.3;
    const usableX = Math.max(0.25, 1 - padL - padR);
    const usableY = Math.max(0.25, 1 - padT - padB);

    const margin = 1.12;
    const spanX = ((maxX - minX) * margin) / usableX;
    const spanY = ((maxY - minY) * margin) / usableY;
    // The camera sits slightly off-axis, which foreshortens the box; pay for it.
    const offAxis = 1.1;
    const dist = fitDistance(spanX, spanY, camera.fov, aspect) * offAxis;

    const vFov = (camera.fov * Math.PI) / 180;
    const viewH = 2 * Math.tan(vFov / 2) * dist;
    const viewW = viewH * aspect;

    desired.current.target.set(
      (minX + maxX) / 2 - ((padL - padR) / 2) * viewW,
      (minY + maxY) / 2 + ((padT - padB) / 2) * viewH,
      0,
    );
    desired.current.dist = dist;
    flying.current = true;


    const controls = controlsRef.current;
    if (controls) {
      controls.minDistance = main.radius * 0.6;
      controls.maxDistance = dist * 40;
    }

    if (reducedMotion && controls) {
      controls.target.copy(desired.current.target);
      const dir = new THREE.Vector3(0.1, 0.14, 1).normalize();
      camera.position.copy(controls.target).addScaledVector(dir, dist);
      controls.update();
      flying.current = false;
    }
  }, [framed, reducedMotion, camera, size.width, size.height]);


  useFrame((state, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const delta = Math.min(rawDelta, 0.05);

    if (flying.current) {
      // Frame-rate independent easing; slow enough that the pull-back reads as travel.
      const k = 1 - Math.exp(-1.9 * delta);
      const dir = camera.position.clone().sub(controls.target);
      let dist = dir.length();
      if (dist < 1e-6) {
        dir.set(0.12, 0.16, 1);
        dist = 1;
      }
      dir.normalize();

      controls.target.lerp(desired.current.target, k);
      dist += (desired.current.dist - dist) * k;
      camera.position.copy(controls.target).addScaledVector(dir, dist);
      controls.update();

      const settled =
        controls.target.distanceTo(desired.current.target) < desired.current.dist * 0.003 &&
        Math.abs(dist - desired.current.dist) < desired.current.dist * 0.003;
      if (settled) flying.current = false;
    }

    // Report how much world space the screen currently covers.
    if (!onView) return;
    const now = state.clock.elapsedTime;
    if (now - lastReport.current < 0.12) return;
    lastReport.current = now;
    const dist = camera.position.distanceTo(controls.target);
    const vFov = (camera.fov * Math.PI) / 180;
    const viewHeight = 2 * Math.tan(vFov / 2) * dist;
    onView(viewHeight * camera.aspect);
  });

  return (
    <OrbitControls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={controlsRef as any}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      enablePan={false}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      onStart={() => {
        flying.current = false;
      }}
    />
  );
}
