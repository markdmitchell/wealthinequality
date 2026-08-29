import { BASE_RADIUS, formatCount } from "@/data/wealthSteps";

interface Props {
  /** World-space width currently covered by the screen. */
  viewWidth: number;
}

const EARTH_DIAMETER = BASE_RADIUS * 2;

export function ScaleBar({ viewWidth }: Props) {
  const earths = viewWidth / EARTH_DIAMETER;

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-border bg-surface/85 px-3 py-2 backdrop-blur-xl"
    >
      <p className="text-[0.6rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        Screen width
      </p>
      <p className="mt-1 font-mono text-sm font-bold text-foreground tabular-nums">
        {earths < 1 ? `${(earths * 100).toFixed(0)}%` : formatCount(earths)}
        <span className="ml-1 font-sans text-[0.68rem] font-medium text-muted-foreground">
          {earths < 1 ? "of an Earth" : earths < 2 ? "Earth" : "Earths"}
        </span>
      </p>
      <div className="mt-1.5 flex items-center gap-1.5" aria-hidden>
        <span className="h-px w-16 bg-foreground/45" />
        <span className="text-[0.55rem] text-muted-foreground">
          Earth = median US household
        </span>
      </div>
    </div>
  );
}
