import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { WealthStep } from "@/data/wealthSteps";
import { getSceneViewportLayout, type ScreenRect } from "./viewportLayout";

export interface CalloutNodes {
  plate: HTMLDivElement | null;
  path: SVGPathElement | null;
  dot: SVGCircleElement | null;
}

export type LabelNodes = Map<number, CalloutNodes>;

interface Props {
  steps: WealthStep[];
  nodes: LabelNodes;
  /** Measured height of the phone bottom sheet, so plates never hide under it. */
  bottomInset?: number | undefined;
}

const DESKTOP_W = 176;
const MOBILE_W = 160;
const LABEL_H = 62;
const GAP = 18;

function overlaps(a: ScreenRect, b: ScreenRect): boolean {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

/**
 * Projects every body's true centre to screen space and places a collision-safe
 * callout plate nearby. An SVG leader retains the exact projected endpoint even
 * when the sphere is too small for a pixel, so annotation never alters geometry.
 */
export function BodyLabels({ steps, nodes, bottomInset }: Props) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    const layout = getSceneViewportLayout(size.width, size.height, bottomInset);
    const labelW = size.width < 640 ? MOBILE_W : DESKTOP_W;
    const safeTop = layout.top;
    const safeBottom = size.height - layout.bottom;
    const safeLeft = layout.left;
    const safeRight = size.width - layout.right;

    const placed: ScreenRect[] = [];

    const fits = (r: ScreenRect) =>
      !layout.reserved.some((q) => overlaps(r, q)) && !placed.some((q) => overlaps(r, q));

    for (const step of steps) {
      const node = nodes.get(step.index);
      if (!node?.plate || !node.path || !node.dot) continue;
      const v = vec.current.set(step.x, step.y, 0).project(camera);
      const behind = v.z > 1;
      const rawX = ((v.x + 1) / 2) * size.width;
      const rawY = ((1 - v.y) / 2) * size.height;

      const targetX = Math.min(size.width, Math.max(0, rawX));
      const targetY = Math.min(size.height, Math.max(0, rawY));

      // Projected on-screen radius: keeps the plate fully outside the sphere.
      const edge = vec.current.set(step.x + step.radius, step.y, 0).project(camera);
      const edgeX = ((edge.x + 1) / 2) * size.width;
      const edgeY = ((1 - edge.y) / 2) * size.height;
      const screenRadius = behind ? 0 : Math.hypot(edgeX - rawX, edgeY - rawY);
      const clearance = screenRadius + GAP;

      const xOffsets =
        step.index === 1
          ? [-(clearance + labelW / 2), clearance + labelW / 2, 0]
          : [clearance + labelW / 2, -(clearance + labelW / 2), 0];
      const yOffsets = [-(clearance + LABEL_H / 2), clearance + LABEL_H / 2, 0];
      let rect: ScreenRect = {
        x: Math.min(safeRight - labelW / 2, Math.max(safeLeft + labelW / 2, targetX)),
        y: Math.min(safeBottom - LABEL_H / 2, Math.max(safeTop + LABEL_H / 2, targetY)),
        w: labelW,
        h: LABEL_H,
      };

      outer: for (const yOffset of yOffsets) {
        for (const xOffset of xOffsets) {
          const candidate = {
            x: Math.min(safeRight - labelW / 2, Math.max(safeLeft + labelW / 2, targetX + xOffset)),
            y: Math.min(safeBottom - LABEL_H / 2, Math.max(safeTop + LABEL_H / 2, targetY + yOffset)),
            w: labelW,
            h: LABEL_H,
          };
          if (fits(candidate)) {
            rect = candidate;
            break outer;
          }
        }
      }

      if (!fits(rect)) {
        // Crowded frame (many bodies, small screen): try every slot in a grid
        // across the safe area, nearest to the target first.
        const slots: ScreenRect[] = [];
        const xs = [safeLeft + labelW / 2, safeRight - labelW / 2, (safeLeft + safeRight) / 2];
        for (let y = safeTop + LABEL_H / 2; y <= safeBottom - LABEL_H / 2; y += LABEL_H + 6) {
          for (const x of xs) slots.push({ x, y, w: labelW, h: LABEL_H });
        }
        slots.sort(
          (a, b) =>
            Math.hypot(a.x - targetX, a.y - targetY) - Math.hypot(b.x - targetX, b.y - targetY),
        );
        const slot = slots.find(fits);
        if (slot) rect = slot;
      }

      placed.push(rect);
      node.plate.style.transform = `translate3d(${Math.round(rect.x)}px, ${Math.round(rect.y)}px, 0) translate(-50%, -50%)`;

      const dx = targetX - rect.x;
      const dy = targetY - rect.y;
      const horizontal = Math.abs(dx) / labelW > Math.abs(dy) / LABEL_H;
      const attachX = horizontal ? rect.x + Math.sign(dx || 1) * labelW / 2 : Math.min(rect.x + labelW / 2, Math.max(rect.x - labelW / 2, targetX));
      const attachY = horizontal ? Math.min(rect.y + LABEL_H / 2, Math.max(rect.y - LABEL_H / 2, targetY)) : rect.y + Math.sign(dy || 1) * LABEL_H / 2;

      // Large spheres: terminate the leader on the rim facing the plate so the
      // line never crosses the surface. Tiny specks keep the exact center dot.
      let endX = targetX;
      let endY = targetY;
      if (screenRadius >= 14 && !behind) {
        const len = Math.hypot(dx, dy);
        if (len > 0.001) {
          endX = targetX - (dx / len) * screenRadius;
          endY = targetY - (dy / len) * screenRadius;
        }
      }
      const elbowX = horizontal ? (attachX + endX) / 2 : attachX;
      const elbowY = horizontal ? attachY : (attachY + endY) / 2;
      node.path.setAttribute("d", `M ${attachX} ${attachY} L ${elbowX} ${elbowY} L ${endX} ${endY}`);
      node.dot.setAttribute("cx", String(endX));
      node.dot.setAttribute("cy", String(endY));
      node.plate.dataset["offFrame"] = behind || rawX !== targetX || rawY !== targetY ? "true" : "false";
    }
  });

  return null;
}
