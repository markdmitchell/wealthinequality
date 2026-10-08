# The Scale of Wealth

[![Framework: TanStack Start](https://img.shields.io/badge/framework-TanStack%20Start%20v1-0f172a?logo=react&logoColor=61dafb)](https://tanstack.com/start)
[![Built with React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![3D: Three.js](https://img.shields.io/badge/3D-Three.js%20%2B%20R3F-000000?logo=threedotjs&logoColor=white)](https://threejs.org)
[![Build: passing](https://img.shields.io/badge/build-passing-brightgreen)](https://wealthinequality.lovable.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An interactive 3D visualization of US wealth inequality, built so that **volume
equals dollars**. One sphere is the median US household net worth, rendered as
the Earth. Every other milestone is placed at true relative size beside it, from
a single dollar to the combined wealth of all US billionaires.

Live demo: <https://wealthinequality.lovable.app>

## The idea

Most inequality graphics break somewhere between a million and a trillion,
because a bar that is honest about $1 is invisible next to $7.8 trillion. This
one fixes the problem geometrically: money maps to a sphere's **volume**, so the
radius grows with the **cube root** of wealth.

```text
radius = 10 × ∛(wealth / 192,900)     ← Earth (median household) = radius 10
```

A $250 billion fortune is 1.3 million times the median household by volume, but
only about 109 times wider, the size of the Sun next to the Earth. The visual
therefore *understates* the gap it depicts, and the app says so out loud rather
than hiding it: a log-scale rail, explicit ratio readouts, and callout lines that
point at spheres too small to see.

## Running it locally

Requires [Bun](https://bun.sh) (the lockfile is `bun.lock`) and Node 20.19+ for
the tooling. npm works too if you prefer it.

```bash
bun install       # or: npm install
bun run dev       # dev server, http://localhost:8080
```

| Script | What it does |
| --- | --- |
| `bun run dev` | Start the dev server with hot reload |
| `bun run build` | Production build |
| `bun run build:dev` | Build in development mode (faster, unminified) |
| `bun run preview` | Serve the production build |
| `bun run lint` | ESLint over the whole repo |
| `bun run format` | Prettier write |
| `bunx tsgo --noEmit` | Typecheck (the check used during development) |

### Enabling the AI "Ask" panel

The Ask feature is the only part that needs a secret. It calls the Lovable AI
Gateway server-side, so the key must be present in the server environment:

```bash
LOVABLE_API_KEY=your_key_here bun run dev
```

Without it the app runs normally and every other feature works; Ask answers with
"AI is not configured." The key is never shipped to the browser; it is read
inside the request handler in `src/lib/ai/ask.server.ts`.

## Features

**Journey mode.** Eight steps, advanced with the buttons, the log rail, or the
left/right arrow keys. Each step frames the selected sphere directly beside the
median-household Earth at exact relative scale, so the comparison is always the
same two bodies; the reference never moves or resizes.

**Compare mode.** A sphere picker: toggle any of the eight bodies in or out of a
single shared frame, with shortcut presets: **All** (everything except the $1
rock), **Top & Bottom** (the richest person against the bottom 50%), and
**Reset**. At least two spheres stay selected so the frame is always a
comparison. The camera refits itself to whatever is active.

**AI Q&A.** The **Ask** panel takes free-text questions ("where would $1 billion
sit?", "how does the bottom 50% compare to all US billionaires?") and streams an
answer grounded in the same figures the spheres use, showing its arithmetic:
divide for the volume ratio, cube-root for the width. The system prompt is
generated from the step data itself, so answers cannot drift from the
visualization. Conversations persist in the visitor's browser only.

**Sources and method.** A **Sources** panel lists every figure, its citation, and
its as-of date.

**Callout labels.** Labels are drawn in screen space, not on the spheres, with a
leader line ending in a dot at each body's true projected centre. Plates are
pushed outside every sphere's silhouette and avoid the HUD panels and each
other, so a subpixel speck is still identified honestly instead of being
inflated.

**Considerate defaults.** Respects `prefers-reduced-motion` (the camera snaps
instead of flying), degrades gracefully when WebGL is unavailable, and re-lays
out for phones with icon-only header buttons, a compact compare sheet, and a
horizontal rail.

## The data

| # | Milestone | Wealth | Volume vs median | Radius vs median | Rendered as |
| --- | --- | --- | --- | --- | --- |
| 0 | One Dollar | $1 | 1 / 192,900 | 1 / 58 | Rocky asteroid |
| 1 | **Median US Household** | **$192,900** | **1×** | **1×** | **Earth (anchor)** |
| 2 | Median US Home | $400,000 | 2.07× | 1.28× | Terrestrial planet |
| 3 | Top 1% Household | $13,600,000 | 71× | 4.13× | Ringed gas giant |
| 4 | A Single Billionaire | $1,000,000,000 | 5,184× | 17× | Ringed gas giant |
| 5 | The Richest Person | $250,000,000,000 | 1.3 million× | 109× | Yellow dwarf star |
| 6 | Bottom 50% Combined | $3,800,000,000,000 | 19.7 million× | 270× | Crimson giant star |
| 7 | All US Billionaires | $7,800,000,000,000 | 40.4 million× | 343× | Red supergiant |

Edit all values, copy, colors, body types, and source keys in
`src/data/wealthSteps.ts`. The radii, ratios, log rail, callouts, camera framing,
AI system prompt, and source list are all derived from that one file, so adding
or removing a step updates the whole app.

## Project structure

```text
src/
  data/wealthSteps.ts        Single source of truth: figures, copy, sources, layout math
  routes/
    index.tsx                "/": renders WealthScale (client-only, ssr: false)
    api/ask.ts               POST /api/ask: streams the AI answer
  components/scale/
    WealthScale.tsx          App shell: state, header, panels, keyboard
    ScaleCanvas.tsx          R3F canvas; decides which bodies are in frame
    CameraRig.tsx            Fits the framed bodies into the panel-safe area
    CelestialBody.tsx        Sphere meshes, shaders, rings, cloud deck, star glow
    BodyLabels.tsx           Screen-space callouts, leader lines, collision handling
    InfoPanel.tsx            Title, value, description, ratio readout
    LogRail.tsx              Log-scale step rail (vertical on desktop, horizontal on mobile)
    NavControls.tsx          Previous / Next
    SourcesPanel.tsx         Figures, citations, as-of dates
    AskPanel.tsx             Chat UI for the AI Q&A
    Starfield.tsx            Background stars
    textures.ts              Procedural equirectangular surfaces (Earth, gas giants, stars, rock)
    viewportLayout.ts        Shared safe-area + reserved-panel geometry used by camera and labels
  components/ai-elements/    Conversation / message / prompt-input / shimmer primitives
  lib/ai/
    ask.server.ts            System prompt from step data, model call, stream handling
    run-id.server.ts         Forwards the AI Gateway run-id header for request tracing
  styles.css                 Tailwind v4 theme tokens, including the callout palette
AGENTS.md                    Conventions for working on this codebase
```

Stack: TanStack Start v1 (React 19, Vite, file-based routing), Three.js via
React Three Fiber and drei, Tailwind CSS v4, the AI SDK against the Lovable AI
Gateway.

## Notes on accuracy

- Figures are snapshots, not live. The richest-person number moves by tens of
  billions between weeks; the source panel records each as-of date.
- "A Single Billionaire" ($1B) and "Bottom 50% Combined" ($3.8T) are rounded
  benchmark figures: the first is the definition of a billionaire, the second
  a rounded Federal Reserve distributional-accounts total.
- `BASE_WEALTH`, the constant every radius and ratio is computed from, is the
  exact Federal Reserve figure, $192,900, so the arithmetic on screen matches
  the label down to the dollar.
- No sphere is ever scaled up for visibility. When a body falls below a pixel it
  stays geometrically true, and the callout points at its real position.

## Deployment

The build targets Cloudflare Workers via Nitro (`bun run build`). The project is
maintained in Lovable, where it is published to the URL above and to a stable
preview URL; pushing to the connected branch syncs changes back into the editor.
