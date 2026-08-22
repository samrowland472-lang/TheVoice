import { useCallback, useEffect, useRef, useState } from "react";
import { BRUSHES, brushById, mirrorPoints, strokeSegment } from "@/lib/design/brushes";
import { applyHandle, hitHandle, hitTop, type Handle } from "@/lib/design/hit";
import { imageNode, pathNode } from "@/lib/design/node-factory";
import { docToScreen, drawDocument, fitViewport, getCachedImage, screenToDoc } from "@/lib/design/render";
import { rectsIntersect, smartSnap } from "@/lib/design/snap";
import { ensurePaintLayer, makeShape, makeText, useDesign } from "@/lib/design/store";
import { snap } from "@/lib/design/geometry";
import { safeInsets } from "@/lib/design/formats";
import type { DesignNode, Tool } from "@/lib/design/types";
import { CanvasMenu, type MenuItem } from "./canvas-menu";

const SHAPE_TOOLS: Tool[] = ["rect", "ellipse", "line", "polygon", "star", "arrow", "frame"];
const RULER = 22;

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const n = raw / p;
  if (n < 2) return p;
  if (n < 5) return 2 * p;
  return 5 * p;
}

function hitManualGuide(
  p: { x: number; y: number },
  guides: { id: string; axis: "x" | "y"; pos: number }[],
  viewport: { x: number; y: number; zoom: number },
) {
  return guides.find((g) => {
    if (g.axis === "x") return Math.abs(p.x - (viewport.x + g.pos * viewport.zoom)) < 6 && p.y > RULER;
    return Math.abs(p.y - (viewport.y + g.pos * viewport.zoom)) < 6 && p.x > RULER;
  });
}

