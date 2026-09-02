import { pathNode } from "./node-factory";
import { nodeCenter, rotatePoint } from "./geometry";
import { hasHandle } from "./path-curve";
import { clipMany, type ClipOp } from "./polygon-clip";
import { groupIslandsNested as groupIslands } from "./island-group";
import type { DesignNode, PathNode, PathPoint } from "./types";
import { isPath } from "./types";

export type BooleanOp = "union" | "subtract" | "intersect" | "exclude";

export type Contour = PathPoint[];

const SHAPE_KINDS = new Set(["rect", "ellipse", "polygon", "star", "arrow", "path"]);

export function canBoolean(n: DesignNode): boolean {
  if (!n.visible || n.locked) return false;
  if (!SHAPE_KINDS.has(n.kind)) return false;
  if (isPath(n)) return n.points.length >= 3;
  return n.w > 1 && n.h > 1;
}

export function booleanableOf(nodes: DesignNode[]): DesignNode[] {
  return nodes.filter(canBoolean);
}

export function isBooleanable(n: DesignNode): boolean {
  return canBoolean(n);
}

function worldPoint(n: DesignNode, lx: number, ly: number): PathPoint {
  const local = { x: n.x + lx, y: n.y + ly };
  if (!n.rotation) return local;
  const c = nodeCenter(n);
  return rotatePoint(local.x, local.y, c.x, c.y, n.rotation);
}

function sampleEllipse(cx: number, cy: number, rx: number, ry: number, steps = 32): PathPoint[] {
  const pts: PathPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function roundedRectLocal(n: DesignNode): PathPoint[] {
  const r = Math.max(0, Math.min(n.radius, Math.min(n.w, n.h) / 2));
  if (r < 0.5) {
    return [
      { x: 0, y: 0 },
      { x: n.w, y: 0 },
      { x: n.w, y: n.h },
      { x: 0, y: n.h },
    ];
  }
  const steps = 5;
  const pts: PathPoint[] = [];
  const corners: [number, number, number, number][] = [
    [n.w - r, r, 0, Math.PI / 2],
    [n.w - r, n.h - r, Math.PI / 2, Math.PI],
    [r, n.h - r, Math.PI, (3 * Math.PI) / 2],
    [r, r, (3 * Math.PI) / 2, Math.PI * 2],
  ];
  for (const [cx, cy, a0, a1] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
  }
  return pts;
}

function polygonLocal(n: DesignNode, sides: number): PathPoint[] {
  const cx = n.w / 2;
  const cy = n.h / 2;
  const rx = n.w / 2;
  const ry = n.h / 2;
  const pts: PathPoint[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return pts;
}

function starLocal(n: DesignNode, points = 5): PathPoint[] {
  const cx = n.w / 2;
  const cy = n.h / 2;
  const rx = n.w / 2;
  const ry = n.h / 2;
  const pts: PathPoint[] = [];
  for (let i = 0; i < points * 2; i++) {
    const inner = i % 2 === 0 ? 1 : 0.4;
    const a = (i * Math.PI) / points - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * rx * inner, y: cy + Math.sin(a) * ry * inner });
  }
  return pts;
}

function arrowLocal(n: DesignNode): PathPoint[] {
  return [
    { x: 0, y: n.h * 0.35 },
    { x: n.w * 0.62, y: n.h * 0.35 },
    { x: n.w * 0.62, y: 0 },
    { x: n.w, y: n.h / 2 },
    { x: n.w * 0.62, y: n.h },
    { x: n.w * 0.62, y: n.h * 0.65 },
    { x: 0, y: n.h * 0.65 },
  ];
}

function flattenLocal(pts: PathPoint[], steps = 8): PathPoint[] {
  if (!pts.length) return [];
  const n = pts.length;
  const out: PathPoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    out.push({ x: a.x, y: a.y });
    if (hasHandle(a.out) || hasHandle(b.in)) {
      const c1x = a.x + (a.out?.x ?? 0);
      const c1y = a.y + (a.out?.y ?? 0);
      const c2x = b.x + (b.in?.x ?? 0);
      const c2y = b.y + (b.in?.y ?? 0);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const u = 1 - t;
        out.push({
          x: u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * b.x,
          y: u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * b.y,
        });
      }
    }
  }
  return out;
}

