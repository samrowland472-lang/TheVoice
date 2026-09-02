import { aabb } from "./geometry";
import type { DesignNode, PathNode, PathPoint } from "./types";

export type AlignEdge = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributeAxis = "h" | "v";

function shiftRing(ring: PathPoint[], dx: number, dy: number): PathPoint[] {
  return ring.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
}

/** Pull a path node's box onto its actual contour so islands can align independently. */
export function tightenPathNode(n: PathNode): PathNode {
  if (n.rotation) return n;
  const samples: { x: number; y: number }[] = [];
  for (const p of n.points) samples.push(p);
  for (const hole of n.holes ?? []) for (const p of hole) samples.push(p);
  if (!samples.length) return n;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of samples) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) return n;
  const dx = minX;
  const dy = minY;
  if (
    Math.abs(dx) < 1e-6 &&
    Math.abs(dy) < 1e-6 &&
    Math.abs(n.w - (maxX - minX)) < 0.5 &&
    Math.abs(n.h - (maxY - minY)) < 0.5
  ) {
    return n;
  }
  return {
    ...n,
    x: n.x + dx,
    y: n.y + dy,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
    points: shiftRing(n.points, -dx, -dy),
    holes: n.holes?.map((h) => shiftRing(h, -dx, -dy)),
  };
}

export function geometryBox(n: DesignNode) {
  return aabb([n]);
}

export function alignNodes(
  nodes: DesignNode[],
  ids: Set<string>,
  edge: AlignEdge | string,
  box: { x: number; y: number; w: number; h: number },
): DesignNode[] {
  return nodes.map((n) => {
    if (!ids.has(n.id) || n.locked) return n;
    const geo = geometryBox(n);
    let dx = 0;
    let dy = 0;
    if (edge === "left") dx = box.x - geo.x;
    else if (edge === "center") dx = box.x + box.w / 2 - (geo.x + geo.w / 2);
    else if (edge === "right") dx = box.x + box.w - (geo.x + geo.w);
    else if (edge === "top") dy = box.y - geo.y;
    else if (edge === "middle") dy = box.y + box.h / 2 - (geo.y + geo.h / 2);
    else if (edge === "bottom") dy = box.y + box.h - (geo.y + geo.h);
    if (!dx && !dy) return n;
    return { ...n, x: n.x + dx, y: n.y + dy };
  });
}

export function distributeNodes(nodes: DesignNode[], ids: string[], axis: DistributeAxis): DesignNode[] {
  const unlocked = nodes.filter((n) => ids.includes(n.id) && !n.locked);
  if (unlocked.length < 3) return nodes;
  const items = unlocked.map((n) => ({ n, box: geometryBox(n) }));
  items.sort((a, b) => (axis === "h" ? a.box.x - b.box.x : a.box.y - b.box.y));
  const first = items[0]!.box;
  const last = items[items.length - 1]!.box;
  const delta = new Map<string, { dx: number; dy: number }>();
  if (axis === "h") {
    const span = last.x + last.w - first.x;
    const total = items.reduce((s, i) => s + i.box.w, 0);
    const gap = (span - total) / (items.length - 1);
    let cursor = first.x;
    for (const item of items) {
      delta.set(item.n.id, { dx: cursor - item.box.x, dy: 0 });
      cursor += item.box.w + gap;
    }
  } else {
    const span = last.y + last.h - first.y;
    const total = items.reduce((s, i) => s + i.box.h, 0);
    const gap = (span - total) / (items.length - 1);
    let cursor = first.y;
    for (const item of items) {
      delta.set(item.n.id, { dx: 0, dy: cursor - item.box.y });
      cursor += item.box.h + gap;
    }
  }
  return nodes.map((n) => {
    const d = delta.get(n.id);
    if (!d || (!d.dx && !d.dy)) return n;
    return { ...n, x: n.x + d.dx, y: n.y + d.dy };
  });
}
