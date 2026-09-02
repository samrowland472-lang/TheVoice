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

function ringContains(outer: Ring, inner: Ring): boolean {
  if (inner.length < 3 || outer.length < 3) return false;
  let hits = 0;
  const sample = Math.min(inner.length, 5);
  for (let i = 0; i < sample; i++) {
    if (pointInRing(inner[Math.floor((i * inner.length) / sample)]!, outer)) hits += 1;
  }
  return hits >= Math.ceil(sample / 2);
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

function onSeg(h: PathPoint, a: PathPoint, b: PathPoint) {
  const minx = Math.min(a.x, b.x) - GRID * 2;
  const maxx = Math.max(a.x, b.x) + GRID * 2;
  const miny = Math.min(a.y, b.y) - GRID * 2;
  const maxy = Math.max(a.y, b.y) + GRID * 2;
  if (h.x < minx || h.x > maxx || h.y < miny || h.y > maxy) return false;
  const cross = (h.x - a.x) * (b.y - a.y) - (h.y - a.y) * (b.x - a.x);
  return Math.abs(cross) <= GRID * 20;
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

function collectCrossings(a: Ring, b: Ring): PathPoint[] {
  const hits: PathPoint[] = [];
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i]!;
    const a2 = a[(i + 1) % a.length]!;
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j]!;
      const b2 = b[(j + 1) % b.length]!;
      const hit = segIntersect(a1, a2, b1, b2);
      if (hit) hits.push(hit.p);
    }
  }
  return hits;
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

export function splitSelfOverlapping(ring: Ring): Ring[] {
  const raw = cleanRing(ring);
  if (raw.length < 4) return raw.length >= 3 ? [raw] : [];
  const hits = selfCrossings(raw);
  if (!hits.length) return [raw];
  const split = splitRingAtHits(raw, hits);
  if (split.length < 4) return [raw];

  const firstAt = new Map<string, number>();
  const lobes: Ring[] = [];
  const consumed = new Set<string>();
  for (let i = 0; i < split.length; i++) {
    const k = keyOf(split[i]!);
    const prev = firstAt.get(k);
    if (prev != null && i - prev >= 3) {
      const slice = split.slice(prev, i);
      const lobe = cleanRing(slice);
      if (lobe.length >= 3 && Math.abs(ringArea(lobe)) > GRID * 40) {
        lobes.push(lobe);
        for (let j = prev; j < i; j++) consumed.add(`${j}`);
      }
    } else if (prev == null) firstAt.set(k, i);
  }
  if (lobes.length === 1) {
    const k = keyOf(lobes[0]![0]!);
    const idxs = split.map((p, i) => (keyOf(p) === k ? i : -1)).filter((i) => i >= 0);
    if (idxs.length >= 2) {
      const a = idxs[0]!;
      const b = idxs[1]!;
      const wrap = cleanRing([...split.slice(b), ...split.slice(0, a)]);
      if (wrap.length >= 3 && Math.abs(ringArea(wrap)) > GRID * 40) lobes.push(wrap);
    }
  }
  if (!lobes.length) {
    return [raw];
  }
  const unique: Ring[] = [];
  for (const lobe of lobes) {
    const sig = lobe.map(keyOf).sort().join("|");
    if (!unique.some((u) => u.map(keyOf).sort().join("|") === sig)) unique.push(lobe);
  }
  return unique.length ? unique : [raw];
}

function insideResult(wa: number, wb: number, op: ClipOp): boolean {
  const a = wa !== 0;
  const b = wb !== 0;
  if (op === "union") return a || b;
  if (op === "intersect") return a && b;
  if (op === "subtract") return a && !b;
  return a !== b;
}

function leftOf(a: PathPoint, b: PathPoint, scale = 0.05): PathPoint {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (a.x + b.x) / 2 - (dy / len) * scale, y: (a.y + b.y) / 2 + (dx / len) * scale };
}

function rightOf(a: PathPoint, b: PathPoint, scale = 0.05): PathPoint {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (a.x + b.x) / 2 + (dy / len) * scale, y: (a.y + b.y) / 2 - (dx / len) * scale };
}

type Half = { a: PathPoint; b: PathPoint };

function splitAgainst(rings: Ring[], other: Ring[]): Ring[] {
  return rings.map((r) => {
    const hits = other.flatMap((o) => collectCrossings(r, o));
    return splitRingAtHits(r, hits);
  });
}

