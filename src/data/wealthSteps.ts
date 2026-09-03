export type BodyType =
  | "rocky"
  | "moon"
  | "earth"
  | "terrestrial"
  | "ice"
  | "gas"
  | "star"
  | "giant-star"
  | "supergiant";

export interface WealthStepInput {
  title: string;
  value: string;
  desc: string;
  wealth: number;
  color: number;
  accent: string;
  emoji: string;
  bodyType: BodyType;
  bgTint: string;
  source: string;
}

export interface WealthStep extends WealthStepInput {
  index: number;
  radius: number;
  /** Centre X. Bodies rest on a shared baseline and nearly touch. */
  x: number;
  /** Centre Y — every body sits on the plane y = 0. */
  y: number;
  radiusRatio: number;
  volumeRatio: number;
}

/** Median US household net worth — the Earth baseline for the whole scene. */
export const BASE_WEALTH = 192_000;
export const BASE_RADIUS = 10;
export const BASE_INDEX = 1;


const rawSteps: WealthStepInput[] = [
  {
    title: "One Dollar",
    value: "$1",
    desc: "A single dollar bill. On this cosmic scale, one dollar maps to a small rocky asteroid drifting silently through space.",
    wealth: 1,
    color: 0x86efac,
    accent: "#86efac",
    emoji: "💵",
    bodyType: "rocky",
    bgTint: "#0f190f",
    source: "unit",
  },
  {
    title: "Median US Household",
    value: "$192,900",
    desc: "The median US household net worth. Half of all American families have less than this. Here it becomes the Earth — the baseline for everything that follows.",
    wealth: BASE_WEALTH,
    color: 0x3b82f6,
    accent: "#60a5fa",
    emoji: "🌍",
    bodyType: "earth",
    bgTint: "#050a1c",
    source: "scf",
  },
  {
    title: "Median US Home",
    value: "$400,000",
    desc: "The typical American home sells for more than twice the typical family's entire net worth — and still only a 1.28× wider sphere.",
    wealth: 400_000,
    color: 0x22c55e,
    accent: "#4ade80",
    emoji: "🏠",
    bodyType: "terrestrial",
    bgTint: "#001208",
    source: "census-hud",
  },
  {
    title: "Top 1% Household",
    value: "$13,600,000",
    desc: "Entering the top 1% takes roughly $13.6M — a ringed gas giant over 4× the radius of the median family's whole net worth.",
    wealth: 13_600_000,
    color: 0xa855f7,
    accent: "#c084fc",
    emoji: "🎩",
    bodyType: "gas",
    bgTint: "#0f001e",
    source: "scf",
  },
  {
    title: "The Richest Person",
    value: "$250,000,000,000",
    desc: "The world's richest individual. On this scale his wealth becomes the Sun — over a million times the volume of the Earth that stood for the median family.",
    wealth: 250_000_000_000,
    color: 0xfbbf24,
    accent: "#fde68a",
    emoji: "🚀",
    bodyType: "star",
    bgTint: "#160f00",
    source: "billionaire-index",
  },
  {
    title: "All US Billionaires",
    value: "$7,800,000,000,000",
    desc: "The combined wealth of roughly 900 US billionaires. A red supergiant so enormous the Sun is invisible inside it.",
    wealth: 7_800_000_000_000,
    color: 0xff4040,
    accent: "#ff8080",
    emoji: "👑",
    bodyType: "supergiant",
    bgTint: "#140202",
    source: "forbes",
  },
];

/** Volume scales linearly with wealth, so radius scales with the cube root. */
export function calcRadius(wealth: number): number {
  return BASE_RADIUS * Math.cbrt(wealth / BASE_WEALTH);
}

/** User-tunable spacing factor: multiples of the larger body's radius. */
export const SPACING_DEFAULT = 0.55;
export const SPACING_MIN = 0.1;
export const SPACING_MAX = 4;

