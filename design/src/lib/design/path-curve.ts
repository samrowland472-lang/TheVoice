import type { PathPoint } from "./types";

export function hasHandle(h: { x: number; y: number } | null | undefined) {
  return Boolean(h && (Math.abs(h.x) > 0.2 || Math.abs(h.y) > 0.2));
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

export function pathD(ox: number, oy: number, pts: PathPoint[], closed: boolean) {
  if (!pts.length) return "";
  const parts: string[] = [`M ${ox + pts[0]!.x} ${oy + pts[0]!.y}`];
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
      parts.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${ox + b.x} ${oy + b.y}`);
    } else {
      parts.push(`L ${ox + b.x} ${oy + b.y}`);
    }
  }
  if (closed) parts.push("Z");
  return parts.join(" ");
}

export function mirrorHandle(h: { x: number; y: number }) {
  return { x: -h.x, y: -h.y };
}
