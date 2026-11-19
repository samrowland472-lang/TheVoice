import { resolveGuideStroke, hexToRgba, dashArray } from "./guide-style";
import { guideDisplayName } from "./guide-select";
import type { DesignDocument, Guide, Viewport } from "./types";
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
  selectedIds?: string[],
  looks?: import("./guide-style").GuideLooks,
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
  ctx.lineWidth = 1;
  const selected = new Set(selectedIds ?? []);
  for (const g of guides) {
    if (g.hidden) continue;
    const isSel = selected.has(g.id);
    const locked = !!g.locked;
    const stroke = resolveGuideStroke(g, looks);
    const base = hexToRgba(stroke.color, isSel ? 0.9 : locked ? 0.65 : 0.72);
    ctx.strokeStyle = base;
    ctx.setLineDash(dashArray(stroke.dash as any));
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
    const name = guideDisplayName(g);
    if (name && g.label) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = hexToRgba(stroke.color, isSel ? 0.95 : 0.9);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      if (g.axis === "x") {
        const x = screenFromDoc(g.pos, viewport.x, viewport.zoom);
        ctx.fillText(name, x + 4, RULER + 4);
      } else {
        const y = screenFromDoc(g.pos, viewport.y, viewport.zoom);
        ctx.fillText(name, RULER + 4, y + 4);
      }
      ctx.restore();
    }
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
  ctx.strokeStyle = "rgba(63,198,255,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, RULER - 0.5);
  ctx.lineTo(w, RULER - 0.5);
  ctx.moveTo(RULER - 0.5, 0);
  ctx.lineTo(RULER - 0.5, h);
  ctx.stroke();

  ctx.fillStyle = "rgba(63,198,255,0.72)";
  ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "top";

  const step = tickStep(zoom);
  const aw = doc.artboard.width;
  const ah = doc.artboard.height;

  function drawPhosphorTick(fromX: number, fromY: number, toX: number, toY: number, major: boolean) {
    // dual soft outer phosphor rings matching measurement ghosts
    ctx.save();
    ctx.globalAlpha = major ? 0.32 : 0.18;
    ctx.strokeStyle = "rgba(63,198,255,0.9)";
    ctx.lineWidth = major ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.globalAlpha = major ? 0.14 : 0.08;
    ctx.lineWidth = major ? 4.2 : 3.0;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.restore();
    // main precise tick
    ctx.strokeStyle = major ? "rgba(63,198,255,0.85)" : "rgba(63,198,255,0.5)";
    ctx.lineWidth = major ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }

  const x0 = Math.floor(docFromScreen(RULER, viewport.x, zoom) / step) * step;
  const x1 = docFromScreen(w, viewport.x, zoom);
  for (let v = x0; v <= x1 + step; v += step) {
    const sx = screenFromDoc(v, viewport.x, zoom);
    if (sx < RULER) continue;
    const major = Math.abs(v % (step * 5)) < 0.001 || Math.abs(v) < 0.001;
    drawPhosphorTick(sx + 0.5, major ? 4 : 10, sx + 0.5, RULER, major);
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
    drawPhosphorTick(major ? 4 : 10, sy + 0.5, RULER, sy + 0.5, major);
    if (major && v >= -0.5 && v <= ah + 0.5) {
      ctx.save();
      ctx.translate(RULER - 3, sy + 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "left";
      ctx.fillText(String(Math.round(v)), 0, 0);
      ctx.restore();
    }
  }

  drawGuideRulerLabels(ctx, doc.guides ?? [], viewport, w, h);

  ctx.fillStyle = "#0c100e";
  ctx.fillRect(0, 0, RULER, RULER);
  ctx.strokeStyle = "rgba(63,198,255,0.35)";
  ctx.strokeRect(0.5, 0.5, RULER - 1, RULER - 1);
  ctx.restore();
}

/** Named (or V/H + pos) captions on the ruler ticks that own each guide. */
export function drawGuideRulerLabels(
  ctx: CanvasRenderingContext2D,
  guides: Guide[],
  viewport: Viewport,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.font = "8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "middle";
  for (const g of guides) {
    if (g.hidden) continue;
    const name = guideDisplayName(g);
    if (g.axis === "x") {
      const sx = screenFromDoc(g.pos, viewport.x, viewport.zoom);
      if (sx < RULER + 2 || sx > w - 2) continue;
      ctx.fillStyle = "rgba(63,198,255,0.95)";
      ctx.beginPath();
      ctx.moveTo(sx + 0.5, 1);
      ctx.lineTo(sx + 0.5, RULER);
      ctx.strokeStyle = "rgba(63,198,255,0.85)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = "left";
      const tw = Math.min(ctx.measureText(name).width, 72);
      const lx = Math.min(sx + 3, w - tw - 2);
      ctx.fillStyle = "rgba(12,16,14,0.78)";
      ctx.fillRect(lx - 1, 2, tw + 3, RULER - 4);
      ctx.fillStyle = "rgba(63,198,255,0.95)";
      ctx.fillText(name, lx, RULER / 2, 72);
    } else {
      const sy = screenFromDoc(g.pos, viewport.y, viewport.zoom);
      if (sy < RULER + 2 || sy > h - 2) continue;
      ctx.strokeStyle = "rgba(158,231,255,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(1, sy + 0.5);
      ctx.lineTo(RULER, sy + 0.5);
      ctx.stroke();
      ctx.save();
      ctx.translate(RULER / 2, sy - 3);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "left";
      const tw = Math.min(ctx.measureText(name).width, 72);
      ctx.fillStyle = "rgba(12,16,14,0.78)";
      ctx.fillRect(-1, -6, tw + 3, 12);
      ctx.fillStyle = "rgba(158,231,255,0.95)";
      ctx.fillText(name, 0, 0, 72);
      ctx.restore();
    }
  }
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
