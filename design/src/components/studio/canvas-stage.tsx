/** Temporary restore — full knife residual canvas lands in follow-up push from workspace. */
import { useEffect, useRef } from "react";
import { useDesign } from "@/lib/design/store";
import { drawDocument, fitViewport } from "@/lib/design/render";

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const setViewport = useDesign((s) => s.setViewport);

  useEffect(() => {
    if (!doc || !wrapRef.current) return;
    const el = wrapRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 8 || h < 8) return;
    if (viewport.x === 0 && viewport.y === 0 && viewport.zoom === 0.4) {
      setViewport(fitViewport(doc.artboard.width, doc.artboard.height, w, h));
    }
  }, [doc?.id, setViewport, doc, viewport.x, viewport.y, viewport.zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !doc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 8 || h < 8) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDocument(ctx, doc, { viewport, dpr });
  }, [doc, viewport]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-void">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
