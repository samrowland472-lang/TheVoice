import type { PathPoint } from "./types";

export type Ring = PathPoint[];
export type ClipOp = "union" | "subtract" | "intersect" | "exclude";

const EPS = 1e-9;
const GRID = 1e-4;
const MAX_VERTS = 480;

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

function snapPt(p: PathPoint): PathPoint {
  return { x: snap(p.x), y: snap(p.y) };
}

function almost(a: number, b: number) {
  return Math.abs(a - b) <= GRID * 2;
}

export function ringArea(pts: PathPoint[]): number {
  let a = 0;
  const n = pts.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % n]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

function eq(a: PathPoint, b: PathPoint) {
  return almost(a.x, b.x) && almost(a.y, b.y);
}

function keyOf(p: PathPoint) {
  return `${snap(p.x)},${snap(p.y)}`;
}

function dist2(a: PathPoint, b: PathPoint) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function cleanRing(pts: PathPoint[]): Ring {
  const snapped = pts.map(snapPt);
  const out: PathPoint[] = [];
  for (const p of snapped) {
    const last = out[out.length - 1];
    if (!last || !eq(last, p)) out.push(p);
  }
  if (out.length > 1 && eq(out[0]!, out[out.length - 1]!)) out.pop();
  if (out.length > MAX_VERTS) {
    const step = out.length / MAX_VERTS;
    const slim: PathPoint[] = [];
    for (let i = 0; i < MAX_VERTS; i++) slim.push(out[Math.min(out.length - 1, Math.floor(i * step))]!);
    return slim;
  }
  return out;
}

function collapseColinear(pts: Ring): Ring {
  if (pts.length < 4) return pts;
  const out: PathPoint[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n]!;
    const b = pts[i]!;
    const c = pts[(i + 1) % n]!;
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
    if (Math.abs(cross) <= GRID * 8 && dot > 0) continue;
    out.push(b);
  }
  return out.length >= 3 ? out : pts;
}

function winding(pt: PathPoint, rings: Ring[]): number {
  let w = 0;
  for (const ring of rings) {
    if (pointInRing(pt, ring)) w += 1;
  }
  return w % 2;
}

function pointInRing(pt: PathPoint, ring: Ring): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const inter =
      a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y || EPS) + a.x;
    if (inter) inside = !inside;
  }
  return inside;
}

function ringCentroid(ring: Ring): PathPoint {
  let x = 0;
  let y = 0;
  for (const p of ring) {
    x += p.x;
    y += p.y;
  }
  const n = ring.length || 1;
  return { x: x / n, y: y / n };
}

function ringContains(outer: Ring, inner: Ring): boolean {
  if (inner.length < 3 || outer.length < 3) return false;
  if (Math.abs(ringArea(inner)) >= Math.abs(ringArea(outer)) - GRID) return false;
  const samples: PathPoint[] = [ringCentroid(inner)];
  const count = inner.length;
  const take = Math.min(count, 9);
  for (let i = 0; i < take; i++) samples.push(inner[Math.floor((i * count) / take)]!);
  let hits = 0;
  for (const s of samples) {
    if (pointInRing(s, outer)) hits += 1;
  }
  return hits >= Math.ceil(samples.length * 0.6);
}
