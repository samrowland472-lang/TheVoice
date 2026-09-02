import type { PathPoint } from "./types";
import { ringArea } from "./polygon-clip";

export type Ring = PathPoint[];

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
  return out;
}

function onSeg(h: PathPoint, a: PathPoint, b: PathPoint) {
  const minx = Math.min(a.x, b.x) - GRID * 2;
  const maxx = Math.max(a.x, b.x) + GRID * 2;
  const miny = Math.min(a.y, b.y) - GRID * 2;
  const maxy = Math.max(a.y, b.y) + GRID * 2;
  if (h.x < minx || h.x > maxx || h.y < miny || h.y > maxy) return false;
  const cross = (h.x - a.x) * (b.y - a.y) - (h.y - a.y) * (b.x - a.x);
  return Math.abs(cross) <= GRID * 20;
}

function segIntersect(a1: PathPoint, a2: PathPoint, b1: PathPoint, b2: PathPoint): { p: PathPoint; t: number } | null {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;
  const den = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / den;
  const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / den;
  if (t < -1e-8 || t > 1 + 1e-8 || u < -1e-8 || u > 1 + 1e-8) return null;
  return { p: snapPt({ x: a1.x + t * dx1, y: a1.y + t * dy1 }), t };
}

function splitRingAtHits(ring: Ring, hits: PathPoint[]): Ring {
  if (!hits.length) return ring;
  const out: PathPoint[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    out.push(a);
    const mid = hits
      .filter((h) => !eq(h, a) && !eq(h, b))
      .filter((h) => onSeg(h, a, b))
      .sort((p, q) => dist2(a, p) - dist2(a, q));
    for (const h of mid) {
      if (!eq(out[out.length - 1]!, h)) out.push(h);
    }
  }
  return cleanRing(out);
}

function selfCrossings(ring: Ring): PathPoint[] {
  const hits: PathPoint[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a1 = ring[i]!;
    const a2 = ring[(i + 1) % n]!;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      const b1 = ring[j]!;
      const b2 = ring[(j + 1) % n]!;
      if (eq(a1, b1) || eq(a1, b2) || eq(a2, b1) || eq(a2, b2)) continue;
      const hit = segIntersect(a1, a2, b1, b2);
      if (hit && !eq(hit.p, a1) && !eq(hit.p, a2)) hits.push(hit.p);
    }
  }
  return hits;
}

/**
 * Winding pass: walk a self-overlapping trace (figure-eight / bowtie),
 * close a simple lobe every time the polyline returns to a vertex, then
 * recurse so clip sees simple rings instead of one twisted contour.
 */
function extractWindingLobes(split: Ring): Ring[] {
  const lastAt = new Map<string, number>();
  const lobes: Ring[] = [];
  const pushLobe = (slice: PathPoint[]) => {
    const lobe = cleanRing(slice);
    if (lobe.length >= 3 && Math.abs(ringArea(lobe)) > GRID * 40) lobes.push(lobe);
  };
  for (let i = 0; i < split.length; i++) {
    const k = keyOf(split[i]!);
    const prev = lastAt.get(k);
    if (prev != null && i - prev >= 3) pushLobe(split.slice(prev, i));
    lastAt.set(k, i);
  }
  if (split.length >= 4) {
    const start = keyOf(split[0]!);
    const end = keyOf(split[split.length - 1]!);
    if (start !== end) pushLobe(split);
  }
  return lobes;
}

export function splitSelfOverlapping(ring: Ring, depth = 0): Ring[] {
  const raw = cleanRing(ring);
  if (depth > 6) return raw.length >= 3 ? [raw] : [];
  if (raw.length < 4) return raw.length >= 3 ? [raw] : [];
  const hits = selfCrossings(raw);
  const split = hits.length ? splitRingAtHits(raw, hits) : raw;
  if (split.length < 4) return [raw];

  let lobes = extractWindingLobes(split);
  if (hits.length && lobes.length < 2) {
    const k = keyOf(split[0]!);
    const idxs = split.map((p, i) => (keyOf(p) === k ? i : -1)).filter((i) => i >= 0);
    if (idxs.length >= 2) {
      const a = idxs[0]!;
      const b = idxs[1]!;
      const wrap = cleanRing([...split.slice(b), ...split.slice(0, a)]);
      if (wrap.length >= 3 && Math.abs(ringArea(wrap)) > GRID * 40) lobes.push(wrap);
    }
  }
  if (!lobes.length) return [raw];

  const unique: Ring[] = [];
  const seen = new Set<string>();
  for (const lobe of lobes) {
    const sig = lobe.map(keyOf).sort().join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    const nestedHits = selfCrossings(lobe);
    if (nestedHits.length && lobe !== raw) {
      for (const n of splitSelfOverlapping(lobe, depth + 1)) {
        const ns = n.map(keyOf).sort().join("|");
        if (seen.has(ns)) continue;
        seen.add(ns);
        unique.push(n);
      }
    } else {
      unique.push(lobe);
    }
  }
  return unique.length ? unique : [raw];
}
