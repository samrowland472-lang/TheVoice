import { useEffect, useRef, useState } from "react";
import { useDesign } from "@/lib/design/store";
import {
  drawDocument,
  fitViewport,
  screenToDoc,
} from "@/lib/design/render";
import { applyHandle, hitHandle, hitTop, type Handle } from "@/lib/design/hit";
import { nodeCenter, degToRad, rotatePoint } from "@/lib/design/geometry";
import { makeShape, makeText } from "@/lib/design/store";
import { setStudioStatus } from "@/lib/design/studio-status";
import {
  appendPenPoint,
  editPathHit,
  joinSelectedPathToNearest,
  rotateSelectedPathPoints,
  scaleSelectedPathPoints,
  setPathEditHit,
  setPathPointSelection,
  togglePathPointSelection,
} from "@/lib/design/path-actions";
import { hitResizeHandle, type ResizeHandle } from "@/lib/design/box-resize";
import {
  drawPathNodeTangents,
  hitPathNode,
  pathWorldToLocal,
} from "@/lib/design/path-edit";
import { closePathWithCubic, nearPenClose } from "@/lib/design/path-curve";
import { isPath, type DesignNode, type PathPoint, type Tool, type Viewport } from "@/lib/design/types";
import type { PathEditHit } from "@/lib/design/path-edit";
import { nodesInMarquee } from "@/lib/design/marquee-nodes";

