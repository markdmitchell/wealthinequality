import { sources, wealthSteps, formatRatio } from "@/data/wealthSteps";

export function SourcesPanel() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
      <section>
        <h3 className="mb-2 text-base font-bold text-foreground">How the scale works</h3>
        <p>
          Each sphere's <strong className="text-foreground">volume</strong> is proportional to the
          dollar amount, with the median US household net worth drawn as the Earth. Because volume
          grows with the cube of radius, a sphere only looks twice as wide when the wealth behind it
          is eight times larger. That is why the early steps look almost identical and the last ones
          are unviewable at once: the visual restraint is in the geometry, not in the framing.
        </p>
        <p className="mt-2">
          Two of these figures are not net worth: a car's sticker price and a home's sale price are
          purchases, compared here against everything a median family owns minus everything it owes.
          The comparison is deliberate, and it is labelled as such on those steps.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-base font-bold text-foreground">Every figure, in text</h3>
        <ol className="space-y-2">
          {wealthSteps.map((s, i) => (
            <li key={s.title} className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-xs text-muted-foreground/70">{i + 1}.</span>
              <span className="font-semibold text-foreground">{s.title}</span>
              <span className="font-mono" style={{ color: s.accent }}>
                {s.value}
              </span>
              <span className="text-xs">
                ({formatRatio(s.volumeRatio)} the median household's net worth)
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-3 text-base font-bold text-foreground">Sources</h3>
        <dl className="space-y-4">
          {sources
            .filter((s) => s.id !== "unit")
            .map((s) => (
              <div key={s.id}>
                <dt className="font-semibold text-foreground">{s.label}</dt>
                <dd>
                  {s.detail} <span className="text-muted-foreground/70">As of {s.asOf}.</span>
                </dd>
              </div>
            ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground/70">
          Figures are rounded for legibility and change over time; billionaire net worth in
          particular is an estimate that moves daily.
        </p>
      </section>
    </div>
  );
}
