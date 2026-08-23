import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BRUSHES, brushById, mirrorPoints, strokeSegment } from "@/lib/design/brushes";
import { applyHandle, hitHandle, hitTop, type Handle } from "@/lib/design/hit";
import { imageNode, pathNode } from "@/lib/design/node-factory";
import { docToScreen, drawDocument, fitViewport, getCachedImage, sampleDocColor, screenToDoc } from "@/lib/design/render";
import { rectsIntersect, smartSnap } from "@/lib/design/snap";
import { ensurePaintLayer, makeShape, makeText, useDesign } from "@/lib/design/store";
import { snap } from "@/lib/design/geometry";
import { safeInsets } from "@/lib/design/formats";
import type { DesignNode, Tool } from "@/lib/design/types";
import { CanvasMenu, type MenuItem } from "./canvas-menu";

const SHAPE_TOOLS: Tool[] = ["rect", "ellipse", "line", "polygon", "star", "arrow", "frame"];
const RULER = 22;

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const n = raw / p;
  if (n < 2) return p;
  if (n < 5) return 2 * p;
  return 5 * p;
}

export function CanvasStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [dropper, setDropper] = useState<{ x: number; y: number; hex: string } | null>(null);
  const tool = useDesign((s) => s.tool);
  const zoom = useDesign((s) => s.viewport.zoom);

  useEffect(() => {
    const canvas = mainRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      canvas.width = r.width * devicePixelRatio;
      canvas.height = r.height * devicePixelRatio;
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const { doc, viewport } = useDesign.getState();
      drawDocument(ctx, doc, viewport, r.width, r.height);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="pasteboard relative min-h-0 flex-1 touch-none overflow-hidden">
      <canvas ref={mainRef} className="absolute inset-0" />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0" />
      {tool === "eyedropper" && dropper && (
        <div className="pointer-events-none absolute z-20 flex items-center gap-1.5" style={{ left: dropper.x + 14, top: dropper.y + 14 }}>
          <span className="size-7 rounded-[8px] border border-phosphor" style={{ background: dropper.hex }} />
          <span className="rounded-[6px] border border-phosphor/50 bg-ground/90 px-1.5 py-0.5 font-mono text-[10px] text-phosphor">{dropper.hex} · kit</span>
        </div>
      )}
      {tool === "eyedropper" && (
        <div className="pointer-events-none absolute bottom-14 left-1/2 z-10 -translate-x-1/2 rounded-[8px] border border-border bg-surface/90 px-3 py-1.5 font-mono text-[10px] tracking-wide text-ink-dim uppercase">
          Click apply · kit · Shift+click save to brand kit
        </div>
      )}
      <div className="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-0.5 rounded-[12px] border border-border bg-surface/90 p-1">
        <button type="button" className="size-8 rounded-[8px] text-ink-dim" onClick={() => useDesign.getState().requestZoom(zoom / 1.15)}>−</button>
        <button type="button" className="h-8 min-w-14 rounded-[8px] font-mono text-[11px] text-ink-dim" onClick={() => useDesign.getState().requestFit()}>{Math.round(zoom * 100)}%</button>
        <button type="button" className="size-8 rounded-[8px] text-ink-dim" onClick={() => useDesign.getState().requestZoom(zoom * 1.15)}>+</button>
      </div>
    </div>
  );
}
