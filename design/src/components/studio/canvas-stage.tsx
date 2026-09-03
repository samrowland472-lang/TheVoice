import { useEffect, useRef, useState } from "react";
import { computeBoolean, isBooleanable } from "@/lib/design/boolean-ops";
import { aabb } from "@/lib/design/geometry";
import { appendPenPoint, editPathHit, knifeCutStroke, setPathEditHit } from "@/lib/design/path-actions";
import { knifePreviewLobe, knifeStrokePreview } from "@/lib/design/path-cut";
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
  const knifeRef = useRef<{ ax: number; ay: number; bx: number; by: number } | null>(null);
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
      const first = selected.points[0]!;
      const hover = hoverRef.current;
      const live = drag.current;
      const closeThresh = 14 / viewport.zoom;
      const fx = selected.x + first.x;
      const fy = selected.y + first.y;
      const lx = selected.x + last.x;
      const ly = selected.y + last.y;
      const pullingLastOut =
        Boolean(live) &&
        live!.id === selected.id &&
        live!.hit.arm === "out" &&
        live!.hit.index === selected.points.length - 1 &&
        live!.hit.hole == null;
      const probe = pullingLastOut && last.out
        ? { x: lx + last.out.x, y: ly + last.out.y }
        : hover;
      const nearFirst =
        selected.points.length >= 3 &&
        probe != null &&
        Math.hypot(probe.x - fx, probe.y - fy) <= closeThresh;
      if (nearFirst) {
        const c1x = hasHandle(last.out) && last.out ? lx + last.out.x : lx;
        const c1y = hasHandle(last.out) && last.out ? ly + last.out.y : ly;
        let c2x = fx;
        let c2y = fy;
        if (hasHandle(first.in) && first.in) {
          c2x = fx + first.in.x;
          c2y = fy + first.in.y;
        } else if (hasHandle(first.out) && first.out) {
          c2x = fx - first.out.x;
          c2y = fy - first.out.y;
        } else {
          c2x = fx + (lx - fx) / 3;
          c2y = fy + (ly - fy) / 3;
        }
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, fx, fy);
        ctx.strokeStyle = "rgba(126,224,255,0.95)";
        ctx.lineWidth = 1.6 / viewport.zoom;
        ctx.setLineDash([5 / viewport.zoom, 4 / viewport.zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(fx, fy, 10 / viewport.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(63,198,255,0.95)";
        ctx.lineWidth = 1.8 / viewport.zoom;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5 / viewport.zoom, 0, Math.PI * 2);
        ctx.fillStyle = "#3fc6ff";
        ctx.fill();
      } else if (hover && !live) {
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        if (hasHandle(last.out) && last.out) {
          const c1x = lx + last.out.x;
          const c1y = ly + last.out.y;
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
    if (!present && tool === "knife") {
      const hover = hoverRef.current;
      const stroke = knifeRef.current;
      ctx.save();
      ctx.strokeStyle = "rgba(63,198,255,0.92)";
      ctx.fillStyle = "#3fc6ff";
      ctx.lineWidth = 1.4 / viewport.zoom;
      if (stroke) {
        ctx.beginPath();
        ctx.moveTo(stroke.ax, stroke.ay);
        ctx.lineTo(stroke.bx, stroke.by);
        ctx.setLineDash([5 / viewport.zoom, 4 / viewport.zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
        const marks: { x: number; y: number }[] = [];
        const seen = new Set<string>();
        for (const node of doc.nodes) {
          if (!isPath(node) || !node.visible || node.locked) continue;
          const preview = knifeStrokePreview(node, stroke.ax, stroke.ay, stroke.bx, stroke.by);
          ctx.save();
          ctx.strokeStyle = "rgba(63,198,255,0.55)";
          ctx.lineWidth = 2.2 / viewport.zoom;
          ctx.setLineDash([]);
          for (const lobe of preview.lobes) {
            ctx.beginPath();
            tracePath(ctx, node.x, node.y, lobe.points, lobe.closed);
            ctx.stroke();
          }
          ctx.restore();
          for (const p of preview.marks) {
            const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            marks.push(p);
          }
        }
        for (const p of marks) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 / viewport.zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7 / viewport.zoom, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(63,198,255,0.7)";
          ctx.stroke();
        }
      } else if (hover) {
        let snap: { x: number; y: number } | null = null;
        for (const node of doc.nodes) {
          if (!isPath(node) || !node.visible || node.locked) continue;
          const local = pathWorldToLocal(node, hover.x, hover.y);
          const hit = knifePreviewLobe(node, local.x, local.y, viewport.zoom);
          if (hit) {
            snap = { x: hit.x, y: hit.y };
            ctx.save();
            ctx.strokeStyle = "rgba(63,198,255,0.55)";
            ctx.lineWidth = 2.2 / viewport.zoom;
            ctx.beginPath();
            tracePath(ctx, node.x, node.y, hit.lobe.points, hit.lobe.closed);
            ctx.stroke();
            ctx.restore();
            break;
          }
        }
        const p = snap ?? hover;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 / viewport.zoom, 0, Math.PI * 2);
        ctx.fill();
        if (snap) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 / viewport.zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
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
    if (s.tool === "knife") {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      knifeRef.current = { ax: d.x, ay: d.y, bx: d.x, by: d.y };
      setHoverTick((n) => n + 1);
      return;
    }
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
    if (s.tool === "knife") {
      if (knifeRef.current) {
        knifeRef.current.bx = d.x;
        knifeRef.current.by = d.y;
      }
      setHoverTick((n) => n + 1);
      return;
    }
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
    const knife = knifeRef.current;
    if (knife) {
      const s = useDesign.getState();
      knifeCutStroke(knife.ax, knife.ay, knife.bx, knife.by, s.viewport.zoom);
      knifeRef.current = null;
      setHoverTick((n) => n + 1);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      return;
    }
    const live = drag.current;
    if (live) {
      const s = useDesign.getState();
      const n = s.doc?.nodes.find((x) => x.id === live.id);
      if (
        s.tool === "pen" &&
        n &&
        isPath(n) &&
        !n.closed &&
        n.points.length >= 3 &&
        live.hit.arm === "out" &&
        live.hit.index === n.points.length - 1 &&
        live.hit.hole == null
      ) {
        const first = n.points[0]!;
        const last = n.points[n.points.length - 1]!;
        const fx = n.x + first.x;
        const fy = n.y + first.y;
        const probe = last.out
          ? { x: n.x + last.x + last.out.x, y: n.y + last.y + last.out.y }
          : clientDoc(e);
        if (Math.hypot(probe.x - fx, probe.y - fy) <= 14 / s.viewport.zoom) {
          s.closeSelectedPath();
        }
      }
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
          Click add · drag cubic · pull last handle to first to preview close · Alt break · ⌫ last · Enter close · Esc finish
        </div>
      )}
      {tool === "knife" && !present && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-phosphor/70">
          Drag across one ring — only that lobe lights, then the stroke opens it
        </div>
      )}
    </div>
  );
}
