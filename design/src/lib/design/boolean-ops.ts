import type { DesignNode, PathNode, ShapeNode } from "./types";
import { nodeCenter, rotatePoint } from "./geometry";
import { uid } from "./id";

export type Point = { x: number; y: number };

const EPS = 1e-9;

/** Shapes that can participate in boolean ops. */
export function isBooleanable(n: DesignNode): boolean {
  if (n.locked || !n.visible) return false;
  if (n.kind === "path") return (n as PathNode).closed && (n as PathNode).points.length >= 3;
  return n.kind === "rect" || n.kind === "ellipse" || n.kind === "polygon" || n.kind === "star";
}

export function nodeToWorldPolygon(n: DesignNode, segments = 48): Point[] | null {
  if (!isBooleanable(n)) return null;
  const c = nodeCenter(n);
  let local: Point[] = [];

  if (n.kind === "path") {
    const p = n as PathNode;
    local = p.points.map((pt) => ({ x: n.x + pt.x, y: n.y + pt.y }));
  } else if (n.kind === "rect") {
    local = [
      { x: n.x, y: n.y },
      { x: n.x + n.w, y: n.y },
      { x: n.x + n.w, y: n.y + n.h },
      { x: n.x, y: n.y + n.h },
    ];
  } else if (n.kind === "ellipse") {
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      local.push({
        x: n.x + n.w / 2 + (n.w / 2) * Math.cos(a),
        y: n.y + n.h / 2 + (n.h / 2) * Math.sin(a),
      });
    }
  } else if (n.kind === "polygon" || n.kind === "star") {
    const sides = (n as ShapeNode).sides ?? (n.kind === "star" ? 5 : 6);
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const rx = n.w / 2;
    const ry = n.h / 2;
    if (n.kind === "star") {
      for (let i = 0; i < sides * 2; i++) {
        const a = (i * Math.PI) / sides - Math.PI / 2;
        const r = i % 2 === 0 ? 1 : 0.4;
        local.push({ x: cx + rx * r * Math.cos(a), y: cy + ry * r * Math.sin(a) });
      }
    } else {
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        local.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
      }
    }
  }

  if (local.length < 3) return null;
  if (!n.rotation) return local;
  return local.map((p) => rotatePoint(p.x, p.y, c.x, c.y, n.rotation));
}

export function nodeToWorldHoles(n: DesignNode): Point[][] {
  if (n.kind !== "path") return [];
  const holes = (n as PathNode).holes ?? [];
  const c = nodeCenter(n);
  return holes
    .filter((h) => h.length >= 3)
    .map((h) => {
      const world = h.map((pt) => ({ x: n.x + pt.x, y: n.y + pt.y }));
      if (!n.rotation) return world;
      return world.map((p) => rotatePoint(p.x, p.y, c.x, c.y, n.rotation));
    });
}

function boundsOf(pts: Point[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function toLocal(pts: Point[], originX: number, originY: number): Point[] {
  return pts.map((p) => ({ x: p.x - originX, y: p.y - originY }));
}

function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function isConvex(poly: Point[]): boolean {
  if (poly.length < 3) return false;
  let sign = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const z = cross(poly[i]!, poly[(i + 1) % n]!, poly[(i + 2) % n]!);
    if (Math.abs(z) < EPS) continue;
    const s = z > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return sign !== 0;
}

function ensureCcw(poly: Point[]): Point[] {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return area < 0 ? [...poly].reverse() : poly;
}

export function pointInPoly(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    const hit = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y + EPS) + a.x;
    if (hit) inside = !inside;
  }
  return inside;
}

function polysOverlap(a: Point[], b: Point[]): boolean {
  if (a.some((p) => pointInPoly(p, b)) || b.some((p) => pointInPoly(p, a))) return true;
  const n = a.length;
  const m = b.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (segIntersect(a[i]!, a[(i + 1) % n]!, b[j]!, b[(j + 1) % m]!)) return true;
    }
  }
  return false;
}

function segIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  if (((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) && ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))) {
    return true;
  }
  return false;
}

function intersectSeg(a: Point, b: Point, c: Point, d: Point): Point | null {
  const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(den) < EPS) return null;
  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den;
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}

function insideHalf(p: Point, a: Point, b: Point) {
  return cross(a, b, p) >= -EPS;
}

export function sutherlandHodgman(subject: Point[], clip: Point[]): Point[] {
  let output = subject;
  const clipper = ensureCcw(clip);
  for (let i = 0; i < clipper.length; i++) {
    const a = clipper[i]!;
    const b = clipper[(i + 1) % clipper.length]!;
    const input = output;
    output = [];
    if (!input.length) break;
    for (let j = 0; j < input.length; j++) {
      const cur = input[j]!;
      const prev = input[(j + input.length - 1) % input.length]!;
      const curIn = insideHalf(cur, a, b);
      const prevIn = insideHalf(prev, a, b);
      if (curIn) {
        if (!prevIn) {
          const hit = intersectSeg(prev, cur, a, b);
          if (hit) output.push(hit);
        }
        output.push(cur);
      } else if (prevIn) {
        const hit = intersectSeg(prev, cur, a, b);
        if (hit) output.push(hit);
      }
    }
  }
  return dedupeRing(output);
}

function dedupeRing(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.15) continue;
    out.push(p);
  }
  if (out.length > 1) {
    const a = out[0]!;
    const b = out[out.length - 1]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) < 0.15) out.pop();
  }
  return out;
}

