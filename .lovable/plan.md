# Fix the scale problem: make relative size the whole experience

## What's broken today

Each step flies the camera to `distance = radius * 3.9` of the current sphere. That framing is size-relative, so a $1 pebble and a $7.8T star occupy exactly the same fraction of the screen. The viewer sees eleven pretty spheres of the same apparent size and learns nothing. The bodies are also spaced apart proportional to their own radii, so neighbours are always off-frame — there is never a second object to compare against.

Scale is only legible against a reference that stays visible. The rebuild makes that reference permanent.

## The new core mechanic: one continuous zoom-out

All eleven bodies sit in one world, resting on a shared baseline (bottoms aligned, like a size-comparison chart), ordered smallest to largest. Moving forward never re-frames to a constant apparent size — the camera pulls **back and up** along a single continuous path, and the framing rule changes to:

> Frame the current body **and the previous body** in the same shot.

So at each step the thing you were just looking at is still on screen, visibly shrinking: groceries shrink beside the Earth-sized median household, the median household shrinks to a pea beside the top 1%, and by the billionaire step everything before it is a sub-pixel speck. The shrinking is the story, and it happens on screen rather than in a caption.

Transitions are one continuous dolly, never a cut, so the eye tracks the old object out as the new one grows in.

## Three reinforcing scale readouts

1. **Persistent Earth reference.** From the median-household step onward, that sphere is labelled and never removed. Once it becomes smaller than a few pixels it is drawn as a minimum-size marker with a leader line reading "median US household" — always present, always shrinking, never invisible.

2. **Live scale bar (HUD).** A bar in the corner reading how much world-space one screen-width currently covers, in Earth-diameters: "screen width = 1.4 Earths" then "= 320 Earths" then "= 41,000 Earths". This turns the dolly into a number that keeps climbing.

3. **Compare inset.** A small always-on panel showing the current body and the median-household Earth drawn to true relative scale within that panel, with the smaller one clamped to a visible minimum and marked as such. Where the ratio exceeds what one panel can show honestly, it switches to a stacked "chain" readout: Earth → top 1% → richest person, each labelled with its multiplier.

## Log-scale journey rail

The timeline is replaced by a vertical (desktop) / horizontal (mobile) **log rail**: eleven stops positioned by `log10(wealth)`, with decade ticks ($1, $10, $100 … $1T). The current position slides along it. Dollar amounts spanning twelve orders of magnitude become a visible distance travelled, and clicking a stop still jumps there.

## Second view: Compare mode

A toggle that leaves the flight and lays several chosen bodies side by side on the baseline at true relative scale, camera framed to fit them all. Default selection: median household, median home, top 1%, richest person. This is the static "look at these together" shot the current build can't produce, and it is what people screenshot and share.

## Honest handling of impossible ratios

The richest-person sphere is ~1.3 million times the median household's volume; all-US-billionaires is far beyond that. Rather than pretend both are visible at once, each step states its ratio in words next to the visual, and the visualisation labels any body clamped to a minimum size as "shown larger than true scale — actually N× smaller". Accuracy is part of the point of the piece.

## Technical notes

- **Layout** (`src/data/wealthSteps.ts`): replace the size-proportional gap spacing with a shared-baseline layout — every body's centre at `y = radius`, `x` accumulated as `prevX + prevRadius + radius + tightGap`, so consecutive bodies nearly touch and both fit in one frame. Keep the cube-root volume scaling and all figures unchanged.
- **Camera** (`CameraRig.tsx`): replace the single-body framing with a two-body fit — compute the bounding span of the current and previous bodies plus their baseline, derive distance from that span and the FOV, and aim the target at the pair's midpoint rather than the body centre. Keep the frame-rate-independent `Math.exp` easing and reduced-motion snap; extend easing time so the pull-back reads as travel.
- **Rendering across 12 orders of magnitude**: the tiny bodies vanish into depth precision at far zoom. Add a logarithmic depth buffer on the renderer and keep the existing wide near/far range; the smallest bodies get a screen-space minimum-size marker so they never disappear entirely.
- **Perf**: only bodies within the current frame's span get full material/atmosphere/ring detail; distant ones downgrade to a flat billboard marker. Textures stay in the existing cache.
- **New components**: `ScaleBar.tsx` (HUD readout), `CompareInset.tsx`, `LogRail.tsx` (replaces `Timeline.tsx`), `CompareMode.tsx`. `InfoPanel.tsx` gains the ratio-in-words line; `WealthScale.tsx` gains the compare-mode toggle.
- Accessibility, reduced-motion, keyboard nav, WebGL text fallback, and the sources panel all carry over; the fallback text gains the ratio chain so it reads as a scale story without WebGL.

## Verification

Screenshot the same journey at desktop and mobile widths and confirm from the images alone that consecutive steps show visibly different sizes, that the median-household reference is present in every late-step frame, and that the scale bar number climbs. If any two steps look the same size, the framing is still wrong.
