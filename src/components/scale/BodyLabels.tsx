import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { WealthStep } from "@/data/wealthSteps";

export type LabelNodes = Map<number, HTMLDivElement | null>;

interface Props {
  steps: WealthStep[];
  nodes: LabelNodes;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const LABEL_W = 150;
const LABEL_H = 30;
const ROW = 34;

function overlaps(a: Rect, b: Rect): boolean {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

/**
 * Projects every body's centre to screen space each frame and drives a DOM
 * overlay. Bodies that fall outside the frame (or are far too small to see)
 * park their label in stacked columns at the nearest safe edge. Columns wrap
 * inward when they run out of vertical room, and every placement is tested
 * against the reserved UI panel rects plus previously placed labels, so labels
 * never sit on the HUD or on one another at extreme zoom levels.
 */
export function BodyLabels({ steps, nodes }: Props) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    const wide = size.width >= 1024;
    // Keep clear of the info panel (left / bottom) and the log rail (right).
    const padLeft = wide ? 420 : 20;
    const padRight = wide ? 210 : 20;
    const padTop = 104;
    const padBottom = wide ? 48 : 360;

    const safeTop = padTop;
    const safeBottom = size.height - padBottom;
    const rows = Math.max(1, Math.floor((safeBottom - safeTop) / ROW));

    // Reserved HUD areas that labels must never cover.
    const reserved: Rect[] = [
      // header title block
      { x: 180, y: 56, w: 360, h: 96 },
      // header buttons / scale bar
      { x: size.width - 180, y: 70, w: 360, h: 130 },
    ];

    const placed: Rect[] = [];
    let leftSlot = 0;
    let rightSlot = 0;

    const fits = (r: Rect) =>
      !reserved.some((q) => overlaps(r, q)) && !placed.some((q) => overlaps(r, q));

    for (const step of steps) {
      const el = nodes.get(step.index);
      if (!el) continue;
      const v = vec.current.set(step.x, step.y, 0).project(camera);
      const behind = v.z > 1;
      const rawX = ((v.x + 1) / 2) * size.width;
      const rawY = ((1 - v.y) / 2) * size.height;

      const outside =
        behind ||
        rawX < padLeft ||
        rawX > size.width - padRight ||
        rawY < safeTop ||
        rawY > safeBottom;

      let rect: Rect;

      if (outside) {
        const toRight = !behind && rawX > size.width / 2;
        let slot = toRight ? rightSlot : leftSlot;
        let candidate: Rect;
        // Walk slots (row, then wrap into the next column inward) until free.
        for (let guard = 0; guard < rows * 4; guard += 1, slot += 1) {
          const col = Math.floor(slot / rows);
          const row = slot % rows;
          const x = toRight
            ? size.width - padRight - 70 - col * (LABEL_W + 12)
            : padLeft + 70 + col * (LABEL_W + 12);
          candidate = { x, y: safeTop + LABEL_H / 2 + row * ROW, w: LABEL_W, h: LABEL_H };
          if (fits(candidate)) break;
        }
        rect = candidate!;
        if (toRight) rightSlot = slot + 1;
        else leftSlot = slot + 1;
      } else {
        rect = { x: rawX, y: rawY, w: LABEL_W, h: LABEL_H };
        // Nudge up, then down, out of anything already occupying this spot.
        let guard = 0;
        while (guard < 10 && !fits(rect)) {
          rect = { ...rect, y: rect.y - ROW };
          guard += 1;
        }
        if (!fits(rect)) {
          rect = { x: rawX, y: rawY, w: LABEL_W, h: LABEL_H };
          guard = 0;
          while (guard < 10 && !fits(rect)) {
            rect = { ...rect, y: rect.y + ROW };
            guard += 1;
          }
        }
        rect = {
          ...rect,
          y: Math.min(safeBottom - LABEL_H / 2, Math.max(safeTop + LABEL_H / 2, rect.y)),
        };
      }

      placed.push(rect);
      el.style.transform = `translate3d(${Math.round(rect.x)}px, ${Math.round(
        rect.y + LABEL_H / 2,
      )}px, 0) translate(-50%, -100%)`;
      el.style.opacity = outside ? "0.8" : "1";
      el.dataset["offFrame"] = outside ? "true" : "false";
    }
  });

  return null;
}