function convexHull(pts: Point[]): Point[] {
  const sorted = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (sorted.length < 3) return sorted;
  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function intersectPolygons(a: Point[], b: Point[]): Point[] | null {
  if (a.length < 3 || b.length < 3) return null;
  if (!polysOverlap(a, b)) return null;
  let result: Point[] = [];
  if (isConvex(b)) result = sutherlandHodgman(a, b);
  else if (isConvex(a)) result = sutherlandHodgman(b, a);
  else {
    const hullB = convexHull(b);
    result = sutherlandHodgman(a, hullB);
  }
  return result.length >= 3 ? result : null;
}

function pathFromWorld(name: string, outer: Point[], holes: Point[][], style: DesignNode, fillRule: PathNode["fillRule"]): PathNode {
  const all = [outer, ...holes].flat();
  const b = boundsOf(all);
  return {
    id: uid(),
    name,
    kind: "path",
    x: b.minX,
    y: b.minY,
    w: Math.max(1, b.w),
    h: Math.max(1, b.h),
    rotation: 0,
    opacity: style.opacity,
    visible: true,
    locked: false,
    blend: style.blend,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    radius: 0,
    shadow: style.shadow,
    points: toLocal(outer, b.minX, b.minY),
    closed: true,
    holes: holes.filter((h) => h.length >= 3).map((h) => toLocal(h, b.minX, b.minY)),
    fillRule,
  };
}

export function unionShapes(nodes: DesignNode[]): PathNode | null {
  const items = nodes
    .map((n) => {
      const poly = nodeToWorldPolygon(n);
      return poly ? { n, poly, holes: nodeToWorldHoles(n) } : null;
    })
    .filter((x): x is { n: DesignNode; poly: Point[]; holes: Point[][] } => !!x);
  if (items.length < 2) return null;

  const used = new Set<number>();
  const groups: { outer: Point[]; holes: Point[][] }[] = [];

  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    let cluster = [items[i]!.poly];
    const holes = [...items[i]!.holes];
    let grew = true;
    while (grew) {
      grew = false;
      for (let j = 0; j < items.length; j++) {
        if (used.has(j)) continue;
        if (cluster.some((poly) => polysOverlap(poly, items[j]!.poly))) {
          used.add(j);
          cluster.push(items[j]!.poly);
          holes.push(...items[j]!.holes);
          grew = true;
        }
      }
    }
    const merged = cluster.length === 1 ? cluster[0]! : convexHull(cluster.flat());
    groups.push({ outer: merged, holes });
  }

  const first = items[0]!.n;
  if (groups.length === 1) {
    return pathFromWorld("Union", groups[0]!.outer, groups[0]!.holes, first, groups[0]!.holes.length ? "evenodd" : "nonzero");
  }
  const primary = groups[0]!;
  const extra = groups.slice(1).map((g) => g.outer);
  return pathFromWorld("Union", primary.outer, [...primary.holes, ...extra], first, "nonzero");
}

export function subtractShapes(base: DesignNode, ...cutters: DesignNode[]): PathNode | null {
  const outer = nodeToWorldPolygon(base);
  if (!outer) return null;
  const inherited = nodeToWorldHoles(base);
  const holes: Point[][] = [...inherited];
  for (const cutter of cutters) {
    const poly = nodeToWorldPolygon(cutter);
    if (!poly) continue;
    const punch = intersectPolygons(outer, poly);
    if (punch && punch.length >= 3) holes.push(ensureCw(punch));
  }
  if (!holes.length) return pathFromWorld("Subtract", outer, [], base, "nonzero");
  return pathFromWorld("Subtract", outer, holes, base, "evenodd");
}

function ensureCw(poly: Point[]): Point[] {
  return ensureCcw(poly).slice().reverse();
}

export function intersectShapes(nodes: DesignNode[]): PathNode | null {
  const items = nodes
    .map((n) => {
      const poly = nodeToWorldPolygon(n);
      return poly ? { n, poly } : null;
    })
    .filter((x): x is { n: DesignNode; poly: Point[] } => !!x);
  if (items.length < 2) return null;
  let acc: Point[] | null = items[0]!.poly;
  for (let i = 1; i < items.length; i++) {
    if (!acc) return null;
    acc = intersectPolygons(acc, items[i]!.poly);
  }
  if (!acc || acc.length < 3) return null;
  return pathFromWorld("Intersect", ensureCcw(acc), [], items[0]!.n, "nonzero");
}

export function excludeShapes(nodes: DesignNode[]): PathNode | null {
  const items = nodes
    .map((n) => {
      const poly = nodeToWorldPolygon(n);
      return poly ? { n, poly, holes: nodeToWorldHoles(n) } : null;
    })
    .filter((x): x is { n: DesignNode; poly: Point[]; holes: Point[][] } => !!x);
  if (items.length < 2) return null;
  const primary = ensureCcw(items[0]!.poly);
  const rings = items.slice(1).map((it) => ensureCcw(it.poly));
  const inherited = items.flatMap((it) => it.holes.map(ensureCw));
  return pathFromWorld("Exclude", primary, [...rings, ...inherited], items[0]!.n, "evenodd");
}

export type BooleanOp = "union" | "subtract" | "intersect" | "exclude";

export function computeBoolean(nodes: DesignNode[], op: BooleanOp): PathNode | null {
  const usable = nodes.filter(isBooleanable);
  if (usable.length < 2) return null;
  if (op === "union") return unionShapes(usable);
  if (op === "subtract") return subtractShapes(usable[0]!, ...usable.slice(1));
  if (op === "intersect") return intersectShapes(usable);
  return excludeShapes(usable);
}
