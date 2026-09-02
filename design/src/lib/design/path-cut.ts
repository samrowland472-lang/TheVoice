import { hasHandle } from "./path-curve";
import type { PathNode, PathPoint } from "./types";
import { explodeTwistedPath } from "./winding-pass";

export const KNIFE_HIT_PX = 10;

type Vec = { x: number; y: number };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpV(a: Vec, b: Vec, t: number): Vec {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function clonePt(p: PathPoint): PathPoint {
  return {
    x: p.x,
    y: p.y,
    in: p.in ? { ...p.in } : null,
    out: p.out ? { ...p.out } : null,
    smooth: p.smooth,
  };
}

export function segmentControls(a: PathPoint, b: PathPoint) {
  const p0: Vec = { x: a.x, y: a.y };
  const p3: Vec = { x: b.x, y: b.y };
  const curved = hasHandle(a.out) || hasHandle(b.in);
  const p1: Vec = curved ? { x: a.x + (a.out?.x ?? 0), y: a.y + (a.out?.y ?? 0) } : lerpV(p0, p3, 1 / 3);
  const p2: Vec = curved ? { x: b.x + (b.in?.x ?? 0), y: b.y + (b.in?.y ?? 0) } : lerpV(p0, p3, 2 / 3);
  return { p0, p1, p2, p3, curved };
}

export function cubicAt(p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

export function splitCubic(p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number) {
  const a = lerpV(p0, p1, t);
  const b = lerpV(p1, p2, t);
  const c = lerpV(p2, p3, t);
  const d = lerpV(a, b, t);
  const e = lerpV(b, c, t);
  const m = lerpV(d, e, t);
  return {
    left: [p0, a, d, m] as const,
    right: [m, e, c, p3] as const,
    mid: m,
  };
}

function sampleDist(p0: Vec, p1: Vec, p2: Vec, p3: Vec, x: number, y: number) {
  let bestT = 0;
  let best = Infinity;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = cubicAt(p0, p1, p2, p3, t);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < best) {
      best = d;
      bestT = t;
    }
  }
  const span = 1 / steps;
  let lo = Math.max(0, bestT - span);
  let hi = Math.min(1, bestT + span);
  for (let k = 0; k < 10; k++) {
    const t1 = lo + (hi - lo) / 3;
    const t2 = hi - (hi - lo) / 3;
    const d1 = Math.hypot(cubicAt(p0, p1, p2, p3, t1).x - x, cubicAt(p0, p1, p2, p3, t1).y - y);
    const d2 = Math.hypot(cubicAt(p0, p1, p2, p3, t2).x - x, cubicAt(p0, p1, p2, p3, t2).y - y);
    if (d1 < d2) hi = t2;
    else lo = t1;
  }
  const t = (lo + hi) / 2;
  const p = cubicAt(p0, p1, p2, p3, t);
  return { t, dist: Math.hypot(p.x - x, p.y - y), point: p };
}

export interface SegmentHit {
  index: number;
  t: number;
  local: Vec;
  dist: number;
}

export function hitPathSegment(pts: PathPoint[], closed: boolean, lx: number, ly: number, zoom: number): SegmentHit | null {
  const n = pts.length;
  if (n < 2) return null;
  const last = closed ? n : n - 1;
  let best: SegmentHit | null = null;
  for (let i = 0; i < last; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const { p0, p1, p2, p3 } = segmentControls(a, b);
    const s = sampleDist(p0, p1, p2, p3, lx, ly);
    if (!best || s.dist < best.dist) {
      best = { index: i, t: s.t, local: s.point, dist: s.dist };
    }
  }
  if (!best || best.dist > KNIFE_HIT_PX / zoom) return null;
  if (best.t < 0.04 || best.t > 0.96) {
    best = { ...best, t: Math.min(0.96, Math.max(0.04, best.t)) };
  }
  return best;
}

