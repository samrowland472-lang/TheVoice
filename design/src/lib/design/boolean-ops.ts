import type { DesignNode, PathNode, ShapeNode } from "./types";
import { nodeCenter, rotatePoint } from "./geometry";
import { uid } from "./id";

export type Point = { x: number; y: number };

/** Shapes that can participate in boolean ops. */
export function isBooleanable(n: DesignNode): boolean {
  if (n.locked || !n.visible) return false;
  if (n.kind === "path") return (n as PathNode).closed && (n as PathNode).points.length >= 3;
  return n.kind === "rect" || n.kind === "ellipse" || n.kind === "polygon" || n.kind === "star";
}

/** Convert a booleanable node to a closed polygon in world coordinates (rotation baked). */
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

function boundsOf(pts: Point[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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

export function unionShapes(nodes: DesignNode[]): PathNode | null {
  const polys = nodes.map((n) => nodeToWorldPolygon(n)).filter((p): p is Point[] => !!p);
  if (polys.length < 2) return null;
  const all = polys.flat();
  const b = boundsOf(all);
  const outer = toLocal(polys[0]!, b.minX, b.minY);
  const holes = polys.slice(1).map((poly) => toLocal(poly, b.minX, b.minY));
  const first = nodes[0]!;
  return {
    id: uid(), name: "Union", kind: "path",
    x: b.minX, y: b.minY, w: Math.max(1, b.w), h: Math.max(1, b.h),
    rotation: 0, opacity: first.opacity, visible: true, locked: false,
    blend: first.blend, fill: first.fill, stroke: first.stroke, strokeWidth: first.strokeWidth,
    radius: 0, shadow: first.shadow, points: outer, closed: true, holes, fillRule: "nonzero",
  };
}

export function subtractShapes(a: DesignNode, b: DesignNode): PathNode | null {
  const polyA = nodeToWorldPolygon(a);
  const polyB = nodeToWorldPolygon(b);
  if (!polyA || !polyB) return null;
  const bnds = boundsOf([...polyA, ...polyB]);
  const outer = toLocal(polyA, bnds.minX, bnds.minY);
  const hole = toLocal(polyB, bnds.minX, bnds.minY);
  return {
    id: uid(), name: "Subtract", kind: "path",
    x: bnds.minX, y: bnds.minY, w: Math.max(1, bnds.w), h: Math.max(1, bnds.h),
    rotation: 0, opacity: a.opacity, visible: true, locked: false,
    blend: a.blend, fill: a.fill, stroke: a.stroke, strokeWidth: a.strokeWidth,
    radius: 0, shadow: a.shadow, points: outer, closed: true, holes: [hole], fillRule: "evenodd",
  };
}
