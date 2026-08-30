import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BASE_INDEX, wealthSteps, type WealthStep } from "@/data/wealthSteps";
import { CameraRig } from "./CameraRig";
import { CelestialBody } from "./CelestialBody";
import { Starfield } from "./Starfield";
import { disposeTextureCache } from "./textures";

interface Props {
  step: WealthStep;
  /** Journey mode frames current + previous; compare mode frames a chosen set. */
  compare: number[] | null;
  reducedMotion: boolean;
  onView?: ((viewWidth: number) => void) | undefined;
}

function Scene({ step, compare, reducedMotion, onView }: Props) {
  useEffect(() => () => disposeTextureCache(), []);

  const framed = useMemo(() => {
    if (compare && compare.length > 0) {
      return compare
        .map((i) => wealthSteps[i])
        .filter((s): s is WealthStep => Boolean(s))
        .sort((a, b) => a.x - b.x);
    }
    const prev = wealthSteps[step.index - 1];
    return prev ? [prev, step] : [step];
  }, [compare, step]);

  const activeSet = useMemo(
    () => new Set(compare && compare.length ? compare : [step.index]),
    [compare, step.index],
  );

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[1, 0.55, 1]} intensity={2.1} />
      <directionalLight position={[-1, -0.3, -0.6]} intensity={0.35} color="#7aa2ff" />
      <Starfield />
      {wealthSteps.map((s) => (
        <CelestialBody
          key={s.title}
          step={s}
          active={activeSet.has(s.index)}
          reference={s.index === BASE_INDEX}
          animate={!reducedMotion}
        />
      ))}
      <CameraRig framed={framed} reducedMotion={reducedMotion} onView={onView} />
    </>
  );
}

export function ScaleCanvas(props: Props) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      frameloop="always"
      gl={{ antialias: true, powerPreference: "high-performance", logarithmicDepthBuffer: true }}
      camera={{ fov: 42, near: 0.01, far: 50_000_000, position: [0, 14, 44] }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
