import type { DesignNode } from "./types";
import { nodeWorldAabb } from "./snap";

function edges(n: { x: number; y: number; w: number; h: number }) {
  return {
    l: n.x,
    c: n.x + n.w / 2,
    r: n.x + n.w,
    t: n.y,
    m: n.y + n.h / 2,
    b: n.y + n.h,
  };
}

/**
 * Snap a ruler guide to artboard edges/centers and visible object bounds.
 * Vertical guides (`x`) lock to left / center / right; horizontal to top / mid / bottom.
 */
export function snapGuideToObjects(
  axis: "x" | "y",
  pos: number,
  nodes: DesignNode[],
  artboard: { width: number; height: number },
  threshold = 8,
): { pos: number; snapped: boolean; line: number | null } {
  const targets: number[] =
    axis === "x"
      ? [0, artboard.width / 2, artboard.width]
      : [0, artboard.height / 2, artboard.height];
  for (const n of nodes) {
    if (!n.visible) continue;
    const e = edges(nodeWorldAabb(n));
    if (axis === "x") targets.push(e.l, e.c, e.r);
    else targets.push(e.t, e.m, e.b);
  }
  let best = threshold + 1;
  let line: number | null = null;
  for (const t of targets) {
    const d = Math.abs(t - pos);
    if (d < best - 0.01) {
      best = d;
      line = t;
    }
  }
  if (line == null || best > threshold) return { pos, snapped: false, line: null };
  return { pos: line, snapped: true, line };
}
