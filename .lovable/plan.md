# The Scale of Wealth — ported to this app and improved

Rebuild the single-file `index.html` prototype from `markdmitchell/wealth-inequality-viz` as a real React page in this project, keeping the concept intact (11 steps from $1 to all US billionaires, each mapped to a solar-system body whose *volume* is proportional to wealth) while fixing the things the prototype gets wrong.

## What the port keeps

- All 11 data steps: title, dollar value, description, emoji, accent color, body type, background tint.
- The scale math: radius = base × (wealth / $192,000)^(1/3), Earth (median US household) as the baseline, bodies laid out along a line with a gap between them.
- The full visual vocabulary: procedural canvas textures (Earth with continents/clouds/ice caps, cratered Moon, banded gas giant with a storm spot and rings, ice giant, rocky asteroid, granulated star surfaces), additive glow sprites, lens-flare crosses on stars, a layered starfield, and the slow background-color shift per step.
- The interaction model: orbit/drag, scroll zoom, prev/next buttons, arrow keys, and a clickable step timeline, with animated camera flights between steps.

## What gets improved

1. **Mobile** — the prototype has one `@media (max-width: 600px)` rule and a fixed 340px side panel; on a phone the panel covers the body. Rework it as a bottom sheet on small screens, side panel on desktop, with a horizontally scrollable timeline and larger touch targets.
2. **Performance** — cap pixel ratio, generate each texture once and cache it (the prototype regenerates and never disposes), dispose geometries/materials/textures on unmount, and pause the render loop when the tab is hidden or the page is scrolled away. Target the mobile-web budget (under ~100 draw calls).
3. **Accessibility** — real buttons with labels, keyboard focus states, `aria-live` on the step panel so screen readers hear each step, respect `prefers-reduced-motion` (instant transitions instead of camera flights), and a text-only fallback list of all 11 figures for anyone without WebGL.
4. **Data honesty** — a "Sources & method" section listing where each figure comes from (Fed Survey of Consumer Finances for median net worth, Forbes/Bloomberg for billionaire figures, etc.), each with its as-of year, plus a plain-language note that the mapping is by volume, not radius — which is exactly why the visual shock is legitimate rather than exaggerated. Two figures also need review: the $3,840 "basic savings" step and the "1.09× radius" phrasing on the Lamborghini step, which compares a purchase price against a net worth.
5. **SEO / sharing** — proper page title, description, og/twitter metadata, semantic `h1`, and a JSON-LD entry for the visualization.

## Technical approach

- Stack: `three` + `@react-three/fiber` v9 + `@react-three/drei` v10 (React 19 compatible), installed fresh. No GSAP — camera and value tweens run in `useFrame` with frame-rate-independent easing, so there's one less dependency and no CDN scripts.
- Route: the visualization becomes the home page (`src/routes/index.tsx`) with `ssr: false`, since `<Canvas>` must not render on the server.
- Files:
  - `src/data/wealthSteps.ts` — step data plus the radius/layout math, framework-free and unit-testable.
  - `src/components/scale/textures.ts` — the procedural canvas texture factories, memoized per body type.
  - `src/components/scale/CelestialBody.tsx` — one body: mesh, texture, atmosphere, glow, rings, flare.
  - `src/components/scale/Starfield.tsx`, `CameraRig.tsx` — background stars and the animated camera flight/orbit controls.
  - `src/components/scale/ScaleCanvas.tsx` — the `<Canvas>`, lighting, and body list.
  - `src/components/scale/InfoPanel.tsx`, `Timeline.tsx`, `NavControls.tsx` — DOM overlay UI (responsive, accessible).
  - `src/components/scale/SourcesDialog.tsx` — the sources/method panel.
- Design tokens: the prototype's palette (near-black background, `#60a5fa` accent, Inter + Space Mono) goes into `src/styles.css` as semantic tokens; components use those tokens rather than hardcoded colors. Fonts load via a `<link>` in `__root.tsx`.
- Step state lives in one `useState` in the page component and drives both the DOM overlay and the camera target — no cross-wiring between imperative Three.js code and React.
- Verification: after building, I take browser screenshots at desktop and mobile widths and check the console for errors before calling it done.

## Note

Porting produces new code in this project; it does not modify the GitHub repo.
