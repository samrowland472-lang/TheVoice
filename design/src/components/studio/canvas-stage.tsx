import { useEffect, useRef } from "react";
import { useDesign } from "@/lib/design/store";
import {
  drawDocument,
  fitViewport,
  screenToDoc,
} from "@/lib/design/render";
import { applyHandle, hitHandle, hitTop, type Handle } from "@/lib/design/hit";
import { nodeCenter, degToRad } from "@/lib/design/geometry";
import { makeShape, makeText } from "@/lib/design/store";
import { setStudioStatus } from "@/lib/design/studio-status";
import type { DesignNode, Tool, Viewport, PathNode } from "@/lib/design/types";
import { isPath } from "@/lib/design/types";
import { appendPenPoint, editPathHit, setPathClosed } from "@/lib/design/path-actions";
import { hitPathNode, pathWorldToLocal } from "@/lib/design/path-edit";
import { drawPathNodeTangents } from "@/lib/design/path-edit";
import { nearPenClose } from "@/lib/design/path-curve";

type DragKind =
  | { type: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { type: "resize"; id: string; handle: Handle; startX: number; startY: number; orig: DesignNode }
  | { type: "rotate"; id: string; startAngle: number; origRot: number; cx: number; cy: number }
  | { type: "pan"; startX: number; startY: number; vx: number; vy: number }
  | { type: "create"; tool: Tool; startX: number; startY: number; id: string | null }
  | { type: "path-point"; id: string; hit: import("@/lib/design/path-edit").PathEditHit };

function snap15(deg: number, force: boolean) {
  if (!force) return deg;
  return Math.round(deg / 15) * 15;
}

function localDelta(n: DesignNode, dx: number, dy: number) {
  const r = -degToRad(n.rotation);
  return {
    dx: dx * Math.cos(r) - dy * Math.sin(r),
    dy: dx * Math.sin(r) + dy * Math.cos(r),
  };
}

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragKind | null>(null);
  const doc = useDesign((s) => s.doc);
  const selection = useDesign((s) => s.selection);
  const tool = useDesign((s) => s.tool);
  const viewport = useDesign((s) => s.viewport);
  const pathEditHit = useDesign((s) => s.pathEditHit);
  const color = useDesign((s) => s.color);
  const viewIntent = useDesign((s) => s.viewIntent);
  const setViewport = useDesign((s) => s.setViewport);
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const addNode = useDesign((s) => s.addNode);
  const setTool = useDesign((s) => s.setTool);

  // Fit on first doc or viewIntent
  useEffect(() => {
    if (!doc || !wrapRef.current) return;
    const el = wrapRef.current;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 8 || h < 8) return;
    if (viewIntent?.type === "fit" || (viewport.x === 0 && viewport.y === 0 && viewport.zoom === 0.4)) {
      const fit = fitViewport(doc.artboard.width, doc.artboard.height, w, h);
      setViewport(fit);
      useDesign.setState({ viewIntent: null });
    } else if (viewIntent?.type === "zoom") {
      const z = viewIntent.zoom;
      const cx = w / 2;
      const cy = h / 2;
      const docPt = screenToDoc(cx, cy, viewport);
      setViewport({
        zoom: z,
        x: cx - docPt.x * z,
        y: cy - docPt.y * z,
      });
      useDesign.setState({ viewIntent: null });
    } else if (viewIntent?.type === "fit-sel" && selection.length) {
      const nodes = doc.nodes.filter((n) => selection.includes(n.id));
      if (nodes.length) {
        const xs = nodes.map((n) => n.x);
        const ys = nodes.map((n) => n.y);
        const box = {
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...nodes.map((n) => n.x + n.w)) - Math.min(...xs),
          h: Math.max(...nodes.map((n) => n.y + n.h)) - Math.min(...ys),
        };
        const fit = fitViewport(box.w, box.h, w, h, 64);
        setViewport({
          zoom: fit.zoom,
          x: w / 2 - (box.x + box.w / 2) * fit.zoom,
          y: h / 2 - (box.y + box.h / 2) * fit.zoom,
        });
      }
      useDesign.setState({ viewIntent: null });
    }
  }, [doc?.id, viewIntent, setViewport]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !doc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawDocument(ctx, doc, { dpr, viewport });
    drawSelection(ctx, doc.nodes, selection, viewport, dpr);
    drawPathPoints(ctx, doc.nodes, selection, viewport, dpr, pathEditHit);
  }, [doc, selection, viewport, pathEditHit]);

  // Resize observer
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      // trigger redraw by touching viewport slightly? just force a state bump via local
      const canvas = canvasRef.current;
      if (!canvas || !doc) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawDocument(ctx, doc, { dpr, viewport });
      drawSelection(ctx, doc.nodes, selection, viewport, dpr);
      drawPathPoints(ctx, doc.nodes, selection, viewport, dpr, pathEditHit);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [doc, selection, viewport]);

  function onPointerDown(e: React.PointerEvent) {
    if (!doc) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    if (tool === "hand" || e.button === 1 || (e.button === 0 && e.altKey && tool === "select")) {
      drag.current = { type: "pan", startX: e.clientX, startY: e.clientY, vx: viewport.x, vy: viewport.y };
      return;
    }

    if (tool === "select") {
      const selected = doc.nodes.filter((n) => selection.includes(n.id));
      let hitH: { node: DesignNode; handle: Handle } | null = null;
      for (const n of selected) {
        const h = hitHandle(n, docPt.x, docPt.y, viewport.zoom);
        if (h) {
          hitH = { node: n, handle: h };
          break;
        }
      }
      if (hitH) {
        const n = hitH.node;
        if (hitH.handle === "rotate") {
          const c = nodeCenter(n);
          const ang = Math.atan2(docPt.y - c.y, docPt.x - c.x) * (180 / Math.PI);
          drag.current = { type: "rotate", id: n.id, startAngle: ang, origRot: n.rotation, cx: c.x, cy: c.y };
          setStudioStatus(`Rotate ${Math.round(n.rotation)}°`);
        } else if (hitH.handle === "move") {
          drag.current = { type: "move", id: n.id, startX: docPt.x, startY: docPt.y, ox: n.x, oy: n.y };
        } else {
          drag.current = { type: "resize", id: n.id, handle: hitH.handle, startX: docPt.x, startY: docPt.y, orig: { ...n } };
        }
        return;
      }
      const hit = hitTop(doc.nodes, docPt.x, docPt.y);
      if (hit) {
        const additive = e.shiftKey || e.metaKey || e.ctrlKey;
        select([hit.id], additive);
        drag.current = { type: "move", id: hit.id, startX: docPt.x, startY: docPt.y, ox: hit.x, oy: hit.y };
      } else if (!e.shiftKey) {
        select([]);
      }
      return;
    }

    // Pen tool — continue path or move points
    if (tool === "pen") {
      const selNode = selection.length === 1 ? doc.nodes.find((n) => n.id === selection[0]) : null;
      if (selNode && isPath(selNode) && !selNode.closed && selNode.points.length >= 3) {
        const first = selNode.points[0]!;
        const local = pathWorldToLocal(selNode, docPt.x, docPt.y);
        if (nearPenClose(local.x, local.y, first.x, first.y, viewport.zoom)) {
          setPathClosed(selNode.id, true);
          setStudioStatus("Path closed");
          return;
        }
      }
      if (selNode && isPath(selNode)) {
        const hit = hitPathNode(selNode, docPt.x, docPt.y, viewport.zoom);
        if (hit) {
          drag.current = { type: "path-point", id: selNode.id, hit };
          setStudioStatus("Move path point");
          return;
        }
      }
      const id = appendPenPoint(docPt.x, docPt.y);
      if (id) {
        select([id]);
        setStudioStatus("Pen point");
      }
      return;
    }

    // Create tools
    if (["rect", "ellipse", "line", "polygon", "star", "arrow", "text"].includes(tool)) {
      const node =
        tool === "text"
          ? makeText(docPt.x, docPt.y, color || "#d9f5e3")
          : makeShape(tool, docPt.x, docPt.y, 40, tool === "line" ? 4 : 40, color || "#3fc6ff");
      addNode(node);
      drag.current = { type: "create", tool, startX: docPt.x, startY: docPt.y, id: node.id };
      if (tool === "text") setTool("select");
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!doc || !drag.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);
    const d = drag.current;

    if (d.type === "pan") {
      setViewport({
        x: d.vx + (e.clientX - d.startX),
        y: d.vy + (e.clientY - d.startY),
      });
      return;
    }

    if (d.type === "move") {
      const dx = docPt.x - d.startX;
      const dy = docPt.y - d.startY;
      updateNodes([d.id], { x: d.ox + dx, y: d.oy + dy });
      return;
    }

    if (d.type === "resize") {
      const dx = docPt.x - d.startX;
      const dy = docPt.y - d.startY;
      const local = localDelta(d.orig, dx, dy);
      const patch = applyHandle(d.orig, d.handle, local.dx, local.dy);
      updateNodes([d.id], patch);
      return;
    }

    if (d.type === "rotate") {
      const ang = Math.atan2(docPt.y - d.cy, docPt.x - d.cx) * (180 / Math.PI);
      let next = d.origRot + (ang - d.startAngle);
      next = snap15(next, e.shiftKey);
      // normalize
      next = ((next % 360) + 360) % 360;
      updateNodes([d.id], { rotation: next });
      setStudioStatus(`Rotate ${Math.round(next)}°${e.shiftKey ? " · 15°" : ""}`);
      return;
    }

    if (d.type === "create" && d.id) {
      const x = Math.min(d.startX, docPt.x);
      const y = Math.min(d.startY, docPt.y);
      const w = Math.max(8, Math.abs(docPt.x - d.startX));
      const h = Math.max(8, Math.abs(docPt.y - d.startY));
      updateNodes([d.id], { x, y, w, h: d.tool === "line" ? Math.max(4, h) : h });
      return;
    }

    if (d.type === "path-point") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (n && isPath(n)) {
        const local = pathWorldToLocal(n, docPt.x, docPt.y);
        editPathHit(d.id, d.hit, local.x, local.y, !e.shiftKey);
      }
    }
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    if (!doc) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZ = Math.max(0.05, Math.min(8, viewport.zoom * factor));
    setViewport({
      zoom: nextZ,
      x: sx - docPt.x * nextZ,
      y: sy - docPt.y * nextZ,
    });
  }

  if (!doc) return <div className="h-full w-full bg-ground" />;

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden bg-ground">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
    </div>
  );
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  selection: string[],
  vp: Viewport,
  dpr: number,
) {
  const selected = nodes.filter((n) => selection.includes(n.id) && n.visible);
  if (!selected.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const phosphor = "#3fc6ff";
  for (const n of selected) {
    ctx.save();
    const c = nodeCenter(n);
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
    ctx.strokeStyle = phosphor;
    ctx.lineWidth = 1 / vp.zoom;
    ctx.setLineDash([]);
    ctx.strokeRect(n.x, n.y, n.w, n.h);
    // handles
    const size = 8 / vp.zoom;
    const half = size / 2;
    const pts = [
      [n.x, n.y],
      [n.x + n.w / 2, n.y],
      [n.x + n.w, n.y],
      [n.x + n.w, n.y + n.h / 2],
      [n.x + n.w, n.y + n.h],
      [n.x + n.w / 2, n.y + n.h],
      [n.x, n.y + n.h],
      [n.x, n.y + n.h / 2],
    ];
    ctx.fillStyle = "#06170f";
    ctx.strokeStyle = phosphor;
    for (const [px, py] of pts) {
      ctx.fillRect(px - half, py - half, size, size);
      ctx.strokeRect(px - half, py - half, size, size);
    }
    // rotation handle
    const ry = n.y - 28 / vp.zoom;
    const rx = n.x + n.w / 2;
    ctx.beginPath();
    ctx.moveTo(rx, n.y);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx, ry, 7 / vp.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawPathPoints(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  selection: string[],
  vp: Viewport,
  dpr: number,
  active: import("@/lib/design/path-edit").PathEditHit | null,
) {
  const selected = nodes.filter((n) => selection.includes(n.id) && n.visible && isPath(n));
  if (!selected.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  for (const n of selected) {
    drawPathNodeTangents(ctx, n as PathNode, vp.zoom, active);
  }
  ctx.restore();
}
