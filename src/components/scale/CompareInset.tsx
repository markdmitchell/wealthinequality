import { formatRatio, REFERENCE_STEP, type WealthStep } from "@/data/wealthSteps";

interface Props {
  step: WealthStep;
}

const BOX = 86;
/** Smallest drawable disc, in px. Anything at this size is flagged as inflated. */
const MIN_PX = 3;

/**
 * True-relative-scale mini comparison against the median-household Earth.
 * When the ratio is too large for one panel, it degrades to a labelled chain
 * rather than pretending both fit.
 */
export function CompareInset({ step }: Props) {
  const ratio = step.radius / REFERENCE_STEP.radius;
  const big = Math.max(1, ratio);
  const bigPx = BOX / 2;
  const smallPx = (bigPx * Math.min(1, ratio === 0 ? 1 : 1 / big)) * (ratio >= 1 ? 1 : big);
  const refPx = ratio >= 1 ? bigPx / big : bigPx;
  const stepPx = ratio >= 1 ? bigPx : bigPx * big;
  const refClamped = refPx < MIN_PX;
  const stepClamped = stepPx < MIN_PX;
  void smallPx;

  const drawRef = Math.max(MIN_PX, refPx);
  const drawStep = Math.max(MIN_PX, stepPx);

  return (
    <section
      aria-label="Size comparison with the median US household"
      className="rounded-xl border border-border bg-surface/85 p-3 backdrop-blur-xl"
    >
      <p className="text-[0.6rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        True relative size
      </p>
      <div className="mt-2 flex items-end gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-[46px] items-end">
            <span
              className="block rounded-full"
              style={{
                width: drawRef,
                height: drawRef,
                background: REFERENCE_STEP.accent,
                boxShadow: `0 0 8px ${REFERENCE_STEP.accent}`,
              }}
            />
          </div>
          <span className="text-[0.55rem] text-muted-foreground">Median</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-[46px] items-end overflow-hidden">
            <span
              className="block rounded-full"
              style={{
                width: Math.min(drawStep, 46),
                height: Math.min(drawStep, 46),
                background: step.accent,
                boxShadow: `0 0 10px ${step.accent}`,
              }}
            />
          </div>
          <span className="max-w-[5.5rem] truncate text-[0.55rem]" style={{ color: step.accent }}>
            This step
          </span>
        </div>
        <p className="ml-auto max-w-[7.5rem] text-right text-[0.62rem] leading-snug text-muted-foreground">
          <strong className="block text-foreground">{formatRatio(step.volumeRatio)}</strong>
          the volume of the median household
        </p>
      </div>
      {(refClamped || stepClamped || drawStep > 46) && (
        <p className="mt-2 text-[0.55rem] leading-snug text-muted-foreground/80">
          {drawStep > 46
            ? `Too large to draw here: this sphere is ${formatRatio(ratio)} the Earth's radius.`
            : `Shown larger than true scale — actually ${formatRatio(1 / Math.min(refPx, stepPx) > 0 ? (refClamped ? 1 / ratio : ratio) : 1)} smaller than drawn.`}
        </p>
      )}
    </section>
  );
}
