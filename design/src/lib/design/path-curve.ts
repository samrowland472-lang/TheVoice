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

function unit(x: number, y: number) {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return { x: 0, y: 0, len: 0 };
  return { x: x / len, y: y / len, len };
}

/** Average incoming/outgoing tangents and write mirrored cubic handles. */
export function autoSmoothPoint(pts: PathPoint[], index: number, closed: boolean): PathPoint {
  const n = pts.length;
  const cur = pts[index]!;
  if (n < 2) return { ...cur, smooth: true };

  const prev = index > 0 ? pts[index - 1]! : closed ? pts[n - 1]! : null;
  const next = index < n - 1 ? pts[index + 1]! : closed ? pts[0]! : null;

  const inDir = prev ? unit(cur.x - prev.x, cur.y - prev.y) : null;
  const outDir = next ? unit(next.x - cur.x, next.y - cur.y) : null;

  let tx = 0;
  let ty = 0;
  if (inDir && outDir) {
    tx = inDir.x + outDir.x;
    ty = inDir.y + outDir.y;
  } else if (outDir) {
    tx = outDir.x;
    ty = outDir.y;
  } else if (inDir) {
    tx = inDir.x;
    ty = inDir.y;
  }
  const t = unit(tx, ty);
  if (t.len < 1e-6) {
    return { ...cur, in: null, out: null, smooth: true };
  }

  const inLen = prev ? Math.hypot(cur.x - prev.x, cur.y - prev.y) / 3 : 0;
  const outLen = next ? Math.hypot(next.x - cur.x, next.y - cur.y) / 3 : 0;

  return {
    ...cur,
    in: inLen > 0.2 ? { x: -t.x * inLen, y: -t.y * inLen } : null,
    out: outLen > 0.2 ? { x: t.x * outLen, y: t.y * outLen } : null,
    smooth: true,
  };
}

export function smoothPathCorners(pts: PathPoint[], closed: boolean): PathPoint[] {
  return pts.map((_, i) => autoSmoothPoint(pts, i, closed));
}
