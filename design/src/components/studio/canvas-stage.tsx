import { useEffect, useRef } from "react";
import { drawDocument, fitViewport } from "@/lib/design/render";
import { useDesign } from "@/lib/design/store";

export function CanvasStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);

  useEffect(() => {
    const wrap = wrapRef.current;
    const main = mainRef.current;
    if (!wrap || !main || !doc) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 8 || h < 8) return;
    main.width = Math.floor(w * dpr);
    main.height = Math.floor(h * dpr);
    main.style.width = `${w}px`;
    main.style.height = `${h}px`;
    const ctx = main.getContext("2d");
    if (!ctx) return;
    drawDocument(ctx, doc, viewport, { dpr });
  }, [doc, viewport]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !doc) return;
    useDesign.getState().setViewport(fitViewport(doc.artboard.width, doc.artboard.height, wrap.clientWidth, wrap.clientHeight));
  }, [doc?.id]);

  return (
    <div ref={wrapRef} className="pasteboard relative min-h-0 flex-1 touch-none overflow-hidden">
      <canvas ref={mainRef} className="absolute inset-0" />
    </div>
  );
}
