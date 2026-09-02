import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { WealthStep } from "@/data/wealthSteps";

export type LabelNodes = Map<number, HTMLDivElement | null>;

interface Props {
  steps: WealthStep[];
  nodes: LabelNodes;
}

/**
 * Projects every body's centre to screen space each frame and drives a DOM
 * overlay. Bodies that fall outside the frame (or are far too small to see)
 * park their label in a stacked column at the nearest safe edge, so every
 * sphere on the scale stays labelled at every step.
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

    let leftStack = 0;
    let rightStack = 0;
    const placed: { x: number; y: number }[] = [];

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
        rawY < padTop ||
        rawY > size.height - padBottom;

      let x: number;
      let y: number;
      if (outside) {
        const toRight = !behind && rawX > size.width / 2;
        if (toRight) {
          x = size.width - padRight - 60;
          y = (wide ? 190 : padTop) + rightStack * 34;
          rightStack += 1;
        } else {
          x = padLeft + 60;
          y = padTop + leftStack * 34;
          leftStack += 1;
        }
      } else {
        x = rawX;
        y = rawY;
        // Nudge up out of any label already occupying this spot.
        let guard = 0;
        while (
          guard < 8 &&
          placed.some((p) => Math.abs(p.x - x) < 150 && Math.abs(p.y - y) < 26)
        ) {
          y -= 30;
          guard += 1;
        }
        y = Math.max(padTop, y);
      }

      placed.push({ x, y });
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
      el.style.opacity = outside ? "0.8" : "1";
      el.dataset["offFrame"] = outside ? "true" : "false";
    }
  });

  return null;
}
