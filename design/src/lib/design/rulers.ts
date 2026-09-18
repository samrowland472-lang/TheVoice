import type { DesignDocument, Viewport } from "./types";
import { formatGuideProbe, guidePairs, type GuideProbe } from "./snap-guide";

export const RULER = 20;

export type GuideDrag =
  | { kind: "new"; axis: "x" | "y"; pos: number }
  | { kind: "move"; id: string; axis: "x" | "y"; pos: number };

export function screenFromDoc(pos: number, origin: number, zoom: number) {
  return origin + pos * zoom;
}

export function docFromScreen(screen: number, origin: number, zoom: number) {
  return (screen - origin) / zoom;
}

export function hitRulerBand(sx: number, sy: number): "top" | "left" | null {
  if (sx < RULER && sy < RULER) return null;
  if (sy < RULER) return "top";
  if (sx < RULER) return "left";
  return null;
}

export function hitGuide(
  doc: DesignDocument,
  viewport: Viewport,
  sx: number,
  sy: number,
  thresh = 5,
): { id: string; axis: "x" | "y"; pos: number } | null {
  const guides = doc.guides ?? [];
  let best: { id: string; axis: "x" | "y"; pos: number; d: number } | null = null;
  for (const g of guides) {
    const d =
      g.axis === "x"
        ? Math.abs(sx - screenFromDoc(g.pos, viewport.x, viewport.zoom))
        : Math.abs(sy - screenFromDoc(g.pos, viewport.y, viewport.zoom));
    if (d <= thresh && (!best || d < best.d)) best = { ...g, d };
  }
  return best ? { id: best.id, axis: best.axis, pos: best.pos } : null;
}

export function dropDeletesGuide(sx: number, sy: number, w: number, h: number) {
  if (sx < RULER || sy < RULER) return true;
  if (sx < 0 || sy < 0 || sx > w || sy > h) return true;
  return false;
}

