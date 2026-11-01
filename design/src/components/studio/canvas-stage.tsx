import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDesign } from "@/lib/design/store";
import { drawDocument, screenToDoc } from "@/lib/design/render";
import { knifeCutStroke, knifeCutAt } from "@/lib/design/path-actions";
import { knifeStrokePreview, knifePreviewPoint } from "@/lib/design/path-cut";
import { setStudioStatus, holdStudioStatus, releaseStudioStatus } from "@/lib/design/studio-status";
import { hitTop } from "@/lib/design/hit";
import { nodeBounds } from "@/lib/design/layer-groups";
import { nodesInMarquee } from "@/lib/design/marquee-nodes";
import { nodeWorldAabb, smartSnap, type GuideSet } from "@/lib/design/snap";
import { expandMovePlaces, scaleNodeInFrame, groupTransformIds, groupBox } from "@/lib/design/group-transform";
import { hitResizeHandle, resizeBox, mapNodeToBox, type ResizeHandle, type Box } from "@/lib/design/box-resize";
import type { DesignNode, PathNode, Viewport } from "@/lib/design/types";
import { isPath, isGroup } from "@/lib/design/types";

type ResidualMark = { x: number; y: number; born: number };

type MarqueeState = {
  start: { x: number; y: number };
  current: { x: number; y: number };
  contain: boolean;
  additive: boolean;
};

function isPathNode(n: DesignNode): n is PathNode {
  return isPath(n);
}

function marqueeBox(a: { x: number; y: number }, b: { x: number; y: number }) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x);
  const h = Math.abs(b.y - a.y);
  return { x, y, w, h };
}

