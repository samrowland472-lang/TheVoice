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

export type PathEditHit = { index: number; arm: "in" | "out" | "anchor"; hole?: number };

/** Hit a path anchor or cubic handle in document space. */
export function hitPathEdit(
  ox: number,
  oy: number,
  pts: PathPoint[],
  wx: number,
  wy: number,
  zoom: number,
): PathEditHit | null {
  const handlePx = 8 / zoom;
  const anchorPx = 7 / zoom;
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    if (hasHandle(p.out)) {
      const hx = ox + p.x + p.out!.x;
      const hy = oy + p.y + p.out!.y;
      if (Math.hypot(wx - hx, wy - hy) <= handlePx) return { index: i, arm: "out" };
    }
    if (hasHandle(p.in)) {
      const hx = ox + p.x + p.in!.x;
      const hy = oy + p.y + p.in!.y;
      if (Math.hypot(wx - hx, wy - hy) <= handlePx) return { index: i, arm: "in" };
    }
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    if (Math.hypot(wx - (ox + p.x), wy - (oy + p.y)) <= anchorPx) return { index: i, arm: "anchor" };
  }
  return null;
}

/** Drag an in/out handle. Smooth points keep opposite handles mirrored; Alt breaks that. */
export function dragPathHandle(pt: PathPoint, arm: "in" | "out", hx: number, hy: number, keepSmooth: boolean): PathPoint {
  const handle = { x: hx - pt.x, y: hy - pt.y };
  if (!keepSmooth) {
    return arm === "out" ? { ...pt, out: handle, smooth: false } : { ...pt, in: handle, smooth: false };
  }
  const opposite = mirrorHandle(handle);
  if (arm === "out") return { ...pt, out: handle, in: opposite, smooth: true };
  return { ...pt, in: handle, out: opposite, smooth: true };
}

/** Overlay: phosphor arms + diamonds for in/out, squares for anchors. */
export function drawPathTangents(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  pts: PathPoint[],
  zoom: number,
  active?: PathEditHit | null,
  tone: "phosphor" | "cool" = "phosphor",
) {
  void tone;
  if (!pts.length) return;
  const armW = 1.25 / zoom;
  const diamond = 5 / zoom;
  const anchor = 6 / zoom;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const ax = ox + p.x;
    const ay = oy + p.y;
    const arms: Array<{ arm: "in" | "out"; h: { x: number; y: number } }> = [];
    if (hasHandle(p.in) && p.in) arms.push({ arm: "in", h: p.in });
    if (hasHandle(p.out) && p.out) arms.push({ arm: "out", h: p.out });
    for (const { arm, h } of arms) {
      const hx = ax + h.x;
      const hy = ay + h.y;
      const hot = active?.index === i && active.arm === arm;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = hot ? "#7ee0ff" : "rgba(63,198,255,0.85)";
      ctx.lineWidth = armW;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx, hy - diamond);
      ctx.lineTo(hx + diamond, hy);
      ctx.lineTo(hx, hy + diamond);
      ctx.lineTo(hx - diamond, hy);
      ctx.closePath();
      ctx.fillStyle = hot ? "#7ee0ff" : "#0a0d0c";
      ctx.fill();
      ctx.strokeStyle = "#3fc6ff";
      ctx.lineWidth = 1.2 / zoom;
      ctx.stroke();
    }
    const aHot = active?.index === i && active.arm === "anchor";
    ctx.fillStyle = aHot ? "#3fc6ff" : "#0a0d0c";
    ctx.strokeStyle = "#3fc6ff";
    ctx.lineWidth = 1.2 / zoom;
    ctx.fillRect(ax - anchor / 2, ay - anchor / 2, anchor, anchor);
    ctx.strokeRect(ax - anchor / 2, ay - anchor / 2, anchor, anchor);
  }
  ctx.restore();
}
