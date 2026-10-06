export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneViewportLayout {
  left: number;
  right: number;
  top: number;
  bottom: number;
  reserved: ScreenRect[];
}

/**
 * Screen-space boundaries shared by 3D framing and the label overlay.
 *
 * `bottomInset` is the measured height of the phone bottom sheet (scale rail +
 * info card). Passing it keeps spheres and callout plates above a card that is
 * far taller than any viewport formula could predict; when it is unknown the
 * narrow layout falls back to a conservative estimate.
 */
export function getSceneViewportLayout(
  width: number,
  height: number,
  bottomInset = 0,
): SceneViewportLayout {
  const wide = width >= 1024;
  const left = wide ? 420 : 20;
  const right = wide ? 240 : 20;
  const top = 104;
  const estimate = wide ? 48 : Math.min(360, Math.max(250, height * 0.39));
  const bottom = wide ? 48 : Math.max(estimate, Math.min(bottomInset + 8, height * 0.72));

  return {
    left,
    right,
    top,
    bottom,
    reserved: [
      { x: 180, y: 56, w: 360, h: 96 },
      { x: width - 180, y: 70, w: 360, h: 130 },
    ],
  };
}
