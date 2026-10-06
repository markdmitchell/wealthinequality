import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BASE_INDEX, formatRatio, wealthSteps, type WealthStep } from "@/data/wealthSteps";
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
  /** Measured height of the phone bottom sheet. */
  bottomInset?: number | undefined;
}

interface SceneProps extends Props {
  visible: WealthStep[];
  labelNodes: LabelNodes;
  all: WealthStep[];
}

function Scene({
  step,
  compare,
  reducedMotion,
  onView,
  bottomInset,
  visible,
  labelNodes,
  all,
}: SceneProps) {
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
      <BodyLabels steps={visible} nodes={labelNodes} bottomInset={bottomInset} />
      <CameraRig
        framed={framed}
        compareMode={Boolean(compare?.length)}
        reducedMotion={reducedMotion}
        onView={onView}
        bottomInset={bottomInset}
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
          const reference = s.index === BASE_INDEX;
          return (
            <div key={s.title}>
              <svg className="absolute inset-0 size-full overflow-visible" aria-hidden>
                <path
                  ref={(el) => {
                    const current = labelNodes.get(s.index) ?? { plate: null, path: null, dot: null };
                    labelNodes.set(s.index, { ...current, path: el });
                  }}
                  fill="none"
                  stroke={s.accent}
                  strokeOpacity={active || reference ? 0.72 : 0.42}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  ref={(el) => {
                    const current = labelNodes.get(s.index) ?? { plate: null, path: null, dot: null };
                    labelNodes.set(s.index, { ...current, dot: el });
                  }}
                  r="2.5"
                  fill={s.accent}
                  stroke={s.accent}
                  strokeWidth="4"
                  strokeOpacity="0.22"
                />
              </svg>
              <div
                ref={(el) => {
                  const current = labelNodes.get(s.index) ?? { plate: null, path: null, dot: null };
                  labelNodes.set(s.index, { ...current, plate: el });
                }}
                className="absolute top-0 left-0 w-40 border border-border border-l-2 bg-callout px-3 py-2 text-left shadow-xl backdrop-blur-md transition-transform duration-200 ease-out will-change-transform sm:w-44"
                style={{ borderLeftColor: s.accent }}
              >
                <span className="flex items-center gap-1.5 font-mono text-[0.5rem] font-bold tracking-[0.12em] uppercase" style={{ color: s.accent }}>
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: s.accent }} />
                  {reference ? "Reference anchor" : active ? "Selected scale" : "Comparison"}
                </span>
                <strong className="mt-0.5 block truncate text-[0.68rem] leading-tight font-semibold text-foreground">
                  {s.title}
                </strong>
                <span className="mt-0.5 flex items-baseline justify-between gap-2 font-mono text-[0.58rem] text-callout-muted">
                  <span>{s.value}</span>
                  {!reference && <span className="text-[0.48rem]">{formatRatio(s.volumeRatio)} vol.</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
