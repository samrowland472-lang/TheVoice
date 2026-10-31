import { brushById, strokeSegment } from "@/lib/design/brushes";
import type { BrushSettings } from "@/lib/design/types";
import { useEffect, useRef } from "react";

export function BrushPreview({ brush }: { brush: BrushSettings }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(10, 13, 12, 0.35)";
    ctx.fillRect(0, 0, w, h);
    const base = brushById(brush.id);
    const def = {
      ...base,
      hardness: brush.hardness ?? base.hardness,
      spacing: brush.spacing ?? base.spacing,
    };
    const size = Math.max(4, Math.min(brush.size, h * 0.7));
    const y = h / 2;
    strokeSegment(ctx, 12, y, w - 12, y, size, brush.color || "#0a0d0c", def, brush.opacity);
    strokeSegment(ctx, 18, y - 6, w - 18, y + 6, size * 0.55, brush.color || "#0a0d0c", def, brush.opacity * 0.8);
  }, [brush.id, brush.size, brush.opacity, brush.color, brush.hardness, brush.spacing]);

  return (
    <canvas
      ref={ref}
      width={160}
      height={36}
      className="h-9 w-40 rounded-[8px] border border-border bg-surface-alt"
      aria-label="Brush stroke preview"
    />
  );
}

export function BrushTipPreview({
  brush,
  pressure = 1,
  tiltX = 0,
  tiltY = 0,
}: {
  brush: BrushSettings;
  /** Live stroke pressure 0–1. Scales tip size and opacity like the dab engine. */
  pressure?: number;
  /** Live stylus tilt axes (degrees). Flattens the tip into a rotated ellipse. */
  tiltX?: number;
  tiltY?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Dark ground so the tip reads
    ctx.fillStyle = "rgba(10, 13, 12, 0.55)";
    ctx.fillRect(0, 0, w, h);

    const hardness = Math.max(0.05, Math.min(1, brush.hardness ?? 0.5));
    const press = Math.max(0, Math.min(1, pressure));
    // Match stroke engine: size 0.2–1.0 of nominal, opacity softens with light pressure
    const size = Math.max(4, Math.min(brush.size * (0.2 + 0.8 * press), w * 0.72));
    const r = size / 2;
    const cx = w / 2;
    const cy = h / 2;
    const color = brush.color || "#0a0d0c";
    const liveAlpha = Math.max(0.22, brush.opacity * (0.55 + 0.45 * press));
    const tiltMag = Math.min(90, Math.hypot(tiltX, tiltY));
    const aspect = Math.max(0.32, 1 - (tiltMag / 90) * 0.62);
    const angle = Math.atan2(tiltY, tiltX);

    ctx.save();
    ctx.globalAlpha = liveAlpha;
    ctx.translate(cx, cy);
    if (tiltMag > 2) {
      ctx.rotate(angle);
      ctx.scale(1, aspect);
    }
    if (hardness >= 0.92) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(0, 0, r * hardness, 0, 0, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hard-core ring so the live hardness is obvious (follows tilt ellipse)
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "rgba(180, 220, 200, 0.7)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, r * hardness), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Scatter direction indicator: elongated phosphor mark along the tilt axis
    // when the brush has scatter and the pen is tilted. Length tracks scatter strength × tilt.
    const base = brushById(brush.id);
    const scatter = base.scatter;
    if (scatter > 0 && tiltMag > 2) {
      const alongScale = 0.55 + (tiltMag / 90) * 1.15;
      const acrossScale = Math.max(0.12, 1 - (tiltMag / 90) * 0.75);
      const amp = scatter * (size * 0.15) * 0.65;
      const halfAlong = Math.min(w * 0.42, amp * alongScale * 0.55);
      const halfAcross = Math.min(w * 0.28, amp * acrossScale * 0.4);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "#7dffb3";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([2.5, 2]);
      // Long axis (scatter stretches along tilt)
      ctx.beginPath();
      ctx.moveTo(-halfAlong, 0);
      ctx.lineTo(halfAlong, 0);
      ctx.stroke();
      // Short axis (compressed across tilt)
      ctx.beginPath();
      ctx.moveTo(0, -halfAcross);
      ctx.lineTo(0, halfAcross);
      ctx.stroke();
      // Center tick
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(2.5, 0);
      ctx.stroke();
      ctx.restore();
    }
  }, [brush.size, brush.opacity, brush.color, brush.hardness, brush.id, pressure, tiltX, tiltY]);

  return (
    <canvas
      ref={ref}
      width={56}
      height={56}
      className="h-14 w-14 shrink-0 rounded-full border border-border bg-surface-alt"
      aria-label="Brush tip preview"
    />
  );
}