import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDesign } from "@/lib/design/store";
import { drawDocument, screenToDoc } from "@/lib/design/render";
import { knifeCutStroke, knifeCutAt } from "@/lib/design/path-actions";
import { knifeStrokePreview, knifePreviewPoint } from "@/lib/design/path-cut";
import { setStudioStatus, holdStudioStatus, releaseStudioStatus } from "@/lib/design/studio-status";
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
  const [hoverMark, setHoverMark] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const tool = useDesign((s) => s.tool);
  const selection = useDesign((s) => s.selection);

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

    if (hoverMark) drawMark(hoverMark.x, hoverMark.y);
    for (const m of dragRef.current.marks) drawMark(m.x, m.y, true);
  }, [doc, viewport, size, statusTick, hoverMark, tool]);

  const localFromEvent = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!doc || tool !== "knife") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = localFromEvent(e);
    const w = screenToDoc(p.x, p.y, viewport);
    dragRef.current = { start: w, last: w, marks: [] };
    setHoverMark(null);
    releaseStudioStatus();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!doc) return;
    const p = localFromEvent(e);
    const w = screenToDoc(p.x, p.y, viewport);
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

  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center text-ink-dim font-mono text-xs">
        No document
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#0b0f0c]">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