function applySplit(pts: PathPoint[], closed: boolean, hit: SegmentHit): PathPoint[] {
  const n = pts.length;
  const aIdx = hit.index;
  const bIdx = (hit.index + 1) % n;
  const a = clonePt(pts[aIdx]!);
  const b = clonePt(pts[bIdx]!);
  const { p0, p1, p2, p3, curved } = segmentControls(a, b);
  const { left, right, mid } = splitCubic(p0, p1, p2, p3, hit.t);
  if (curved) {
    a.out = { x: left[1].x - a.x, y: left[1].y - a.y };
    b.in = { x: right[2].x - b.x, y: right[2].y - b.y };
  }
  const midPt: PathPoint = {
    x: mid.x,
    y: mid.y,
    in: curved ? { x: left[2].x - mid.x, y: left[2].y - mid.y } : null,
    out: curved ? { x: right[1].x - mid.x, y: right[1].y - mid.y } : null,
    smooth: curved,
  };
  const next = pts.map(clonePt);
  next[aIdx] = a;
  next[bIdx] = b;
  next.splice(aIdx + 1, 0, midPt);
  return next;
}

export interface CutResult {
  keep: PathPoint[];
  extra: PathPoint[] | null;
  closed: boolean;
  cutIndex: number;
}

export function cutContourMany(pts: PathPoint[], closed: boolean, hits: SegmentHit[]): PathPoint[][] {
  if (!hits.length) return [pts.map(clonePt)];
  const ordered = hits
    .slice()
    .sort((a, b) => (a.index === b.index ? a.t - b.t : a.index - b.index));
  let ring = pts.map(clonePt);
  const wasClosed = closed;
  const cutIdxs: number[] = [];
  let shift = 0;
  for (const hit of ordered) {
    const adj: SegmentHit = {
      ...hit,
      index: hit.index + shift,
      t: Math.min(0.96, Math.max(0.04, hit.t)),
    };
    ring = applySplit(ring, wasClosed, adj);
    cutIdxs.push(adj.index + 1);
    shift += 1;
  }
  if (ring.length < 2) return [ring];
  if (wasClosed && cutIdxs.length === 1) {
    const one = cutContour(pts, true, ordered[0]!);
    return [one.keep];
  }
  const unique = [...new Set(cutIdxs)].sort((a, b) => a - b);
  const pieces: PathPoint[][] = [];
  const nick = (idx: number) => {
    const p = clonePt(ring[idx]!);
    p.in = null;
    p.out = null;
    p.smooth = false;
    return p;
  };
  if (wasClosed) {
    for (let i = 0; i < unique.length; i++) {
      const a = unique[i]!;
      const b = unique[(i + 1) % unique.length]!;
      const slice = a < b ? ring.slice(a, b + 1) : [...ring.slice(a), ...ring.slice(0, b + 1)];
      if (slice.length < 2) continue;
      const copy = slice.map(clonePt);
      copy[0] = nick(a);
      copy[copy.length - 1] = nick(b);
      pieces.push(copy);
    }
    return pieces.length ? pieces : [ring];
  }
  let start = 0;
  for (const cut of unique) {
    const slice = ring.slice(start, cut + 1).map(clonePt);
    if (slice.length >= 2) {
      slice[slice.length - 1] = nick(cut);
      if (start > 0) slice[0] = nick(start);
      pieces.push(slice);
    }
    start = cut;
  }
  const tail = ring.slice(start).map(clonePt);
  if (tail.length >= 2) {
    tail[0] = nick(start);
    pieces.push(tail);
  }
  return pieces.length ? pieces : [ring];
}

