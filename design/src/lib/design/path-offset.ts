import { cubicAt, segmentControls } from "./path-cut";
import type { PathPoint } from "./types";

export type Vec = { x: number; y: number };

const EPS = 1e-6;

function clonePts(pts: PathPoint[]): PathPoint[] {
  return pts.map((p) => ({
    x: p.x,
    y: p.y,
    in: p.in ? { ...p.in } : null,
    out: p.out ? { ...p.out } : null,
    smooth: p.smooth,
  }));
}

function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

function mul(a: Vec, s: number): Vec {
  return { x: a.x * s, y: a.y * s };
}

function len(a: Vec) {
  return Math.hypot(a.x, a.y);
}

function norm(a: Vec): Vec {
  const l = len(a);
  if (l < EPS) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

function perpLeft(t: Vec): Vec {
  return { x: -t.y, y: t.x };
}

function cubicDeriv(p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

export function signedArea(pts: Vec[]): number {
  let a = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % n]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

interface Sample {
  p: Vec;
  t: Vec;
}

function sampleContour(pts: PathPoint[], closed: boolean): Sample[] {
  const n = pts.length;
  if (n < 2) return [];
  const out: Sample[] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const { p0, p1, p2, p3, curved } = segmentControls(a, b);
    const chord = len(sub(p3, p0));
    const steps = curved ? Math.max(6, Math.min(28, Math.ceil(chord / 8))) : Math.max(1, Math.min(8, Math.ceil(chord / 24)));
    const start = i === 0 ? 0 : 1;
    for (let s = start; s <= steps; s++) {
      const t = s / steps;
      const p = cubicAt(p0, p1, p2, p3, t);
      let tan = cubicDeriv(p0, p1, p2, p3, t);
      if (len(tan) < EPS) tan = sub(p3, p0);
      out.push({ p, t: norm(tan) });
    }
  }
  return out;
}

function offsetWithMiter(samples: Sample[], distance: number, miterLimit = 4): Vec[] {
  if (!samples.length) return [];
  const pts: Vec[] = [];
  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i]!;
    const prev = samples[i - 1];
    const next = samples[i + 1];
    const n0 = perpLeft(cur.t);
    if (!prev || !next) {
      pts.push(add(cur.p, mul(n0, distance)));
      continue;
    }
    const n1 = perpLeft(norm(add(prev.t, cur.t)));
    const n2 = perpLeft(norm(add(cur.t, next.t)));
    const joined = norm(add(n1, n2));
    const denom = Math.max(EPS, joined.x * n0.x + joined.y * n0.y);
    let scale = distance / denom;
    const limit = Math.abs(distance) * miterLimit;
    if (Math.abs(scale) > limit) scale = Math.sign(scale) * limit;
    pts.push(add(cur.p, mul(joined, scale)));
  }
  return pts;
}

function simplifyPolyline(pts: Vec[], eps: number): Vec[] {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = true;
  keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const pa = pts[a]!;
    const pb = pts[b]!;
    const ab = sub(pb, pa);
    const lab = len(ab);
    let maxD = 0;
    let maxI = a;
    for (let i = a + 1; i < b; i++) {
      const p = pts[i]!;
      let d: number;
      if (lab < EPS) d = len(sub(p, pa));
      else {
        const t = Math.max(0, Math.min(1, ((p.x - pa.x) * ab.x + (p.y - pa.y) * ab.y) / (lab * lab)));
        const proj = add(pa, mul(ab, t));
        d = len(sub(p, proj));
      }
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > eps && maxI !== a) {
      keep[maxI] = true;
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

export function toPathPoints(pts: Vec[]): PathPoint[] {
  return pts.map((p) => ({ x: p.x, y: p.y, in: null, out: null, smooth: false }));
}

export function offsetPolyline(pts: PathPoint[], closed: boolean, distance: number): PathPoint[] {
  if (Math.abs(distance) < 0.25 || pts.length < 2) return clonePts(pts);
  const samples = sampleContour(pts, closed);
  if (samples.length < 2) return clonePts(pts);
  let raw = offsetWithMiter(samples, distance);
  if (closed && raw.length > 2) {
    const srcArea = signedArea(pts);
    const dstArea = signedArea(raw);
    if (srcArea !== 0 && dstArea !== 0 && Math.sign(srcArea) !== Math.sign(dstArea)) {
      raw = raw.slice().reverse();
    }
  }
  const simple = simplifyPolyline(raw, Math.max(0.6, Math.abs(distance) * 0.08));
  if (simple.length < 2) return clonePts(pts);
  return toPathPoints(simple);
}

function capArc(center: Vec, from: Vec, to: Vec, steps = 5): Vec[] {
  const a0 = Math.atan2(from.y - center.y, from.x - center.x);
  const a1 = Math.atan2(to.y - center.y, to.x - center.x);
  let delta = a1 - a0;
  while (delta <= 0) delta += Math.PI * 2;
  while (delta > Math.PI * 2) delta -= Math.PI * 2;
  const out: Vec[] = [];
  const r = len(sub(from, center));
  for (let i = 1; i < steps; i++) {
    const a = a0 + (delta * i) / steps;
    out.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r });
  }
  return out;
}

export interface StrokeOutline {
  points: PathPoint[];
  hole: PathPoint[] | null;
  closed: boolean;
}

/** Expand a stroke into a filled contour. Closed paths keep the original as a hole. */
export function outlineStroke(pts: PathPoint[], closed: boolean, strokeWidth: number): StrokeOutline | null {
  const half = Math.max(0.5, strokeWidth / 2);
  if (pts.length < 2) return null;
  const samples = sampleContour(pts, closed);
  if (samples.length < 2) return null;
  const left = offsetWithMiter(samples, half);
  const right = offsetWithMiter(samples, -half);
  if (closed) {
    const outerCand = Math.abs(signedArea(left)) >= Math.abs(signedArea(right)) ? left : right;
    const innerCand = outerCand === left ? right : left;
    const outer = simplifyPolyline(outerCand, Math.max(0.6, half * 0.08));
    const inner = simplifyPolyline(innerCand, Math.max(0.6, half * 0.08));
    if (outer.length < 3) return null;
    const hole =
      inner.length >= 3 && Math.abs(signedArea(inner)) > 4
        ? toPathPoints(signedArea(inner) * signedArea(outer) > 0 ? inner.slice().reverse() : inner)
        : null;
    return { points: toPathPoints(outer), hole, closed: true };
  }
  const start = samples[0]!;
  const end = samples[samples.length - 1]!;
  const l0 = left[0]!;
  const r0 = right[0]!;
  const lN = left[left.length - 1]!;
  const rN = right[right.length - 1]!;
  const ring: Vec[] = [
    ...left,
    ...capArc(end.p, lN, rN),
    ...right.slice().reverse(),
    ...capArc(start.p, r0, l0),
  ];
  const simple = simplifyPolyline(ring, Math.max(0.6, half * 0.08));
  if (simple.length < 3) return null;
  return { points: toPathPoints(simple), hole: null, closed: true };
}
