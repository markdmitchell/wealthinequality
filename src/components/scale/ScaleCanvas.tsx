import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BASE_INDEX, wealthSteps, type WealthStep } from "@/data/wealthSteps";
import { BodyLabels, type LabelNodes } from "./BodyLabels";
import { CameraRig } from "./CameraRig";
import { CelestialBody } from "./CelestialBody";
import { Starfield } from "./Starfield";
import { disposeTextureCache } from "./textures";

interface Props {
  step: WealthStep;
  /** Journey mode frames current + median anchor; compare mode frames a chosen set. */
  compare: number[] | null;
  reducedMotion: boolean;
  onView?: ((viewWidth: number) => void) | undefined;
  /** Layout rebuilt for the current anchored comparison. */
  steps?: WealthStep[] | undefined;
}

interface SceneProps extends Props {
  visible: WealthStep[];
  labelNodes: LabelNodes;
  all: WealthStep[];
}

function Scene({ step, compare, reducedMotion, onView, visible, labelNodes, all }: SceneProps) {
  useEffect(() => () => disposeTextureCache(), []);

  const framed = useMemo(() => {
    if (compare && compare.length > 0) {
      return compare
        .map((i) => all[i])
        .filter((s): s is WealthStep => Boolean(s))
        .sort((a, b) => a.x - b.x);
    }
    const reference = all[BASE_INDEX];
    if (!reference || step.index === BASE_INDEX) return [step];
    return [reference, step].sort((a, b) => a.x - b.x);
  }, [compare, step, all]);

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
      {visible.map((s) => (
        <CelestialBody
          key={s.title}
          step={s}
          active={activeSet.has(s.index)}
          reference={s.index === BASE_INDEX}
          animate={!reducedMotion}
        />
      ))}
      <BodyLabels steps={visible} nodes={labelNodes} />
      <CameraRig
        framed={framed}
        compareMode={Boolean(compare?.length)}
        reducedMotion={reducedMotion}
        onView={onView}
      />
    </>
  );
}

export function ScaleCanvas(props: Props) {
  const { compare, step, steps } = props;
  const labelNodes = useRef<LabelNodes>(new Map()).current;
  const all = steps ?? wealthSteps;

  const visible = useMemo(
    () => {
      if (compare && compare.length > 0) return all.filter((s) => compare.includes(s.index));
      return all.filter((s) => s.index === BASE_INDEX || s.index === step.index);
    },
    [compare, all, step.index],
  );

  const activeSet = useMemo(
    () => new Set(compare && compare.length ? compare : [step.index]),
    [compare, step.index],
  );


  return (
    <div className="absolute inset-0">
      <Canvas
        className="absolute inset-0"
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, powerPreference: "high-performance", logarithmicDepthBuffer: true }}
        camera={{ fov: 42, near: 0.01, far: 50_000_000, position: [0, 14, 44] }}
      >
        <Scene {...props} visible={visible} labelNodes={labelNodes} all={all} />
      </Canvas>

      {/* Screen-space labels: always on screen, even for off-frame or invisible bodies. */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
        {visible.map((s) => {
          const active = activeSet.has(s.index);
          return (
            <div
              key={s.title}
              ref={(el) => {
                labelNodes.set(s.index, el);
              }}
              className="absolute top-0 left-0 whitespace-nowrap text-center will-change-transform"
            >
              <span
                className="rounded-full border px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.08em] uppercase backdrop-blur-sm"
                style={{
                  color: s.accent,
                  borderColor: active ? `${s.accent}cc` : `${s.accent}55`,
                  background: active ? "rgba(3,5,12,0.88)" : "rgba(3,5,12,0.66)",
                }}
              >
                {s.title}
              </span>
              <span className="mt-0.5 block text-[0.55rem] text-white/70">{s.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
