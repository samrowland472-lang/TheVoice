import { pathNode } from "./node-factory";
import type { DesignNode, PathNode, PathPoint, ShapeNode } from "./types";
import { isPath } from "./types";

function pt(x: number, y: number, inn?: PathPoint["in"], out?: PathPoint["out"], smooth = false): PathPoint {
  return { x, y, in: inn ?? null, out: out ?? null, smooth };
}

function roundedRectPoints(w: number, h: number, radius: number): PathPoint[] {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r < 0.5) {
    return [pt(0, 0), pt(w, 0), pt(w, h), pt(0, h)];
  }
  const k = 0.5522847498 * r;
  return [
    pt(r, 0, null, { x: Math.min(k, (w - 2 * r) / 3), y: 0 }, true),
    pt(w - r, 0, { x: -k, y: 0 }, { x: k, y: 0 }, true),
    pt(w, r, { x: 0, y: -k }, { x: 0, y: k }, true),
    pt(w, h - r, { x: 0, y: -k }, { x: 0, y: k }, true),
    pt(w - r, h, { x: k, y: 0 }, { x: -k, y: 0 }, true),
    pt(r, h, { x: k, y: 0 }, { x: -k, y: 0 }, true),
    pt(0, h - r, { x: 0, y: k }, { x: 0, y: -k }, true),
    pt(0, r, { x: 0, y: k }, { x: 0, y: -k }, true),
  ];
}

function ellipsePoints(w: number, h: number): PathPoint[] {
  const rx = w / 2;
  const ry = h / 2;
  const kx = 0.5522847498 * rx;
  const ky = 0.5522847498 * ry;
  return [
    pt(rx, 0, { x: -kx, y: 0 }, { x: kx, y: 0 }, true),
    pt(w, ry, { x: 0, y: -ky }, { x: 0, y: ky }, true),
    pt(rx, h, { x: kx, y: 0 }, { x: -kx, y: 0 }, true),
    pt(0, ry, { x: 0, y: ky }, { x: 0, y: -ky }, true),
  ];
}

function polyPoints(w: number, h: number, sides: number, inner = 1): PathPoint[] {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const count = Math.max(3, sides);
  const pts: PathPoint[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const r = inner;
    pts.push(pt(cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)));
  }
  return pts;
}

function starPoints(w: number, h: number, points: number): PathPoint[] {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const n = Math.max(3, points);
  const pts: PathPoint[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : 0.4;
    pts.push(pt(cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)));
  }
  return pts;
}

function arrowPoints(w: number, h: number): PathPoint[] {
  const shaft = Math.max(2, h * 0.36);
  const mid = h / 2;
  const head = Math.max(8, Math.min(w * 0.38, h));
  const tip = w;
  const base = Math.max(0, w - head);
  return [
    pt(0, mid - shaft / 2),
    pt(base, mid - shaft / 2),
    pt(base, 0),
    pt(tip, mid),
    pt(base, h),
    pt(base, mid + shaft / 2),
    pt(0, mid + shaft / 2),
  ];
}

export function isConvertibleShape(n: DesignNode): n is ShapeNode {
  return n.kind === "rect" || n.kind === "ellipse" || n.kind === "line" || n.kind === "polygon" || n.kind === "star" || n.kind === "arrow";
}

export function shapeContour(n: ShapeNode): { points: PathPoint[]; closed: boolean } {
  switch (n.kind) {
    case "ellipse":
      return { points: ellipsePoints(n.w, n.h), closed: true };
    case "line":
      return { points: [pt(0, n.h / 2), pt(n.w, n.h / 2)], closed: false };
    case "polygon":
      return { points: polyPoints(n.w, n.h, n.sides ?? 6), closed: true };
    case "star":
      return { points: starPoints(n.w, n.h, n.sides ?? 5), closed: true };
    case "arrow":
      return { points: arrowPoints(n.w, n.h), closed: true };
    default:
      return { points: roundedRectPoints(n.w, n.h, n.radius ?? 0), closed: true };
  }
}

export function shapeToPathNode(n: ShapeNode): PathNode {
  const { points, closed } = shapeContour(n);
  const node = pathNode({
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    rotation: n.rotation,
    points,
    closed,
    fill: n.fill,
    stroke: n.stroke,
    strokeWidth: n.strokeWidth,
    opacity: n.opacity,
    blend: n.blend,
    name: n.name,
    visible: n.visible,
    locked: n.locked,
    shadow: n.shadow,
  });
  node.id = n.id;
  node.linkId = n.linkId;
  node.href = n.href;
  return node;
}

export function asEditablePath(n: DesignNode): PathNode | null {
  if (isPath(n)) return n;
  if (isConvertibleShape(n)) return shapeToPathNode(n);
  return null;
}
