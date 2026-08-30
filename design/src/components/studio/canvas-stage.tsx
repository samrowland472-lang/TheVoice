import { useEffect, useRef } from "react";
import { computeBoolean, isBooleanable } from "@/lib/design/boolean-ops";
import { aabb } from "@/lib/design/geometry";
import { drawDocument, fitBoxViewport, fitViewport } from "@/lib/design/render";
import { useDesign } from "@/lib/design/store";

export function CanvasStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const viewIntent = useDesign((s) => s.viewIntent);
  const selection = useDesign((s) => s.selection);
  const booleanPreview = useDesign((s) => s.booleanPreview);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !doc || !viewIntent) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 8 || h < 8) return;
    if (viewIntent.type === "fit") {
      useDesign.getState().setViewport(fitViewport(doc.artboard.width, doc.artboard.height, w, h));
    } else if (viewIntent.type === "zoom") {
      const z = viewIntent.zoom;
      useDesign.getState().setViewport({
        zoom: z,
        x: w / 2 - (doc.artboard.width / 2) * z,
        y: h / 2 - (doc.artboard.height / 2) * z,
      });
    } else if (viewIntent.type === "fit-sel") {
      const nodes = doc.nodes.filter((n) => selection.includes(n.id));
      const box = nodes.length ? aabb(nodes) : { x: 0, y: 0, w: doc.artboard.width, h: doc.artboard.height };
      useDesign.getState().setViewport(fitBoxViewport(box, w, h));
    }
    useDesign.getState().clearViewIntent();
  }, [doc, viewIntent, selection]);

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
    let ghost = null;
    if (booleanPreview && selection.length >= 2) {
      const order = new Map(selection.map((id, i) => [id, i]));
      const usable = doc.nodes
        .filter((n) => selection.includes(n.id) && isBooleanable(n))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      ghost = computeBoolean(usable, booleanPreview);
    }
    drawDocument(ctx, doc, viewport, { dpr, ghost, ghostOp: booleanPreview });
  }, [doc, viewport, selection, booleanPreview]);

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
