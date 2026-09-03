import { Info, Layers, Route, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  buildWealthSteps,
  COMPARE_DEFAULT,
  SPACING_DEFAULT,
  SPACING_MAX,
  SPACING_MIN,
  wealthSteps,
} from "@/data/wealthSteps";
import { CompareInset } from "./CompareInset";
import { InfoPanel } from "./InfoPanel";
import { LogRail } from "./LogRail";
import { NavControls } from "./NavControls";
import { ScaleBar } from "./ScaleBar";
import { SourcesPanel } from "./SourcesPanel";

const SPACING_KEY = "wealth-scale-spacing";


const ScaleCanvas = lazy(() =>
  import("./ScaleCanvas").then((m) => ({ default: m.ScaleCanvas })),
);

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useWebglSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl")));
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

export function WealthScale() {
  const [index, setIndex] = useState(1);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [viewWidth, setViewWidth] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useWebglSupport();
  const step = wealthSteps[index] ?? wealthSteps[0]!;
  const total = wealthSteps.length;

  const go = useCallback(
    (next: number) => {
      setCompareMode(false);
      setIndex(Math.min(total - 1, Math.max(0, next)));
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(el.tagName)) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "Escape") setSourcesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const compare = useMemo(() => (compareMode ? COMPARE_DEFAULT : null), [compareMode]);

  const backdrop = useMemo(
    () => ({
      background: `radial-gradient(circle at 55% 45%, ${step.bgTint} 0%, #000 70%)`,
      transition: reducedMotion ? "none" : "background 1.8s ease",
    }),
    [step.bgTint, reducedMotion],
  );

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <div className="absolute inset-0" style={backdrop} aria-hidden />

      {webgl && (
        <Suspense fallback={null}>
          <ScaleCanvas
            step={step}
            compare={compare}
            reducedMotion={reducedMotion}
            onView={setViewWidth}
          />
        </Suspense>
      )}

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          <h1 className="text-sm font-bold tracking-[0.22em] text-foreground/90 uppercase">
            The Scale of Wealth
          </h1>
          <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
            Every sphere's volume matches the money. Each step keeps the one before it in frame.
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCompareMode((v) => !v)}
              aria-pressed={compareMode}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/85 px-4 text-xs font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {compareMode ? (
                <Route className="size-4" aria-hidden />
              ) : (
                <Layers className="size-4" aria-hidden />
              )}
              {compareMode ? "Journey" : "Compare"}
            </button>
            <button
              type="button"
              onClick={() => setSourcesOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/85 px-4 text-xs font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Info className="size-4" aria-hidden />
              <span className="hidden sm:inline">Sources &amp; method</span>
              <span className="sm:hidden">Sources</span>
            </button>
          </div>
          {webgl && viewWidth > 0 && (
            <div className="hidden sm:block">
              <ScaleBar viewWidth={viewWidth} />
            </div>
          )}
        </div>
      </header>

      {/* Log rail: vertical on desktop */}
      <div className="pointer-events-auto absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 lg:block">
        <LogRail index={index} onSelect={go} orientation="vertical" />
      </div>

      {/* Info panel: side on desktop, bottom sheet on mobile */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[64dvh] overflow-y-auto p-3 sm:p-4 lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-8 lg:max-h-none lg:w-[22rem] lg:-translate-y-1/2 lg:overflow-visible lg:p-0">
        <div className="mb-2 lg:hidden">
          <LogRail index={index} onSelect={go} orientation="horizontal" />
        </div>

        {compareMode ? (
          <section className="rounded-2xl border border-border bg-surface/85 p-5 backdrop-blur-xl sm:p-7">
            <h2 className="text-lg font-bold text-foreground">Side by side</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Four spheres in one frame at true relative scale: the median household, the median
              home, a top 1% household, and the world's richest person. The first three are already
              specks — that gap is the whole point.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs">
              {COMPARE_DEFAULT.map((i) => {
                const s = wealthSteps[i]!;
                return (
                  <li key={s.title} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: s.accent }}
                    />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{s.title}</strong> — {s.value}
                    </span>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setCompareMode(false)}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Route className="size-4" aria-hidden />
              Back to the journey
            </button>
          </section>
        ) : (
          <>
            <InfoPanel step={step} index={index} total={total} />
            <div className="mt-3">
              <CompareInset step={step} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <NavControls
                index={index}
                total={total}
                onPrev={() => go(index - 1)}
                onNext={() => go(index + 1)}
              />
              <p className="hidden text-[0.68rem] text-muted-foreground/70 lg:block">
                Drag to orbit · scroll to zoom · ← → keys
              </p>
            </div>
          </>
        )}
      </div>

      {webgl === false && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-background p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            Your browser can&apos;t render the 3D view
          </h2>
          <SourcesPanel />
        </div>
      )}

      {/* Sources dialog */}
      {sourcesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sources and method"
          className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSourcesOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setSourcesOpen(false)}
              aria-label="Close sources"
              className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden />
            </button>
            <h2 className="mb-6 pr-12 text-xl font-bold text-foreground">Sources &amp; method</h2>
            <SourcesPanel />
          </div>
        </div>
      )}

      {/* Always-available text version for assistive tech */}
      <div className="sr-only">
        <h2>All figures in this visualization</h2>
        <SourcesPanel />
      </div>
    </main>
  );
}