function halves(rings: Ring[]): Half[] {
  const out: Half[] = [];
  for (const r of rings) {
    for (let i = 0; i < r.length; i++) out.push({ a: r[i]!, b: r[(i + 1) % r.length]! });
  }
  return out;
}

function clipTwo(aRings: Ring[], bRings: Ring[], op: ClipOp): Ring[] {
  const A0 = aRings.flatMap(splitSelfOverlapping).map(cleanRing).filter((r) => r.length >= 3);
  const B0 = bRings.flatMap(splitSelfOverlapping).map(cleanRing).filter((r) => r.length >= 3);
  if (!A0.length) return op === "intersect" || op === "subtract" ? [] : B0;
  if (!B0.length) return op === "intersect" ? [] : A0;

  const A = splitAgainst(A0, B0);
  const B = splitAgainst(B0, A0);
  const edges = [...halves(A), ...halves(B)];
  const kept: Half[] = [];
  for (const e of edges) {
    if (eq(e.a, e.b)) continue;
    const L = leftOf(e.a, e.b);
    const R = rightOf(e.a, e.b);
    const inL = insideResult(winding(L, A0), winding(L, B0), op);
    const inR = insideResult(winding(R, A0), winding(R, B0), op);
    if (inL && !inR) kept.push(e);
    else if (inR && !inL) kept.push({ a: e.b, b: e.a });
  }
  return chainHalves(kept);
}

function chainHalves(frags: Half[]): Ring[] {
  const unused = frags.map((f) => ({ ...f, used: false }));
  const rings: Ring[] = [];
  for (let i = 0; i < unused.length; i++) {
    if (unused[i]!.used) continue;
    unused[i]!.used = true;
    const ring: PathPoint[] = [unused[i]!.a, unused[i]!.b];
    let guard = 0;
    while (guard++ < unused.length + 4) {
      const tip = ring[ring.length - 1]!;
      let found = -1;
      let best = Infinity;
      for (let j = 0; j < unused.length; j++) {
        const f = unused[j]!;
        if (f.used) continue;
        const d = dist2(tip, f.a);
        if (d <= best && (eq(tip, f.a) || d < GRID * GRID * 80)) {
          best = d;
          found = j;
        }
      }
      if (found < 0) break;
      unused[found]!.used = true;
      const nxt = unused[found]!.b;
      if (!eq(ring[ring.length - 1]!, unused[found]!.a)) ring.push(unused[found]!.a);
      ring.push(nxt);
      if (eq(nxt, ring[0]!) && ring.length > 3) break;
    }
    const cleaned = collapseColinear(cleanRing(ring));
    if (cleaned.length >= 3 && Math.abs(ringArea(cleaned)) > GRID * 40) rings.push(cleaned);
  }
  return rings;
}

export function groupIslands(rings: Ring[]): { outer: Ring; holes: Ring[] }[] {
  const cleaned = rings.map(cleanRing).filter((r) => r.length >= 3);
  if (!cleaned.length) return [];
  const byArea = [...cleaned].sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
  const used = new Set<number>();
  const islands: { outer: Ring; holes: Ring[] }[] = [];
  for (let i = 0; i < byArea.length; i++) {
    if (used.has(i)) continue;
    const outer = byArea[i]!;
    const holes: Ring[] = [];
    used.add(i);
    for (let j = i + 1; j < byArea.length; j++) {
      if (used.has(j)) continue;
      const cand = byArea[j]!;
      if (!ringContains(outer, cand)) continue;
      if (holes.some((h) => ringContains(h, cand))) continue;
      holes.push(cand);
      used.add(j);
    }
    islands.push({ outer, holes });
  }
  return islands;
}

export function clipRings(a: Ring[], b: Ring[], op: ClipOp): Ring[] {
  return clipTwo(a, b, op);
}

export function clipMany(groups: Ring[][], op: ClipOp): Ring[] {
  const prepared = groups
    .map((g) => g.flatMap(splitSelfOverlapping).map(cleanRing).filter((r) => r.length >= 3))
    .filter((g) => g.length);
  if (prepared.length < 2) return prepared[0] ?? [];
  let acc = prepared[0]!;
  for (let i = 1; i < prepared.length; i++) {
    acc = clipTwo(acc, prepared[i]!, op);
    if (!acc.length && (op === "intersect" || op === "subtract")) return [];
  }
  return acc;
}
