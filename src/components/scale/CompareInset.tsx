import { formatRatio, REFERENCE_STEP, type WealthStep } from "@/data/wealthSteps";

interface Props {
  step: WealthStep;
}

/** The larger of the two discs always draws at this size, in px. */
const MAX_PX = 44;
/** Smallest drawable disc. Anything clamped here is flagged as inflated. */
const MIN_PX = 3;

/**
 * True-relative-scale mini comparison against the median-household Earth.
 * The larger body fills the panel; the smaller is drawn at its honest fraction,
 * and if that lands below a visible minimum it is labelled as inflated.
 */
export function CompareInset({ step }: Props) {
  const ratio = step.radius / REFERENCE_STEP.radius;
  const isRef = step.index === REFERENCE_STEP.index;

  const truePx = ratio >= 1 ? { ref: MAX_PX / ratio, step: MAX_PX } : { ref: MAX_PX, step: MAX_PX * ratio };
  const drawRef = Math.max(MIN_PX, truePx.ref);
  const drawStep = Math.max(MIN_PX, truePx.step);
  const clampedSide = truePx.ref < MIN_PX ? "ref" : truePx.step < MIN_PX ? "step" : null;

  return (
    <section
      aria-label="Size comparison with the median US household"
      className="rounded-xl border border-border bg-surface/85 p-3 backdrop-blur-xl"
    >
      <p className="text-[0.6rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        True relative size
      </p>

      <div className="mt-2 flex items-end gap-4">
        <Disc label="Median" px={drawRef} color={REFERENCE_STEP.accent} />
        <Disc
          label={isRef ? "Same body" : "This step"}
          px={drawStep}
          color={step.accent}
          highlight
        />
        <p className="ml-auto max-w-[8rem] text-right text-[0.62rem] leading-snug text-muted-foreground">
          <strong className="block font-mono text-foreground">
            {formatRatio(step.volumeRatio)}
          </strong>
          the volume of the median household
        </p>
      </div>

      {clampedSide && (
        <p className="mt-2 text-[0.55rem] leading-snug text-muted-foreground/80">
          {clampedSide === "ref"
            ? `The median household is drawn larger than true scale — it is really ${formatRatio(ratio)} smaller across than this step.`
            : `This step is drawn larger than true scale — it is really ${formatRatio(1 / ratio)} smaller across than the median household.`}
        </p>
      )}
    </section>
  );
}

function Disc({
  label,
  px,
  color,
  highlight,
}: {
  label: string;
  px: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-[46px] items-end">
        <span
          className="block rounded-full"
          style={{
            width: px,
            height: px,
            background: color,
            boxShadow: `0 0 ${highlight ? 12 : 8}px ${color}`,
          }}
        />
      </div>
      <span
        className="text-[0.55rem]"
        style={{ color: highlight ? color : undefined }}
      >
        {label}
      </span>
    </div>
  );
}
