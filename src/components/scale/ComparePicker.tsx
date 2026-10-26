import { Layers, RotateCcw, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatYears, wealthSteps, workYears } from "@/data/wealthSteps";

interface Props {
  selected: number[];
  onToggle: (index: number) => void;
  onPreset: (selection: number[] | null) => void;
  onExit: () => void;
}

const allGroups = wealthSteps.filter((step) => step.index !== 0).map((step) => step.index);
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ComparePicker({ selected, onToggle, onPreset, onExit }: Props) {
  const allSelected = selected.length === allGroups.length && allGroups.every((index) => selected.includes(index));
  const topBottomSelected = selected.length === 2 && selected.includes(5) && selected.includes(6);

  return (
    <section aria-labelledby="compare-heading" className="rounded-lg border border-border bg-surface/85 p-4 backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="compare-heading" className="flex items-center gap-2 text-base font-bold text-foreground">
          <Layers className="size-4 text-primary" aria-hidden /> Compare wealth
        </h2>
        <span role="status" aria-live="polite" className="shrink-0 text-xs font-medium text-primary">
          {selected.length} selected
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Comparison presets">
        <Button variant={allSelected ? "secondary" : "outline"} size="sm" aria-pressed={allSelected} onClick={() => onPreset(allGroups)}>
          All groups
        </Button>
        <Button variant={topBottomSelected ? "secondary" : "outline"} size="sm" aria-pressed={topBottomSelected} onClick={() => onPreset([5, 6])}>
          Richest vs bottom 50%
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Reset comparison" title="Reset comparison" onClick={() => onPreset(null)}>
          <RotateCcw aria-hidden />
        </Button>
      </div>

      <fieldset className="mt-3 min-w-0">
        <legend className="mb-2 text-[0.68rem] font-medium text-muted-foreground">Wealth groups · minimum 2</legend>
        <div className="max-h-[224px] overflow-y-auto overscroll-contain pr-1 lg:max-h-[352px]">
          {wealthSteps.map((step) => {
            const checked = selected.includes(step.index);
            const disabled = checked && selected.length <= 2;
            return (
              <label
                key={step.index}
                htmlFor={`compare-group-${step.index}`}
                title={disabled ? "Keep at least two groups selected" : step.value}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-2.5 py-1.5 transition-colors focus-within:ring-1 focus-within:ring-ring ${checked ? "border-primary/25 bg-primary/10" : "border-transparent hover:bg-secondary/60"} ${disabled ? "cursor-not-allowed" : ""}`}
              >
                <Checkbox
                  id={`compare-group-${step.index}`}
                  checked={checked}
                  disabled={disabled}
                  aria-label={step.title}
                  onCheckedChange={() => onToggle(step.index)}
                  className="size-4"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-xs font-medium leading-snug ${checked ? "text-foreground" : "text-muted-foreground"}`}>{step.title}</span>
                  <span className="hidden text-[0.6rem] leading-snug text-muted-foreground lg:block">{formatYears(workYears(step.wealth))} of median income</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-foreground" aria-label={step.value}>{compactMoney.format(step.wealth)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-3 border-t border-border pt-3">
        <Button variant="outline" className="min-h-11 w-full" onClick={onExit}>
          <Route aria-hidden /> Back to journey
        </Button>
      </div>
    </section>
  );
}