/**
 * Shared-baseline layout: every body rests on the plane y = 0 with its centre at
 * y = radius. The gap before a body scales mostly with that body's own (larger)
 * radius, so as the focus grows the smaller predecessors are pushed apart by a
 * proportionally huge distance instead of collapsing into one another.
 */
function buildSteps(input: WealthStepInput[], spacing = SPACING_DEFAULT): WealthStep[] {
  const out: WealthStep[] = [];
  input.forEach((s, i) => {
    const radius = calcRadius(s.wealth);
    let x = 0;
    const p = out[i - 1];
    if (p) {
      const gap = radius * spacing + p.radius * 0.2;
      x = p.x + p.radius + gap + radius;
    }

    out.push({
      ...s,
      index: i,
      radius,
      x,
      y: radius,
      radiusRatio: radius / BASE_RADIUS,
      volumeRatio: s.wealth / BASE_WEALTH,
    });
  });
  return out;
}

/** Rebuild the layout for a user-chosen spacing factor. */
export function buildWealthSteps(spacing: number): WealthStep[] {
  return buildSteps(rawSteps, Math.min(SPACING_MAX, Math.max(SPACING_MIN, spacing)));
}

export const wealthSteps: WealthStep[] = buildSteps(rawSteps);

/** The median-household Earth: the reference body that is never removed. */
export const REFERENCE_STEP: WealthStep = wealthSteps[BASE_INDEX]!;


/** Bodies shown side by side by default in compare mode. */
export const COMPARE_DEFAULT = [1, 2, 3, 4];

export const LUMINOUS: BodyType[] = ["star", "giant-star", "supergiant"];

export function isLuminous(t: BodyType): boolean {
  return LUMINOUS.includes(t);
}

export function formatRatio(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} trillion×`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion×`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} million×`;
  if (n >= 1000) return `${Math.round(n).toLocaleString("en-US")}×`;
  if (n >= 10) return `${n.toFixed(0)}×`;
  if (n >= 1) return `${n.toFixed(2)}×`;
  return `1 / ${Math.round(1 / n).toLocaleString("en-US")}`;
}

/** Compact count, e.g. 41,000 or 3.4 million. */
export function formatCount(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} trillion`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} million`;
  if (n >= 1000) return Math.round(n).toLocaleString("en-US");
  if (n >= 10) return n.toFixed(0);
  return n.toFixed(1);
}

/** Ratio between two steps, phrased for the info panel. */
export function ratioSentence(step: WealthStep, prev?: WealthStep): string | null {
  if (!prev) return null;
  const vol = step.wealth / prev.wealth;
  const rad = step.radius / prev.radius;
  return `${formatRatio(vol)} the volume of ${prev.title.toLowerCase()} — ${formatRatio(rad)} the radius.`;
}


export interface SourceEntry {
  id: string;
  label: string;
  detail: string;
  asOf: string;
}

export const sources: SourceEntry[] = [
  {
    id: "scf",
    label: "Median household net worth · top 1% threshold",
    detail:
      "Federal Reserve Survey of Consumer Finances (median net worth $192,900) and Fed Distributional Financial Accounts for the top 1% entry threshold.",
    asOf: "2022 survey, released 2023",
  },
  {
    id: "census-hud",
    label: "Median US home price",
    detail: "Census Bureau / HUD median sales price of houses sold in the United States, rounded.",
    asOf: "2024",
  },
  {
    id: "billionaire-index",
    label: "Richest individual",
    detail:
      "Bloomberg Billionaires Index / Forbes real-time net worth. This figure moves by tens of billions week to week.",
    asOf: "2025 snapshot",
  },
  {
    id: "forbes",
    label: "Combined US billionaire wealth",
    detail: "Forbes 400 / Americans for Tax Fairness tallies of aggregate US billionaire wealth.",
    asOf: "2024",
  },
  {
    id: "unit",
    label: "One dollar",
    detail: "The unit of the scale.",
    asOf: "—",
  },
];
