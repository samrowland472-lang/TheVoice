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

export function collectGuideTargets(
  axis: "x" | "y",
  nodes: DesignNode[],
  artboard: { width: number; height: number },
  extra: number[] = [],
): number[] {
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
  for (const t of extra) targets.push(t);
  return targets;
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
  const targets = collectGuideTargets(axis, nodes, artboard);
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

export type GuideProbe = {
  axis: "x" | "y";
  pos: number;
  before: number | null;
  after: number | null;
};

function nearestSide(pos: number, targets: number[], side: "before" | "after"): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    const d = side === "before" ? pos - t : t - pos;
    if (d <= 0.05) continue;
    if (d < bestD) {
      bestD = d;
      best = Math.round(d * 10) / 10;
    }
  }
  return best;
}

/** Distances from a live guide to the nearest object / artboard target on each side. */
export function guideProbe(
  axis: "x" | "y",
  pos: number,
  nodes: DesignNode[],
  artboard: { width: number; height: number },
  extra: number[] = [],
): GuideProbe {
  const targets = collectGuideTargets(axis, nodes, artboard, extra);
  return {
    axis,
    pos: Math.round(pos * 10) / 10,
    before: nearestSide(pos, targets, "before"),
    after: nearestSide(pos, targets, "after"),
  };
}

export function formatGuideProbe(p: GuideProbe): string {
  const a = p.axis === "x" ? "L" : "T";
  const b = p.axis === "x" ? "R" : "B";
  const left = p.before == null ? `${a} —` : `${a} ${p.before}`;
  const right = p.after == null ? `${b} —` : `${b} ${p.after}`;
  return `${p.pos}  ${left}  ${right}`;
}
