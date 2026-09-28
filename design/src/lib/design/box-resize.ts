import type { DesignNode } from "./types";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export type Box = { x: number; y: number; w: number; h: number };

export const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function handlePoint(box: Box, handle: ResizeHandle): { x: number; y: number } {
  const midX = box.x + box.w / 2;
  const midY = box.y + box.h / 2;
  const right = box.x + box.w;
  const bottom = box.y + box.h;
  switch (handle) {
    case "nw":
      return { x: box.x, y: box.y };
    case "n":
      return { x: midX, y: box.y };
    case "ne":
      return { x: right, y: box.y };
    case "e":
      return { x: right, y: midY };
    case "se":
      return { x: right, y: bottom };
    case "s":
      return { x: midX, y: bottom };
    case "sw":
      return { x: box.x, y: bottom };
    case "w":
      return { x: box.x, y: midY };
  }
}

export function hitResizeHandle(box: Box, x: number, y: number, zoom: number): ResizeHandle | null {
  const r = 7 / Math.max(zoom, 0.01);
  let best: ResizeHandle | null = null;
  let bestD = r;
  for (const h of RESIZE_HANDLES) {
    const p = handlePoint(box, h);
    const d = Math.hypot(x - p.x, y - p.y);
    if (d <= bestD) {
      bestD = d;
      best = h;
    }
  }
  return best;
}

/** Opposite corner stays fixed when dragging a handle. */
export function resizeBox(box: Box, handle: ResizeHandle, x: number, y: number, lockAspect = false): Box {
  let left = box.x;
  let top = box.y;
  let right = box.x + box.w;
  let bottom = box.y + box.h;
  const aspect = box.w > 0 && box.h > 0 ? box.w / box.h : 1;
  if (handle.includes("w")) left = x;
  if (handle.includes("e")) right = x;
  if (handle.includes("n")) top = y;
  if (handle.includes("s")) bottom = y;
  if (lockAspect && box.h > 0) {
    if (handle === "n" || handle === "s") {
      const h = Math.abs(bottom - top);
      const w = h * aspect;
      const cx = box.x + box.w / 2;
      left = cx - w / 2;
      right = cx + w / 2;
    } else if (handle === "e" || handle === "w") {
      const w = Math.abs(right - left);
      const h = w / aspect;
      const cy = box.y + box.h / 2;
      top = cy - h / 2;
      bottom = cy + h / 2;
    } else {
      const w = Math.abs(right - left);
      const h = w / aspect;
      if (handle.includes("n")) top = bottom - (bottom > top ? h : -h);
      else bottom = top + (bottom > top ? h : -h);
    }
  }
  const nx = Math.min(left, right);
  const ny = Math.min(top, bottom);
  const nw = Math.max(1, Math.abs(right - left));
  const nh = Math.max(1, Math.abs(bottom - top));
  return { x: nx, y: ny, w: nw, h: nh };
}

export function mapNodeToBox(n: DesignNode, from: Box, to: Box): DesignNode {
  if (from.w < 1e-6 || from.h < 1e-6) return n;
  const sx = to.w / from.w;
  const sy = to.h / from.h;
  const x = to.x + (n.x - from.x) * sx;
  const y = to.y + (n.y - from.y) * sy;
  const w = Math.max(1, n.w * sx);
  const h = n.kind === "text" ? n.h : Math.max(1, n.h * sy);
  return { ...n, x, y, w, h };
}
