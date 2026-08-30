import { useEffect, useRef } from "react";
import { computeBoolean, isBooleanable } from "@/lib/design/boolean-ops";
import { aabb } from "@/lib/design/geometry";
import { hitPathNode, pathWorldToLocal } from "@/lib/design/path-edit";
import { drawDocument, fitBoxViewport, fitViewport, screenToDoc } from "@/lib/design/render";
import { useDesign } from "@/lib/design/store";
import { isPath } from "@/lib/design/types";
import type { PathEditHit } from "@/lib/design/path-edit";

export function CanvasStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{
    id: string;
    hit: PathEditHit;
    keepSmooth: boolean;
  } | null>(null);
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const viewIntent = useDesign((s) => s.viewIntent);
  const selection = useDesign((s) => s.selection);
  const booleanPreview = useDesign((s) => s.booleanPreview);
  const pathEditHit = useDesign((s) => s.pathEditHit);
  const tool = useDesign((s) => s.tool);
  const present = useDesign((s) => s.present);

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
    const selected = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
    const showTangents = !present && selected && isPath(selected) && (tool === "pen" || tool === "select");
    drawDocument(ctx, doc, {
      dpr,
      viewport,
      ghost,
      ghostOp: booleanPreview,
      tangentPath: showTangents ? selected : null,
      tangentHit: showTangents ? pathEditHit : null,
    });
  }, [doc, viewport, selection, booleanPreview, tool, present, pathEditHit]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !doc) return;
    useDesign.getState().setViewport(fitViewport(doc.artboard.width, doc.artboard.height, wrap.clientWidth, wrap.clientHeight));
  }, [doc?.id]);

  function clientDoc(e: { clientX: number; clientY: number }) {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const r = wrap.getBoundingClientRect();
    return screenToDoc(e.clientX - r.left, e.clientY - r.top, useDesign.getState().viewport);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (present || e.button !== 0) return;
    const s = useDesign.getState();
    if (s.tool !== "pen" && s.tool !== "select") return;
    const selected = s.selection[0] ? s.doc?.nodes.find((n) => n.id === s.selection[0]) : null;
    if (!selected || !isPath(selected)) return;
    const d = clientDoc(e);
    const hit = hitPathNode(selected, d.x, d.y, s.viewport.zoom);
    if (!hit) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: selected.id, hit, keepSmooth: !e.altKey };
    s.setPathEditHit(hit);
    if (hit.arm !== "anchor") {
      const local = pathWorldToLocal(selected, d.x, d.y);
      s.editPathHit(selected.id, hit, local.x, local.y, !e.altKey, true);
    } else {
      s.commit();
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = useDesign.getState();
    const d = clientDoc(e);
    const live = drag.current;
    if (live) {
      const n = s.doc?.nodes.find((x) => x.id === live.id);
      if (!n || !isPath(n)) return;
      const local = pathWorldToLocal(n, d.x, d.y);
      s.editPathHit(live.id, live.hit, local.x, local.y, live.keepSmooth && !e.altKey);
      return;
    }
    if (present || (s.tool !== "pen" && s.tool !== "select")) return;
    const selected = s.selection[0] ? s.doc?.nodes.find((n) => n.id === s.selection[0]) : null;
    if (!selected || !isPath(selected)) return;
    const hit = hitPathNode(selected, d.x, d.y, s.viewport.zoom);
    if (hit?.hole !== s.pathEditHit?.hole || hit?.index !== s.pathEditHit?.index || hit?.arm !== s.pathEditHit?.arm) {
      s.setPathEditHit(hit);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (drag.current) {
      drag.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
  }

  return (
    <div
      ref={wrapRef}
      className="pasteboard relative min-h-0 flex-1 touch-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas ref={mainRef} className="absolute inset-0" />
    </div>
  );
}
