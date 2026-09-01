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

export function pointInRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  const n = ring.length;
  if (n < 3) return false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInShape(x: number, y: number, rings: Ring[]): boolean {
  let odd = false;
  for (const r of rings) {
    if (pointInRing(x, y, r)) odd = !odd;
  }
  return odd;
}

function onSeg(ax: number, ay: number, bx: number, by: number, px: number, py: number) {
  const minx = Math.min(ax, bx) - EPS;
  const maxx = Math.max(ax, bx) + EPS;
  const miny = Math.min(ay, by) - EPS;
  const maxy = Math.max(ay, by) + EPS;
  if (px < minx || px > maxx || py < miny || py > maxy) return false;
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
  return Math.abs(cross) <= 1e-4;
}

function collinearOverlapParams(a: PathPoint, b: PathPoint, c: PathPoint, d: PathPoint): number[] {
  const rX = b.x - a.x;
  const rY = b.y - a.y;
  const sX = d.x - c.x;
  const sY = d.y - c.y;
  const den = rX * sY - rY * sX;
  if (Math.abs(den) > 1e-6) return [];
  if (!onSeg(a.x, a.y, b.x, b.y, c.x, c.y) && !onSeg(a.x, a.y, b.x, b.y, d.x, d.y) && !onSeg(c.x, c.y, d.x, d.y, a.x, a.y)) {
    return [];
  }
  const ts: number[] = [];
  if (onSeg(a.x, a.y, b.x, b.y, c.x, c.y)) ts.push(paramOn(a, b, c));
  if (onSeg(a.x, a.y, b.x, b.y, d.x, d.y)) ts.push(paramOn(a, b, d));
  return ts;
}

function segIntersect(a: PathPoint, b: PathPoint, c: PathPoint, d: PathPoint): PathPoint | null {
  const rX = b.x - a.x;
  const rY = b.y - a.y;
  const sX = d.x - c.x;
  const sY = d.y - c.y;
  const den = rX * sY - rY * sX;
  if (Math.abs(den) < EPS) return null;
  const t = ((c.x - a.x) * sY - (c.y - a.y) * sX) / den;
  const u = ((c.x - a.x) * rY - (c.y - a.y) * rX) / den;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return null;
  return snapPt({ x: a.x + t * rX, y: a.y + t * rY });
}

type SplitPt = { x: number; y: number; t: number };

function paramOn(a: PathPoint, b: PathPoint, p: PathPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return 0;
  return ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
}

function dedupeRing(ring: Ring): Ring {
  const out: PathPoint[] = [];
  for (const p of ring) {
    const last = out[out.length - 1];
    if (last && almost(last.x, p.x) && almost(last.y, p.y)) continue;
    out.push({ x: p.x, y: p.y });
  }
  if (out.length > 1) {
    const a = out[0]!;
    const b = out[out.length - 1]!;
    if (almost(a.x, b.x) && almost(a.y, b.y)) out.pop();
  }
  return out;
}

function splitRing(ring: Ring, cutters: Ring[]): Ring {
  const n = ring.length;
  if (n < 2) return ring.map(snapPt);
  const out: PathPoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = snapPt(ring[i]!);
    const b = snapPt(ring[(i + 1) % n]!);
    const extras: SplitPt[] = [];
    for (const other of cutters) {
      const m = other.length;
      for (let k = 0; k < m; k++) {
        const c = snapPt(other[k]!);
        const d = snapPt(other[(k + 1) % m]!);
        const hit = segIntersect(a, b, c, d);
        if (hit) extras.push({ x: hit.x, y: hit.y, t: paramOn(a, b, hit) });
        for (const t of collinearOverlapParams(a, b, c, d)) {
          extras.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), t });
        }
        if (onSeg(a.x, a.y, b.x, b.y, c.x, c.y)) extras.push({ x: c.x, y: c.y, t: paramOn(a, b, c) });
      }
    }
    extras.sort((p, q) => p.t - q.t);
    out.push(a);
    let lastT = 0;
    for (const e of extras) {
      if (e.t < 1e-5 || e.t > 1 - 1e-5) continue;
      if (e.t - lastT < 1e-5) continue;
      out.push(snapPt({ x: e.x, y: e.y }));
      lastT = e.t;
    }
  }
  return dedupeRing(out);
}

export type ClipOp = "union" | "subtract" | "intersect" | "exclude";

type Frag = { ax: number; ay: number; bx: number; by: number };

function keepFromA(inB: boolean, onB: boolean, op: ClipOp): boolean {
  if (onB && op !== "intersect") return false;
  if (op === "union" || op === "subtract") return !inB;
  if (op === "intersect") return inB || onB;
  return true;
}

function keepFromB(inA: boolean, onA: boolean, op: ClipOp): boolean {
  if (onA && op !== "intersect" && op !== "subtract") return false;
  if (op === "union") return !inA;
  if (op === "intersect" || op === "subtract") return inA || onA;
  return true;
}

function pointOnRing(x: number, y: number, ring: Ring): boolean {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % n]!;
    if (onSeg(a.x, a.y, b.x, b.y, x, y)) return true;
  }
  return false;
}