type DragKind =
  | { type: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { type: "resize"; id: string; handle: Handle; startX: number; startY: number; orig: DesignNode }
  | { type: "rotate"; id: string; startAngle: number; origRot: number; cx: number; cy: number }
  | { type: "pan"; startX: number; startY: number; vx: number; vy: number }
  | { type: "create"; tool: Tool; startX: number; startY: number; id: string | null }
  | {
      type: "path-point";
      id: string;
      hit: PathEditHit;
      keepSmooth: boolean;
      started: boolean;
    }
  | {
      type: "marquee";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      additive: boolean;
    }
  | {
      type: "path-points-rotate";
      id: string;
      startAngle: number;
      cx: number;
      cy: number;
      basePoints: PathPoint[];
      baseHoles?: PathPoint[][];
    }
  | {
      type: "path-points-scale";
      id: string;
      handle: ResizeHandle;
      basePoints: PathPoint[];
      baseHoles?: PathPoint[][];
    };

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
  const color = useDesign((s) => s.color);
  const viewIntent = useDesign((s) => s.viewIntent);
  const pathEditHit = useDesign((s) => s.pathEditHit);
  const pathPointSelection = useDesign((s) => s.pathPointSelection);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const setViewport = useDesign((s) => s.setViewport);
  const select = useDesign((s) => s.select);
  const updateNodes = useDesign((s) => s.updateNodes);
  const addNode = useDesign((s) => s.addNode);
  const setTool = useDesign((s) => s.setTool);
  const commit = useDesign((s) => s.commit);
  const replaceNode = useDesign((s) => s.replaceNode);

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
    } else if (viewIntent?.type === "fit-sel" && selection.length) {
      const nodes = doc.nodes.filter((n) => selection.includes(n.id));
      if (nodes.length) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const n of nodes) {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + n.w);
          maxY = Math.max(maxY, n.y + n.h);
        }
        const box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        const fit = fitViewport(box.w, box.h, w, h, 64);
        setViewport({
          zoom: fit.zoom,
          x: w / 2 - (box.x + box.w / 2) * fit.zoom,
          y: h / 2 - (box.y + box.h / 2) * fit.zoom,
        });
      }
      useDesign.setState({ viewIntent: null });
    }
  }, [doc?.id, viewIntent, setViewport, selection, doc, viewport.x, viewport.y, viewport.zoom]);

  // Draw
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
    drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection);
    if (marquee) drawMarquee(ctx, marquee, viewport, dpr);
  }, [doc, selection, viewport, pathEditHit, pathPointSelection, marquee]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas || !doc) return;
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
      drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [doc, selection, viewport, pathEditHit, pathPointSelection]);

  function onPointerDown(e: React.PointerEvent) {
    if (!doc || e.button > 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);

    if (tool === "hand" || e.button === 1 || (e.button === 0 && e.altKey && tool === "select")) {
      drag.current = { type: "pan", startX: sx, startY: sy, vx: viewport.x, vy: viewport.y };
      return;
    }

    // Pen tool: continue path / close / start
    if (tool === "pen" && e.button === 0) {
      const sel = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
      if (sel && isPath(sel) && !sel.closed && sel.points.length >= 1) {
        const first = sel.points[0]!;
        const fx = sel.x + first.x;
        const fy = sel.y + first.y;
        if (sel.points.length >= 3 && nearPenClose(docPt.x, docPt.y, fx, fy, viewport.zoom)) {
          commit();
          replaceNode(sel.id, closePathWithCubic(sel), false);
          setPathEditHit({ index: 0, arm: "anchor" });
          setStudioStatus("Path closed");
          setTool("select");
          return;
        }
        if (joinSelectedPathToNearest(docPt.x, docPt.y, viewport.zoom)) {
          setStudioStatus("Paths joined");
          return;
        }
      }
      const id = appendPenPoint(docPt.x, docPt.y);
      if (id) {
        const n = useDesign.getState().doc?.nodes.find((x) => x.id === id);
        if (n && isPath(n)) {
          setPathEditHit({ index: n.points.length - 1, arm: "anchor" });
          setStudioStatus(`Point ${n.points.length}`);
        }
      }
      return;
    }

    if (tool === "select") {
      const selected = doc.nodes.filter((n) => selection.includes(n.id));

      // Path points group rotation handle (when 2+ points selected on a single path)
      if (selection.length === 1 && pathPointSelection.length > 1) {
        const n = selected[0];
        if (n && isPath(n)) {
          const coords: { x: number; y: number }[] = [];
          for (const sel of pathPointSelection) {
            const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
            const pt = ring?.[sel.index];
            if (pt) coords.push({ x: pt.x, y: pt.y });
          }
          if (coords.length > 1) {
            const xs = coords.map((c) => c.x);
            const ys = coords.map((c) => c.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const lcx = (minX + maxX) / 2;
            const lcy = (minY + maxY) / 2;
            // Handle in local: top center of bbox, offset up
            const pad = 6 / viewport.zoom;
            const handleLocalX = n.x + lcx;
            const handleLocalY = n.y + minY - pad - 28 / viewport.zoom;
            // Convert to world (apply node rotation around node center)
            const nc = nodeCenter(n);
            const worldHandle = n.rotation
              ? rotatePoint(handleLocalX, handleLocalY, nc.x, nc.y, n.rotation)
              : { x: handleLocalX, y: handleLocalY };
            const worldCenter = n.rotation
              ? rotatePoint(n.x + lcx, n.y + lcy, nc.x, nc.y, n.rotation)
              : { x: n.x + lcx, y: n.y + lcy };
            const dist = Math.hypot(docPt.x - worldHandle.x, docPt.y - worldHandle.y);
            const hitR = 18 / viewport.zoom;
            if (dist <= hitR + 4 / viewport.zoom) {
              const ang = Math.atan2(docPt.y - worldCenter.y, docPt.x - worldCenter.x);
              drag.current = {
                type: "path-points-rotate",
                id: n.id,
                startAngle: ang,
                cx: worldCenter.x,
                cy: worldCenter.y,
                basePoints: n.points.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out })),
                baseHoles: n.holes?.map((ring) => ring.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out }))),
              };
              commit();
              setStudioStatus("Rotate path points");
              return;
            }

            // Scale handles on the group bounding box (local space after node rotation)
            const box = {
              x: n.x + minX - pad,
              y: n.y + minY - pad,
              w: maxX - minX + pad * 2,
              h: maxY - minY + pad * 2,
            };
            // Transform docPt into the node's local frame (undo rotation)
            const localPt = n.rotation
              ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
              : docPt;
            const scaleHit = hitResizeHandle(box, localPt.x, localPt.y, viewport.zoom);
            if (scaleHit) {
              drag.current = {
                type: "path-points-scale",
                id: n.id,
                handle: scaleHit,
                basePoints: n.points.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out })),
                baseHoles: n.holes?.map((ring) => ring.map((p) => ({ ...p, in: p.in ? { ...p.in } : p.in, out: p.out ? { ...p.out } : p.out }))),
              };
              commit();
              setStudioStatus("Scale path points");
              return;
            }
          }
        }
      }

      // Path point / handle hit on selected path first
      for (const n of selected) {
        if (!isPath(n) || !n.points.length) continue;
        const hit = hitPathNode(n, docPt.x, docPt.y, viewport.zoom);
        if (hit) {
          if (e.shiftKey && hit.arm === "anchor") {
            togglePathPointSelection(hit.index, hit.hole);
            setStudioStatus(`Path points · ${useDesign.getState().pathPointSelection.length} selected`);
          } else {
            setPathEditHit(hit);
            if (hit.arm === "anchor") {
              setPathPointSelection([{ index: hit.index, hole: hit.hole }]);
            } else {
              setPathPointSelection([]);
            }
            const arm = hit.arm === "anchor" ? "anchor" : hit.arm;
            setStudioStatus(`Path ${arm}${hit.hole != null ? ` · hole ${hit.hole + 1}` : ""}`);
          }
          drag.current = {
            type: "path-point",
            id: n.id,
            hit,
            keepSmooth: !e.altKey,
            started: false,
          };
          return;
        }
      }

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
          const ang = Math.atan2(docPt.y - c.y, docPt.x - c.x);
          drag.current = { type: "rotate", id: n.id, startAngle: ang, origRot: n.rotation, cx: c.x, cy: c.y };
          setStudioStatus(`Rotate ${Math.round(n.rotation)}°`);
        } else if (hitH.handle === "move") {
          drag.current = { type: "move", id: n.id, startX: docPt.x, startY: docPt.y, ox: n.x, oy: n.y };
        } else {
          drag.current = {
            type: "resize",
            id: n.id,
            handle: hitH.handle,
            startX: docPt.x,
            startY: docPt.y,
            orig: { ...n },
          };
        }
        return;
      }
      const hit = hitTop(doc.nodes, docPt.x, docPt.y);
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (hit) {
        select([hit.id], additive);
        if (isPath(hit)) {
          const ph = hitPathNode(hit, docPt.x, docPt.y, viewport.zoom);
          setPathEditHit(ph);
        } else {
          setPathEditHit(null);
        }
        drag.current = { type: "move", id: hit.id, startX: docPt.x, startY: docPt.y, ox: hit.x, oy: hit.y };
      } else {
        // Start marquee on empty canvas (click-drag selects; pure click clears)
        drag.current = {
          type: "marquee",
          startX: docPt.x,
          startY: docPt.y,
          endX: docPt.x,
          endY: docPt.y,
          additive: e.shiftKey || e.metaKey || e.ctrlKey,
        };
        setMarquee({ x1: docPt.x, y1: docPt.y, x2: docPt.x, y2: docPt.y });
      }
      return;
    }

    // Shape / text create
    if (["rect", "ellipse", "line", "polygon", "star", "arrow", "text"].includes(tool)) {
      drag.current = { type: "create", tool, startX: docPt.x, startY: docPt.y, id: null };
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
      setViewport({ x: d.vx + (sx - d.startX), y: d.vy + (sy - d.startY) });
      return;
    }
    if (d.type === "move") {
      const dx = docPt.x - d.startX;
      const dy = docPt.y - d.startY;
      updateNodes([d.id], { x: d.ox + dx, y: d.oy + dy }, false);
      return;
    }
    if (d.type === "resize") {
      const local = localDelta(d.orig, docPt.x - d.startX, docPt.y - d.startY);
      const patch = applyHandle(d.orig, d.handle, local.dx, local.dy);
      updateNodes([d.id], patch, false);
      return;
    }
    if (d.type === "path-points-rotate") {
      const ang = Math.atan2(docPt.y - d.cy, docPt.x - d.cx);
      let deg = ((ang - d.startAngle) * 180) / Math.PI;
      deg = snap15(deg, e.shiftKey);
      rotateSelectedPathPoints(deg, d.basePoints, d.baseHoles);
      return;
    }
    if (d.type === "path-points-scale") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      const nc = nodeCenter(n);
      const localPt = n.rotation
        ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
        : docPt;
      // local relative to node origin for the scale function
      const mouseLocalX = localPt.x - n.x;
      const mouseLocalY = localPt.y - n.y;
      scaleSelectedPathPoints(
        d.handle,
        mouseLocalX,
        mouseLocalY,
        e.shiftKey,
        e.altKey,
        d.basePoints,
        d.baseHoles,
      );
      return;
    }
    if (d.type === "rotate") {
      const ang = Math.atan2(docPt.y - d.cy, docPt.x - d.cx);
      let deg = d.origRot + ((ang - d.startAngle) * 180) / Math.PI;
      deg = snap15(deg, e.shiftKey);
      updateNodes([d.id], { rotation: deg }, false);
      setStudioStatus(`Rotate ${Math.round(deg)}°`);
      return;
    }
    if (d.type === "path-point") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      if (!d.started) {
        commit();
        drag.current = { ...d, started: true };
      }
      const local = pathWorldToLocal(n, docPt.x, docPt.y);
      editPathHit(d.id, d.hit, local.x, local.y, d.keepSmooth && !e.altKey, false);
      if (d.hit.arm === "anchor") {
        setStudioStatus(`Point ${d.hit.index + 1} · ${Math.round(local.x)}, ${Math.round(local.y)}`);
      } else {
        setStudioStatus(`Handle ${d.hit.arm} · point ${d.hit.index + 1}`);
      }
      return;
    }
    if (d.type === "marquee") {
      drag.current = { ...d, endX: docPt.x, endY: docPt.y };
      setMarquee({ x1: d.startX, y1: d.startY, x2: docPt.x, y2: docPt.y });
      return;
    }
    if (d.type === "create") {
      const x0 = Math.min(d.startX, docPt.x);
      const y0 = Math.min(d.startY, docPt.y);
      const w = Math.abs(docPt.x - d.startX);
      const h = Math.abs(docPt.y - d.startY);
      if (!d.id) {
        if (w < 2 && h < 2 && d.tool !== "text") return;
        if (d.tool === "text") {
          const node = makeText(d.startX, d.startY, color);
          addNode(node, true);
          drag.current = { ...d, id: node.id };
          setTool("select");
          return;
        }
        const node = makeShape(d.tool, x0, y0, Math.max(w, 4), Math.max(h, 4), color);
        addNode(node, true);
        drag.current = { ...d, id: node.id };
      } else if (d.tool !== "text") {
        updateNodes([d.id], { x: x0, y: y0, w: Math.max(w, 4), h: Math.max(h, 4) }, false);
      }
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setMarquee(null);
    if (d?.type === "create" && d.id && d.tool !== "text") {
      setTool("select");
    }
    if (d?.type === "path-point") {
      // final state already live; nothing to commit again
    }
    if (d?.type === "marquee") {
      const dx = Math.abs(d.endX - d.startX);
      const dy = Math.abs(d.endY - d.startY);
      if (dx < 3 && dy < 3) {
        // Pure click on empty: clear
        if (!d.additive) {
          select([]);
          setPathEditHit(null);
          setPathPointSelection([]);
        }
        return;
      }
      const minX = Math.min(d.startX, d.endX);
      const minY = Math.min(d.startY, d.endY);
      const maxX = Math.max(d.startX, d.endX);
      const maxY = Math.max(d.startY, d.endY);
      const mq = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };

      // Prefer path-point marquee when a single path is selected
      if (selection.length === 1) {
        const n = doc?.nodes.find((x) => x.id === selection[0]);
        if (n && isPath(n)) {
          const picked: { index: number; hole?: number }[] = [];
          const c = nodeCenter(n);
          const consider = (ring: typeof n.points, hole?: number) => {
            ring.forEach((pt, index) => {
              const localWx = n.x + pt.x;
              const localWy = n.y + pt.y;
              const world = n.rotation
                ? rotatePoint(localWx, localWy, c.x, c.y, n.rotation)
                : { x: localWx, y: localWy };
              if (world.x >= minX && world.x <= maxX && world.y >= minY && world.y <= maxY) {
                picked.push({ index, hole });
              }
            });
          };
          consider(n.points);
          (n.holes ?? []).forEach((ring, hole) => consider(ring, hole));
          if (d.additive) {
            const cur = useDesign.getState().pathPointSelection ?? [];
            const key = (p: { index: number; hole?: number }) => `${p.hole ?? ""}:${p.index}`;
            const seen = new Set(cur.map(key));
            for (const p of picked) if (!seen.has(key(p))) cur.push(p);
            setPathPointSelection(cur);
          } else {
            setPathPointSelection(picked);
          }
          if (picked.length) {
            setPathEditHit({ index: picked[0]!.index, arm: "anchor", hole: picked[0]!.hole });
          }
          setStudioStatus(`Marquee · ${picked.length} path point${picked.length === 1 ? "" : "s"}`);
          return;
        }
      }

      // Otherwise select nodes
      const ids = nodesInMarquee(doc?.nodes ?? [], mq, "intersect");
      if (d.additive) {
        const cur = new Set(selection);
        for (const id of ids) cur.add(id);
        select(Array.from(cur));
      } else {
        select(ids);
      }
      setPathEditHit(null);
      setPathPointSelection([]);
      setStudioStatus(`Marquee · ${ids.length} layer${ids.length === 1 ? "" : "s"}`);
    }
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

