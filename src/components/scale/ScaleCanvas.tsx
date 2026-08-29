import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import type { WealthStep } from "@/data/wealthSteps";
import { wealthSteps } from "@/data/wealthSteps";
import { CameraRig } from "./CameraRig";
import { CelestialBody } from "./CelestialBody";
import { Starfield } from "./Starfield";
import { disposeTextureCache } from "./textures";

interface Props {
  step: WealthStep;
  reducedMotion: boolean;
}

function Scene({ step, reducedMotion }: Props) {
  useEffect(() => () => disposeTextureCache(), []);

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
          active={s.title === step.title}
          animate={!reducedMotion}
        />
      ))}
      <CameraRig step={step} reducedMotion={reducedMotion} />
    </>
  );
}

export function ScaleCanvas({ step, reducedMotion }: Props) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      frameloop="always"
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 38, near: 0.001, far: 8_000_000, position: [4, 3, 12] }}
    >
      <Scene step={step} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
