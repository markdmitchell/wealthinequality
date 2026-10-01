import { formatRatio, type WealthStep } from "@/data/wealthSteps";

interface Props {
  step: WealthStep;
  index: number;
  total: number;
}

export function InfoPanel({ step, index, total }: Props) {
  const barPct = Math.min(100, Math.max(2, (Math.log10(step.wealth) / Math.log10(7.8e12)) * 100));
  // Long values (e.g. "$7,800,000,000,000") shrink so they never overflow the card.
  const valueSize =
    step.value.length > 15
      ? "clamp(0.95rem,2.6vw,1.35rem)"
      : step.value.length > 11
        ? "clamp(1.15rem,3.2vw,1.7rem)"
        : "clamp(1.4rem,4vw,2.1rem)";

  return (
    <section
      aria-live="polite"
      className="rounded-2xl border border-border bg-surface/85 p-5 backdrop-blur-xl sm:p-7"
    >
      <p className="mb-3 flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.12em] uppercase">
        <span
          className="rounded-full border px-2 py-0.5 tabular-nums"
          style={{ color: step.accent, borderColor: step.accent, background: `${step.accent}22` }}
        >
          Step {index + 1} / {total}
        </span>
      </p>

      <div className="mb-2 flex items-start gap-3">
        <span aria-hidden className="shrink-0 text-4xl leading-none drop-shadow">
          {step.emoji}
        </span>
        <h2 className="pt-1 text-lg leading-tight font-bold tracking-tight text-foreground">
          {step.title}
        </h2>
      </div>

      <p
        className="mb-5 font-mono text-[clamp(1.4rem,4vw,2.1rem)] leading-none font-bold tracking-tight"
        style={{ color: step.accent }}
      >
        {step.value}
      </p>

      <div className="mb-5">
        <p className="mb-2 text-[0.68rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Compared with the median household
        </p>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">
          <strong className="text-foreground">{formatRatio(step.volumeRatio)}</strong> the volume ·{" "}
          <strong className="text-foreground">{formatRatio(step.radiusRatio)}</strong> the radius
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${barPct}%`, background: step.accent }}
          />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
    </section>
  );
}
