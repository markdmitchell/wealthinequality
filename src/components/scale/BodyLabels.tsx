import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { WealthStep } from "@/data/wealthSteps";

export type LabelNodes = Map<number, HTMLDivElement | null>;

interface Props {
  steps: WealthStep[];
  nodes: LabelNodes;
}

const PAD_X = 16;
const PAD_TOP = 96;
const PAD_BOTTOM = 24;

/**
 * Projects every body's centre to screen space each frame and drives a DOM
 * overlay, clamping labels inside the viewport so a body that is off-frame or
 * too small to see still carries a readable, correctly coloured label.
 */
export function BodyLabels({ steps, nodes }: Props) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    // Vertical lanes keep labels from stacking on top of each other.
    const lanes: number[] = [];
    for (const step of steps) {
      const el = nodes.get(step.index);
      if (!el) continue;
      const v = vec.current.set(step.x, step.y, 0).project(camera);
      const behind = v.z > 1;
      let x = ((v.x + 1) / 2) * size.width;
      let y = ((1 - v.y) / 2) * size.height;

      const offEdge =
        behind || x < PAD_X || x > size.width - PAD_X || y < PAD_TOP || y > size.height - PAD_BOTTOM;
      x = Math.min(size.width - PAD_X, Math.max(PAD_X, x));
      y = Math.min(size.height - PAD_BOTTOM, Math.max(PAD_TOP, y));

      // Nudge into a free lane if another label already sits at this height.
      let lane = 0;
      while (lanes.some((l) => Math.abs(l - (y - lane * 30)) < 24) && lane < 6) lane += 1;
      y -= lane * 30;
      lanes.push(y);

      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
      el.style.opacity = offEdge ? "0.75" : "1";
      el.dataset["offEdge"] = offEdge ? "true" : "false";
    }
  });

  return null;
}
