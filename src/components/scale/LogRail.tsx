import { wealthSteps } from "@/data/wealthSteps";

interface Props {
  index: number;
  onSelect: (i: number) => void;
  /** Horizontal rail for mobile, vertical for desktop. */
  orientation?: "horizontal" | "vertical";
}

const MIN_LOG = 0;
const MAX_LOG = Math.log10(7.8e12);

const DECADES = [
  { v: 1, label: "$1" },
  { v: 1e3, label: "$1K" },
  { v: 1e6, label: "$1M" },
  { v: 1e9, label: "$1B" },
  { v: 1e12, label: "$1T" },
];

function pct(wealth: number) {
  return ((Math.log10(wealth) - MIN_LOG) / (MAX_LOG - MIN_LOG)) * 100;
}

/**
 * Log-scale rail: stops are positioned by log10(wealth), so twelve orders of
 * magnitude become a distance you can see yourself travel.
 */
export function LogRail({ index, onSelect, orientation = "vertical" }: Props) {
  const vertical = orientation === "vertical";
  const active = wealthSteps[index]!;

  if (!vertical) {
    return (
      <nav aria-label="Wealth scale steps" className="w-full">
        <div className="relative h-9 w-full">
          <span className="absolute top-4 right-0 left-0 h-px bg-white/15" aria-hidden />
          {DECADES.map((d) => (
            <span
              key={d.label}
              aria-hidden
              className="absolute top-[1.35rem] -translate-x-1/2 font-mono text-[0.5rem] text-muted-foreground/70"
              style={{ left: `${pct(d.v)}%` }}
            >
              {d.label}
            </span>
          ))}
          {wealthSteps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`${s.title}, ${s.value}`}
              className="absolute top-0 size-8 -translate-x-1/2 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              style={{ left: `${pct(s.wealth)}%` }}
            >
              <span
                aria-hidden
                className="absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full transition-all"
                style={{
                  width: i === index ? 12 : 6,
                  height: i === index ? 12 : 6,
                  background: i === index ? s.accent : "rgba(255,255,255,0.35)",
                  boxShadow: i === index ? `0 0 10px ${s.accent}` : undefined,
                }}
              />
            </button>
          ))}
        </div>
        <p className="mt-1 text-center text-[0.6rem] font-semibold" style={{ color: active.accent }}>
          {active.title} · {active.value}
        </p>
      </nav>
    );
  }

  return (
    <nav aria-label="Wealth scale steps" className="relative h-[62dvh] w-56">
      <span className="absolute top-0 bottom-0 left-3 w-px bg-white/15" aria-hidden />
      {DECADES.map((d) => (
        <span
          key={d.label}
          aria-hidden
          className="absolute left-0 flex -translate-y-1/2 items-center gap-1"
          style={{ bottom: `${pct(d.v)}%` }}
        >
          <span className="ml-1 block h-px w-4 bg-white/25" />
          <span className="font-mono text-[0.55rem] text-muted-foreground/70">{d.label}</span>
        </span>
      ))}
      {wealthSteps.map((s, i) => {
        const isActive = i === index;
        return (
          <button
            key={s.title}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isActive ? "step" : undefined}
            className="group absolute left-0 flex min-h-8 -translate-y-1/2 items-center gap-2 rounded-lg pr-2 pl-1.5 text-left text-[0.7rem] font-semibold whitespace-nowrap transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            style={{ bottom: `${pct(s.wealth)}%`, color: isActive ? s.accent : undefined }}
          >
            <span
              aria-hidden
              className="block shrink-0 rounded-full transition-all"
              style={{
                width: isActive ? 11 : 7,
                height: isActive ? 11 : 7,
                background: isActive ? s.accent : "rgba(255,255,255,0.3)",
                boxShadow: isActive ? `0 0 10px ${s.accent}` : undefined,
              }}
            />
            <span className={isActive ? "" : "text-muted-foreground group-hover:text-foreground"}>
              {s.title}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
