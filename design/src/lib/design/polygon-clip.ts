import type { PathPoint } from "./types";

export type Ring = PathPoint[];

const EPS = 1e-7;
const GRID = 1e-4;

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
