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
    const def = brushById(brush.id);
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
