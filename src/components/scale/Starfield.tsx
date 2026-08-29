import { useMemo } from "react";
import * as THREE from "three";

const STAR_TINTS = [
  [1, 1, 1],
  [0.8, 0.9, 1],
  [1, 0.9, 0.85],
  [0.95, 0.95, 1],
];

function useStarGeometry(count: number, spread: number) {
  return useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.35 + Math.random() * 0.65);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const tint = STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)];
      const b = 0.55 + Math.random() * 0.45;
      cols[i * 3] = tint[0] * b;
      cols[i * 3 + 1] = tint[1] * b;
      cols[i * 3 + 2] = tint[2] * b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, [count, spread]);
}

function Layer({ count, spread, size }: { count: number; spread: number; size: number }) {
  const geometry = useStarGeometry(count, spread);
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

/** Two depth layers of stars so the background keeps parallax at every zoom. */
export function Starfield() {
  return (
    <>
      <Layer count={2600} spread={60_000} size={140} />
      <Layer count={1400} spread={900_000} size={2600} />
    </>
  );
}
