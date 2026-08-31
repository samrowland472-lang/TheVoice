import { useEffect, useRef, useState } from "react";
import { computeBoolean, isBooleanable } from "@/lib/design/boolean-ops";
import { aabb } from "@/lib/design/geometry";
import { appendPenPoint, editPathHit, setPathEditHit } from "@/lib/design/path-actions";
import { drawPathNodeTangents, hitPathNode, pathWorldToLocal } from "@/lib/design/path-edit";
import { hasHandle } from "@/lib/design/path-curve";
import { tracePath } from "@/lib/design/path-curve";
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
    mode: "edit" | "pull";
    originX: number;
    originY: number;
    pulled: boolean;
  } | null>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const [hoverTick, setHoverTick] = useState(0);
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
    const selected = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
    const showTangents = !present && selected && isPath(selected) && (tool === "pen" || tool === "select");
    drawDocument(ctx, doc, { dpr, viewport } as Parameters<typeof drawDocument>[2]);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);
    if (showTangents && selected && isPath(selected)) {
      drawPathNodeTangents(ctx, selected, viewport.zoom, pathEditHit);
    }
    if (!present && tool === "pen" && selected && isPath(selected) && !selected.closed && selected.points.length) {
      const last = selected.points[selected.points.length - 1]!;
      const hover = hoverRef.current;
      if (hover && !drag.current) {
        ctx.beginPath();
        ctx.moveTo(selected.x + last.x, selected.y + last.y);
        if (hasHandle(last.out) && last.out) {
          const c1x = selected.x + last.x + last.out.x;
          const c1y = selected.y + last.y + last.out.y;
          ctx.bezierCurveTo(c1x, c1y, hover.x, hover.y, hover.x, hover.y);
        } else {
          ctx.lineTo(hover.x, hover.y);
        }
        ctx.strokeStyle = "rgba(63,198,255,0.55)";
        ctx.lineWidth = 1.25 / viewport.zoom;
        ctx.setLineDash([6 / viewport.zoom, 5 / viewport.zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (!present && booleanPreview && selection.length >= 2) {
      const picked = selection.flatMap((id) => {
        const n = doc.nodes.find((x) => x.id === id);
        return n && isBooleanable(n) ? [n] : [];
      });
      const ghost = computeBoolean(picked, booleanPreview);
      if (ghost) {
        ctx.beginPath();
        tracePath(ctx, ghost.x, ghost.y, ghost.points, true);
        for (const hole of ghost.holes ?? []) tracePath(ctx, ghost.x, ghost.y, hole, true);
        ctx.fillStyle = "rgba(63,198,255,0.22)";
        ctx.strokeStyle = "rgba(63,198,255,0.9)";
        ctx.lineWidth = 1.5 / viewport.zoom;
        ctx.setLineDash([7 / viewport.zoom, 5 / viewport.zoom]);
        ctx.fill(ghost.fillRule === "evenodd" ? "evenodd" : "nonzero");
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }, [doc, viewport, selection, booleanPreview, tool, present, pathEditHit, hoverTick]);

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
    const d = clientDoc(e);
    if (s.tool === "pen") {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const selected = s.selection[0] ? s.doc?.nodes.find((n) => n.id === s.selection[0]) : null;
      if (selected && isPath(selected) && !selected.closed) {
        const hit = hitPathNode(selected, d.x, d.y, s.viewport.zoom);
        if (hit && hit.arm !== "anchor") {
          drag.current = {
            id: selected.id,
            hit,
            keepSmooth: !e.altKey,
            mode: "edit",
            originX: d.x,
            originY: d.y,
            pulled: true,
          };
          setPathEditHit(hit);
          const local = pathWorldToLocal(selected, d.x, d.y);
          editPathHit(selected.id, hit, local.x, local.y, !e.altKey, true);
          return;
        }
        const first = selected.points[0];
        if (first && selected.points.length >= 2) {
          const fx = selected.x + first.x;
          const fy = selected.y + first.y;
          if (Math.hypot(d.x - fx, d.y - fy) <= 10 / s.viewport.zoom) {
            s.closeSelectedPath();
            return;
          }
        }
      }
      const id = appendPenPoint(d.x, d.y);
      if (!id) return;
      const hit: PathEditHit = { index: 0, arm: "out" };
      const node = useDesign.getState().doc?.nodes.find((n) => n.id === id);
      if (node && isPath(node)) {
        hit.index = node.points.length - 1;
      }
      drag.current = {
        id,
        hit,
        keepSmooth: !e.altKey,
        mode: "pull",
        originX: d.x,
        originY: d.y,
        pulled: false,
      };
      setPathEditHit(hit);
      return;
    }
    if (s.tool !== "select") return;
    const selected = s.selection[0] ? s.doc?.nodes.find((n) => n.id === s.selection[0]) : null;
    if (!selected || !isPath(selected)) return;
    const hit = hitPathNode(selected, d.x, d.y, s.viewport.zoom);
    if (!hit) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      id: selected.id,
      hit,
      keepSmooth: !e.altKey,
      mode: "edit",
      originX: d.x,
      originY: d.y,
      pulled: true,
    };
    setPathEditHit(hit);
    if (hit.arm !== "anchor") {
      const local = pathWorldToLocal(selected, d.x, d.y);
      editPathHit(selected.id, hit, local.x, local.y, !e.altKey, true);
    } else {
      s.commit();
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = useDesign.getState();
    const d = clientDoc(e);
    hoverRef.current = d;
    if (!drag.current) setHoverTick((n) => n + 1);
    const live = drag.current;
    if (live) {
      const n = s.doc?.nodes.find((x) => x.id === live.id);
      if (!n || !isPath(n)) return;
      if (live.mode === "pull" && !live.pulled) {
        const dist = Math.hypot(d.x - live.originX, d.y - live.originY);
        if (dist < 3 / s.viewport.zoom) return;
        live.pulled = true;
      }
      if (e.altKey) live.keepSmooth = false;
      const local = pathWorldToLocal(n, d.x, d.y);
      editPathHit(live.id, live.hit, local.x, local.y, live.keepSmooth);
      return;
    }
    if (present || (s.tool !== "pen" && s.tool !== "select")) return;
    const selected = s.selection[0] ? s.doc?.nodes.find((n) => n.id === s.selection[0]) : null;
    if (!selected || !isPath(selected)) return;
    const hit = hitPathNode(selected, d.x, d.y, s.viewport.zoom);
    const cur = s.pathEditHit;
    if (hit?.hole !== cur?.hole || hit?.index !== cur?.index || hit?.arm !== cur?.arm) {
      setPathEditHit(hit);
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
      {tool === "pen" && !present && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-phosphor/70">
          Click add · drag cubic · Alt break · Alt after drop corners last · ⌫ last · Enter close · Esc finish
        </div>
      )}
    </div>
  );
}
