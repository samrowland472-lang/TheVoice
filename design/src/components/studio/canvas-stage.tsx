import { useEffect, useRef, useState } from "react";
import { useDesign } from "@/lib/design/store";
import type { PathPointAlignPreview, PathPointNumericPreview, PathPointHandleNumericPreview } from "@/lib/design/store-impl";
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
  alignSelectedPathPoints,
  appendPenPoint,
  clearPathPointAlignPreview,
  distributeSelectedPathPoints,
  flipSelectedPathPoints,
  previewFlipSelectedPathPoints,
  editPathHit,
  joinSelectedPathToNearest,
  knifeCutStroke,
  lastPathScale,
  previewAlignSelectedPathPoints,
  previewDistributeSelectedPathPoints,
  rotateSelectedPathPoints,
  scaleSelectedPathPoints,
  setPathEditHit,
  setPathPointSelection,
  togglePathPointSelection,
  type AlignEdge,
} from "@/lib/design/path-actions";
import { asEditablePath } from "@/lib/design/shape-to-path";
import { knifeStrokePreview, knifePreviewPoint, knifeSplitPieces, knifePointSplitPieces } from "@/lib/design/path-cut";
import { hitResizeHandle, type ResizeHandle } from "@/lib/design/box-resize";
import {
  drawPathNodeTangents,
  hitPathNode,
  hitPathLengthLabel,
  pathWorldToLocal,
} from "@/lib/design/path-edit";
import { closePathWithCubic, nearPenClose, mirrorHandle } from "@/lib/design/path-curve";
import { isPath, type DesignNode, type DesignDocument, type PathPoint, type Tool, type Viewport } from "@/lib/design/types";
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
    }
  | {
      type: "path-points-align";
      id: string;
      edge: AlignEdge;
    }
  | {
      type: "path-points-dist";
      id: string;
      axis: "h" | "v";
    }
  | {
      type: "path-points-flip";
      id: string;
      axis: "x" | "y" | "xy";
    }
  | {
      type: "path-handle-length";
      id: string;
      index: number;
      arm: "in" | "out";
      hole?: number;
      baseVec: { x: number; y: number };
      started: boolean;
    }
  | { type: "knife"; startX: number; startY: number; endX?: number; endY?: number };

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
  const pathPointAlignPreview = useDesign((s) => s.pathPointAlignPreview);
  const pathPointNumericPreview = useDesign((s) => s.pathPointNumericPreview);
  const pathPointHandleNumericPreview = useDesign((s) => s.pathPointHandleNumericPreview);
  const showTangentLengths = useDesign((s) => s.showTangentLengths);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [knifeStroke, setKnifeStroke] = useState<{ ax: number; ay: number; bx: number; by: number } | null>(null);
  const [knifeHover, setKnifeHover] = useState<{ x: number; y: number } | null>(null);
  const [scaleFlip, setScaleFlip] = useState<{ x: boolean; y: boolean } | null>(null);
  const [rotateAngle, setRotateAngle] = useState<number | null>(null);
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
    drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection, scaleFlip, showTangentLengths, rotateAngle);
    if (pathPointAlignPreview) drawPathPointAlignPreview(ctx, pathPointAlignPreview, doc, viewport, dpr);
    if (pathPointNumericPreview) drawPathPointNumericPreview(ctx, pathPointNumericPreview, doc, viewport, dpr);
    if (pathPointHandleNumericPreview) drawPathPointHandleNumericPreview(ctx, pathPointHandleNumericPreview, doc, viewport, dpr);
    if (marquee) drawMarquee(ctx, marquee, viewport, dpr);
    if (knifeStroke) drawKnifeStroke(ctx, knifeStroke, doc, viewport, dpr);
    else if (knifeHover) drawKnifeHover(ctx, knifeHover, doc, viewport, dpr);
  }, [doc, selection, viewport, pathEditHit, pathPointSelection, marquee, knifeStroke, knifeHover, scaleFlip, pathPointAlignPreview, pathPointNumericPreview, pathPointHandleNumericPreview, showTangentLengths, rotateAngle]);

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
      drawSelection(ctx, doc.nodes, selection, viewport, dpr, pathEditHit, pathPointSelection, scaleFlip, showTangentLengths, rotateAngle);
    if (pathPointAlignPreview) drawPathPointAlignPreview(ctx, pathPointAlignPreview, doc, viewport, dpr);
    if (pathPointNumericPreview) drawPathPointNumericPreview(ctx, pathPointNumericPreview, doc, viewport, dpr);
    if (pathPointHandleNumericPreview) drawPathPointHandleNumericPreview(ctx, pathPointHandleNumericPreview, doc, viewport, dpr);
      if (marquee) drawMarquee(ctx, marquee, viewport, dpr);
      if (knifeStroke) drawKnifeStroke(ctx, knifeStroke, doc, viewport, dpr);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [doc, selection, viewport, pathEditHit, pathPointSelection, marquee, knifeStroke, scaleFlip, pathPointAlignPreview, pathPointNumericPreview, pathPointHandleNumericPreview, showTangentLengths, rotateAngle]);

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

    // Knife tool: live stroke cut
    if (tool === "knife" && e.button === 0) {
      drag.current = { type: "knife", startX: docPt.x, startY: docPt.y };
      setKnifeStroke({ ax: docPt.x, ay: docPt.y, bx: docPt.x, by: docPt.y });
      setKnifeHover(null);
      setStudioStatus("Knife · drag to cut");
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
              setRotateAngle(0);
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

            // Alignment handles (outward mid-edge circles)
            const alignOff = 16 / viewport.zoom;
            const alignHitR = 14 / viewport.zoom;
            const alignHandles: { x: number; y: number; edge: AlignEdge }[] = [
              { x: box.x - alignOff, y: box.y + box.h / 2, edge: "left" },
              { x: box.x + box.w + alignOff, y: box.y + box.h / 2, edge: "right" },
              { x: box.x + box.w / 2, y: box.y - alignOff, edge: "top" },
              { x: box.x + box.w / 2, y: box.y + box.h + alignOff, edge: "bottom" },
            ];
            for (const ah of alignHandles) {
              const d = Math.hypot(localPt.x - ah.x, localPt.y - ah.y);
              if (d <= alignHitR) {
                previewAlignSelectedPathPoints(ah.edge);
                drag.current = { type: "path-points-align", id: n.id, edge: ah.edge };
                setStudioStatus(`Align ${ah.edge} · drag to snap`);
                return;
              }
            }

            // Distribute handles (further out, 3+ points)
            if (pathPointSelection.length >= 3) {
              const distOff = 32 / viewport.zoom;
              const distHitR = 14 / viewport.zoom;
              const distHandles: { x: number; y: number; axis: "h" | "v" }[] = [
                { x: box.x - distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w + distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w / 2, y: box.y - distOff, axis: "v" },
                { x: box.x + box.w / 2, y: box.y + box.h + distOff, axis: "v" },
              ];
              for (const dh of distHandles) {
                const d = Math.hypot(localPt.x - dh.x, localPt.y - dh.y);
                if (d <= distHitR) {
                  previewDistributeSelectedPathPoints(dh.axis);
                  drag.current = { type: "path-points-dist", id: n.id, axis: dh.axis };
                  setStudioStatus(`Distribute ${dh.axis === "h" ? "H" : "V"} · drag to apply`);
                  return;
                }
              }
            }

            // Flip handles (further out): H on left/right, V on top/bottom, XY on corners
            const flipOff = 48 / viewport.zoom;
            const flipHitR = 14 / viewport.zoom;
            const flipHandles: { x: number; y: number; axis: "x" | "y" | "xy" }[] = [
              { x: box.x - flipOff, y: box.y + box.h / 2, axis: "x" },
              { x: box.x + box.w + flipOff, y: box.y + box.h / 2, axis: "x" },
              { x: box.x + box.w / 2, y: box.y - flipOff, axis: "y" },
              { x: box.x + box.w / 2, y: box.y + box.h + flipOff, axis: "y" },
              { x: box.x - flipOff, y: box.y - flipOff, axis: "xy" },
              { x: box.x + box.w + flipOff, y: box.y - flipOff, axis: "xy" },
              { x: box.x - flipOff, y: box.y + box.h + flipOff, axis: "xy" },
              { x: box.x + box.w + flipOff, y: box.y + box.h + flipOff, axis: "xy" },
            ];
            for (const fh of flipHandles) {
              const d = Math.hypot(localPt.x - fh.x, localPt.y - fh.y);
              if (d <= flipHitR) {
                previewFlipSelectedPathPoints(fh.axis);
                drag.current = { type: "path-points-flip", id: n.id, axis: fh.axis };
                setStudioStatus(`Flip ${fh.axis.toUpperCase()} · drag to apply`);
                return;
              }
            }
          }
        }
      }

      // On-canvas length label drag (when Len mode / showTangentLengths)
      if (showTangentLengths && pathEditHit) {
        for (const n of selected) {
          if (!isPath(n) || !n.points.length) continue;
          const labelHit = hitPathLengthLabel(n, docPt.x, docPt.y, viewport.zoom, pathEditHit);
          if (
            labelHit &&
            labelHit.index === pathEditHit.index &&
            (labelHit.hole ?? undefined) === (pathEditHit.hole ?? undefined)
          ) {
            const ring = labelHit.hole == null ? n.points : (n.holes?.[labelHit.hole] ?? []);
            const pt = ring[labelHit.index];
            const h = labelHit.arm === "in" ? pt?.in : pt?.out;
            if (h && (Math.abs(h.x) > 0.2 || Math.abs(h.y) > 0.2)) {
              drag.current = {
                type: "path-handle-length",
                id: n.id,
                index: labelHit.index,
                arm: labelHit.arm,
                hole: labelHit.hole,
                baseVec: { x: h.x, y: h.y },
                started: false,
              };
              setStudioStatus(`Length ${labelHit.arm} · ${labelHit.length}`);
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
    if (!doc) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const docPt = screenToDoc(sx, sy, viewport);

    // Knife hover preview (point cut) when not dragging
    if (tool === "knife" && !drag.current) {
      let best: { x: number; y: number; dist: number } | null = null;
      const preferred = selection[0];
      const paths: DesignNode[] = [];
      for (const n of doc.nodes) {
        if (!n.visible || n.locked) continue;
        const p = asEditablePath(n);
        if (p && p.points.length >= 2) paths.push(p);
      }
      const ordered = preferred
        ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
        : paths;
      for (const n of ordered) {
        const p = asEditablePath(n);
        if (!p) continue;
        const local = pathWorldToLocal(p, docPt.x, docPt.y);
        const mark = knifePreviewPoint(p, local.x, local.y, viewport.zoom);
        if (mark) {
          const d = Math.hypot(mark.x - docPt.x, mark.y - docPt.y);
          if (!best || d < best.dist) best = { x: mark.x, y: mark.y, dist: d };
        }
      }
      if (best && best.dist < 20 / viewport.zoom) {
        setKnifeHover(best);
        let pieceNote = "";
        // Compute piece count for status (same path logic as draw)
        const preferred = selection[0];
        const paths: DesignNode[] = [];
        for (const n of doc.nodes) {
          if (!n.visible || n.locked) continue;
          const p = asEditablePath(n);
          if (p && p.points.length >= 2) paths.push(p);
        }
        const ordered = preferred
          ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
          : paths;
        for (const n of ordered) {
          const p = asEditablePath(n);
          if (!p) continue;
          const local = pathWorldToLocal(p, best.x, best.y);
          const pieces = knifePointSplitPieces(p, local.x, local.y, viewport.zoom);
          const valid = pieces.filter((pc) => pc.length >= 2).length;
          if (valid > 1) {
            pieceNote = ` · ${valid} pieces`;
            break;
          }
        }
        setStudioStatus(`Knife · cut here${pieceNote}`);
      } else {
        setKnifeHover(null);
        setStudioStatus("Knife · drag to cut");
      }
      return;
    }

    // Alignment handle hover preview (select tool, multi path points)
    if (tool === "select" && !drag.current && selection.length === 1 && pathPointSelection.length > 1) {
      const n = doc.nodes.find((x) => x.id === selection[0]);
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
          const pad = 6 / viewport.zoom;
          const box = {
            x: n.x + minX - pad,
            y: n.y + minY - pad,
            w: maxX - minX + pad * 2,
            h: maxY - minY + pad * 2,
          };
          const nc = nodeCenter(n);
          const localPt = n.rotation
            ? rotatePoint(docPt.x, docPt.y, nc.x, nc.y, -n.rotation)
            : docPt;
          const alignOff = 16 / viewport.zoom;
          const hitR = 14 / viewport.zoom;
          const alignHandles: { x: number; y: number; edge: AlignEdge }[] = [
            { x: box.x - alignOff, y: box.y + box.h / 2, edge: "left" },
            { x: box.x + box.w + alignOff, y: box.y + box.h / 2, edge: "right" },
            { x: box.x + box.w / 2, y: box.y - alignOff, edge: "top" },
            { x: box.x + box.w / 2, y: box.y + box.h + alignOff, edge: "bottom" },
          ];
          let hitEdge: AlignEdge | null = null;
          for (const ah of alignHandles) {
            if (Math.hypot(localPt.x - ah.x, localPt.y - ah.y) <= hitR) {
              hitEdge = ah.edge;
              break;
            }
          }
          if (hitEdge) {
            previewAlignSelectedPathPoints(hitEdge);
          } else {
            let handled = false;
            if (pathPointSelection.length >= 3) {
              const distOff = 32 / viewport.zoom;
              const distHitR = 14 / viewport.zoom;
              const distHandles: { x: number; y: number; axis: "h" | "v" }[] = [
                { x: box.x - distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w + distOff, y: box.y + box.h / 2, axis: "h" },
                { x: box.x + box.w / 2, y: box.y - distOff, axis: "v" },
                { x: box.x + box.w / 2, y: box.y + box.h + distOff, axis: "v" },
              ];
              let hitAxis: "h" | "v" | null = null;
              for (const dh of distHandles) {
                if (Math.hypot(localPt.x - dh.x, localPt.y - dh.y) <= distHitR) {
                  hitAxis = dh.axis;
                  break;
                }
              }
              if (hitAxis) {
                previewDistributeSelectedPathPoints(hitAxis);
                handled = true;
              }
            }
            if (!handled) {
              // Flip handles (further out): H on left/right, V on top/bottom, XY on corners
              const flipOff = 48 / viewport.zoom;
              const flipHitR = 14 / viewport.zoom;
              const flipHandles: { x: number; y: number; axis: "x" | "y" | "xy" }[] = [
                { x: box.x - flipOff, y: box.y + box.h / 2, axis: "x" },
                { x: box.x + box.w + flipOff, y: box.y + box.h / 2, axis: "x" },
                { x: box.x + box.w / 2, y: box.y - flipOff, axis: "y" },
                { x: box.x + box.w / 2, y: box.y + box.h + flipOff, axis: "y" },
                { x: box.x - flipOff, y: box.y - flipOff, axis: "xy" },
                { x: box.x + box.w + flipOff, y: box.y - flipOff, axis: "xy" },
                { x: box.x - flipOff, y: box.y + box.h + flipOff, axis: "xy" },
                { x: box.x + box.w + flipOff, y: box.y + box.h + flipOff, axis: "xy" },
              ];
              let hitFlip: "x" | "y" | "xy" | null = null;
              for (const fh of flipHandles) {
                if (Math.hypot(localPt.x - fh.x, localPt.y - fh.y) <= flipHitR) {
                  hitFlip = fh.axis;
                  break;
                }
              }
              if (hitFlip) {
                previewFlipSelectedPathPoints(hitFlip);
              } else {
                clearPathPointAlignPreview();
              }
            }
          }
        }
      }
    }

    if (!drag.current) return;
    const d = drag.current;

    if (d.type === "pan") {
      setViewport({ x: d.vx + (sx - d.startX), y: d.vy + (sy - d.startY) });
      return;
    }
    if (d.type === "knife") {
      d.endX = docPt.x;
      d.endY = docPt.y;
      setKnifeStroke({ ax: d.startX, ay: d.startY, bx: docPt.x, by: docPt.y });
      const dx = docPt.x - d.startX;
      const dy = docPt.y - d.startY;
      const len = Math.hypot(dx, dy);
      const ang = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const lenStr = len < 10 ? len.toFixed(1) : Math.round(len).toString();
      const cuts = knifeCutCount(d.startX, d.startY, docPt.x, docPt.y, doc.nodes);
      const cutStr = cuts === 0 ? "miss" : cuts === 1 ? "1 cut" : `${cuts} cuts`;
      let pieces = 0;
      for (const n of doc.nodes) {
        if (!n.visible || n.locked) continue;
        const ep = asEditablePath(n);
        if (ep) pieces += knifeSplitPieces(ep, d.startX, d.startY, docPt.x, docPt.y).length;
      }
      const pieceStr = pieces > 1 ? ` · ${pieces} pieces` : "";
      setStudioStatus(`Knife · ${lenStr}px · ${Math.round(ang)}° · ${cutStr}${pieceStr}`);
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
      setRotateAngle(deg);
      return;
    }
    if (d.type === "path-points-align") {
      // Preview already set on down; nothing to update during drag
      return;
    }
    if (d.type === "path-points-dist") {
      // Preview already set on down; nothing to update during drag
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
      setScaleFlip({ x: lastPathScale.sx < 0, y: lastPathScale.sy < 0 });
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
    if (d.type === "path-handle-length") {
      const n = doc.nodes.find((x) => x.id === d.id);
      if (!n || !isPath(n)) return;
      if (!d.started) {
        commit();
        drag.current = { ...d, started: true };
      }
      const ring = d.hole == null ? n.points : (n.holes?.[d.hole] ?? []);
      const pt = ring[d.index];
      if (!pt) return;
      const ax = n.x + pt.x;
      const ay = n.y + pt.y;
      const c = nodeCenter(n);
      const worldAnchor = n.rotation ? rotatePoint(ax, ay, c.x, c.y, n.rotation) : { x: ax, y: ay };
      const dx = docPt.x - worldAnchor.x;
      const dy = docPt.y - worldAnchor.y;
      const newLen = Math.max(0, Math.hypot(dx, dy));
      const baseLen = Math.hypot(d.baseVec.x, d.baseVec.y) || 1;
      const scale = newLen / baseLen;
      const next = { x: d.baseVec.x * scale, y: d.baseVec.y * scale };
      const s = useDesign.getState();
      const mirrorKey = `${d.id}:${d.hole ?? ""}:${d.index}`;
      const mir = !!(s.mirrorPoints && s.mirrorPoints[mirrorKey]);
      const nextPt = { ...pt };
      if (mir) {
        const mirrored = mirrorHandle(next);
        if (d.arm === "in") {
          nextPt.in = next;
          nextPt.out = mirrored;
        } else {
          nextPt.out = next;
          nextPt.in = mirrored;
        }
      } else {
        if (d.arm === "in") nextPt.in = next;
        else nextPt.out = next;
      }
      const nextRing = ring.map((p, i) => (i === d.index ? nextPt : p));
      const nextNode =
        d.hole == null
          ? { ...n, points: nextRing }
          : { ...n, holes: (n.holes ?? []).map((h, i) => (i === d.hole ? nextRing : h)) };
      replaceNode(d.id, nextNode, false);
      setPathEditHit({ index: d.index, arm: d.arm, hole: d.hole });
      setStudioStatus(`Length ${d.arm} · ${Math.round(newLen)}`);
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
    setScaleFlip(null);
    setRotateAngle(null);
    if (d?.type === "path-points-align") {
      alignSelectedPathPoints(d.edge);
      clearPathPointAlignPreview();
      return;
    }
    if (d?.type === "path-points-dist") {
      distributeSelectedPathPoints(d.axis);
      clearPathPointAlignPreview();
      return;
    }
    if (d?.type === "path-points-flip") {
      flipSelectedPathPoints(d.axis);
      clearPathPointAlignPreview();
      return;
    }
    if (d?.type === "knife") {
      const bx = d.endX ?? d.startX;
      const by = d.endY ?? d.startY;
      const ok = knifeCutStroke(d.startX, d.startY, bx, by, viewport.zoom);
      setStudioStatus(ok ? "Knife · cut" : "Knife · miss");
      setKnifeStroke(null);
      return;
    }
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

function drawPathPointAlignPreview(
  ctx: CanvasRenderingContext2D,
  preview: NonNullable<PathPointAlignPreview>,
  doc: DesignDocument,
  vp: Viewport,
  dpr: number,
) {
  const n = doc.nodes.find((x) => x.id === preview.nodeId);
  if (!n || !isPath(n)) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const phosphor = "#3fc6ff";
  ctx.strokeStyle = phosphor;
  ctx.fillStyle = "rgba(63,198,255,0.35)";
  ctx.lineWidth = 1 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  const r = 5 / vp.zoom;
  for (const pt of preview.points) {
    const fx = n.x + pt.fromX;
    const fy = n.y + pt.fromY;
    const tx = n.x + pt.toX;
    const ty = n.y + pt.toY;
    // dashed line from current to target
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // ghost circle at target
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPathPointNumericPreview(
  ctx: CanvasRenderingContext2D,
  preview: NonNullable<PathPointNumericPreview>,
  doc: DesignDocument,
  vp: Viewport,
  dpr: number,
) {
  const n = doc.nodes.find((x) => x.id === preview.nodeId);
  if (!n || !isPath(n)) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const phosphor = "#3fc6ff";
  ctx.strokeStyle = phosphor;
  ctx.fillStyle = "rgba(63,198,255,0.45)";
  ctx.lineWidth = 1 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  const r = 6 / vp.zoom;
  const fx = n.x + preview.fromX;
  const fy = n.y + preview.fromY;
  const tx = n.x + preview.toX;
  const ty = n.y + preview.toY;
  // dashed line from current to proposed
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  // ghost circle at proposed
  ctx.beginPath();
  ctx.arc(tx, ty, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // small cross at proposed for axis emphasis
  const cross = 4 / vp.zoom;
  ctx.beginPath();
  if (preview.axis === "x") {
    ctx.moveTo(tx - cross, ty);
    ctx.lineTo(tx + cross, ty);
  } else {
    ctx.moveTo(tx, ty - cross);
    ctx.lineTo(tx, ty + cross);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}


function drawPathPointHandleNumericPreview(
  ctx: CanvasRenderingContext2D,
  preview: NonNullable<PathPointHandleNumericPreview>,
  doc: DesignDocument,
  vp: Viewport,
  dpr: number,
) {
  const n = doc.nodes.find((x) => x.id === preview.nodeId);
  if (!n || !isPath(n)) return;
  const ring = preview.hole == null ? n.points : n.holes?.[preview.hole];
  const pt = ring?.[preview.index];
  if (!pt) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const phosphor = "#3fc6ff";
  ctx.strokeStyle = phosphor;
  ctx.fillStyle = "rgba(63,198,255,0.45)";
  ctx.lineWidth = 1 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  const ax = n.x + pt.x;
  const ay = n.y + pt.y;
  const tx = ax + preview.toX;
  const ty = ay + preview.toY;
  // dashed line from anchor to proposed handle tip
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  // ghost circle at proposed tip
  const r = 5 / vp.zoom;
  ctx.beginPath();
  ctx.arc(tx, ty, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // small cross for axis emphasis (skip for length)
  if (preview.axis !== "len") {
    const cross = 3.5 / vp.zoom;
    ctx.beginPath();
    if (preview.axis === "x") {
      ctx.moveTo(tx - cross, ty);
      ctx.lineTo(tx + cross, ty);
    } else {
      ctx.moveTo(tx, ty - cross);
      ctx.lineTo(tx, ty + cross);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
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
  scaleFlip: { x: boolean; y: boolean } | null = null,
  showLengths = false,
  rotateAngle: number | null = null,
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
      drawPathNodeTangents(ctx, n, vp.zoom, pathEditHit, showLengths);
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

          // Flip feedback: reverse-arrow indicators on individual flipped axes
          if (scaleFlip && (scaleFlip.x || scaleFlip.y)) {
            ctx.save();
            ctx.strokeStyle = "#ff6b6b";
            ctx.fillStyle = "#ff6b6b";
            ctx.lineWidth = 1.5 / vp.zoom;
            ctx.setLineDash([]);
            const bx = minX - pad;
            const by = minY - pad;
            const bw = maxX - minX + pad * 2;
            const bh = maxY - minY + pad * 2;
            const cx = bx + bw / 2;
            const cy = by + bh / 2;
            const arrowLen = Math.min(bw, bh) * 0.25;
            const head = 6 / vp.zoom;

            function drawArrowhead(ax: number, ay: number, angle: number) {
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(ax + Math.cos(angle + 2.4) * head, ay + Math.sin(angle + 2.4) * head);
              ctx.lineTo(ax + Math.cos(angle - 2.4) * head, ay + Math.sin(angle - 2.4) * head);
              ctx.closePath();
              ctx.fill();
            }

            if (scaleFlip.x) {
              // Horizontal reverse arrows (pointing inward)
              const left = cx - arrowLen;
              const right = cx + arrowLen;
              ctx.beginPath();
              ctx.moveTo(left + head * 0.6, cy);
              ctx.lineTo(right - head * 0.6, cy);
              ctx.stroke();
              drawArrowhead(left, cy, Math.PI); // pointing left
              drawArrowhead(right, cy, 0); // pointing right
            }
            if (scaleFlip.y) {
              // Vertical reverse arrows (pointing inward)
              const top = cy - arrowLen;
              const bot = cy + arrowLen;
              ctx.beginPath();
              ctx.moveTo(cx, top + head * 0.6);
              ctx.lineTo(cx, bot - head * 0.6);
              ctx.stroke();
              drawArrowhead(cx, top, -Math.PI / 2); // pointing up
              drawArrowhead(cx, bot, Math.PI / 2); // pointing down
            }
            ctx.restore();
          }

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
            // Cross the handle if both axes flipped
            if (scaleFlip && scaleFlip.x && scaleFlip.y) {
              ctx.strokeStyle = "#ff6b6b";
              ctx.beginPath();
              ctx.moveTo(hx - half + 1 / vp.zoom, hy - half + 1 / vp.zoom);
              ctx.lineTo(hx + half - 1 / vp.zoom, hy + half - 1 / vp.zoom);
              ctx.moveTo(hx + half - 1 / vp.zoom, hy - half + 1 / vp.zoom);
              ctx.lineTo(hx - half + 1 / vp.zoom, hy + half - 1 / vp.zoom);
              ctx.stroke();
              ctx.strokeStyle = "#3fc6ff";
            }
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

          // Live angle badge while rotating the path-point group
          if (rotateAngle != null) {
            const label = `${Math.round(rotateAngle)}°`;
            const offX = 22 / vp.zoom;
            const lx = lcx + offX;
            const ly = ry;
            ctx.save();
            ctx.font = `${Math.max(9, 11 / vp.zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const pad = 5 / vp.zoom;
            const tw = ctx.measureText(label).width;
            const bw = tw + pad * 2;
            const bh = 14 / vp.zoom;
            ctx.fillStyle = "rgba(6, 23, 15, 0.95)";
            ctx.strokeStyle = "#7ee0ff";
            ctx.lineWidth = 1.5 / vp.zoom;
            ctx.beginPath();
            ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 3 / vp.zoom);
            ctx.fill();
            ctx.stroke();
            // small phosphor core
            ctx.fillStyle = "#3fc6ff";
            ctx.beginPath();
            ctx.arc(lx, ly, 1.2 / vp.zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#7ee0ff";
            ctx.fillText(label, lx, ly);
            ctx.restore();
          }

          // Alignment handles: small phosphor circles outward from mid-edges
          const alignOff = 16 / vp.zoom;
          const ar = 5 / vp.zoom;
          const aligns = [
            { x: boxX - alignOff, y: boxY + boxH / 2 },
            { x: boxX + boxW + alignOff, y: boxY + boxH / 2 },
            { x: boxX + boxW / 2, y: boxY - alignOff },
            { x: boxX + boxW / 2, y: boxY + boxH + alignOff },
          ];
          ctx.fillStyle = "#3fc6ff";
          ctx.strokeStyle = "#06170f";
          ctx.lineWidth = 1 / vp.zoom;
          for (const a of aligns) {
            ctx.beginPath();
            ctx.arc(a.x, a.y, ar, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Distribute handles (further out, only when 3+ points): small squares
          if (pathPointSelection.length >= 3) {
            const distOff = 32 / vp.zoom;
            const ds = 6 / vp.zoom;
            const halfDs = ds / 2;
            const dists = [
              { x: boxX - distOff, y: boxY + boxH / 2 }, // left H
              { x: boxX + boxW + distOff, y: boxY + boxH / 2 }, // right H
              { x: boxX + boxW / 2, y: boxY - distOff }, // top V
              { x: boxX + boxW / 2, y: boxY + boxH + distOff }, // bottom V
            ];
            ctx.fillStyle = "#3fc6ff";
            ctx.strokeStyle = "#06170f";
            ctx.lineWidth = 1 / vp.zoom;
            for (const d of dists) {
              ctx.fillRect(d.x - halfDs, d.y - halfDs, ds, ds);
              ctx.strokeRect(d.x - halfDs, d.y - halfDs, ds, ds);
            }
          }

          // Flip handles (further out): small diamonds with reverse arrows; corners are XY
          const flipOff = 48 / vp.zoom;
          const fs = 7 / vp.zoom;
          const flips = [
            { x: boxX - flipOff, y: boxY + boxH / 2, axis: "x" as const },
            { x: boxX + boxW + flipOff, y: boxY + boxH / 2, axis: "x" as const },
            { x: boxX + boxW / 2, y: boxY - flipOff, axis: "y" as const },
            { x: boxX + boxW / 2, y: boxY + boxH + flipOff, axis: "y" as const },
            { x: boxX - flipOff, y: boxY - flipOff, axis: "xy" as const },
            { x: boxX + boxW + flipOff, y: boxY - flipOff, axis: "xy" as const },
            { x: boxX - flipOff, y: boxY + boxH + flipOff, axis: "xy" as const },
            { x: boxX + boxW + flipOff, y: boxY + boxH + flipOff, axis: "xy" as const },
          ];
          ctx.fillStyle = "#3fc6ff";
          ctx.strokeStyle = "#06170f";
          ctx.lineWidth = 1 / vp.zoom;
          for (const f of flips) {
            // diamond
            ctx.beginPath();
            ctx.moveTo(f.x, f.y - fs);
            ctx.lineTo(f.x + fs, f.y);
            ctx.lineTo(f.x, f.y + fs);
            ctx.lineTo(f.x - fs, f.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // simple reverse arrows or X inside
            ctx.strokeStyle = "#06170f";
            ctx.lineWidth = 1.2 / vp.zoom;
            const al = 3.5 / vp.zoom;
            if (f.axis === "x") {
              ctx.beginPath();
              ctx.moveTo(f.x - al, f.y);
              ctx.lineTo(f.x + al, f.y);
              ctx.moveTo(f.x - al + 1.2 / vp.zoom, f.y - 1.5 / vp.zoom);
              ctx.lineTo(f.x - al, f.y);
              ctx.lineTo(f.x - al + 1.2 / vp.zoom, f.y + 1.5 / vp.zoom);
              ctx.moveTo(f.x + al - 1.2 / vp.zoom, f.y - 1.5 / vp.zoom);
              ctx.lineTo(f.x + al, f.y);
              ctx.lineTo(f.x + al - 1.2 / vp.zoom, f.y + 1.5 / vp.zoom);
              ctx.stroke();
            } else if (f.axis === "y") {
              ctx.beginPath();
              ctx.moveTo(f.x, f.y - al);
              ctx.lineTo(f.x, f.y + al);
              ctx.moveTo(f.x - 1.5 / vp.zoom, f.y - al + 1.2 / vp.zoom);
              ctx.lineTo(f.x, f.y - al);
              ctx.lineTo(f.x + 1.5 / vp.zoom, f.y - al + 1.2 / vp.zoom);
              ctx.moveTo(f.x - 1.5 / vp.zoom, f.y + al - 1.2 / vp.zoom);
              ctx.lineTo(f.x, f.y + al);
              ctx.lineTo(f.x + 1.5 / vp.zoom, f.y + al - 1.2 / vp.zoom);
              ctx.stroke();
            } else {
              // XY: small X
              const xl = 2.8 / vp.zoom;
              ctx.beginPath();
              ctx.moveTo(f.x - xl, f.y - xl);
              ctx.lineTo(f.x + xl, f.y + xl);
              ctx.moveTo(f.x + xl, f.y - xl);
              ctx.lineTo(f.x - xl, f.y + xl);
              ctx.stroke();
            }
            ctx.strokeStyle = "#06170f";
            ctx.lineWidth = 1 / vp.zoom;
          }
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


/** Count unique cut marks a knife stroke would make on visible editable paths. */
function knifeCutCount(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  nodes: DesignNode[],
): number {
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of nodes) {
    if (!n.visible || n.locked) continue;
    const ep = asEditablePath(n);
    if (ep && ep.points.length >= 2) paths.push(ep);
  }
  const ordered = preferred
    ? ([paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[])
    : paths;

  const seen = new Set<string>();
  for (const n of ordered) {
    const ep = asEditablePath(n);
    if (!ep) continue;
    const prev = knifeStrokePreview(ep, ax, ay, bx, by);
    for (const m of prev.marks) {
      const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
      seen.add(key);
    }
  }
  return seen.size;
}

function drawKnifeStroke(
  ctx: CanvasRenderingContext2D,
  stroke: { ax: number; ay: number; bx: number; by: number },
  doc: { nodes: DesignNode[] },
  vp: Viewport,
  dpr: number,
) {
  const { ax, ay, bx, by } = stroke;
  const dist = Math.hypot(bx - ax, by - ay);
  if (dist < 1) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);

  // Live cut line
  ctx.strokeStyle = "#3fc6ff";
  ctx.lineWidth = 1.5 / vp.zoom;
  ctx.setLineDash([6 / vp.zoom, 4 / vp.zoom]);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cut marks on paths the stroke crosses
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of doc.nodes) {
    if (!n.visible || n.locked) continue;
    const p = asEditablePath(n);
    if (p && p.points.length >= 2) paths.push(p);
  }
  const ordered = preferred
    ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
    : paths;

  const marks: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const prev = knifeStrokePreview(p, ax, ay, bx, by);
    for (const m of prev.marks) {
      const key = `${m.x.toFixed(1)},${m.y.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      marks.push(m);
    }
  }

  const r = 4 / vp.zoom;
  ctx.fillStyle = "#3fc6ff";
  ctx.strokeStyle = "#06170f";
  ctx.lineWidth = 1 / vp.zoom;
  for (const m of marks) {
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // small cross
    ctx.beginPath();
    ctx.moveTo(m.x - r * 0.7, m.y);
    ctx.lineTo(m.x + r * 0.7, m.y);
    ctx.moveTo(m.x, m.y - r * 0.7);
    ctx.lineTo(m.x, m.y + r * 0.7);
    ctx.stroke();
  }

  // Live path-split preview: ghost outlines of the resulting pieces + multi-lobe labels
  // with a light explode offset that grows with stroke length so pieces separate visually.
  // Pieces are ordered by angle around the cut midpoint and explode with a staggered factor
  // so later pieces push further out (piece-order animation).
  ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
  ctx.lineWidth = 1.25 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  type PieceInfo = {
    worldCx: number;
    worldCy: number;
    piece: { x: number; y: number }[];
    nodeX: number;
    nodeY: number;
    angle: number;
  };
  const allPieces: PieceInfo[] = [];
  const cutMidX = (ax + bx) / 2;
  const cutMidY = (ay + by) / 2;
  const baseExplode = Math.min(22 / vp.zoom, Math.max(0, dist - 8) * 0.18);
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const pieces = knifeSplitPieces(p, ax, ay, bx, by);
    for (const piece of pieces) {
      if (piece.length < 2) continue;
      let sx = 0, sy = 0;
      for (const pt of piece) {
        sx += pt.x; sy += pt.y;
      }
      const cnt = piece.length;
      const localCx = sx / cnt;
      const localCy = sy / cnt;
      const worldCx = n.x + localCx;
      const worldCy = n.y + localCy;
      const ang = Math.atan2(worldCy - cutMidY, worldCx - cutMidX);
      allPieces.push({
        worldCx,
        worldCy,
        piece,
        nodeX: n.x,
        nodeY: n.y,
        angle: ang,
      });
    }
  }
  // Order pieces angularly around the cut so labels feel sequential
  allPieces.sort((a, b) => a.angle - b.angle);
  const labeled: { cx: number; cy: number; ox: number; oy: number; label: string }[] = [];
  allPieces.forEach((info, idx) => {
    const stagger = allPieces.length > 1 ? 0.65 + 0.55 * (idx / Math.max(1, allPieces.length - 1)) : 1;
    const explode = baseExplode * stagger;
    let ox = 0, oy = 0;
    if (explode > 0.5) {
      const dx = info.worldCx - cutMidX;
      const dy = info.worldCy - cutMidY;
      const len = Math.hypot(dx, dy) || 1;
      ox = (dx / len) * explode;
      oy = (dy / len) * explode;
    }
    ctx.beginPath();
    const first = info.piece[0]!;
    ctx.moveTo(info.nodeX + first.x + ox, info.nodeY + first.y + oy);
    for (let i = 1; i < info.piece.length; i++) {
      const pt = info.piece[i]!;
      ctx.lineTo(info.nodeX + pt.x + ox, info.nodeY + pt.y + oy);
    }
    ctx.stroke();
    labeled.push({
      cx: info.worldCx,
      cy: info.worldCy,
      ox,
      oy,
      label: String(idx + 1),
    });
  });
  ctx.setLineDash([]);

  // Phosphor piece labels when a drag produces multiple pieces (multi-lobe or multi-cut)
  if (labeled.length > 1) {
    ctx.font = `${Math.max(10, 12 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const lab of labeled) {
      const lx = lab.cx + lab.ox;
      const ly = lab.cy + lab.oy;
      // faint original-to-exploded connector
      if (Math.hypot(lab.ox, lab.oy) > 2 / vp.zoom) {
        ctx.strokeStyle = "rgba(63, 198, 255, 0.35)";
        ctx.lineWidth = 0.75 / vp.zoom;
        ctx.setLineDash([2 / vp.zoom, 2 / vp.zoom]);
        ctx.beginPath();
        ctx.moveTo(lab.cx, lab.cy);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      const pad = 6 / vp.zoom;
      const tw = ctx.measureText(lab.label).width;
      const bw = tw + pad * 2;
      const bh = 16 / vp.zoom;
      ctx.fillStyle = "rgba(6, 23, 15, 0.88)";
      ctx.strokeStyle = "#3fc6ff";
      ctx.lineWidth = 1.25 / vp.zoom;
      ctx.beginPath();
      ctx.roundRect(lx - bw / 2, ly - bh / 2, bw, bh, 4 / vp.zoom);
      ctx.fill();
      ctx.stroke();
      // small phosphor core
      ctx.fillStyle = "#3fc6ff";
      ctx.beginPath();
      ctx.arc(lx, ly, 1.5 / vp.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(lab.label, lx, ly);
    }
  }

  ctx.restore();
}

function drawKnifeHover(
  ctx: CanvasRenderingContext2D,
  mark: { x: number; y: number },
  doc: { nodes: DesignNode[] },
  vp: Viewport,
  dpr: number,
) {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(vp.x, vp.y);
  ctx.scale(vp.zoom, vp.zoom);

  const r = 5 / vp.zoom;
  ctx.fillStyle = "rgba(63, 198, 255, 0.35)";
  ctx.strokeStyle = "#3fc6ff";
  ctx.lineWidth = 1.25 / vp.zoom;
  ctx.beginPath();
  ctx.arc(mark.x, mark.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // small cross
  ctx.beginPath();
  ctx.moveTo(mark.x - r * 0.8, mark.y);
  ctx.lineTo(mark.x + r * 0.8, mark.y);
  ctx.moveTo(mark.x, mark.y - r * 0.8);
  ctx.lineTo(mark.x, mark.y + r * 0.8);
  ctx.stroke();

  // Single-split ghost outlines for the point cut, ordered by angle with light staggered explode
  const preferred = useDesign.getState().selection[0];
  const paths: DesignNode[] = [];
  for (const n of doc.nodes) {
    if (!n.visible || n.locked) continue;
    const p = asEditablePath(n);
    if (p && p.points.length >= 2) paths.push(p);
  }
  const ordered = preferred
    ? [paths.find((n) => n.id === preferred), ...paths.filter((n) => n.id !== preferred)].filter(Boolean) as DesignNode[]
    : paths;

  ctx.strokeStyle = "rgba(63, 198, 255, 0.55)";
  ctx.lineWidth = 1.25 / vp.zoom;
  ctx.setLineDash([3 / vp.zoom, 3 / vp.zoom]);
  type HoverPiece = {
    worldCx: number;
    worldCy: number;
    piece: { x: number; y: number }[];
    nodeX: number;
    nodeY: number;
    angle: number;
  };
  const hoverPieces: HoverPiece[] = [];
  for (const n of ordered) {
    const p = asEditablePath(n);
    if (!p) continue;
    const local = pathWorldToLocal(p, mark.x, mark.y);
    const pieces = knifePointSplitPieces(p, local.x, local.y, vp.zoom);
    for (const piece of pieces) {
      if (piece.length < 2) continue;
      let sx = 0, sy = 0;
      for (const pt of piece) { sx += pt.x; sy += pt.y; }
      const cnt = piece.length;
      const worldCx = n.x + sx / cnt;
      const worldCy = n.y + sy / cnt;
      const ang = Math.atan2(worldCy - mark.y, worldCx - mark.x);
      hoverPieces.push({
        worldCx,
        worldCy,
        piece,
        nodeX: n.x,
        nodeY: n.y,
        angle: ang,
      });
    }
  }
  hoverPieces.sort((a, b) => a.angle - b.angle);
  const hoverLabeled: { cx: number; cy: number; label: string }[] = [];
  hoverPieces.forEach((info, idx) => {
    const stagger = hoverPieces.length > 1 ? 0.7 + 0.5 * (idx / Math.max(1, hoverPieces.length - 1)) : 1;
    let ox = 0, oy = 0;
    if (hoverPieces.length > 1) {
      const dx = info.worldCx - mark.x;
      const dy = info.worldCy - mark.y;
      const len = Math.hypot(dx, dy) || 1;
      const e = (10 / vp.zoom) * stagger;
      ox = (dx / len) * e;
      oy = (dy / len) * e;
    }
    ctx.beginPath();
    const first = info.piece[0]!;
    ctx.moveTo(info.nodeX + first.x + ox, info.nodeY + first.y + oy);
    for (let i = 1; i < info.piece.length; i++) {
      const pt = info.piece[i]!;
      ctx.lineTo(info.nodeX + pt.x + ox, info.nodeY + pt.y + oy);
    }
    ctx.stroke();
    hoverLabeled.push({ cx: info.worldCx + ox, cy: info.worldCy + oy, label: String(idx + 1) });
  });
  ctx.setLineDash([]);

  if (hoverLabeled.length > 1) {
    ctx.font = `${Math.max(9, 11 / vp.zoom)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const lab of hoverLabeled) {
      const pad = 5 / vp.zoom;
      const tw = ctx.measureText(lab.label).width;
      const bw = tw + pad * 2;
      const bh = 14 / vp.zoom;
      ctx.fillStyle = "rgba(6, 23, 15, 0.82)";
      ctx.strokeStyle = "#3fc6ff";
      ctx.lineWidth = 1 / vp.zoom;
      ctx.beginPath();
      ctx.roundRect(lab.cx - bw / 2, lab.cy - bh / 2, bw, bh, 3 / vp.zoom);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#3fc6ff";
      ctx.fillText(lab.label, lab.cx, lab.cy);
    }
  }

  ctx.restore();
}
