# Restore true relative sizing under auto-tuned spacing

## What the screenshots show

Auto-tune fixed the label stacking but broke the framing that carried the size story:

- Step 4 (Top 1%): the focused purple giant sits far right and is clipped by the frame edge, while the previous body (green home sphere) is clipped at the bottom left behind the info panel. The HUD reads "screen width = 7.4 Earths" although the focused sphere alone is 8.3 Earth-diameters across, so the readout and the picture disagree.
- Step 5 (Richest Person): the Sun fills the frame and the previous body (Top 1%) is entirely off-screen: its label is parked on the right edge. There is nothing left in frame to compare against, which was the whole point of the rebuild.

Two causes, both verified in the code:

1. The auto gap floor is a fraction of the focused sphere's radius with no relation to the frame. As the focus grows, the previous body is pushed so far along the baseline that it leaves the shot.
2. The camera fit in `CameraRig.tsx` is inconsistent with the scene: it fits the horizontal span but only `maxY` (half the vertical extent) for height, aims at `y = maxY * 0.45`, and then places the camera along an off-axis direction `(0.12, 0.16, 1)`. The fit math assumes a straight-on view, so off-axis bodies fall outside the computed frame and get clipped.

## The fix

**Frame first, then space.** Spacing becomes a function of the frame rather than the sphere:

- Compute the pair to frame (current + previous, or the compare set) and lay out the whole scene as today, but clamp the auto gap so the pair's total span never exceeds a budget: roughly 2.6× the focused sphere's diameter. Below that budget the gap grows with the focus (keeping small spheres and labels apart, as the user asked); above it the gap stops growing, so the previous body always stays inside the shot.
- Small bodies that would still collide within the budget spread using the existing per-focus floor, since at that zoom their combined width is a tiny fraction of the frame.

**Correct the camera fit.** Rewrite the framing computation to a true bounding-box fit:

- Build the framed set's world-space AABB (min/max on x and y, using each body's baseline centre and radius).
- Aim the camera target at the AABB centre, not `maxY * 0.45`.
- Use the full vertical span (`maxY - minY`) and horizontal span, then solve distance for both FOV axes and take the larger, with a single margin factor.
- Compensate for the off-axis camera direction by fitting against the span projected perpendicular to that direction (or, simpler and equally correct, reduce the direction to a mild offset and add its cosine factor into the distance).

**Make the HUD honest.** The scale-bar readout is derived from the same distance, so once the fit is correct the "screen width = N Earths" number will match what is on screen; verify it against the focused sphere's known diameter at each step.

## Result

At every step the focused sphere is fully inside the frame with room around it, the previous sphere is also visible: visibly smaller by its true ratio: and the smaller bodies remain separated enough for their labels. Compare mode keeps its own fit over the chosen set.

## Technical notes

- `src/data/wealthSteps.ts`: add a span budget to `buildAutoSteps`: after computing the per-focus floor, cap the gap before the focused body so `focus.x - prev.x` stays within the budget derived from the focused radius.
- `src/components/scale/CameraRig.tsx`: replace the `spanY = maxY` / `target.y = maxY * 0.45` framing with a full AABB fit and centre-aimed target; keep the `Math.exp` easing, reduced-motion snap, and `onView` reporting untouched.
- No changes to `calcRadius`, wealth figures, `CelestialBody`, `CompareInset`, or `LogRail`.

## Verification

Re-capture all six steps plus compare mode at 1280×1800 and confirm from the images alone that (a) the focused sphere is not clipped, (b) the previous sphere is visible in the same shot, (c) consecutive steps look dramatically different in size, and (d) the "screen width = N Earths" figure is consistent with the focused sphere's on-screen width.
