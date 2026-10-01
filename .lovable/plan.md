# Stabilize compare-mode framing

## Changes
- Define one shared set of screen-safe insets for the title, controls, information panel, and navigation rail.
- Use those same insets for both camera fitting and label placement at every viewport size.
- Reset compare mode to a canonical camera angle and fit its complete sphere set, preventing prior orbit or journey state from changing the composition.
- Keep journey transitions animated while making compare framing deterministic whenever it is entered or resized.

## Verification
- Switch repeatedly between journey steps and compare mode on desktop and mobile-sized viewports.
- Confirm every compared sphere remains inside the usable scene area and all labels avoid panels and each other.
- Check the preview for build and runtime errors.

## Technical notes
- Add a small shared viewport-layout helper consumed by `CameraRig` and `BodyLabels`.
- Pass an explicit compare-mode flag to the camera rig so it can use a fixed viewing direction without changing sphere scale calculations.
