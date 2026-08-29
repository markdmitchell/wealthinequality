import { wealthSteps } from "@/data/wealthSteps";

interface Props {
  index: number;
  onSelect: (i: number) => void;
}

export function Timeline({ index, onSelect }: Props) {
  return (
    <nav aria-label="Wealth scale steps" className="w-full">
      <ol className="flex snap-x gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible">
        {wealthSteps.map((s, i) => {
          const active = i === index;
          return (
            <li key={s.title} className="snap-start lg:w-full">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className="group flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold whitespace-nowrap transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:w-full"
                style={{ color: active ? s.accent : undefined }}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full transition-transform"
                  style={{
                    background: active ? s.accent : "rgba(255,255,255,0.25)",
                    boxShadow: active ? `0 0 10px ${s.accent}` : undefined,
                    transform: active ? "scale(1.4)" : undefined,
                  }}
                />
                <span className={active ? "" : "text-muted-foreground group-hover:text-foreground"}>
                  {s.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
