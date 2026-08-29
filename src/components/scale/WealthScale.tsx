import { Info, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { wealthSteps } from "@/data/wealthSteps";
import { InfoPanel } from "./InfoPanel";
import { NavControls } from "./NavControls";
import { SourcesPanel } from "./SourcesPanel";
import { Timeline } from "./Timeline";

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
      setSupported(
        Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl")),
      );
    } catch {
      setSupported(false);
    }
  }, []);
  return supported;
}

export function WealthScale() {
  const [index, setIndex] = useState(2);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useWebglSupport();
  const step = wealthSteps[index] ?? wealthSteps[0]!;
  const total = wealthSteps.length;

  const go = useCallback(
    (next: number) => setIndex(Math.min(total - 1, Math.max(0, next))),
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

      {webgl === false ? null : (
        <Suspense fallback={null}>
          {webgl && <ScaleCanvas step={step} reducedMotion={reducedMotion} />}
        </Suspense>
      )}

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto">
          <h1 className="text-sm font-bold uppercase tracking-[0.22em] text-foreground/90">
            The Scale of Wealth
          </h1>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            US wealth, drawn as spheres whose volume matches the money.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSourcesOpen(true)}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/85 px-4 text-xs font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Info className="size-4" aria-hidden />
          Sources &amp; method
        </button>
      </header>

      {/* Desktop timeline */}
      <div className="pointer-events-auto absolute top-1/2 right-4 z-20 hidden w-56 -translate-y-1/2 lg:block">
        <Timeline index={index} onSelect={go} />
      </div>

      {/* Info panel: side on desktop, bottom sheet on mobile */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[62dvh] overflow-y-auto p-3 sm:p-4 lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-8 lg:max-h-none lg:w-[22rem] lg:-translate-y-1/2 lg:overflow-visible lg:p-0">
        <div className="lg:hidden">
          <div className="mb-2">
            <Timeline index={index} onSelect={go} />
          </div>
        </div>
        <InfoPanel step={step} index={index} total={total} />
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
