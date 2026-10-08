import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { sources, wealthSteps, formatRatio } from "@/data/wealthSteps";

const title = "Data Sources | The Scale of Wealth";
const description =
  "Every wealth milestone in the visualization, with its source, citation link, and as-of date.";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SourcesPage,
});

const sourceById = new Map(sources.map((s) => [s.id, s]));

function SourcesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the visualization
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Data sources</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every milestone in the visualization, with the figure used, its source, and the date the
          figure reflects. Figures are rounded for legibility and change over time; billionaire net
          worth in particular is an estimate that moves daily.
        </p>

        <ol className="mt-10 space-y-4">
          {wealthSteps.map((step) => {
            const source = sourceById.get(step.source);
            return (
              <li
                key={step.title}
                className="rounded-xl border border-border bg-card/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-semibold">{step.title}</span>
                  <span className="font-mono text-sm" style={{ color: step.accent }}>
                    {step.value}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRatio(step.volumeRatio)} the median household
                  </span>
                </div>
                {source && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>{source.detail}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>As of {source.asOf}</span>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                        >
                          {source.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <section className="mt-12">
          <h2 className="text-xl font-bold">Method</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Each sphere's <strong className="text-foreground">volume</strong> is proportional to the
            dollar amount, with the median US household net worth drawn as the Earth. Because volume
            grows with the cube of radius, a sphere only looks twice as wide when the wealth behind
            it is eight times larger. Some figures are not net worth: a home's sale price is a
            purchase, compared here against everything a median family owns minus everything it
            owes. The comparison is deliberate, and it is labelled as such on that step.
          </p>
        </section>
      </div>
    </div>
  );
}
