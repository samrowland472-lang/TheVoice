import { degToRad, nodeCenter } from "./geometry";
import type { DesignNode } from "./types";

export type Handle =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw"
  | "rotate";

export function nodeLocalPoint(n: DesignNode, x: number, y: number) {
  const c = nodeCenter(n);
  const r = -degToRad(n.rotation);
  const dx = x - c.x;
  const dy = y - c.y;
  return {
    x: c.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: c.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

export function hitNode(n: DesignNode, x: number, y: number, opts?: { ignoreLock?: boolean }): boolean {
  if (!n.visible || (n.locked && !opts?.ignoreLock)) return false;
  const p = nodeLocalPoint(n, x, y);
  if (n.kind === "ellipse") {
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const rx = n.w / 2 || 1;
    const ry = n.h / 2 || 1;
    const dx = (p.x - cx) / rx;
    const dy = (p.y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  const pad = Math.max(6, n.strokeWidth);
  return p.x >= n.x - pad && p.x <= n.x + n.w + pad && p.y >= n.y - pad && p.y <= n.y + n.h + pad;
}

export function hitTop(nodes: DesignNode[], x: number, y: number): DesignNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]!;
    if (hitNode(n, x, y)) return n;
  }
  return null;
}

export function hitHandle(n: DesignNode, sx: number, sy: number, zoom: number): Handle | null {
  const size = 9 / zoom;
  const rot = 18 / zoom;
  const c = nodeCenter(n);
  const handles: { id: Handle; x: number; y: number; r: number }[] = [
    { id: "nw", x: n.x, y: n.y, r: size },
    { id: "n", x: n.x + n.w / 2, y: n.y, r: size },
    { id: "ne", x: n.x + n.w, y: n.y, r: size },
    { id: "e", x: n.x + n.w, y: n.y + n.h / 2, r: size },
    { id: "se", x: n.x + n.w, y: n.y + n.h, r: size },
    { id: "s", x: n.x + n.w / 2, y: n.y + n.h, r: size },
    { id: "sw", x: n.x, y: n.y + n.h, r: size },
    { id: "w", x: n.x, y: n.y + n.h / 2, r: size },
    { id: "rotate", x: n.x + n.w / 2, y: n.y - 28 / zoom, r: rot },
  ];
  const p = nodeLocalPoint(n, sx, sy);
  for (const h of handles) {
    if (Math.hypot(p.x - h.x, p.y - h.y) <= h.r + 4 / zoom) return h.id;
  }
  if (hitNode({ ...n, locked: false }, sx, sy)) return "move";
  void c;
  return null;
}

export function applyHandle(
  n: DesignNode,
  handle: Handle,
  dx: number,
  dy: number,
): Partial<DesignNode> {
  const p = { x: n.x, y: n.y, w: n.w, h: n.h };
  switch (handle) {
    case "move":
      p.x += dx;
      p.y += dy;
      break;
    case "e":
      p.w += dx;
      break;
    case "w":
      p.x += dx;
      p.w -= dx;
      break;
    case "s":
      p.h += dy;
      break;
    case "n":
      p.y += dy;
      p.h -= dy;
      break;
    case "se":
      p.w += dx;
      p.h += dy;
      break;
    case "nw":
      p.x += dx;
      p.y += dy;
      p.w -= dx;
      p.h -= dy;
      break;
    case "ne":
      p.y += dy;
      p.w += dx;
      p.h -= dy;
      break;
    case "sw":
      p.x += dx;
      p.w -= dx;
      p.h += dy;
      break;
  }
  if (p.w < 8) {
    p.w = 8;
  }
  if (p.h < 8) {
    p.h = 8;
  }
  return p;
}
