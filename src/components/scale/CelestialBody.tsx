import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { isLuminous, type WealthStep } from "@/data/wealthSteps";
import { clouds, flare, glow, ring, surfaceMaps } from "./textures";

interface Props {
  step: WealthStep;
  /** Emphasised body for the current step. */
  active: boolean;
  /** The permanent median-household reference. */
  reference?: boolean;
  animate: boolean;
}

/** Fresnel limb glow: light concentrates along the silhouette like a real atmosphere. */
const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vView), 0.0);
    float a = pow(rim, uPower) * uStrength;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Stellar photosphere: drifting granulation with physical limb darkening. */
const starVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const starFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform vec3 uLimb;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec2 flow = vec2(sin(vUv.y * 40.0 + uTime * 0.6), cos(vUv.x * 60.0 + uTime * 0.45)) * 0.0025;
    vec3 a = texture2D(uMap, vUv + flow + vec2(uTime * 0.004, 0.0)).rgb;
    vec3 b = texture2D(uMap, vUv * 1.0 - flow + vec2(-uTime * 0.003, 0.0)).rgb;
    vec3 col = mix(a, b, 0.5 + 0.5 * sin(uTime * 0.35));
    float mu = max(dot(vNormal, vView), 0.0);
    float limb = 0.4 + 0.6 * pow(mu, 0.55);
    col = mix(uLimb, col, limb) * (0.55 + 0.5 * limb);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const LIMB_COLOR: Partial<Record<WealthStep["bodyType"], number>> = {
  star: 0xd9480f,
  "giant-star": 0x5c0a14,
  supergiant: 0x8a1c08,
};

export function CelestialBody({ step, animate }: Props) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Sprite>(null);

  const luminous = isLuminous(step.bodyType);
  const maps = useMemo(() => surfaceMaps(step.bodyType, step.color), [step.bodyType, step.color]);
  const glowMap = useMemo(() => glow(step.color), [step.color]);
  const flareMap = useMemo(() => (luminous ? flare(step.color) : null), [luminous, step.color]);
  const ringMap = useMemo(
    () => (step.bodyType === "gas" ? ring(step.color) : null),
    [step.bodyType, step.color],
  );
  const cloudMap = useMemo(() => (step.bodyType === "earth" ? clouds() : null), [step.bodyType]);

  /** Ring geometry with radial UVs so the profile texture runs inner → outer. */
  const ringGeometry = useMemo(() => {
    if (!ringMap) return null;
    const inner = step.radius * 1.35;
    const outer = step.radius * 2.3;
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    const pos = g.getAttribute("position");
    const uv = g.getAttribute("uv");
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [ringMap, step.radius]);
  useEffect(() => () => ringGeometry?.dispose(), [ringGeometry]);

  const starUniforms = useMemo(
    () =>
      luminous
        ? {
            uMap: { value: maps.map },
            uTime: { value: 0 },
            uLimb: { value: new THREE.Color(LIMB_COLOR[step.bodyType] ?? step.color) },
          }
        : null,
    [luminous, maps.map, step.bodyType, step.color],
  );

  const atmosphere = useMemo(() => {
    const atmoColor =
      step.bodyType === "earth" ? 0x6fb4ff : luminous ? step.color : step.color;
    return {
      uColor: { value: new THREE.Color(atmoColor) },
      uPower: { value: luminous ? 1.6 : step.bodyType === "rocky" ? 4.5 : 2.6 },
      uStrength: { value: luminous ? 1.4 : step.bodyType === "earth" ? 1.5 : 0.9 },
    };
  }, [step.bodyType, step.color, luminous]);

  const spin = 0.06 / Math.max(0.35, Math.cbrt(step.radiusRatio));
  useFrame((state, rawDelta) => {
    if (starUniforms) starUniforms.uTime.value = animate ? state.clock.elapsedTime : 0;
    if (!animate) return;
    const delta = Math.min(rawDelta, 0.05);
    if (bodyRef.current) bodyRef.current.rotation.y += spin * delta;
    if (cloudRef.current) cloudRef.current.rotation.y += spin * 1.35 * delta;
    if (flareRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * 1.1) * 0.04 + Math.sin(t * 2.7) * 0.02;
      const s = step.radius * 5.2 * pulse;
      flareRef.current.scale.set(s, s, 1);
      flareRef.current.material.rotation = t * 0.02;
    }
  });

  const segments = step.radius > 100 ? 96 : 64;

  return (
    <group position={[step.x, step.y, 0]}>
      <mesh ref={bodyRef} rotation={[0.18, 0, 0.12]}>
        <sphereGeometry args={[step.radius, segments, segments]} />
        {starUniforms ? (
          <shaderMaterial
            uniforms={starUniforms}
            vertexShader={starVertex}
            fragmentShader={starFragment}
            toneMapped={false}
          />
        ) : (
          <meshStandardMaterial
            map={maps.map}
            bumpMap={maps.bump ?? null}
            bumpScale={step.radius * 0.04}
            roughnessMap={maps.roughness ?? null}
            roughness={step.bodyType === "earth" ? 1 : step.bodyType === "gas" ? 0.9 : 0.95}
            metalness={0}
          />
        )}
      </mesh>

      {cloudMap && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[step.radius * 1.012, 64, 64]} />
          <meshStandardMaterial map={cloudMap} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}

      {/* Fresnel atmosphere / chromosphere */}
      <mesh>
        <sphereGeometry args={[step.radius * (luminous ? 1.06 : 1.04), 48, 48]} />
        <shaderMaterial
          uniforms={atmosphere}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {ringGeometry && (
        <mesh rotation={[Math.PI / 2.6, 0.18, 0]} geometry={ringGeometry}>
          <meshStandardMaterial
            map={ringMap}
            side={THREE.DoubleSide}
            transparent
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      )}

      <sprite scale={[step.radius * 3.2, step.radius * 3.2, 1]}>
        <spriteMaterial
          map={glowMap}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={luminous ? 0.8 : 0.22}
        />
      </sprite>

      {flareMap && (
        <sprite ref={flareRef} scale={[step.radius * 5.2, step.radius * 5.2, 1]}>
          <spriteMaterial
            map={flareMap}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={0.6}
          />
        </sprite>
      )}

      {luminous && (
        <pointLight color={step.color} intensity={2.4} distance={step.radius * 40} decay={1.4} />
      )}
    </group>
  );
}