export function CanvasStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const guidesRef = useRef<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const marqueeRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const penHoverRef = useRef<{ x: number; y: number } | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{
    mode: "pan" | "move" | "handle" | "create" | "paint" | "pen" | "marquee" | "guide";
    handle?: Handle;
    sx: number;
    sy: number;
    lx: number;
    ly: number;
    start?: DesignNode;
    created?: string;
    space?: boolean;
    orig?: { id: string; x: number; y: number }[];
    guideId?: string;
    guideAxis?: "x" | "y";
  } | null>(null);

  const redraw = useCallback(() => {
    const main = mainRef.current;
    const overlay = overlayRef.current;
    const wrap = wrapRef.current;
    const { doc, viewport, selection, grid, rulers, tool, safeArea } = useDesign.getState();
    if (!main || !overlay || !wrap || !doc) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [main, overlay]) {
      if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
    }
    const mctx = main.getContext("2d");
    const octx = overlay.getContext("2d");
    if (!mctx || !octx) return;
    drawDocument(mctx, doc, viewport, { dpr });

    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, w, h);
    octx.save();
    octx.translate(viewport.x, viewport.y);
    octx.scale(viewport.zoom, viewport.zoom);

    if (grid) {
      octx.strokeStyle = "rgba(63,198,255,0.08)";
      octx.lineWidth = 1 / viewport.zoom;
      const step = 40;
      for (let x = 0; x <= doc.artboard.width; x += step) {
        octx.beginPath();
        octx.moveTo(x, 0);
        octx.lineTo(x, doc.artboard.height);
        octx.stroke();
      }
      for (let y = 0; y <= doc.artboard.height; y += step) {
        octx.beginPath();
        octx.moveTo(0, y);
        octx.lineTo(doc.artboard.width, y);
        octx.stroke();
      }
    }

    if (safeArea) {
      const { width: aw, height: ah, formatId, bleed = 0 } = doc.artboard;
      const inset = safeInsets(formatId, aw, ah);
      octx.save();
      octx.fillStyle = "rgba(7,9,8,0.38)";
      octx.fillRect(0, 0, aw, inset.t);
      octx.fillRect(0, ah - inset.b, aw, inset.b);
      octx.fillRect(0, inset.t, inset.l, ah - inset.t - inset.b);
      octx.fillRect(aw - inset.r, inset.t, inset.r, ah - inset.t - inset.b);
      octx.strokeStyle = "rgba(63,198,255,0.85)";
      octx.lineWidth = 1 / viewport.zoom;
      octx.setLineDash([8 / viewport.zoom, 5 / viewport.zoom]);
      octx.strokeRect(inset.l, inset.t, aw - inset.l - inset.r, ah - inset.t - inset.b);
      octx.setLineDash([]);
      octx.font = `${11 / viewport.zoom}px ui-monospace, monospace`;
      octx.fillStyle = "rgba(63,198,255,0.9)";
      octx.textBaseline = "top";
      octx.fillText("SAFE", inset.l + 6 / viewport.zoom, inset.t + 6 / viewport.zoom);
      if (bleed > 0) {
        octx.strokeStyle = "rgba(255,178,56,0.7)";
        octx.strokeRect(-bleed, -bleed, aw + bleed * 2, ah + bleed * 2);
        octx.fillStyle = "rgba(255,178,56,0.85)";
        octx.fillText(`BLEED ${bleed}`, 6 / viewport.zoom, -bleed - 14 / viewport.zoom);
      }
      octx.restore();
    }

    const manuals = doc.guides ?? [];
    octx.save();
    octx.strokeStyle = "rgba(63,198,255,0.55)";
    octx.lineWidth = 1 / viewport.zoom;
    for (const g of manuals) {
      octx.beginPath();
      if (g.axis === "x") {
        octx.moveTo(g.pos, -80);
        octx.lineTo(g.pos, doc.artboard.height + 80);
      } else {
        octx.moveTo(-80, g.pos);
        octx.lineTo(doc.artboard.width + 80, g.pos);
      }
      octx.stroke();
    }
    octx.restore();

    const guides = guidesRef.current;
    octx.save();
    octx.strokeStyle = "#3fc6ff";
    octx.lineWidth = 1 / viewport.zoom;
    octx.setLineDash([6 / viewport.zoom, 4 / viewport.zoom]);
    for (const x of guides.x) {
      octx.beginPath();
      octx.moveTo(x, -40);
      octx.lineTo(x, doc.artboard.height + 40);
      octx.stroke();
    }
    for (const y of guides.y) {
      octx.beginPath();
      octx.moveTo(-40, y);
      octx.lineTo(doc.artboard.width + 40, y);
      octx.stroke();
    }
    octx.restore();

    if (tool === "pen") {
      const live = selection[0] ? doc.nodes.find((n) => n.id === selection[0] && n.kind === "path") : null;
      if (live && live.kind === "path" && live.points.length) {
        const last = live.points[live.points.length - 1]!;
        const hover = penHoverRef.current;
        octx.save();
        octx.strokeStyle = "rgba(63,198,255,0.7)";
        octx.lineWidth = 1.5 / viewport.zoom;
        octx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom]);
        if (hover) {
          octx.beginPath();
          octx.moveTo(live.x + last.x, live.y + last.y);
          octx.lineTo(hover.x, hover.y);
          octx.stroke();
        }
        octx.setLineDash([]);
        const first = live.points[0]!;
        if (live.points.length >= 3) {
          octx.beginPath();
          octx.arc(live.x + first.x, live.y + first.y, 6 / viewport.zoom, 0, Math.PI * 2);
          octx.strokeStyle = "#3fc6ff";
          octx.stroke();
        }
        octx.restore();
      }
    }

    const mq = marqueeRef.current;
    if (mq) {
      octx.fillStyle = "rgba(63,198,255,0.08)";
      octx.strokeStyle = "#3fc6ff";
      octx.lineWidth = 1 / viewport.zoom;
      octx.fillRect(mq.x, mq.y, mq.w, mq.h);
      octx.strokeRect(mq.x, mq.y, mq.w, mq.h);
    }

    for (const id of selection) {
      const n = doc.nodes.find((x) => x.id === id);
      if (!n) continue;
      octx.save();
      const cx = n.x + n.w / 2;
      const cy = n.y + n.h / 2;
      octx.translate(cx, cy);
      octx.rotate((n.rotation * Math.PI) / 180);
      octx.translate(-cx, -cy);
      octx.strokeStyle = "#3fc6ff";
      octx.lineWidth = 1.5 / viewport.zoom;
      octx.strokeRect(n.x, n.y, n.w, n.h);
      const hs = 8 / viewport.zoom;
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
      octx.fillStyle = "#0a0d0c";
      octx.strokeStyle = "#3fc6ff";
      for (const [hx, hy] of pts) {
        octx.fillRect(hx! - hs / 2, hy! - hs / 2, hs, hs);
        octx.strokeRect(hx! - hs / 2, hy! - hs / 2, hs, hs);
      }
      octx.beginPath();
      octx.moveTo(n.x + n.w / 2, n.y);
      octx.lineTo(n.x + n.w / 2, n.y - 28 / viewport.zoom);
      octx.stroke();
      octx.beginPath();
      octx.arc(n.x + n.w / 2, n.y - 28 / viewport.zoom, 6 / viewport.zoom, 0, Math.PI * 2);
      octx.fillStyle = "#3fc6ff";
      octx.fill();
      octx.restore();
    }
    octx.restore();

    octx.save();
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.font = "10px ui-monospace, SFMono-Regular, monospace";
    octx.fillStyle = "#3fc6ff";
    octx.textBaseline = "top";
    for (const g of manuals) {
      const label = String(Math.round(g.pos));
      if (g.axis === "x") {
        const sx = viewport.x + g.pos * viewport.zoom;
        octx.textAlign = "left";
        octx.fillText(label, sx + 6, RULER + 6);
      } else {
        const sy = viewport.y + g.pos * viewport.zoom;
        octx.textAlign = "left";
        octx.fillText(label, RULER + 6, sy + 4);
      }
    }
    octx.restore();

    if (rulers) {
      octx.fillStyle = "#0c0f0d";
      octx.fillRect(0, 0, w, RULER);
      octx.fillRect(0, 0, RULER, h);
      octx.fillStyle = "#121613";
      octx.fillRect(0, 0, RULER, RULER);
      octx.strokeStyle = "rgba(63,198,255,0.22)";
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(RULER, 0);
      octx.lineTo(RULER, h);
      octx.moveTo(0, RULER);
      octx.lineTo(w, RULER);
      octx.stroke();
      const step = niceStep(48 / viewport.zoom);
      octx.fillStyle = "#7d9689";
      octx.strokeStyle = "rgba(125,150,137,0.55)";
      octx.font = "9px ui-monospace, SFMono-Regular, monospace";
      octx.textBaseline = "middle";
      const xStart = Math.floor(-viewport.x / viewport.zoom / step) * step;
      const xEnd = (w - viewport.x) / viewport.zoom;
      octx.textAlign = "center";
      for (let x = xStart; x <= xEnd; x += step) {
        const sx = viewport.x + x * viewport.zoom;
        if (sx < RULER) continue;
        octx.beginPath();
        octx.moveTo(sx, RULER);
        octx.lineTo(sx, Math.round(x / step) % 5 === 0 ? 4 : 10);
        octx.stroke();
        if (Math.round(x / step) % 2 === 0) octx.fillText(String(Math.round(x)), sx, 8);
      }
      const yStart = Math.floor(-viewport.y / viewport.zoom / step) * step;
      const yEnd = (h - viewport.y) / viewport.zoom;
      octx.textAlign = "center";
      for (let y = yStart; y <= yEnd; y += step) {
        const sy = viewport.y + y * viewport.zoom;
        if (sy < RULER) continue;
        octx.beginPath();
        octx.moveTo(RULER, sy);
        octx.lineTo(Math.round(y / step) % 5 === 0 ? 4 : 10, sy);
        octx.stroke();
        if (Math.round(y / step) % 2 === 0) {
          octx.save();
          octx.translate(8, sy);
          octx.rotate(-Math.PI / 2);
          octx.fillText(String(Math.round(y)), 0, 0);
          octx.restore();
        }
      }
    }
  }, []);

  useEffect(() => {
    const unsub = useDesign.subscribe(redraw);
    redraw();
    const wrap = wrapRef.current;
    const ro = new ResizeObserver(() => {
      const { doc, viewport } = useDesign.getState();
      if (doc && wrap && viewport.zoom < 0.05) {
        useDesign.getState().setViewport(fitViewport(doc.artboard.width, doc.artboard.height, wrap.clientWidth, wrap.clientHeight));
      }
      redraw();
    });
    if (wrap) ro.observe(wrap);
    const t = window.setTimeout(() => {
      const { doc } = useDesign.getState();
      if (doc && wrap) {
        useDesign.getState().setViewport(fitViewport(doc.artboard.width, doc.artboard.height, wrap.clientWidth, wrap.clientHeight));
      }
    }, 30);
    return () => {
      unsub();
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [redraw]);

  const viewIntent = useDesign((s) => s.viewIntent);
  useEffect(() => {
    if (!viewIntent) return;
    const wrap = wrapRef.current;
    const { doc, viewport } = useDesign.getState();
    if (!wrap || !doc) {
      useDesign.getState().clearViewIntent();
      return;
    }
    if (viewIntent.type === "fit") {
      useDesign.getState().setViewport(fitViewport(doc.artboard.width, doc.artboard.height, wrap.clientWidth, wrap.clientHeight));
    } else {
      const zoom = Math.min(4, Math.max(0.05, viewIntent.zoom));
      const cx = wrap.clientWidth / 2;
      const cy = wrap.clientHeight / 2;
      const d = screenToDoc(cx, cy, viewport);
      useDesign.getState().setViewport({ zoom, x: cx - d.x * zoom, y: cy - d.y * zoom });
    }
    useDesign.getState().clearViewIntent();
  }, [viewIntent]);

  function pos(e: { clientX: number; clientY: number }) {
    const wrap = wrapRef.current!;
    const r = wrap.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function placeImage(src: string, x: number, y: number) {
    const img = new Image();
    img.onload = () => {
      const max = 720;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      useDesign.getState().addNode(
        imageNode({
          x,
          y,
          w: img.width * scale,
          h: img.height * scale,
          src,
          name: "Image",
        }),
      );
    };
    img.src = src;
  }

  function onPointerDown(e: React.PointerEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (e.button === 2) return;
    wrap.setPointerCapture(e.pointerId);
    const { doc, tool, viewport, selection, snap: doSnap, rulers } = useDesign.getState();
    if (!doc) return;
    const p = pos(e);
    const d = screenToDoc(p.x, p.y, viewport);
    const space = drag.current?.space || e.button === 1 || tool === "hand";
    setMenu(null);

    if (space) {
      drag.current = { mode: "pan", sx: p.x, sy: p.y, lx: viewport.x, ly: viewport.y };
      return;
    }

    if (rulers) {
      const manuals = doc.guides ?? [];
      const hit = hitManualGuide(p, manuals, viewport);
      if (hit) {
        drag.current = { mode: "guide", sx: p.x, sy: p.y, lx: hit.pos, ly: hit.pos, guideId: hit.id, guideAxis: hit.axis };
        return;
      }
      if (p.y < RULER && p.x > RULER) {
        const id = useDesign.getState().addGuide("x", d.x);
        drag.current = { mode: "guide", sx: p.x, sy: p.y, lx: d.x, ly: d.y, guideId: id, guideAxis: "x" };
        return;
      }
      if (p.x < RULER && p.y > RULER) {
        const id = useDesign.getState().addGuide("y", d.y);
        drag.current = { mode: "guide", sx: p.x, sy: p.y, lx: d.x, ly: d.y, guideId: id, guideAxis: "y" };
        return;
      }
    }

    if (tool === "eyedropper") {
      const main = mainRef.current;
      if (!main) return;
      const ctx = main.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pix = ctx.getImageData(p.x * dpr, p.y * dpr, 1, 1).data;
      const hex = `#${[pix[0], pix[1], pix[2]].map((c) => c!.toString(16).padStart(2, "0")).join("")}`;
      useDesign.getState().setColor(hex);
      return;
    }

    if (tool === "brush" || tool === "eraser") {
      const layer = ensurePaintLayer(doc);
      const off = paintRef.current ?? document.createElement("canvas");
      off.width = doc.artboard.width;
      off.height = doc.artboard.height;
      const pctx = off.getContext("2d")!;
      if (layer.kind === "paint" && layer.bitmap) {
        const img = getCachedImage(layer.bitmap);
        if (img) pctx.drawImage(img, 0, 0);
      }
      paintRef.current = off;
      drag.current = { mode: "paint", sx: d.x, sy: d.y, lx: d.x, ly: d.y, created: layer.id };
      useDesign.getState().beginPaintStroke(layer.id);
      stamp(d.x, d.y, d.x, d.y);
      return;
    }

    if (tool === "pen") {
      const existing = selection[0] ? doc.nodes.find((n) => n.id === selection[0] && n.kind === "path") : null;
      if (existing && existing.kind === "path") {
        const first = existing.points[0];
        if (first && existing.points.length >= 3) {
          const fx = existing.x + first.x;
          const fy = existing.y + first.y;
          const closePx = 10 / viewport.zoom;
          if (Math.hypot(d.x - fx, d.y - fy) <= closePx) {
            useDesign.getState().closeSelectedPath();
            return;
          }
        }
        const pts = [...existing.points, { x: d.x - existing.x, y: d.y - existing.y }];
        useDesign.getState().replaceNode(existing.id, { ...existing, points: pts, w: Math.max(existing.w, d.x - existing.x + 8), h: Math.max(existing.h, d.y - existing.y + 8) }, true);
      } else {
        const node = pathNode({
          x: d.x,
          y: d.y,
          w: 8,
          h: 8,
          points: [{ x: 0, y: 0 }],
          stroke: useDesign.getState().color,
          strokeWidth: 3,
        });
        useDesign.getState().addNode(node);
      }
      return;
    }

    if (tool === "text") {
      const node = makeText(d.x, d.y, useDesign.getState().color);
      useDesign.getState().addNode(node);
      useDesign.getState().setTool("select");
      useDesign.getState().setEditingText(node.id);
      return;
    }

    if (tool === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => placeImage(String(reader.result), d.x, d.y);
        reader.readAsDataURL(file);
      };
      input.click();
      useDesign.getState().setTool("select");
      return;
    }

    if (SHAPE_TOOLS.includes(tool)) {
      const kind = tool === "frame" ? "rect" : (tool as "rect");
      const node = makeShape(kind, d.x, d.y, 8, 8, tool === "frame" ? "transparent" : useDesign.getState().color);
      if (tool === "frame") {
        node.stroke = "#3fc6ff";
        node.strokeWidth = 2;
        node.fill = "transparent";
      }
      useDesign.getState().addNode(node);
      drag.current = { mode: "create", sx: d.x, sy: d.y, lx: d.x, ly: d.y, created: node.id };
      return;
    }

    const selected = selection[0] ? doc.nodes.find((n) => n.id === selection[0]) : null;
    if (selected) {
      const handle = hitHandle(selected, d.x, d.y, viewport.zoom);
      if (handle && handle !== "move") {
        useDesign.getState().commit();
        drag.current = { mode: "handle", handle, sx: d.x, sy: d.y, lx: d.x, ly: d.y, start: { ...selected } };
        return;
      }
    }

    const hit = hitTop(doc.nodes, d.x, d.y);
    if (hit) {
      if (!selection.includes(hit.id)) useDesign.getState().select(e.shiftKey ? [hit.id] : [hit.id], e.shiftKey);
      if (e.altKey) useDesign.getState().duplicateSelected();
      useDesign.getState().commit();
      const sel = useDesign.getState().selection;
      const live = useDesign.getState().doc!;
      drag.current = {
        mode: "move",
        sx: d.x,
        sy: d.y,
        lx: d.x,
        ly: d.y,
        start: { ...hit },
        orig: live.nodes.filter((n) => sel.includes(n.id)).map((n) => ({ id: n.id, x: n.x, y: n.y })),
      };
    } else {
      useDesign.getState().select([]);
      drag.current = { mode: "marquee", sx: d.x, sy: d.y, lx: d.x, ly: d.y };
      marqueeRef.current = { x: d.x, y: d.y, w: 0, h: 0 };
    }
    void doSnap;
  }

  function stamp(x0: number, y0: number, x1: number, y1: number) {
    const off = paintRef.current;
    const { doc, brush, tool } = useDesign.getState();
    if (!off || !doc) return;
    const ctx = off.getContext("2d")!;
    const def = tool === "eraser" ? brushById("eraser") : brushById(brush.id);
    const color = brush.color;
    const pts0 = mirrorPoints(x0, y0, doc.artboard.width, doc.artboard.height, brush.symmetry);
    const pts1 = mirrorPoints(x1, y1, doc.artboard.width, doc.artboard.height, brush.symmetry);
    pts0.forEach((a, i) => {
      const b = pts1[i] ?? a;
      strokeSegment(ctx, a.x, a.y, b.x, b.y, brush.size, color, def, brush.opacity);
    });
    const layerId = drag.current?.created;
    if (layerId) {
      const node = doc.nodes.find((n) => n.id === layerId);
      if (node && node.kind === "paint") {
        useDesign.getState().replaceNode(layerId, { ...node, bitmap: off.toDataURL("image/png") }, false);
      }
    }
    void BRUSHES;
  }

  function onPointerMove(e: React.PointerEvent) {
    const wrap = wrapRef.current;
    const p = pos(e);
    const st = drag.current;
    if (!st) {
      const { doc, viewport, rulers, tool } = useDesign.getState();
      if (tool === "pen") {
        const d = screenToDoc(p.x, p.y, viewport);
        penHoverRef.current = { x: d.x, y: d.y };
        redraw();
      } else {
        penHoverRef.current = null;
      }
      if (wrap && doc && rulers) {
        const hit = hitManualGuide(p, doc.guides ?? [], viewport);
        if (p.y < RULER && p.x > RULER) wrap.style.cursor = "col-resize";
        else if (p.x < RULER && p.y > RULER) wrap.style.cursor = "row-resize";
        else if (hit?.axis === "x") wrap.style.cursor = "col-resize";
        else if (hit?.axis === "y") wrap.style.cursor = "row-resize";
        else wrap.style.cursor = "";
      }
      return;
    }
    const { doc, viewport, snap: doSnap } = useDesign.getState();
    if (!doc) return;
    const d = screenToDoc(p.x, p.y, viewport);

    if (st.mode === "guide" && st.guideId && st.guideAxis) {
      let next = st.guideAxis === "x" ? d.x : d.y;
      if (doSnap) next = snap(next, 8);
      useDesign.getState().moveGuide(st.guideId, next);
      return;
    }
    if (st.mode === "pan") {
      useDesign.getState().setViewport({ x: st.lx + (p.x - st.sx), y: st.ly + (p.y - st.sy) });
      return;
    }
    if (st.mode === "paint") {
      stamp(st.lx, st.ly, d.x, d.y);
      st.lx = d.x;
      st.ly = d.y;
      return;
    }
    if (st.mode === "create" && st.created) {
      const x = Math.min(st.sx, d.x);
      const y = Math.min(st.sy, d.y);
      let w = Math.max(8, Math.abs(d.x - st.sx));
      let h = Math.max(8, Math.abs(d.y - st.sy));
      if (e.shiftKey) {
        const s = Math.max(w, h);
        w = s;
        h = s;
      }
      useDesign.getState().updateNodes([st.created], { x, y, w, h });
      return;
    }
    if (st.mode === "marquee") {
      const x = Math.min(st.sx, d.x);
      const y = Math.min(st.sy, d.y);
      marqueeRef.current = { x, y, w: Math.abs(d.x - st.sx), h: Math.abs(d.y - st.sy) };
      redraw();
      return;
    }
    if (st.mode === "move" && st.orig) {
      let dx = d.x - st.sx;
      let dy = d.y - st.sy;
      if (doSnap) {
        dx = snap(dx, 8);
        dy = snap(dy, 8);
      }
      const proposed = st.orig.map((o) => ({ id: o.id, x: o.x + dx, y: o.y + dy }));
      const moving = proposed.map((p) => {
        const n = doc.nodes.find((x) => x.id === p.id);
        return n ? { ...n, x: p.x, y: p.y } : null;
      }).filter((n): n is DesignNode => Boolean(n));
      const others = doc.nodes.filter((n) => !st.orig!.some((o) => o.id === n.id) && n.visible);
      const extra = {
        x: (doc.guides ?? []).filter((g) => g.axis === "x").map((g) => g.pos),
        y: (doc.guides ?? []).filter((g) => g.axis === "y").map((g) => g.pos),
      };
      const snapped = smartSnap(moving, others, doc.artboard, 6, extra);
      const places = proposed.map((p) => ({ id: p.id, x: p.x + snapped.dx, y: p.y + snapped.dy }));
      useDesign.getState().placeNodes(places);
      guidesRef.current = snapped.guides;
      return;
    }
    if (st.mode === "handle" && st.start && st.handle) {
      if (st.handle === "rotate") {
        const n = st.start;
        const cx = n.x + n.w / 2;
        const cy = n.y + n.h / 2;
        const ang = (Math.atan2(d.y - cy, d.x - cx) * 180) / Math.PI + 90;
        useDesign.getState().updateNodes([n.id], { rotation: Math.round(ang) });
        return;
      }
      const patch = applyHandle(st.start, st.handle, d.x - st.sx, d.y - st.sy);
      if (e.shiftKey && patch.w && patch.h) {
        const s = Math.max(Number(patch.w), Number(patch.h));
        patch.w = s;
        patch.h = s;
      }
      useDesign.getState().updateNodes([st.start.id], patch);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const st = drag.current;
    if (st?.mode === "create") {
      useDesign.getState().setTool("select");
    }
    if (st?.mode === "marquee") {
      const mq = marqueeRef.current;
      const { doc } = useDesign.getState();
      if (doc && mq && (mq.w > 4 || mq.h > 4)) {
        const ids = doc.nodes.filter((n) => n.visible && !n.locked && rectsIntersect(n, mq)).map((n) => n.id);
        useDesign.getState().select(ids);
      }
      marqueeRef.current = null;
      redraw();
    }
    if (st?.mode === "guide") {
      const p = pos(e);
      if (st.guideId && st.guideAxis) {
        if ((st.guideAxis === "x" && p.y < RULER) || (st.guideAxis === "y" && p.x < RULER)) {
          useDesign.getState().removeGuide(st.guideId);
        }
      }
      useDesign.getState().commit();
    }
    if (st?.mode === "move") {
      guidesRef.current = { x: [], y: [] };
      redraw();
    }
    drag.current = drag.current?.space ? { ...drag.current, mode: "pan" } : null;
    try {
      wrapRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const { viewport } = useDesign.getState();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const zoom = Math.min(4, Math.max(0.05, viewport.zoom * factor));
    const d = screenToDoc(p.x, p.y, viewport);
    useDesign.getState().setViewport({
      zoom,
      x: p.x - d.x * zoom,
      y: p.y - d.y * zoom,
    });
  }

  function onDoubleClick(e: React.MouseEvent) {
    const { doc, viewport, rulers, tool } = useDesign.getState();
    if (!doc) return;
    const p = pos(e);
    if (tool === "pen") {
      useDesign.getState().finishPen();
      return;
    }
    if (rulers) {
      const g = hitManualGuide(p, doc.guides ?? [], viewport);
      if (g) {
        useDesign.getState().removeGuide(g.id);
        return;
      }
    }
    const d = screenToDoc(p.x, p.y, viewport);
    const hit = hitTop(doc.nodes, d.x, d.y);
    if (hit?.kind === "text") useDesign.getState().setEditingText(hit.id);
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    const { doc, viewport } = useDesign.getState();
    if (!doc) return;
    const d = screenToDoc(pos(e).x, pos(e).y, viewport);
    const hit = hitTop(doc.nodes, d.x, d.y);
    if (hit && !useDesign.getState().selection.includes(hit.id)) useDesign.getState().select([hit.id]);
    setMenu({ x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        drag.current = { ...(drag.current ?? { sx: 0, sy: 0, lx: 0, ly: 0, mode: "pan" }), space: true, mode: "pan" };
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && drag.current) drag.current.space = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const editingText = useDesign((s) => s.editingText);
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const tool = useDesign((s) => s.tool);
  const zoom = viewport.zoom;
  const editNode = editingText && doc ? doc.nodes.find((n) => n.id === editingText) : null;
  const screen = editNode ? docToScreen(editNode.x, editNode.y, viewport) : null;

  const menuItems: MenuItem[] = [
    { id: "copy", label: "Copy", hint: "⌘C", run: () => useDesign.getState().copySelected() },
    { id: "paste", label: "Paste", hint: "⌘V", run: () => useDesign.getState().pasteClipboard() },
    { id: "dup", label: "Duplicate", hint: "⌘D", run: () => useDesign.getState().duplicateSelected() },
    { id: "front", label: "Bring to front", run: () => useDesign.getState().bringSelected("top") },
    { id: "back", label: "Send to back", run: () => useDesign.getState().bringSelected("bottom") },
    { id: "flip-h", label: "Flip horizontal", run: () => useDesign.getState().flipSelected("h") },
    { id: "flip-v", label: "Flip vertical", run: () => useDesign.getState().flipSelected("v") },
    { id: "lock", label: "Lock / unlock", run: () => useDesign.getState().lockSelected() },
    { id: "hide", label: "Hide", run: () => useDesign.getState().hideSelected() },
    { id: "del", label: "Delete", hint: "⌫", danger: true, run: () => useDesign.getState().removeSelected() },
  ];

  return (
    <div
      ref={wrapRef}
      className="pasteboard relative min-h-0 flex-1 touch-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
        if (!file || !doc) return;
        const p = pos(e);
        const d = screenToDoc(p.x, p.y, viewport);
        const reader = new FileReader();
        reader.onload = () => placeImage(String(reader.result), d.x, d.y);
        reader.readAsDataURL(file);
      }}
    >
      <canvas ref={mainRef} className="absolute inset-0" />
      <canvas ref={overlayRef} className="pointer-events-none absolute inset-0" />
      {tool === "pen" && (
        <div className="pointer-events-none absolute bottom-14 left-1/2 z-10 -translate-x-1/2 rounded-[8px] border border-border bg-surface/90 px-3 py-1.5 font-mono text-[10px] tracking-wide text-ink-dim uppercase">
          Click add · ⌫ last point · Enter close · Esc finish
        </div>
      )}
      {editNode && editNode.kind === "text" && screen && (
        <textarea
          autoFocus
          className="absolute resize-none bg-transparent p-0 text-ink outline-none"
          style={{
            left: screen.x,
            top: screen.y,
            width: editNode.w * viewport.zoom,
            height: Math.max(editNode.h, editNode.fontSize * 1.4) * viewport.zoom,
            fontFamily: editNode.fontFamily,
            fontWeight: editNode.fontWeight,
            fontSize: editNode.fontSize * viewport.zoom,
            lineHeight: editNode.lineHeight,
            color: typeof editNode.fill === "string" ? editNode.fill : "#d9f5e3",
            textAlign: editNode.align,
          }}
          value={editNode.text}
          onChange={(e) => useDesign.getState().updateNodes([editNode.id], { text: e.target.value } as Partial<DesignNode>, false)}
          onBlur={() => useDesign.getState().setEditingText(null)}
        />
      )}
      <div className="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-0.5 rounded-[12px] border border-border bg-surface/90 p-1">
        <button
          type="button"
          className="size-8 rounded-[8px] text-ink-dim hover:bg-surface-alt hover:text-ink"
          onClick={() => useDesign.getState().requestZoom(zoom / 1.15)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="h-8 min-w-14 rounded-[8px] font-mono text-[11px] text-ink-dim hover:bg-surface-alt hover:text-ink"
          onClick={() => useDesign.getState().requestFit()}
          aria-label="Fit artboard"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          className="size-8 rounded-[8px] text-ink-dim hover:bg-surface-alt hover:text-ink"
          onClick={() => useDesign.getState().requestZoom(zoom * 1.15)}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      {menu && <CanvasMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </div>
  );
}
