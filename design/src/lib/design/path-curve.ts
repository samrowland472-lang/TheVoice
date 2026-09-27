import type { PathPoint } from "./types";

export function hasHandle(h: { x: number; y: number } | null | undefined) {
  return Boolean(h && (Math.abs(h.x) > 0.2 || Math.abs(h.y) > 0.2));
}

/** Screen-pixel radius for pen snap-close to the first point. */
export const PEN_CLOSE_SNAP_PX = 9;

export function nearPenClose(
  probeX: number,
  probeY: number,
  firstX: number,
  firstY: number,
  zoom: number,
  px = PEN_CLOSE_SNAP_PX,
) {
  return Math.hypot(probeX - firstX, probeY - firstY) <= px / zoom;
}

export function tracePath(ctx: CanvasRenderingContext2D, ox: number, oy: number, pts: PathPoint[], closed: boolean) {
  if (!pts.length) return;
  ctx.moveTo(ox + pts[0]!.x, oy + pts[0]!.y);
  const n = pts.length;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const out = a.out;
    const inn = b.in;
    if (hasHandle(out) || hasHandle(inn)) {
      const c1x = ox + a.x + (out?.x ?? 0);
      const c1y = oy + a.y + (out?.y ?? 0);
      const c2x = ox + b.x + (inn?.x ?? 0);
      const c2y = oy + b.y + (inn?.y ?? 0);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ox + b.x, oy + b.y);
    } else {
      ctx.lineTo(ox + b.x, oy + b.y);
    }
  }
  if (closed) ctx.closePath();
}

/** Rotate a relative cubic handle (offset from its anchor) by degrees. */
export function rotateHandle(
  h: { x: number; y: number } | null | undefined,
  deg: number,
): { x: number; y: number } | null {
  if (!h) return null;
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: h.x * c - h.y * s, y: h.x * s + h.y * c };
}

/**
 * Flatten a rotate-group into world-space points: anchors around (cx, cy)
 * and cubic handles as rotated relative offsets so path d needs no transform.
 */
export function bakeRotatedPoints(
  ox: number,
  oy: number,
  pts: PathPoint[],
  rotation: number,
  cx: number,
  cy: number,
): PathPoint[] {
  const rot = rotation || 0;
  return pts.map((p) => {
    const ax = ox + p.x;
    const ay = oy + p.y;
    if (!rot) return { ...p, x: ax, y: ay };
    const r = (rot * Math.PI) / 180;
    const dx = ax - cx;
    const dy = ay - cy;
    return {
      ...p,
      x: cx + dx * Math.cos(r) - dy * Math.sin(r),
      y: cy + dx * Math.sin(r) + dy * Math.cos(r),
      in: rotateHandle(p.in, rot),
      out: rotateHandle(p.out, rot),
    };
  });
}
