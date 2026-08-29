import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

const base =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/85 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-xl transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35";

export function NavControls({ index, total, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={base} onClick={onPrev} disabled={index === 0}>
        <ArrowLeft className="size-4" aria-hidden />
        Previous
      </button>
      <button type="button" className={base} onClick={onNext} disabled={index === total - 1}>
        Next
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}