function drawMarquee(
  ctx: CanvasRenderingContext2D,
  mq: { x1: number; y1: number; x2: number; y2: number },
  vp: Viewport,
  dpr: number,
) {
  const x = Math.min(mq.x1, mq.x2);
  const y = Math.min(mq.y1, mq.y2);
  const w = Math.abs(mq.x2 - mq.x1);
  const h = Math.abs(mq.y2 - mq.y1);
  if (w < 1 && h < 1) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  ctx.strokeStyle = "#3fc6ff";
  ctx.fillStyle = "rgba(63,198,255,0.08)";
  ctx.lineWidth = 1 / vp.zoom;
  ctx.setLineDash([4 / vp.zoom, 3 / vp.zoom]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  selection: string[],
  vp: Viewport,
  dpr: number,
  pathEditHit: PathEditHit | null,
  pathPointSelection: { index: number; hole?: number }[] = [],
) {
  const selected = nodes.filter((n) => selection.includes(n.id) && n.visible);
  if (!selected.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const phosphor = "#3fc6ff";
  for (const n of selected) {
    if (isPath(n) && n.points.length) {
      drawPathNodeTangents(ctx, n, vp.zoom, pathEditHit, false);
      // Multi-selected point highlights (phosphor fill)
      if (pathPointSelection.length > 1) {
        ctx.save();
        const c = nodeCenter(n);
        if (n.rotation) {
          ctx.translate(c.x, c.y);
          ctx.rotate(degToRad(n.rotation));
          ctx.translate(-c.x, -c.y);
        }
        ctx.fillStyle = "rgba(63,198,255,0.9)";
        ctx.strokeStyle = "#7ee0ff";
        const r = 4.5 / vp.zoom;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const sel of pathPointSelection) {
          const ring = sel.hole == null ? n.points : n.holes?.[sel.hole];
          const pt = ring?.[sel.index];
          if (!pt) continue;
          const ax = n.x + pt.x;
          const ay = n.y + pt.y;
          // world for box (rotation already applied by the save/restore transform above? wait)
          // The transform is around center, so points are drawn in rotated space.
          // For box we want axis-aligned in the current (rotated) context? Or world.
          // Simpler: compute local min/max then draw in the transformed space.
          minX = Math.min(minX, ax);
          minY = Math.min(minY, ay);
          maxX = Math.max(maxX, ax);
          maxY = Math.max(maxY, ay);
          ctx.beginPath();
          ctx.arc(ax, ay, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1 / vp.zoom;
          ctx.stroke();
        }
        if (Number.isFinite(minX) && pathPointSelection.length > 1) {
          const pad = 6 / vp.zoom;
          ctx.strokeStyle = "#3fc6ff";
          ctx.lineWidth = 1 / vp.zoom;
          ctx.setLineDash([5 / vp.zoom, 4 / vp.zoom]);
          ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
          ctx.setLineDash([]);

          // Scale handles (corners + mid-edges)
          const size = 8 / vp.zoom;
          const half = size / 2;
          const boxX = minX - pad;
          const boxY = minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;
          const handles: [number, number][] = [
            [boxX, boxY],
            [boxX + boxW / 2, boxY],
            [boxX + boxW, boxY],
            [boxX + boxW, boxY + boxH / 2],
            [boxX + boxW, boxY + boxH],
            [boxX + boxW / 2, boxY + boxH],
            [boxX, boxY + boxH],
            [boxX, boxY + boxH / 2],
          ];
          ctx.fillStyle = "#06170f";
          ctx.strokeStyle = "#3fc6ff";
          for (const [hx, hy] of handles) {
            ctx.fillRect(hx - half, hy - half, size, size);
            ctx.strokeRect(hx - half, hy - half, size, size);
          }

          // Shared rotation handle at top center of the group box
          const lcx = (minX + maxX) / 2;
          const top = minY - pad;
          const ry = top - 28 / vp.zoom;
          ctx.beginPath();
          ctx.moveTo(lcx, top);
          ctx.lineTo(lcx, ry);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(lcx, ry, 7 / vp.zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#06170f";
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
      continue;
    }
    ctx.save();
    const c = nodeCenter(n);
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
    ctx.strokeStyle = phosphor;
    ctx.lineWidth = 1 / vp.zoom;
    ctx.setLineDash([]);
    ctx.strokeRect(n.x, n.y, n.w, n.h);
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
      ctx.fillRect(px! - half, py! - half, size, size);
      ctx.strokeRect(px! - half, py! - half, size, size);
    }
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
