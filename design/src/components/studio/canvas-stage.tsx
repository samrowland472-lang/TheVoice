import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDesign } from "@/lib/design/store";
import { drawDocument, screenToDoc } from "@/lib/design/render";
import { knifeCutStroke, knifeCutAt } from "@/lib/design/path-actions";
import { knifeStrokePreview, knifePreviewPoint } from "@/lib/design/path-cut";
import { setStudioStatus, holdStudioStatus, releaseStudioStatus } from "@/lib/design/studio-status";
import { hitTop } from "@/lib/design/hit";
import { nodeBounds } from "@/lib/design/layer-groups";
import type { DesignNode, PathNode, Viewport } from "@/lib/design/types";
import { isPath } from "@/lib/design/types";

type ResidualMark = { x: number; y: number; born: number };

function isPathNode(n: DesignNode): n is PathNode {
  return isPath(n);
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
  const [hoverMark, setHoverMark] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

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

    if (hoverMark) drawMark(hoverMark.x, hoverMark.y);
    for (const m of dragRef.current.marks) drawMark(m.x, m.y, true);
  }, [doc, viewport, size, statusTick, hoverMark, tool, selection]);

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
      const hit = hitTop(doc.nodes, w.x, w.y);
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      if (hit) {
        select([hit.id], additive);
        setStudioStatus(additive ? "Selection updated" : `Selected ${hit.kind}`);
      } else if (!additive) {
        select([], false);
        setStudioStatus("Selection cleared");
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

    if (tool === "knife") {
      if (dragRef.current.start) {
        const a = dragRef.current.start;
        const b = w;
        const preview = knifeStrokePreview(
          doc.nodes.find((n) => isPathNode(n) && selection.includes(n.id)) as PathNode || (doc.nodes.find(isPathNode) as PathNode),
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
      style={{ cursor: tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair" }}
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
