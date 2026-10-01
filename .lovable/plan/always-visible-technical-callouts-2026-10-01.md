# Always-visible technical callouts

## Goal
Replace floating pills with precise callouts that identify each sphere’s exact projected location, including the subpixel median-household anchor, while preserving honest relative sizing.

## Changes
- Build each label as a compact technical plate with a role line, title, and dollar value.
- Add a fine leader line from every plate to the sphere’s true screen-space center, ending in a small target dot rather than an enlarged sphere.
- Give the median household a persistent “Reference anchor” treatment; mark the current body as “Selected scale.”
- Keep callout plates and leader paths inside the same panel-safe area already shared by camera framing and labels.
- Extend collision placement so plates avoid panels, one another, and cramped viewport edges; route leaders cleanly from the nearest plate edge.
- Preserve the existing sphere colors as callout accents and use restrained blueprint styling rather than adding new page chrome.
- Smooth callout movement as the camera settles, while respecting reduced-motion preferences.

## Technical details
- Extend the screen-space label overlay with SVG leader lines and endpoint targets driven by the existing Three.js projection loop.
- Keep the projected target coordinates separate from the collision-adjusted plate coordinates, so the line always indicates the sphere’s real location.
- Use semantic design tokens for callout surfaces, borders, text, and shadows; dynamic per-sphere accent colors remain data-driven.
- Keep `getSceneViewportLayout` authoritative for camera and callout boundaries.

## Verification
- Check every journey step and compare mode on desktop and mobile.
- Confirm every callout remains readable, plates never overlap reserved panels or each other, and each leader terminates at the correct sphere center.
- Confirm tiny spheres remain geometrically true-scale and are not replaced by oversized markers.
- Check reduced-motion behavior, console errors, type safety, and the preview build.