export function drawDocGuides(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocument,
  viewport: Viewport,
  w: number,
  h: number,
  live?: GuideDrag | null,
  probe?: GuideProbe | null,
) {
  const guides = [...(doc.guides ?? [])];
  if (live) {
    if (live.kind === "move") {
      const i = guides.findIndex((g) => g.id === live.id);
      if (i >= 0) guides[i] = { ...guides[i]!, pos: live.pos };
    } else {
      guides.push({ id: "live", axis: live.axis, pos: live.pos });
    }
  }
  ctx.save();
  ctx.strokeStyle = "rgba(63,198,255,0.72)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  for (const g of guides) {
    ctx.beginPath();
    if (g.axis === "x") {
      const x = screenFromDoc(g.pos, viewport.x, viewport.zoom);
      ctx.moveTo(x, RULER);
      ctx.lineTo(x, h);
    } else {
      const y = screenFromDoc(g.pos, viewport.y, viewport.zoom);
      ctx.moveTo(RULER, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }
  const pairs = guidePairs(guides);
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(63,198,255,0.55)";
  ctx.fillStyle = "rgba(63,198,255,0.88)";
  ctx.lineWidth = 1;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const livePos = live ? live.pos : null;
  const liveAxis = live ? live.axis : null;
  for (const pair of pairs) {
    const hot =
      liveAxis === pair.axis &&
      livePos != null &&
      (Math.abs(livePos - pair.lo) < 0.2 || Math.abs(livePos - pair.hi) < 0.2);
    ctx.strokeStyle = hot ? "rgba(196,255,77,0.7)" : "rgba(63,198,255,0.45)";
    ctx.fillStyle = hot ? "rgba(196,255,77,0.95)" : "rgba(63,198,255,0.88)";
    const mid = (pair.lo + pair.hi) / 2;
    const tick = 6;
    if (pair.axis === "x") {
      const x0 = screenFromDoc(pair.lo, viewport.x, viewport.zoom);
      const x1 = screenFromDoc(pair.hi, viewport.x, viewport.zoom);
      const y = Math.max(RULER + 28, Math.min(h - 36, h * 0.12));
      ctx.beginPath();
      ctx.moveTo(x0, y - tick);
      ctx.lineTo(x0, y + tick);
      ctx.moveTo(x1, y - tick);
      ctx.lineTo(x1, y + tick);
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      const label = String(pair.gap);
      const tw = ctx.measureText(label).width;
      const cx = screenFromDoc(mid, viewport.x, viewport.zoom);
      ctx.fillStyle = "rgba(12,16,14,0.82)";
      ctx.fillRect(cx - tw / 2 - 4, y - 8, tw + 8, 16);
      ctx.fillStyle = hot ? "rgba(196,255,77,0.95)" : "rgba(63,198,255,0.92)";
      ctx.fillText(label, cx, y);
    } else {
      const y0 = screenFromDoc(pair.lo, viewport.y, viewport.zoom);
      const y1 = screenFromDoc(pair.hi, viewport.y, viewport.zoom);
      const x = Math.max(RULER + 28, Math.min(w - 48, w * 0.12));
      ctx.beginPath();
      ctx.moveTo(x - tick, y0);
      ctx.lineTo(x + tick, y0);
      ctx.moveTo(x - tick, y1);
      ctx.lineTo(x + tick, y1);
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      const label = String(pair.gap);
      const tw = ctx.measureText(label).width;
      const cy = screenFromDoc(mid, viewport.y, viewport.zoom);
      ctx.fillStyle = "rgba(12,16,14,0.82)";
      ctx.fillRect(x - tw / 2 - 4, cy - 8, tw + 8, 16);
      ctx.fillStyle = hot ? "rgba(196,255,77,0.95)" : "rgba(63,198,255,0.92)";
      ctx.fillText(label, x, cy);
    }
  }

  if (live && probe) {
    const label = formatGuideProbe(probe);
    ctx.setLineDash([]);
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = "middle";
    const padX = 6;
    const boxH = 16;
    const tw = ctx.measureText(label).width;
    if (live.axis === "x") {
      const x = screenFromDoc(live.pos, viewport.x, viewport.zoom);
      const y = Math.max(RULER + 18, Math.min(h - 24, h * 0.18));
      ctx.fillStyle = "rgba(12,16,14,0.86)";
      ctx.fillRect(x + 6, y - boxH / 2, tw + padX * 2, boxH);
      ctx.fillStyle = "rgba(63,198,255,0.95)";
      ctx.textAlign = "left";
      ctx.fillText(label, x + 6 + padX, y);
    } else {
      const y = screenFromDoc(live.pos, viewport.y, viewport.zoom);
      const x = Math.max(RULER + 18, Math.min(w - tw - 20, w * 0.18));
      ctx.fillStyle = "rgba(12,16,14,0.86)";
      ctx.fillRect(x, y - boxH - 6, tw + padX * 2, boxH);
      ctx.fillStyle = "rgba(63,198,255,0.95)";
      ctx.textAlign = "left";
      ctx.fillText(label, x + padX, y - boxH / 2 - 6);
    }
  }
  ctx.restore();
}

export function drawRulers(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocument,
  viewport: Viewport,
  w: number,
  h: number,
) {
  const zoom = viewport.zoom || 1;
  ctx.save();
  ctx.fillStyle = "#121614";
  ctx.fillRect(0, 0, w, RULER);
  ctx.fillRect(0, 0, RULER, h);
  ctx.strokeStyle = "rgba(196,255,77,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, RULER - 0.5);
  ctx.lineTo(w, RULER - 0.5);
  ctx.moveTo(RULER - 0.5, 0);
  ctx.lineTo(RULER - 0.5, h);
  ctx.stroke();

  ctx.fillStyle = "rgba(196,255,77,0.55)";
  ctx.strokeStyle = "rgba(196,255,77,0.35)";
  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";

  const step = tickStep(zoom);
  const aw = doc.artboard.width;
  const ah = doc.artboard.height;

  const x0 = Math.floor(docFromScreen(RULER, viewport.x, zoom) / step) * step;
  const x1 = docFromScreen(w, viewport.x, zoom);
  for (let v = x0; v <= x1 + step; v += step) {
    const sx = screenFromDoc(v, viewport.x, zoom);
    if (sx < RULER) continue;
    const major = Math.abs(v % (step * 5)) < 0.001 || Math.abs(v) < 0.001;
    ctx.beginPath();
    ctx.moveTo(sx + 0.5, major ? 4 : 10);
    ctx.lineTo(sx + 0.5, RULER);
    ctx.stroke();
    if (major && v >= -0.5 && v <= aw + 0.5) {
      ctx.fillText(String(Math.round(v)), sx + 2, 3);
    }
  }

  ctx.textAlign = "right";
  const y0 = Math.floor(docFromScreen(RULER, viewport.y, zoom) / step) * step;
  const y1 = docFromScreen(h, viewport.y, zoom);
  for (let v = y0; v <= y1 + step; v += step) {
    const sy = screenFromDoc(v, viewport.y, zoom);
    if (sy < RULER) continue;
    const major = Math.abs(v % (step * 5)) < 0.001 || Math.abs(v) < 0.001;
    ctx.beginPath();
    ctx.moveTo(major ? 4 : 10, sy + 0.5);
    ctx.lineTo(RULER, sy + 0.5);
    ctx.stroke();
    if (major && v >= -0.5 && v <= ah + 0.5) {
      ctx.save();
      ctx.translate(RULER - 3, sy + 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "left";
      ctx.fillText(String(Math.round(v)), 0, 0);
      ctx.restore();
    }
  }

  ctx.fillStyle = "#0c100e";
  ctx.fillRect(0, 0, RULER, RULER);
  ctx.strokeStyle = "rgba(196,255,77,0.28)";
  ctx.strokeRect(0.5, 0.5, RULER - 1, RULER - 1);
  ctx.restore();
}

function tickStep(zoom: number) {
  const raw = 50 / zoom;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  if (n < 2) return mag;
  if (n < 5) return 2 * mag;
  return 5 * mag;
}
