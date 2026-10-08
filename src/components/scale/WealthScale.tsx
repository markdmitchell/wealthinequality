import { Info, Layers, MessageCircleQuestion, Route, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildAnchoredSteps,
  buildAutoSteps,
  COMPARE_DEFAULT,
  SPACING_DEFAULT,
  wealthSteps,
} from "@/data/wealthSteps";
import { AskPanel } from "./AskPanel";
import { InfoPanel } from "./InfoPanel";
import { LogRail } from "./LogRail";
import { NavControls } from "./NavControls";
import { SourcesPanel } from "./SourcesPanel";



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
  const [askOpen, setAskOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useWebglSupport();

  // The phone bottom sheet (scale rail + info card) is far taller than any
  // viewport formula predicts, so its real height is measured and shared with
  // the camera and the callout overlay.
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [sheetH, setSheetH] = useState(0);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => setSheetH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [picked, setPicked] = useState<number[] | null>(null);
  const defaultSet = useMemo(
    () => [...new Set([...COMPARE_DEFAULT, index])].sort((a, b) => a - b),
    [index],
  );
  const compareSet = picked ?? defaultSet;
  const toggleSphere = (i: number) => {
    const cur = new Set(compareSet);
    if (cur.has(i)) {
      if (cur.size <= 2) return;
      cur.delete(i);
    } else cur.add(i);
    setPicked([...cur].sort((a, b) => a - b));
  };
  const allButDollar = wealthSteps.map((s) => s.index).filter((i) => i !== 0);

  const steps = useMemo(
    () =>
      compareMode
        ? buildAutoSteps(compareSet, SPACING_DEFAULT)
        : buildAnchoredSteps(index),
    [compareMode, index, compareSet],
  );
  const step = steps[index] ?? steps[0]!;
  const total = wealthSteps.length;



  const go = useCallback(
    (next: number) => {
      setCompareMode(false);
      setPicked(null);
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
      if (e.key === "Escape") {
        setSourcesOpen(false);
        setAskOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const compare = useMemo(() => (compareMode ? compareSet : null), [compareMode, compareSet]);

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
            steps={steps}
            compare={compare}
            reducedMotion={reducedMotion}
            bottomInset={sheetH}
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
            Every sphere's volume matches the money. The median household remains the anchor.
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setCompareMode((v) => !v); setPicked(null); }}
              aria-pressed={compareMode}
              aria-label={compareMode ? "Journey" : "Compare"}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/85 px-4 text-xs font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {compareMode ? (
                <Route className="size-4" aria-hidden />
              ) : (
                <Layers className="size-4" aria-hidden />
              )}
              <span className="hidden sm:inline">{compareMode ? "Journey" : "Compare"}</span>
            </button>
            <button
              type="button"
              onClick={() => setAskOpen((v) => !v)}
              aria-pressed={askOpen}
              aria-label="Ask"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/85 px-4 text-xs font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <MessageCircleQuestion className="size-4" aria-hidden />
              <span className="hidden sm:inline">Ask</span>
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
        </div>
      </header>

      {/* Log rail: vertical on desktop */}
      <div className="pointer-events-auto absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 lg:block">
        <LogRail index={index} onSelect={go} orientation="vertical" />
      </div>

      {/* Info panel: side on desktop, bottom sheet on mobile */}
      <div
        ref={sheetRef}
        className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[64dvh] overflow-y-auto p-3 sm:p-4 lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-8 lg:max-h-none lg:w-[23.5rem] lg:-translate-y-1/2 lg:overflow-visible lg:p-0"
      >
        <div className="mb-2 lg:hidden">
          <LogRail index={index} onSelect={go} orientation="horizontal" />
        </div>




        {compareMode ? (
          <section className="rounded-2xl border border-border bg-surface/85 p-4 backdrop-blur-xl sm:p-7">
            <h2 className="text-base font-bold text-foreground sm:text-lg">Side by side</h2>
            <p className="mt-2 hidden text-sm sm:block leading-relaxed text-muted-foreground">
              Pick any spheres (at least two) to see them in one frame at true relative
              scale, always including the median household. Smaller ones become tiny specks; that
              gap is the whole point.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { label: "All", set: allButDollar },
                { label: "Top & Bottom", set: [5, 6] },
                { label: "Reset", set: null as number[] | null },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setPicked(b.set)}
                  className="min-h-8 rounded-full border border-border px-3 text-[0.68rem] font-semibold text-foreground transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {b.label}
                </button>
              ))}
            </div>
            <ul className="mt-2 space-y-0.5 text-xs sm:mt-3">
              {wealthSteps.map((s) => {
                const on = compareSet.includes(s.index);
                const locked = on && compareSet.length <= 2;
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-disabled={locked}
                      title={locked ? "Keep at least two spheres" : undefined}
                      onClick={() => toggleSphere(s.index)}
                      className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${on ? "" : "opacity-45"}`}
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full border"
                        style={{ background: on ? s.accent : "transparent", borderColor: s.accent }}
                      />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{s.title}</strong>: {s.value}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => { setCompareMode(false); setPicked(null); }}
              className="mt-3 inline-flex min-h-11 sm:mt-5 items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Route className="size-4" aria-hidden />
              Back to the journey
            </button>
          </section>
        ) : (
          <>
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
          </>
        )}
      </div>

      {askOpen && (
        <div className="absolute inset-x-2 top-20 bottom-2 z-30 sm:inset-x-auto sm:right-4 sm:w-[24rem] lg:top-24 lg:bottom-6">
          <AskPanel onClose={() => setAskOpen(false)} />
        </div>
      )}

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
