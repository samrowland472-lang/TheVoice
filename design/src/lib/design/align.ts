import { aabb, nodeCenter, rotatePoint } from "./geometry";
import { groupIslandsNested } from "./island-group";
import { uid } from "./id";
import type { DesignNode, PathNode, PathPoint } from "./types";
import { isPath } from "./types";

export type AlignEdge = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type DistributeAxis = "h" | "v";

type Pt = { x: number; y: number };

function shiftRing(ring: PathPoint[], dx: number, dy: number): PathPoint[] {
  return ring.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
}

function rotateOffset(h: { x: number; y: number } | null | undefined, deg: number) {
  if (!h) return h;
  const r = rotatePoint(h.x, h.y, 0, 0, deg);
  return { x: r.x, y: r.y };
}

function unrotateOffset(h: { x: number; y: number } | null | undefined, deg: number) {
  if (!h) return h;
  const r = rotatePoint(h.x, h.y, 0, 0, -deg);
  return { x: r.x, y: r.y };
}

/** Flatten node rotation into path points so island boxes match ink on the artboard. */
export function bakePathRotation(n: PathNode): PathNode {
  if (!n.rotation) return n;
  const c = nodeCenter(n);
  const deg = n.rotation;
  const mapRing = (ring: PathPoint[]) =>
    ring.map((p) => {
      const w = rotatePoint(n.x + p.x, n.y + p.y, c.x, c.y, deg);
      return {
        ...p,
        x: w.x,
        y: w.y,
        in: rotateOffset(p.in, deg) ?? p.in,
        out: rotateOffset(p.out, deg) ?? p.out,
      };
    });
  return {
    ...n,
    rotation: 0,
    x: 0,
    y: 0,
    points: mapRing(n.points),
    holes: n.holes?.map(mapRing),
  };
}

function convexHull(pts: Pt[]): Pt[] {
  const uniq = new Map<string, Pt>();
  for (const p of pts) uniq.set(`${p.x.toFixed(4)},${p.y.toFixed(4)}`, p);
  const points = [...uniq.values()].sort((a, b) => a.x - b.x || a.y - b.y);
  if (points.length <= 2) return points;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/** Minimum-area oriented box around world samples (rotating calipers on the hull). */
export function minAreaObb(pts: Pt[]): { cx: number; cy: number; w: number; h: number; rotation: number } {
  const hull = convexHull(pts);
  if (hull.length === 0) return { cx: 0, cy: 0, w: 1, h: 1, rotation: 0 };
  if (hull.length === 1) return { cx: hull[0]!.x, cy: hull[0]!.y, w: 1, h: 1, rotation: 0 };
  if (hull.length === 2) {
    const a = hull[0]!;
    const b = hull[1]!;
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return {
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
      w: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      h: 1,
      rotation: ang,
    };
  }
  let best = { area: Infinity, cx: 0, cy: 0, w: 1, h: 1, rotation: 0 };
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    let minP = Infinity;
    let maxP = -Infinity;
    let minQ = Infinity;
    let maxQ = -Infinity;
    for (const p of hull) {
      const pr = p.x * c + p.y * s;
      const qr = -p.x * s + p.y * c;
      minP = Math.min(minP, pr);
      maxP = Math.max(maxP, pr);
      minQ = Math.min(minQ, qr);
      maxQ = Math.max(maxQ, qr);
    }
    const w = maxP - minP;
    const h = maxQ - minQ;
    const area = w * h;
    if (area < best.area) {
      const midP = (minP + maxP) / 2;
      const midQ = (minQ + maxQ) / 2;
      best = {
        area,
        cx: midP * c - midQ * s,
        cy: midP * s + midQ * c,
        w: Math.max(1, w),
        h: Math.max(1, h),
        rotation: (ang * 180) / Math.PI,
      };
    }
  }
  return best;
}