export default function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const residualRef = useRef<ResidualMark[]>([]);
  const dragRef = useRef<{ start: { x: number; y: number } | null; last: { x: number; y: number } | null; marks: { x: number; y: number }[] }>({
    start: null,
    last: null,
    marks: [],
  });
  const panRef = useRef<{ startX: number; startY: number; vx: number; vy: number } | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);
  const moveRef = useRef<{
    start: { x: number; y: number };
    originals: { id: string; x: number; y: number }[];
    committed: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    handle: ResizeHandle;
    originalBox: Box;
    committed: boolean;
  } | null>(null);
  const [hoverMark, setHoverMark] = useState<{ x: number; y: number } | null>(null);
  const [marqueeTick, setMarqueeTick] = useState(0);
  const [liveGuides, setLiveGuides] = useState<GuideSet | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoverCursor, setHoverCursor] = useState<string | null>(null);

  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const tool = useDesign((s) => s.tool);
  const selection = useDesign((s) => s.selection);
  const select = useDesign((s) => s.select);
  const setViewport = useDesign((s) => s.setViewport);

  const statusTick = useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 32);
      return () => clearInterval(id);
    },
    () => Date.now(),
    () => Date.now(),
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !doc) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawDocument(ctx, doc, { viewport, dpr });

    // Residual knife marks that linger
    const now = Date.now();
    const live = residualRef.current.filter((m) => now - m.born < 1600);
    residualRef.current = live;
    for (const m of live) {
      const age = (now - m.born) / 1600;
      const a = 1 - age;
      const sx = m.x * viewport.zoom + viewport.x;
      const sy = m.y * viewport.zoom + viewport.y;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = "#c8f7c5";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#c8f7c5";
      ctx.shadowBlur = 8 * a;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy);
      ctx.lineTo(sx + 6, sy);
      ctx.moveTo(sx, sy - 6);
      ctx.lineTo(sx, sy + 6);
      ctx.stroke();
      ctx.restore();
    }

    // Live hover / drag marks
    const drawMark = (wx: number, wy: number, strong = false) => {
      const sx = wx * viewport.zoom + viewport.x;
      const sy = wy * viewport.zoom + viewport.y;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = strong ? 0.95 : 0.55;
      ctx.strokeStyle = "#e8ffe6";
      ctx.lineWidth = strong ? 1.8 : 1.2;
      ctx.shadowColor = "#c8f7c5";
      ctx.shadowBlur = strong ? 10 : 4;
      ctx.beginPath();
      ctx.moveTo(sx - 7, sy);
      ctx.lineTo(sx + 7, sy);
      ctx.moveTo(sx, sy - 7);
      ctx.lineTo(sx, sy + 7);
      ctx.stroke();
      ctx.restore();
    };

    // Selection outlines (phosphor)
    if (selection.length && doc) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = "#c8f7c5";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#c8f7c5";
      ctx.shadowBlur = 6;
      for (const id of selection) {
        const n = doc.nodes.find((nn) => nn.id === id);
        if (!n) continue;
        const b = nodeBounds(n);
        const sx = b.x * viewport.zoom + viewport.x;
        const sy = b.y * viewport.zoom + viewport.y;
        const sw = b.w * viewport.zoom;
        const sh = b.h * viewport.zoom;
        ctx.strokeRect(sx - 1, sy - 1, sw + 2, sh + 2);
      }
      ctx.restore();
    }

    // Resize handles (phosphor squares on selected layers)
    if (tool === "select" && selection.length && doc && !moveRef.current && !resizeRef.current) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hs = 5; // screen px half-ish
      for (const id of selection) {
        const n = doc.nodes.find((nn) => nn.id === id);
        if (!n || n.locked) continue;
        const b = n.kind === "group" ? (groupBox(doc.nodes, id) || nodeBounds(n)) : nodeBounds(n);
        for (const h of ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const) {
          const pt = (() => {
            const midX = b.x + b.w / 2;
            const midY = b.y + b.h / 2;
            const right = b.x + b.w;
            const bottom = b.y + b.h;
            switch (h) {
              case "nw": return { x: b.x, y: b.y };
              case "n": return { x: midX, y: b.y };
              case "ne": return { x: right, y: b.y };
              case "e": return { x: right, y: midY };
              case "se": return { x: right, y: bottom };
              case "s": return { x: midX, y: bottom };
              case "sw": return { x: b.x, y: bottom };
              case "w": return { x: b.x, y: midY };
            }
          })();
          const sx = pt.x * viewport.zoom + viewport.x;
          const sy = pt.y * viewport.zoom + viewport.y;
          ctx.fillStyle = "#0b0f0c";
          ctx.strokeStyle = "#c8f7c5";
          ctx.lineWidth = 1.4;
          ctx.shadowColor = "#c8f7c5";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.rect(sx - hs / 2, sy - hs / 2, hs, hs);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Live marquee rectangle + optional contain corner ticks
    const mq = marqueeRef.current;
    if (mq) {
      const box = marqueeBox(mq.start, mq.current);
      const sx = box.x * viewport.zoom + viewport.x;
      const sy = box.y * viewport.zoom + viewport.y;
      const sw = box.w * viewport.zoom;
      const sh = box.h * viewport.zoom;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = mq.contain ? "rgba(200,247,197,0.95)" : "rgba(200,247,197,0.75)";
      ctx.fillStyle = mq.contain ? "rgba(200,247,197,0.12)" : "rgba(200,247,197,0.08)";
      ctx.lineWidth = 1.25;
      ctx.shadowColor = "#c8f7c5";
      ctx.shadowBlur = 4;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);
      if (mq.contain) {
        // Corner ticks for contain mode
        const t = 7;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        // NW
        ctx.moveTo(sx, sy + t);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + t, sy);
        // NE
        ctx.moveTo(sx + sw - t, sy);
        ctx.lineTo(sx + sw, sy);
        ctx.lineTo(sx + sw, sy + t);
        // SE
        ctx.moveTo(sx + sw, sy + sh - t);
        ctx.lineTo(sx + sw, sy + sh);
        ctx.lineTo(sx + sw - t, sy + sh);
        // SW
        ctx.moveTo(sx + t, sy + sh);
        ctx.lineTo(sx, sy + sh);
        ctx.lineTo(sx, sy + sh - t);
        ctx.stroke();
      }
      // Preview outlines for nodes under marquee
      const mode = mq.contain ? "contain" : "intersect";
      const ids = nodesInMarquee(doc.nodes, box, mode);
      ctx.shadowBlur = 3;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(232,255,230,0.7)";
      for (const id of ids) {
        const n = doc.nodes.find((nn) => nn.id === id);
        if (!n) continue;
        const b = nodeWorldAabb(n);
        const px = b.x * viewport.zoom + viewport.x;
        const py = b.y * viewport.zoom + viewport.y;
        ctx.strokeRect(px - 0.5, py - 0.5, b.w * viewport.zoom + 1, b.h * viewport.zoom + 1);
      }
      ctx.restore();
    }

    // Live smart-guide lines while dragging selected layers
    if (liveGuides && doc) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = "rgba(200,247,197,0.85)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "#c8f7c5";
      ctx.shadowBlur = 6;
      ctx.setLineDash([4, 3]);
      for (const gx of liveGuides.x) {
        const sx = gx * viewport.zoom + viewport.x;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, size.h);
        ctx.stroke();
      }
      for (const gy of liveGuides.y) {
        const sy = gy * viewport.zoom + viewport.y;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(size.w, sy);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (hoverMark) drawMark(hoverMark.x, hoverMark.y);
    for (const m of dragRef.current.marks) drawMark(m.x, m.y, true);
  }, [doc, viewport, size, statusTick, hoverMark, tool, selection, marqueeTick, liveGuides]);

  const localFromEvent = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!doc) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = localFromEvent(e);
    const w = screenToDoc(p.x, p.y, viewport);

    if (tool === "knife") {
      dragRef.current = { start: w, last: w, marks: [] };
      setHoverMark(null);
      releaseStudioStatus();
      return;
    }

    if (tool === "hand") {
      panRef.current = { startX: e.clientX, startY: e.clientY, vx: viewport.x, vy: viewport.y };
      return;
    }

    if (tool === "select") {
      // Prefer resize handles on the current selection
      let handleHit: { id: string; handle: ResizeHandle; box: Box } | null = null;
      for (const id of [...selection].reverse()) {
        const n = doc.nodes.find((nn) => nn.id === id);
        if (!n || n.locked) continue;
        const b = n.kind === "group" ? (groupBox(doc.nodes, id) || nodeBounds(n)) : nodeBounds(n);
        const h = hitResizeHandle(b, w.x, w.y, viewport.zoom);
        if (h) {
          handleHit = { id, handle: h, box: b };
          break;
        }
      }
      if (handleHit) {
        resizeRef.current = {
          id: handleHit.id,
          handle: handleHit.handle,
          originalBox: { ...handleHit.box },
          committed: false,
        };
        moveRef.current = null;
        marqueeRef.current = null;
        setLiveGuides(null);
        setStudioStatus("Drag handle to resize · Shift locks aspect · smart guides");
        return;
      }

      const hit = hitTop(doc.nodes, w.x, w.y);
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (hit) {
        const already = selection.includes(hit.id);
        if (additive) {
          select([hit.id], true);
        } else if (!already) {
          select([hit.id], false);
        }
        // Start a move of the (possibly updated) selection
        const sel = useDesign.getState().selection;
        const originals = doc.nodes
          .filter((n) => sel.includes(n.id))
          .map((n) => ({ id: n.id, x: n.x, y: n.y }));
        moveRef.current = { start: w, originals, committed: false };
        marqueeRef.current = null;
        setLiveGuides(null);
        setStudioStatus(additive ? "Selection updated · drag to move" : already ? "Drag to move · smart guides" : `Selected ${hit.kind} · drag to move`);
      } else {
        // Start pasteboard marquee
        marqueeRef.current = {
          start: w,
          current: w,
          contain: e.altKey,
          additive,
        };
        setMarqueeTick((t) => t + 1);
        setStudioStatus(
          additive
            ? "Marquee · Shift add · Alt contain"
            : "Drag empty board to marquee · Shift add · click empty clears",
        );
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!doc) return;
    const p = localFromEvent(e);
    const w = screenToDoc(p.x, p.y, viewport);

    if (tool === "hand" && panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setViewport({ x: panRef.current.vx + dx, y: panRef.current.vy + dy });
      return;
    }

    // Hover cursor for resize handles
    if (tool === "select" && !resizeRef.current && !moveRef.current && !marqueeRef.current && selection.length) {
      let cur: string | null = null;
      for (const id of [...selection].reverse()) {
        const n = doc.nodes.find((nn) => nn.id === id);
        if (!n || n.locked) continue;
        const b = n.kind === "group" ? (groupBox(doc.nodes, id) || nodeBounds(n)) : nodeBounds(n);
        const h = hitResizeHandle(b, w.x, w.y, viewport.zoom);
        if (h) {
          cur =
            h === "nw" || h === "se"
              ? "nwse-resize"
              : h === "ne" || h === "sw"
                ? "nesw-resize"
                : h === "n" || h === "s"
                  ? "ns-resize"
                  : "ew-resize";
          break;
        }
      }
      if (cur !== hoverCursor) setHoverCursor(cur);
    } else if (hoverCursor) {
      setHoverCursor(null);
    }

    if (tool === "select" && resizeRef.current) {
      const rz = resizeRef.current;
      const raw = resizeBox(rz.originalBox, rz.handle, w.x, w.y, e.shiftKey);
      // Smart snap the active edges
      const others = doc.nodes
        .filter((n) => n.visible && n.id !== rz.id && !groupTransformIds(doc.nodes, rz.id).includes(n.id))
        .map(nodeWorldAabb);
      const artboard = { width: doc.width, height: doc.height };
      const thresh = Math.max(2, 7 / Math.max(0.25, viewport.zoom));
      const candsX = [0, artboard.width / 2, artboard.width];
      const candsY = [0, artboard.height / 2, artboard.height];
      for (const o of others) {
        candsX.push(o.x, o.x + o.w / 2, o.x + o.w);
        candsY.push(o.y, o.y + o.h / 2, o.y + o.h);
      }
      let { x, y, w: bw, h: bh } = raw;
      const guides: GuideSet = { x: [], y: [] };
      const snapSide = (val: number, cands: number[]) => {
        let best = Infinity;
        let to = val;
        for (const c of cands) {
          const d = Math.abs(val - c);
          if (d < best && d < thresh) {
            best = d;
            to = c;
          }
        }
        return best < thresh ? to : null;
      };
      if (rz.handle.includes("w")) {
        const s = snapSide(x, candsX);
        if (s != null) {
          const dx = s - x;
          x += dx;
          bw -= dx;
          guides.x.push(s);
        }
      }
      if (rz.handle.includes("e")) {
        const right = x + bw;
        const s = snapSide(right, candsX);
        if (s != null) {
          bw = s - x;
          guides.x.push(s);
        }
      }
      if (rz.handle.includes("n")) {
        const s = snapSide(y, candsY);
        if (s != null) {
          const dy = s - y;
          y += dy;
          bh -= dy;
          guides.y.push(s);
        }
      }
      if (rz.handle.includes("s")) {
        const bottom = y + bh;
        const s = snapSide(bottom, candsY);
        if (s != null) {
          bh = s - y;
          guides.y.push(s);
        }
      }
      // Also snap centers when mid-edge handles are used
      if (rz.handle === "n" || rz.handle === "s") {
        const mid = x + bw / 2;
        const s = snapSide(mid, candsX);
        if (s != null && guides.x.length === 0) {
          const dx = s - mid;
          x += dx;
          guides.x.push(s);
        }
      }
      if (rz.handle === "e" || rz.handle === "w") {
        const mid = y + bh / 2;
        const s = snapSide(mid, candsY);
        if (s != null && guides.y.length === 0) {
          const dy = s - mid;
          y += dy;
          guides.y.push(s);
        }
      }
      bw = Math.max(1, bw);
      bh = Math.max(1, bh);
      const toBox: Box = { x, y, w: bw, h: bh };
      if (!rz.committed && (Math.abs(w.x - rz.originalBox.x) > 0.4 || Math.abs(w.y - rz.originalBox.y) > 0.4 || Math.abs(bw - rz.originalBox.w) > 0.4 || Math.abs(bh - rz.originalBox.h) > 0.4)) {
        useDesign.getState().commit();
        rz.committed = true;
      }
      const st = useDesign.getState();
      const target = st.doc.nodes.find((nn) => nn.id === rz.id);
      if (target && isGroup(target)) {
        const ids = groupTransformIds(st.doc.nodes, rz.id);
        st.mapNodes(
          ids,
          (n) => {
            if (n.id === rz.id) return { ...n, x: toBox.x, y: toBox.y, w: toBox.w, h: toBox.h };
            return scaleNodeInFrame(n, rz.originalBox, toBox);
          },
          false,
        );
      } else {
        st.mapNodes(
          [rz.id],
          (n) => mapNodeToBox(n, rz.originalBox, toBox),
          false,
        );
      }
      setLiveGuides(guides.x.length || guides.y.length ? guides : null);
      const snapped = guides.x.length > 0 || guides.y.length > 0;
      setStudioStatus(
        snapped
          ? `Resize · snapped · ${bw.toFixed(0)} × ${bh.toFixed(0)}`
          : `Resize · ${bw.toFixed(0)} × ${bh.toFixed(0)}`,
      );
      setMarqueeTick((t) => t + 1);
      return;
    }

    if (tool === "select" && moveRef.current) {
      const mv = moveRef.current;
      const rawDx = w.x - mv.start.x;
      const rawDy = w.y - mv.start.y;
      if (!mv.committed && (Math.abs(rawDx) > 0.4 || Math.abs(rawDy) > 0.4)) {
        useDesign.getState().commit();
        mv.committed = true;
      }
      // Proposed positions after raw drag
      const byId = new Map(doc.nodes.map((n) => [n.id, n]));
      const proposedMoving: DesignNode[] = [];
      for (const o of mv.originals) {
        const n = byId.get(o.id);
        if (!n) continue;
        proposedMoving.push({ ...n, x: o.x + rawDx, y: o.y + rawDy } as DesignNode);
      }
      const others = doc.nodes.filter((n) => !mv.originals.some((o) => o.id === n.id));
      const artboard = { width: doc.width, height: doc.height };
      const thresh = Math.max(2, 7 / Math.max(0.25, viewport.zoom));
      const { dx, dy, guides } = smartSnap(proposedMoving, others, artboard, thresh);
      const finalDx = rawDx + dx;
      const finalDy = rawDy + dy;
      const places = mv.originals.map((o) => ({ id: o.id, x: o.x + finalDx, y: o.y + finalDy }));
      const expanded = expandMovePlaces(doc.nodes, places);
      const placeMap = new Map(expanded.map((pl) => [pl.id, pl]));
      useDesign.getState().mapNodes(
        expanded.map((pl) => pl.id),
        (n) => {
          const pl = placeMap.get(n.id);
          return pl ? { ...n, x: pl.x, y: pl.y } : n;
        },
        false,
      );
      setLiveGuides(guides.x.length || guides.y.length ? guides : null);
      const snapped = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
      setStudioStatus(
        snapped
          ? `Move · snapped · Δ ${finalDx.toFixed(1)}, ${finalDy.toFixed(1)}`
          : `Move · Δ ${finalDx.toFixed(1)}, ${finalDy.toFixed(1)}`,
      );
      setMarqueeTick((t) => t + 1);
      return;
    }

    if (tool === "select" && marqueeRef.current) {
      const mq = marqueeRef.current;
      mq.current = w;
      mq.contain = e.altKey;
      const box = marqueeBox(mq.start, mq.current);
      const mode = mq.contain ? "contain" : "intersect";
      const ids = nodesInMarquee(doc.nodes, box, mode);
      const label = mq.contain ? "Alt contain" : "intersect";
      setStudioStatus(
        ids.length
          ? `Marquee · ${ids.length} layer${ids.length === 1 ? "" : "s"} · ${label}`
          : `Marquee · empty · ${label}`,
      );
      setMarqueeTick((t) => t + 1);
      return;
    }

    if (tool === "knife") {
      if (dragRef.current.start) {
        const a = dragRef.current.start;
        const b = w;
        const preview = knifeStrokePreview(
          (doc.nodes.find((n) => isPathNode(n) && selection.includes(n.id)) as PathNode) ||
            (doc.nodes.find(isPathNode) as PathNode),
          a.x,
          a.y,
          b.x,
          b.y,
        );
        // Fallback to all paths if no selection
        let marks = preview?.marks ?? [];
        if (!marks.length) {
          for (const n of doc.nodes) {
            if (!isPathNode(n)) continue;
            const pr = knifeStrokePreview(n, a.x, a.y, b.x, b.y);
            marks = marks.concat(pr.marks);
          }
        }
        dragRef.current.marks = marks;
        const pathCount = new Set(marks.map(() => 1)).size || 1;
        setStudioStatus(`Knife · ${marks.length} cut${marks.length === 1 ? "" : "s"} across ${pathCount} path${pathCount === 1 ? "" : "s"}`);
      } else {
        // Hover snap
        let best: { x: number; y: number } | null = null;
        for (const n of doc.nodes) {
          if (!isPathNode(n)) continue;
          const pt = knifePreviewPoint(n, w.x - n.x, w.y - n.y, viewport.zoom);
          if (pt) {
            best = { x: n.x + pt.x, y: n.y + pt.y };
            break;
          }
        }
        setHoverMark(best);
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (panRef.current) {
      panRef.current = null;
    }

    if (tool === "select" && marqueeRef.current && doc) {
      const mq = marqueeRef.current;
      mq.contain = e.altKey;
      const box = marqueeBox(mq.start, mq.current);
      const moved = box.w > 2 / viewport.zoom || box.h > 2 / viewport.zoom;
      if (moved) {
        const mode = mq.contain ? "contain" : "intersect";
        const ids = nodesInMarquee(doc.nodes, box, mode);
        select(ids, mq.additive);
        holdStudioStatus(
          ids.length
            ? `Marquee · ${ids.length} selected${mq.contain ? " · contain" : ""}`
            : "Marquee · none",
        );
      } else if (!mq.additive) {
        select([], false);
        holdStudioStatus("Selection cleared");
      }
      marqueeRef.current = null;
      setMarqueeTick((t) => t + 1);
      return;
    }

    if (resizeRef.current) {
      const rz = resizeRef.current;
      resizeRef.current = null;
      setLiveGuides(null);
      setMarqueeTick((t) => t + 1);
      if (rz.committed) {
        holdStudioStatus("Layer resized");
      }
      return;
    }

    if (moveRef.current) {
      const mv = moveRef.current;
      moveRef.current = null;
      setLiveGuides(null);
      setMarqueeTick((t) => t + 1);
      if (mv.committed) {
        holdStudioStatus("Layer moved");
      }
      return;
    }

    if (!doc || tool !== "knife") return;
    const p = localFromEvent(e);
    const w = screenToDoc(p.x, p.y, viewport);
    const start = dragRef.current.start;
    dragRef.current.start = null;
    const marks = dragRef.current.marks;
    dragRef.current.marks = [];
    setHoverMark(null);

    let ok = false;
    if (start) {
      ok = knifeCutStroke(start.x, start.y, w.x, w.y, viewport.zoom);
    } else {
      ok = knifeCutAt(w.x, w.y, viewport.zoom);
    }

    if (ok && marks.length) {
      const now = Date.now();
      for (const m of marks) residualRef.current.push({ ...m, born: now });
      holdStudioStatus("Path cut");
    } else {
      holdStudioStatus("Knife · no cut");
    }
    // force redraw
    residualRef.current = [...residualRef.current];
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!doc) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nextZoom = Math.min(8, Math.max(0.05, viewport.zoom * factor));
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    // Zoom toward cursor
    const wx = (sx - viewport.x) / viewport.zoom;
    const wy = (sy - viewport.y) / viewport.zoom;
    const nx = sx - wx * nextZoom;
    const ny = sy - wy * nextZoom;
    setViewport({ zoom: nextZoom, x: nx, y: ny });
  };

  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center text-ink-dim font-mono text-xs">
        No document
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0b0f0c]"
      style={{ cursor: hoverCursor || (tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair") }}
    >
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
