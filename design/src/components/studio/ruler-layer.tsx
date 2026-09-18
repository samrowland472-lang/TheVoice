import { useEffect, useRef } from "react";
import {
  docFromScreen,
  drawDocGuides,
  drawRulers,
  dropDeletesGuide,
  hitGuide,
  hitRulerBand,
  type GuideDrag,
} from "@/lib/design/rulers";
import { guideProbe, snapGuideToObjects } from "@/lib/design/snap-guide";
import { useDesign } from "@/lib/design/store";
import "@/lib/design/guide-live";

export function RulerLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<GuideDrag | null>(null);
  const doc = useDesign((s) => s.doc);
  const viewport = useDesign((s) => s.viewport);
  const rulers = useDesign((s) => s.rulers);
  const present = useDesign((s) => s.present);
  useDesign((s) => s.guideSelection);

  function paint() {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const s = useDesign.getState();
    if (!wrap || !canvas || !s.doc || s.present) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 8 || h < 8) return;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawDocGuides(ctx, s.doc, s.viewport, w, h, drag.current, s.guideProbe, s.guideSelection);
    if (s.rulers) drawRulers(ctx, s.doc, s.viewport, w, h);
  }

  useEffect(() => {
    paint();
  });

  useEffect(() => {
    if (present) return;
    function loc(e: PointerEvent) {
      const wrap = wrapRef.current;
      if (!wrap) return { x: 0, y: 0, w: 0, h: 0 };
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    }
    function onDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const s = useDesign.getState();
      if (!s.rulers || !s.doc || s.present) return;
      const sc = loc(e);
      const existing = hitGuide(s.doc, s.viewport, sc.x, sc.y);
      const band = hitRulerBand(sc.x, sc.y);
      if (!existing && !band) return;
      e.preventDefault();
      if (existing) {
        s.selectGuides([existing.id], e.shiftKey);
        drag.current = { kind: "move", id: existing.id, axis: existing.axis, pos: existing.pos };
      } else if (band === "top") {
        drag.current = { kind: "new", axis: "y", pos: docFromScreen(sc.y, s.viewport.y, s.viewport.zoom) };
      } else {
        drag.current = { kind: "new", axis: "x", pos: docFromScreen(sc.x, s.viewport.x, s.viewport.zoom) };
      }
      paint();
    }
    function onMove(e: PointerEvent) {
      const live = drag.current;
      if (!live) return;
      const sc = loc(e);
      const s = useDesign.getState();
      let pos =
        live.axis === "x"
          ? docFromScreen(sc.x, s.viewport.x, s.viewport.zoom)
          : docFromScreen(sc.y, s.viewport.y, s.viewport.zoom);
      if (s.snap && !e.altKey && s.doc) {
        pos = snapGuideToObjects(live.axis, pos, s.doc.nodes, s.doc.artboard).pos;
      }
      live.pos = pos;
      if (s.doc) {
        const others = (s.doc.guides ?? [])
          .filter((g) => g.axis === live.axis && (live.kind === "new" || g.id !== live.id))
          .map((g) => g.pos);
        s.setGuideProbe(guideProbe(live.axis, pos, s.doc.nodes, s.doc.artboard, others));
      }
      paint();
    }
    function onUp(e: PointerEvent) {
      const live = drag.current;
      if (!live) return;
      const s = useDesign.getState();
      const sc = loc(e);
      const kill = dropDeletesGuide(sc.x, sc.y, sc.w, sc.h);
      if (live.kind === "new") {
        if (!kill) s.addGuide(live.axis, Math.round(live.pos));
      } else if (kill) {
        s.removeGuide(live.id);
      } else {
        s.moveGuide(live.id, Math.round(live.pos));
      }
      drag.current = null;
      s.setGuideProbe(null);
      paint();
    }
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [present, rulers]);

  if (present || !doc) return null;

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-10">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