function mapContour(n: DesignNode, local: PathPoint[]): Contour {
  return flattenLocal(local).map((p) => {
    const w = worldPoint(n, p.x, p.y);
    return { x: w.x, y: w.y };
  });
}

export function nodeToWorldContours(n: DesignNode): Contour[] {
  if (isPath(n)) {
    const outer = mapContour(n, n.points);
    const holes = (n.holes ?? []).map((h) => mapContour(n, h));
    return [outer, ...holes];
  }
  let local: PathPoint[] = [];
  switch (n.kind) {
    case "rect":
      local = roundedRectLocal(n);
      break;
    case "ellipse":
      local = sampleEllipse(n.w / 2, n.h / 2, Math.abs(n.w / 2), Math.abs(n.h / 2));
      break;
    case "polygon":
      local = polygonLocal(n, n.sides ?? 6);
      break;
    case "star":
      local = starLocal(n, n.sides ?? 5);
      break;
    case "arrow":
      local = arrowLocal(n);
      break;
    default:
      return [];
  }
  return [mapContour(n, local)];
}

export function contourArea(pts: PathPoint[]): number {
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

export function orientContour(pts: PathPoint[], clockwise: boolean): PathPoint[] {
  if (pts.length < 3) return pts;
  const pos = contourArea(pts) >= 0;
  const isCw = !pos;
  if (isCw === clockwise) return pts;
  return pts.slice().reverse();
}

export function composeBoolean(nodes: DesignNode[], op: BooleanOp): PathNode | null {
  const usable = booleanableOf(nodes);
  if (usable.length < 2) return null;
  const groups = usable.map((n) => nodeToWorldContours(n)).filter((g) => g.length && g[0]!.length >= 3);
  if (groups.length < 2) return null;
  const parts = composeBooleanParts(usable, groups, op);
  return parts[0] ?? null;
}

export function composeBooleanParts(
  usable: DesignNode[],
  groups: Contour[][],
  op: BooleanOp,
): PathNode[] {
  const first = usable[0]!;
  const clipped = clipMany(groups, op as ClipOp);
  if (!clipped.length) return [];
  const islands = groupIslands(clipped);
  if (!islands.length) return [];
  const label = op === "union" ? "Union" : op === "subtract" ? "Subtract" : op === "intersect" ? "Intersect" : "Exclude";
  return islands.map((island, i) => ringToPath(first, island.outer, island.holes, i === 0 ? label : `${label} ${i + 1}`, i === 0 ? first.id : undefined));
}

function ringToPath(first: DesignNode, outer: Contour, holes: Contour[], name: string, id?: string): PathNode {
  const allPts = [outer, ...holes].flat();
  const minX = Math.min(...allPts.map((p) => p.x));
  const minY = Math.min(...allPts.map((p) => p.y));
  const maxX = Math.max(...allPts.map((p) => p.x));
  const maxY = Math.max(...allPts.map((p) => p.y));
  const ox = Number.isFinite(minX) ? minX : 0;
  const oy = Number.isFinite(minY) ? minY : 0;
  const rel = (c: Contour) => c.map((p) => ({ ...p, x: p.x - ox, y: p.y - oy }));
  const outerRel = rel(outer);
  const outerCw = contourArea(outerRel) < 0;
  return pathNode({
    ...(id ? { id } : {}),
    name,
    x: ox,
    y: oy,
    w: Math.max(1, maxX - ox),
    h: Math.max(1, maxY - oy),
    rotation: 0,
    opacity: first.opacity,
    visible: true,
    locked: false,
    blend: first.blend,
    fill: first.fill,
    stroke: first.stroke,
    strokeWidth: first.strokeWidth,
    radius: 0,
    shadow: first.shadow,
    points: outerRel,
    holes: holes.map((h) => orientContour(rel(h), !outerCw)),
    closed: true,
    fillRule: "evenodd",
  });
}

export function computeBoolean(nodes: DesignNode[], op: BooleanOp): PathNode | null {
  return composeBoolean(nodes, op);
}

export function computeBooleanParts(nodes: DesignNode[], op: BooleanOp): PathNode[] {
  const usable = booleanableOf(nodes);
  if (usable.length < 2) return [];
  const groups = usable.map((n) => nodeToWorldContours(n)).filter((g) => g.length && g[0]!.length >= 3);
  if (groups.length < 2) return [];
  return composeBooleanParts(usable, groups, op);
}
