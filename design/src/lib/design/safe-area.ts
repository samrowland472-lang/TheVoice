import { safeInsets } from "./formats";
import { isGradient, type DesignDocument, type Fill } from "./types";

function parseCssColor(raw: string): { r: number; g: number; b: number } | null {
  const hex = raw.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    const h = short[1]!;
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
    };
  }
  const full = /^#([0-9a-f]{6})$/i.exec(hex);
  if (full) {
    const h = full[1]!;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

function fillLuma(fill: Fill): number {
  const sample = isGradient(fill) ? fill.stops[0]?.color ?? "#070908" : fill;
  const rgb = typeof sample === "string" ? parseCssColor(sample) : null;
  if (!rgb) return 0.08;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

/** Title-safe / action-safe overlay. Dual-stroke so it reads on dark or light grounds. */
export function drawSafeArea(ctx: CanvasRenderingContext2D, doc: DesignDocument, zoom: number) {
  const { width, height, background, formatId } = doc.artboard;
  const inset = safeInsets(formatId, width, height);
  const x = inset.l;
  const y = inset.t;
  const w = Math.max(1, width - inset.l - inset.r);
  const h = Math.max(1, height - inset.t - inset.b);
  const dark = fillLuma(background) < 0.42;
  const hair = 1 / Math.max(zoom, 0.05);
  const tick = Math.min(28, Math.min(w, h) * 0.08);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.rect(x, y, w, h);
  ctx.fillStyle = dark ? "rgba(0,0,0,0.28)" : "rgba(7,9,8,0.12)";
  ctx.fill("evenodd");

  const strokes: Array<{ color: string; width: number; dash: number[] }> = dark
    ? [
        { color: "rgba(7,9,8,0.92)", width: 3 * hair, dash: [] },
        { color: "rgba(63,198,255,0.95)", width: 1.15 * hair, dash: [8 * hair, 5 * hair] },
      ]
    : [
        { color: "rgba(255,255,255,0.9)", width: 3 * hair, dash: [] },
        { color: "rgba(10,13,12,0.88)", width: 1.15 * hair, dash: [8 * hair, 5 * hair] },
      ];

  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.setLineDash(s.dash);
    ctx.strokeRect(x, y, w, h);
  }

  ctx.setLineDash([]);
  ctx.lineWidth = (dark ? 1.4 : 1.2) * hair;
  ctx.strokeStyle = dark ? "rgba(63,198,255,0.88)" : "rgba(10,13,12,0.8)";
  const corners: Array<[number, number, number, number]> = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of corners) {
    ctx.moveTo(cx, cy + sy * tick);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * tick, cy);
  }
  ctx.stroke();
  ctx.restore();
}

const PREF = "voice-design-safe-area";

export function readSafeAreaPref(): boolean {
  try {
    return localStorage.getItem(PREF) === "1";
  } catch {
    return false;
  }
}

export function writeSafeAreaPref(on: boolean) {
  try {
    localStorage.setItem(PREF, on ? "1" : "0");
  } catch {
    /* blocked */
  }
}
