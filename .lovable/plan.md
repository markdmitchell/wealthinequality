# Make Compare mode include the step you are viewing

## What is happening
Compare mode always shows the same four spheres: median household, median home, top 1%, and the richest person. It ignores the step you were on. So opening Compare from "Bottom 50% Combined" (or "A Single Billionaire" / "All US Billionaires") never shows that sphere. This is how it was built, but it is confusing.

## Change
- Compare mode shows the four default spheres plus the step you were viewing, if it is not already one of them.
  - Example: from Bottom 50% Combined, you see median household, median home, top 1%, richest person, and Bottom 50% Combined side by side at true scale.
- The "Side by side" panel lists whichever spheres are shown, and its intro text updates to match ("Four" or "Five spheres").
- Callouts label every compared sphere, including tiny ones, using the same panel-safe placement as now.
- Viewing One Dollar adds it as a tiny labeled speck.

## Technical details
- `WealthScale.tsx`: derive `compareSet = sorted unique [...COMPARE_DEFAULT, index]`; pass it to `buildAutoSteps(compareSet, SPACING_DEFAULT)` and as `compare` to `ScaleCanvas`; render the panel list and count from `compareSet`.
- `ScaleCanvas` already filters visible bodies and frames by the `compare` array, so no camera changes are expected; verify framing with 5 bodies.
- Verify with Playwright on desktop and mobile: Compare from steps 6, 7, and 8 shows both the richest person and the viewed step with non-overlapping callouts.
