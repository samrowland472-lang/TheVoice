import { degToRad, nodeCenter } from "./geometry";
import { tracePath } from "./path-curve";
import { applyStrokeStyle } from "./render";
import { isConvertibleShape, shapeContour } from "./shape-to-path";
import type { DesignNode } from "./types";
import { isPath } from "./types";

export type StrokeGhost = {
  strokeWidth?: number;
  strokeDash?: number;
  strokeDashOffset?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  miterLimit?: number;
  headScale?: number;
} | null;

export function applyStrokeGhost(n: DesignNode, ghost: StrokeGhost): DesignNode {
  if (!ghost) return n;
  return { ...n, ...ghost };
}

const OUTLINE = new Set(["path", "rect", "ellipse", "line", "polygon", "star", "arrow"]);

export function isOutlineNode(n: DesignNode): boolean {
  return OUTLINE.has(n.kind);
}

function traceOutline(ctx: CanvasRenderingContext2D, n: DesignNode) {
  if (isPath(n) && n.points.length) {
    ctx.beginPath();
    tracePath(ctx, n.x, n.y, n.points, n.closed);
    for (const hole of n.holes ?? []) {
      if (hole.length < 3) continue;
      tracePath(ctx, n.x, n.y, hole, true);
    }
    return true;
  }
  if (isConvertibleShape(n)) {
    const { points, closed } = shapeContour(n);
    ctx.beginPath();
    tracePath(ctx, n.x, n.y, points, closed);
    return true;
  }
  return false;
}

/** Phosphor overlay of selected outlines using a hovered stroke field. */
export function drawStrokeGhosts(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  ghost: StrokeGhost,
  zoom: number,
) {
  if (!ghost) return;
  for (const raw of nodes) {
    if (!raw.visible || !isOutlineNode(raw)) continue;
    if (ghost.headScale != null && raw.kind !== "arrow") continue;
    const n = applyStrokeGhost(raw, ghost);
    ctx.save();
    const c = nodeCenter(n);
    if (n.rotation) {
      ctx.translate(c.x, c.y);
      ctx.rotate(degToRad(n.rotation));
      ctx.translate(-c.x, -c.y);
    }
    if (!traceOutline(ctx, n)) {
      ctx.restore();
      continue;
    }
    const width = Math.max(n.strokeWidth ?? 0, 1);
    ctx.strokeStyle = "rgba(63,198,255,0.88)";
    ctx.lineWidth = width;
    applyStrokeStyle(ctx, n);
    ctx.globalAlpha = 0.92;
    ctx.stroke();
    ctx.lineWidth = Math.max(1.2 / zoom, width * 0.08);
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.strokeStyle = "rgba(63,198,255,0.45)";
    ctx.stroke();
    ctx.restore();
  }
}
