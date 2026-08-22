export interface BrushDef {
  id: string;
  name: string;
  hardness: number;
  opacity: number;
  spacing: number;
  scatter: number;
  grain: boolean;
  mix: GlobalCompositeOperation;
}

export const BRUSHES: BrushDef[] = [
  { id: "ink", name: "Ink", hardness: 0.95, opacity: 1, spacing: 0.12, scatter: 0, grain: false, mix: "source-over" },
  { id: "pencil", name: "Pencil", hardness: 0.35, opacity: 0.35, spacing: 0.08, scatter: 0.6, grain: true, mix: "source-over" },
  { id: "marker", name: "Marker", hardness: 0.7, opacity: 0.55, spacing: 0.1, scatter: 0, grain: false, mix: "multiply" },
  { id: "airbrush", name: "Airbrush", hardness: 0.05, opacity: 0.18, spacing: 0.08, scatter: 0.2, grain: false, mix: "source-over" },
  { id: "watercolor", name: "Water", hardness: 0.12, opacity: 0.22, spacing: 0.14, scatter: 0.8, grain: true, mix: "multiply" },
  { id: "charcoal", name: "Charcoal", hardness: 0.25, opacity: 0.45, spacing: 0.1, scatter: 1.2, grain: true, mix: "source-over" },
  { id: "spray", name: "Spray", hardness: 0.2, opacity: 0.28, spacing: 0.16, scatter: 2.4, grain: true, mix: "source-over" },
  { id: "pixel", name: "Pixel", hardness: 1, opacity: 1, spacing: 1, scatter: 0, grain: false, mix: "source-over" },
  { id: "eraser", name: "Eraser", hardness: 0.85, opacity: 1, spacing: 0.12, scatter: 0, grain: false, mix: "destination-out" },
];

export function brushById(id: string) {
  return BRUSHES.find((b) => b.id === id) ?? BRUSHES[0]!;
}

function dab(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  hardness: number,
  color: string,
  grain: boolean,
) {
  const r = size / 2;
  if (hardness >= 0.92) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const g = ctx.createRadialGradient(x, y, r * hardness, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (grain && r > 3) {
    ctx.globalAlpha *= 0.18;
    for (let i = 0; i < 6; i++) {
      const ox = (Math.random() - 0.5) * r;
      const oy = (Math.random() - 0.5) * r;
      ctx.fillStyle = color;
      ctx.fillRect(x + ox, y + oy, 1.2, 1.2);
    }
  }
}

export function strokeSegment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number,
  color: string,
  brush: BrushDef,
  opacity: number,
) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const step = Math.max(1, size * brush.spacing);
  const n = Math.max(1, Math.ceil(dist / step));
  ctx.save();
  ctx.globalCompositeOperation = brush.mix;
  ctx.globalAlpha = opacity * brush.opacity;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t + (Math.random() - 0.5) * brush.scatter * (size * 0.15);
    const y = y0 + (y1 - y0) * t + (Math.random() - 0.5) * brush.scatter * (size * 0.15);
    if (brush.id === "pixel") {
      const p = Math.max(2, Math.round(size / 4) * 4);
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x / p) * p, Math.round(y / p) * p, p, p);
    } else {
      dab(ctx, x, y, size, brush.hardness, color, brush.grain);
    }
  }
  ctx.restore();
}

export function mirrorPoints(
  x: number,
  y: number,
  w: number,
  h: number,
  mode: "none" | "x" | "y" | "xy" | "radial",
): { x: number; y: number }[] {
  const pts = [{ x, y }];
  if (mode === "x" || mode === "xy") pts.push({ x: w - x, y });
  if (mode === "y" || mode === "xy") pts.push({ x, y: h - y });
  if (mode === "xy") pts.push({ x: w - x, y: h - y });
  if (mode === "radial") {
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 1; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dx = x - cx;
      const dy = y - cy;
      pts.push({
        x: cx + dx * Math.cos(a) - dy * Math.sin(a),
        y: cy + dx * Math.sin(a) + dy * Math.cos(a),
      });
    }
  }
  return pts;
}
