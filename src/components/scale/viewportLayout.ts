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

/** Screen-space boundaries shared by 3D framing and the label overlay. */
export function getSceneViewportLayout(width: number, height: number): SceneViewportLayout {
  const wide = width >= 1024;
  const left = wide ? 420 : 20;
  const right = wide ? 210 : 20;
  const top = 104;
  const bottom = wide ? 48 : Math.min(360, Math.max(250, height * 0.39));

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