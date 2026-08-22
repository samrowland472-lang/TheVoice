import type { DesignNode } from "./types";

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

export function rotatePoint(x: number, y: number, cx: number, cy: number, deg: number) {
  const r = degToRad(deg);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cy + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

export function nodeCenter(n: DesignNode) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

export function nodeCorners(n: DesignNode) {
  const c = nodeCenter(n);
  const pts = [
    { x: n.x, y: n.y },
    { x: n.x + n.w, y: n.y },
    { x: n.x + n.w, y: n.y + n.h },
    { x: n.x, y: n.y + n.h },
  ];
  if (!n.rotation) return pts;
  return pts.map((p) => rotatePoint(p.x, p.y, c.x, c.y, n.rotation));
}

export function aabb(nodes: DesignNode[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of nodes) {
    for (const p of nodeCorners(n)) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay);
}

export function snap(value: number, grid: number) {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}
