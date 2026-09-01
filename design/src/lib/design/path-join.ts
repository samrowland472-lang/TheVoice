import type { PathNode, PathPoint } from "./types";
import { closePathWithCubic, hasHandle } from "./path-curve";

export type PathEnd = "start" | "end";
export const PEN_SNAP_PX = 9;

export function worldPathEnd(n: PathNode, end: PathEnd) {
  const p = end === "start" ? n.points[0] : n.points[n.points.length - 1];
  if (!p) return null;
  return { x: n.x + p.x, y: n.y + p.y };
}

function reversePoints(pts: PathPoint[]): PathPoint[] {
  return pts
    .map((p) => ({
      ...p,
      in: p.out ? { ...p.out } : null,
      out: p.in ? { ...p.in } : null,
    }))
    .reverse();
}

function toKeepSpace(p: PathPoint, from: PathNode, keep: PathNode): PathPoint {
  return {
    ...p,
    x: from.x + p.x - keep.x,
    y: from.y + p.y - keep.y,
    in: p.in ? { ...p.in } : null,
    out: p.out ? { ...p.out } : null,
  };
}

/** Concatenate two open contours at the named ends. Same node + opposite ends closes. */
export function joinOpenPathNodes(keep: PathNode, keepEnd: PathEnd, other: PathNode, otherEnd: PathEnd): PathNode {
  if (keep.id === other.id) {
    if (keep.points.length >= 3 && keepEnd !== otherEnd) return closePathWithCubic(keep);
    return keep;
  }
  if (keep.closed || other.closed || keep.points.length < 1 || other.points.length < 1) return keep;

  let a: PathPoint[] = keep.points.map((p) => ({
    ...p,
    in: p.in ? { ...p.in } : null,
    out: p.out ? { ...p.out } : null,
  }));
  let b: PathPoint[] = other.points.map((p) => toKeepSpace(p, other, keep));
  if (keepEnd === "start") a = reversePoints(a);
  if (otherEnd === "end") b = reversePoints(b);

  const last = a[a.length - 1]!;
  const first = b[0]!;
  const joined: PathPoint = {
    x: (last.x + first.x) / 2,
    y: (last.y + first.y) / 2,
    in: last.in ?? null,
    out: first.out ?? null,
    smooth: Boolean((hasHandle(last.in) && hasHandle(first.out)) || last.smooth || first.smooth),
  };
  return { ...keep, points: [...a.slice(0, -1), joined, ...b.slice(1)], closed: false };
}

export type JoinPair = {
  from: { node: PathNode; end: PathEnd };
  to: { node: PathNode; end: PathEnd };
};

/** Two open ends within snap distance of a world point. */
export function findJoinPair(
  nodes: PathNode[],
  wx: number,
  wy: number,
  thresh: number,
): JoinPair | null {
  const open = nodes.filter((n) => !n.closed && n.points.length >= 1);
  const from = nearestOpenPathEnd(open, wx, wy, thresh);
  if (!from) return null;
  const to = nearestOpenPathEnd(open, wx, wy, thresh, { id: from.node.id, end: from.end });
  if (!to) return null;
  if (from.node.id === to.node.id && from.node.points.length < 3) return null;
  return { from: { node: from.node, end: from.end }, to: { node: to.node, end: to.end } };
}

export function nearestOpenPathEnd(
  nodes: PathNode[],
  wx: number,
  wy: number,
  thresh: number,
  exclude?: { id: string; end: PathEnd },
): { node: PathNode; end: PathEnd; dist: number } | null {
  let best: { node: PathNode; end: PathEnd; dist: number } | null = null;
  for (const n of nodes) {
    if (n.closed || n.points.length < 1) continue;
    for (const end of ["start", "end"] as const) {
      if (exclude && exclude.id === n.id && exclude.end === end) continue;
      if (exclude && exclude.id === n.id && n.points.length < 2) continue;
      const pt = worldPathEnd(n, end);
      if (!pt) continue;
      const dist = Math.hypot(wx - pt.x, wy - pt.y);
      if (dist <= thresh && (!best || dist < best.dist)) best = { node: n, end, dist };
    }
  }
  return best;
}
