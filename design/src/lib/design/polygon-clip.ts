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