function fragmentsOf(rings: Ring[], other: Ring[], fromA: boolean, op: ClipOp): Frag[] {
  const frags: Frag[] = [];
  for (const ring of rings) {
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % n]!;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const inOther = pointInShape(mx, my, other);
      const onOther = other.some((r) => pointOnRing(mx, my, r));
      const keep = fromA ? keepFromA(inOther, onOther, op) : keepFromB(inOther, onOther, op);
      if (!keep) continue;
      if (!fromA && op === "subtract") {
        frags.push({ ax: b.x, ay: b.y, bx: a.x, by: a.y });
      } else {
        frags.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
      }
    }
  }
  return frags;
}

function collapseColinear(ring: Ring): Ring {
  if (ring.length < 4) return ring;
  const out: PathPoint[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const prev = ring[(i + n - 1) % n]!;
    const cur = ring[i]!;
    const next = ring[(i + 1) % n]!;
    const ax = cur.x - prev.x;
    const ay = cur.y - prev.y;
    const bx = next.x - cur.x;
    const by = next.y - cur.y;
    const cross = ax * by - ay * bx;
    if (Math.abs(cross) <= 1e-3 && ax * bx + ay * by > 0) continue;
    out.push(cur);
  }
  return out.length >= 3 ? out : ring;
}

function chainFrags(frags: Frag[]): Ring[] {
  const unused = frags
    .map((f) => ({
      ax: snap(f.ax),
      ay: snap(f.ay),
      bx: snap(f.bx),
      by: snap(f.by),
    }))
    .filter((f) => Math.hypot(f.bx - f.ax, f.by - f.ay) > GRID * 4);
  const rings: Ring[] = [];
  while (unused.length) {
    const start = unused.pop()!;
    const ring: PathPoint[] = [
      { x: start.ax, y: start.ay },
      { x: start.bx, y: start.by },
    ];
    let guard = unused.length + 4;
    while (guard-- > 0) {
      const tail = ring[ring.length - 1]!;
      const head = ring[0]!;
      if (ring.length > 2 && almost(tail.x, head.x) && almost(tail.y, head.y)) {
        ring.pop();
        break;
      }
      let idx = unused.findIndex((f) => almost(f.ax, tail.x) && almost(f.ay, tail.y));
      let rev = false;
      if (idx < 0) {
        idx = unused.findIndex((f) => almost(f.bx, tail.x) && almost(f.by, tail.y));
        rev = idx >= 0;
      }
      if (idx < 0) {
        let best = -1;
        let bestD = 0.6;
        for (let i = 0; i < unused.length; i++) {
          const f = unused[i]!;
          const d1 = Math.hypot(f.ax - tail.x, f.ay - tail.y);
          const d2 = Math.hypot(f.bx - tail.x, f.by - tail.y);
          if (d1 < bestD) {
            bestD = d1;
            best = i;
            rev = false;
          }
          if (d2 < bestD) {
            bestD = d2;
            best = i;
            rev = true;
          }
        }
        idx = best;
      }
      if (idx < 0) break;
      const [f] = unused.splice(idx, 1);
      if (!f) break;
      ring.push(rev ? { x: f.ax, y: f.ay } : { x: f.bx, y: f.by });
    }
    const clean = collapseColinear(dedupeRing(ring));
    if (clean.length >= 3 && Math.abs(ringArea(clean)) > 0.5) rings.push(clean);
  }
  return rings;
}

function capRing(ring: Ring, max = 480): Ring {
  if (ring.length <= max) return ring.map(snapPt);
  const step = ring.length / max;
  const out: PathPoint[] = [];
  for (let i = 0; i < max; i++) out.push(snapPt(ring[Math.floor(i * step)]!));
  return dedupeRing(out);
}

export function clipRings(subject: Ring[], clip: Ring[], op: ClipOp): Ring[] {
  const sub = subject.filter((r) => r.length >= 3).map((r) => capRing(r));
  const clp = clip.filter((r) => r.length >= 3).map((r) => capRing(r));
  if (!sub.length) return [];
  if (!clp.length) return op === "subtract" || op === "union" || op === "exclude" ? sub : [];
  const subSplit = sub.map((r) => splitRing(r, clp));
  const clpSplit = clp.map((r) => splitRing(r, sub));
  const frags = [
    ...fragmentsOf(subSplit, clp, true, op),
    ...fragmentsOf(clpSplit, sub, false, op),
  ];
  return chainFrags(frags)
    .map((r) => ({ r, area: Math.abs(ringArea(r)) }))
    .sort((a, b) => b.area - a.area)
    .map((s) => s.r);
}

export function clipMany(groups: Ring[][], op: ClipOp): Ring[] {
  if (groups.length === 0) return [];
  let acc = groups[0] ?? [];
  for (let i = 1; i < groups.length; i++) {
    acc = clipRings(acc, groups[i]!, op);
    if (!acc.length) return [];
  }
  return acc;
}

export type Island = { outer: Ring; holes: Ring[] };

/** Nested rings become holes of the smallest containing outer; siblings stay islands. */
export function groupIslands(rings: Ring[]): Island[] {
  const ranked = rings
    .map((r) => ({ r, area: Math.abs(ringArea(r)) }))
    .filter((x) => x.area > 0.5)
    .sort((a, b) => b.area - a.area);
  const islands: Island[] = [];
  for (const item of ranked) {
    const probe = item.r[0]!;
    let parent: Island | undefined;
    for (let i = islands.length - 1; i >= 0; i--) {
      if (pointInRing(probe.x, probe.y, islands[i]!.outer)) parent = islands[i];
    }
    if (parent) parent.holes.push(item.r);
    else islands.push({ outer: item.r, holes: [] });
  }
  return islands;
}