/** Rebase a path onto its minimum-area oriented frame so align uses rotated ink, not the AABB. */
export function applyOrientedFrame(n: PathNode): PathNode {
  const samples: Pt[] = [];
  for (const p of n.points) samples.push({ x: n.x + p.x, y: n.y + p.y });
  for (const hole of n.holes ?? []) for (const p of hole) samples.push({ x: n.x + p.x, y: n.y + p.y });
  if (samples.length < 2) return n;
  const obb = minAreaObb(samples);
  const x = obb.cx - obb.w / 2;
  const y = obb.cy - obb.h / 2;
  const mapRing = (ring: PathPoint[]) =>
    ring.map((p) => {
      const world = { x: n.x + p.x, y: n.y + p.y };
      const local = rotatePoint(world.x, world.y, obb.cx, obb.cy, -obb.rotation);
      return {
        ...p,
        x: local.x - x,
        y: local.y - y,
        in: unrotateOffset(p.in, obb.rotation) ?? p.in,
        out: unrotateOffset(p.out, obb.rotation) ?? p.out,
      };
    });
  return {
    ...n,
    x,
    y,
    w: obb.w,
    h: obb.h,
    rotation: obb.rotation,
    points: mapRing(n.points),
    holes: n.holes?.map(mapRing),
  };
}

/** Pull a path node's box onto its actual contour so islands can align independently. */
export function tightenPathNode(n: PathNode): PathNode {
  const baked = bakePathRotation(n);
  const samples: { x: number; y: number }[] = [];
  for (const p of baked.points) samples.push(p);
  for (const hole of baked.holes ?? []) for (const p of hole) samples.push(p);
  if (!samples.length) return baked;
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
  if (!Number.isFinite(minX)) return baked;
  const dx = minX;
  const dy = minY;
  const tight: PathNode = {
    ...baked,
    x: baked.x + dx,
    y: baked.y + dy,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
    points: shiftRing(baked.points, -dx, -dy),
    holes: baked.holes?.map((h) => shiftRing(h, -dx, -dy)),
  };
  return applyOrientedFrame(tight);
}

/** Axis-aligned projection of the node's oriented frame (rotated box, not raw ink AABB). */
export function geometryBox(n: DesignNode) {
  const c = { x: n.x + n.w / 2, y: n.y + n.h / 2 };
  const pts = [
    { x: n.x, y: n.y },
    { x: n.x + n.w, y: n.y },
    { x: n.x + n.w, y: n.y + n.h },
    { x: n.x, y: n.y + n.h },
  ];
  const corners = n.rotation ? pts.map((p) => rotatePoint(p.x, p.y, c.x, c.y, n.rotation)) : pts;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of corners) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) return aabb([n]);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Union of oriented-frame projections — the target box for Align to selection. */
export function unionOrientedBox(nodes: DesignNode[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const b = geometryBox(n);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function ringBox(ring: PathPoint[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of ring) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Disjoint outer rings on one path (holes stay attached to their parent). */
export function splitCompoundIslands(n: PathNode): PathNode[] {
  n = tightenPathNode(n);
  const rings = [n.points, ...(n.holes ?? [])].filter((r) => r.length >= 3);
  if (rings.length < 2) return [n];
  const groups = groupIslandsNested(rings);
  if (groups.length <= 1) return [n];
  return groups.map((g, i) => {
    const all = [g.outer, ...g.holes];
    const box = ringBox(all.flat());
    const dx = box.x;
    const dy = box.y;
    const part: PathNode = {
      ...n,
      id: i === 0 ? n.id : uid("pt"),
      name: i === 0 ? n.name : `${n.name} ${i + 1}`,
      x: n.x + dx,
      y: n.y + dy,
      w: Math.max(1, box.w),
      h: Math.max(1, box.h),
      rotation: 0,
      points: shiftRing(g.outer, -dx, -dy),
      holes: g.holes.length ? g.holes.map((h) => shiftRing(h, -dx, -dy)) : undefined,
      fillRule: g.holes.length ? (n.fillRule ?? "evenodd") : n.fillRule,
    };
    return applyOrientedFrame(part);
  });
}

export function explodeSelectedIslands(
  nodes: DesignNode[],
  selected: string[],
): { nodes: DesignNode[]; selection: string[] } {
  const ids = new Set(selected);
  const next: DesignNode[] = [];
  const selection: string[] = [];
  for (const n of nodes) {
    if (!ids.has(n.id) || !isPath(n) || n.locked) {
      next.push(n);
      if (ids.has(n.id)) selection.push(n.id);
      continue;
    }
    const parts = splitCompoundIslands(n);
    next.push(...parts);
    for (const p of parts) selection.push(p.id);
  }
  return { nodes: next, selection };
}

export function countIslandItems(nodes: DesignNode[], selected: string[]): number {
  const ids = new Set(selected);
  let count = 0;
  for (const n of nodes) {
    if (!ids.has(n.id) || n.locked) continue;
    count += isPath(n) ? splitCompoundIslands(n).length : 1;
  }
  return count;
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