export function cutContour(pts: PathPoint[], closed: boolean, hit: SegmentHit): CutResult {
  const inserted = applySplit(pts, closed, hit);
  const cutIndex = hit.index + 1;
  if (closed) {
    const rotated = [...inserted.slice(cutIndex), ...inserted.slice(0, cutIndex)];
    const start = clonePt(rotated[0]!);
    start.in = null;
    const end = clonePt(rotated[rotated.length - 1]!);
    end.out = null;
    rotated[0] = start;
    rotated[rotated.length - 1] = end;
    return { keep: rotated, extra: null, closed: false, cutIndex: 0 };
  }
  const left = inserted.slice(0, cutIndex + 1).map(clonePt);
  const right = inserted.slice(cutIndex).map(clonePt);
  if (left.length) {
    const last = left[left.length - 1]!;
    last.out = null;
    last.smooth = false;
  }
  if (right.length) {
    const first = right[0]!;
    first.in = null;
    first.smooth = false;
  }
  return { keep: left, extra: right.length >= 2 ? right : null, closed: false, cutIndex };
}

export interface CompoundHit {
  hole: number | null;
  hit: SegmentHit;
}

export function hitCompoundSegment(n: PathNode, lx: number, ly: number, zoom: number): CompoundHit | null {
  let best: CompoundHit | null = null;
  const outer = hitPathSegment(n.points, n.closed, lx, ly, zoom);
  if (outer) best = { hole: null, hit: outer };
  (n.holes ?? []).forEach((ring, i) => {
    const h = hitPathSegment(ring, true, lx, ly, zoom);
    if (h && (!best || h.dist < best.hit.dist)) best = { hole: i, hit: h };
  });
  return best;
}

export function knifePreviewPoint(n: PathNode, lx: number, ly: number, zoom: number): { x: number; y: number } | null {
  let best: { x: number; y: number; dist: number } | null = null;
  for (const part of explodeTwistedPath(n)) {
    const found = hitCompoundSegment(part, lx, ly, zoom);
    if (!found) continue;
    if (!best || found.hit.dist < best.dist) {
      best = { x: n.x + found.hit.local.x, y: n.y + found.hit.local.y, dist: found.hit.dist };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

function segSeg(a: Vec, b: Vec, c: Vec, d: Vec): { t: number; u: number; p: Vec } | null {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = d.x - c.x;
  const sy = d.y - c.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u, p: { x: a.x + t * rx, y: a.y + t * ry } };
}

export function strokeHitsContour(pts: PathPoint[], closed: boolean, a: Vec, b: Vec): SegmentHit[] {
  const n = pts.length;
  if (n < 2) return [];
  const last = closed ? n : n - 1;
  const hits: SegmentHit[] = [];
  for (let i = 0; i < last; i++) {
    const pa = pts[i]!;
    const pb = pts[(i + 1) % n]!;
    const { p0, p1, p2, p3 } = segmentControls(pa, pb);
    let prev = p0;
    const steps = 16;
    for (let s = 1; s <= steps; s++) {
      const t1 = s / steps;
      const cur = cubicAt(p0, p1, p2, p3, t1);
      const hit = segSeg(prev, cur, a, b);
      if (hit) {
        const tSeg = (s - 1 + hit.t) / steps;
        hits.push({
          index: i,
          t: Math.min(0.96, Math.max(0.04, tSeg)),
          local: hit.p,
          dist: 0,
        });
        break;
      }
      prev = cur;
    }
  }
  hits.sort((x, y) => {
    const dx = (p: SegmentHit) => Math.hypot(p.local.x - a.x, p.local.y - a.y);
    return dx(x) - dx(y);
  });
  return hits;
}

export function strokeHitsCompound(
  n: PathNode,
  a: Vec,
  b: Vec,
): { hole: number | null; hit: SegmentHit }[] {
  const out: { hole: number | null; hit: SegmentHit }[] = [];
  for (const hit of strokeHitsContour(n.points, n.closed, a, b)) out.push({ hole: null, hit });
  (n.holes ?? []).forEach((ring, i) => {
    for (const hit of strokeHitsContour(ring, true, a, b)) out.push({ hole: i, hit });
  });
  return out;
}
