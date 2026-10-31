import { brushById, mirrorPoints, strokeSegment } from "./brushes";
import { ensurePaintLayer, useDesign } from "./store";
import type { BrushSettings, PaintNode } from "./types";

type StrokeSession = {
  nodeId: string;
  canvas: HTMLCanvasElement;
  lastWorld: { x: number; y: number } | null;
  /** Last pressure sample (0–1). Mouse / non-pen defaults to 1. */
  pressure: number;
  /** Pointer tilt in degrees (−90…90). Drives dab ellipse and directional scatter. */
  tiltX: number;
  tiltY: number;
};

let session: StrokeSession | null = null;

function loadBitmap(canvas: HTMLCanvasElement, bitmap: string): Promise<void> {
  return new Promise((resolve) => {
    if (!bitmap) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = bitmap;
  });
}

/** Normalize PointerEvent pressure; treat 0 (some mice) as full pressure. */
function normPressure(p: number | undefined): number {
  if (p == null || p <= 0) return 1;
  return Math.min(1, Math.max(0.05, p));
}

function stamp(x0: number, y0: number, x1: number, y1: number) {
  if (!session) return;
  const state = useDesign.getState();
  const brush: BrushSettings = state.brush;
  const id = state.tool === "eraser" ? "eraser" : brush.id;
  const base = brushById(id);
  // Live hardness / spacing from the dock override the preset defaults
  const def = {
    ...base,
    hardness: brush.hardness ?? base.hardness,
    spacing: brush.spacing ?? base.spacing,
  };
  const layer = state.doc?.nodes.find((n) => n.id === session!.nodeId);
  if (!layer || layer.kind !== "paint") return;
  const ctx = session.canvas.getContext("2d");
  if (!ctx) return;
  const color = brush.color || state.color || "#0a0d0c";
  // Pressure scales size (and a touch of opacity). Tilt flattens dabs into ellipses.
  const pressure = session.pressure;
  const liveSize = Math.max(1, brush.size * (0.2 + 0.8 * pressure));
  const liveOpacity = brush.opacity * (0.55 + 0.45 * pressure);
  const aPoints = mirrorPoints(x0 - layer.x, y0 - layer.y, layer.w, layer.h, brush.symmetry);
  const bPoints = mirrorPoints(x1 - layer.x, y1 - layer.y, layer.w, layer.h, brush.symmetry);
  for (let i = 0; i < aPoints.length; i++) {
    const a = aPoints[i]!;
    const b = bPoints[i] ?? a;
    strokeSegment(
      ctx,
      a.x,
      a.y,
      b.x,
      b.y,
      liveSize,
      color,
      def,
      liveOpacity,
      session.tiltX,
      session.tiltY,
    );
  }
  const url = session.canvas.toDataURL("image/png");
  state.replaceNode(session.nodeId, { ...layer, bitmap: url }, false);
}

export type StrokePointer = {
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
};

export async function beginPaintStroke(
  docX: number,
  docY: number,
  pointer?: StrokePointer,
): Promise<boolean> {
  const state = useDesign.getState();
  const doc = state.doc;
  if (!doc) return false;
  const layer = ensurePaintLayer(doc) as PaintNode;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(layer.w));
  canvas.height = Math.max(1, Math.round(layer.h));
  await loadBitmap(canvas, layer.bitmap);
  session = {
    nodeId: layer.id,
    canvas,
    lastWorld: { x: docX, y: docY },
    pressure: normPressure(pointer?.pressure),
    tiltX: pointer?.tiltX ?? 0,
    tiltY: pointer?.tiltY ?? 0,
  };
  stamp(docX, docY, docX, docY);
  return true;
}

export function continuePaintStroke(docX: number, docY: number, pointer?: StrokePointer) {
  if (!session) return;
  if (pointer) {
    session.pressure = normPressure(pointer.pressure);
    session.tiltX = pointer.tiltX ?? session.tiltX;
    session.tiltY = pointer.tiltY ?? session.tiltY;
  }
  const prev = session.lastWorld;
  if (!prev) {
    session.lastWorld = { x: docX, y: docY };
    stamp(docX, docY, docX, docY);
    return;
  }
  stamp(prev.x, prev.y, docX, docY);
  session.lastWorld = { x: docX, y: docY };
}

export function endPaintStroke() {
  if (!session) return;
  const state = useDesign.getState();
  const layer = state.doc?.nodes.find((n) => n.id === session!.nodeId);
  if (layer && layer.kind === "paint") {
    state.replaceNode(session.nodeId, layer, true);
  }
  session = null;
}

export function isPainting() {
  return session != null;
}


/** Live pressure from the active stroke (1 when idle or mouse). */
export function getStrokePressure(): number {
  return session?.pressure ?? 1;
}

/** Live tilt magnitude (degrees) from the active stroke. */
export function getStrokeTilt(): number {
  if (!session) return 0;
  return Math.min(90, Math.hypot(session.tiltX, session.tiltY));
}
