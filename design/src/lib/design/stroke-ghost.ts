import { degToRad, nodeCenter } from "./geometry";
import { tracePath } from "./path-curve";
import { applyStrokeStyle } from "./render";
import { canvasShadowParams, DEFAULT_SHADOW } from "./shadow";
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
  sides?: number;
  radius?: number;
  fillRule?: "evenodd" | "nonzero";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOx?: number;
  shadowOy?: number;
  shadowSpread?: number;
  shadowInset?: boolean;
} | null;

function hasShadowPatch(ghost: NonNullable<StrokeGhost>) {
  return (
    ghost.shadowColor != null ||
    ghost.shadowBlur != null ||
    ghost.shadowOx != null ||
    ghost.shadowOy != null ||
    ghost.shadowSpread != null ||
    ghost.shadowInset != null
  );
}

export function applyStrokeGhost(n: DesignNode, ghost: StrokeGhost): DesignNode {
  if (!ghost) return n;
  const {
    shadowColor,
    shadowBlur,
    shadowOx,
    shadowOy,
    shadowSpread,
    shadowInset,
    ...rest
  } = ghost;
  const next = { ...n, ...rest };
  if (!hasShadowPatch(ghost)) return next;
  const base = n.shadow ?? DEFAULT_SHADOW;
  return {
    ...next,
    shadow: {
      color: shadowColor ?? base.color,
      blur: shadowBlur ?? base.blur,
      ox: shadowOx ?? base.ox,
      oy: shadowOy ?? base.oy,
      spread: shadowSpread ?? base.spread ?? 0,
      inset: shadowInset ?? Boolean(base.inset),
    },
  };
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

function traceShadowBody(ctx: CanvasRenderingContext2D, n: DesignNode) {
  if (traceOutline(ctx, n)) return true;
  ctx.beginPath();
  ctx.rect(n.x, n.y, n.w, n.h);
  return true;
}

/** Phosphor overlay of selected outlines using a hovered stroke field. */
export function drawStrokeGhosts(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  ghost: StrokeGhost,
  zoom: number,
) {
  if (!ghost) return;
  const shadowing = hasShadowPatch(ghost);
  for (const raw of nodes) {
    if (!raw.visible) continue;
    if (!shadowing && !isOutlineNode(raw)) continue;
    if (ghost.headScale != null && raw.kind !== "arrow") continue;
    if (ghost.sides != null && raw.kind !== "polygon" && raw.kind !== "star") continue;
    if (ghost.radius != null && raw.kind !== "rect") continue;
    if (ghost.fillRule != null && (raw.kind !== "path" || !(raw.holes && raw.holes.length))) continue;
    const n = applyStrokeGhost(raw, ghost);
    ctx.save();
    const c = nodeCenter(n);
    if (n.rotation) {
      ctx.translate(c.x, c.y);
      ctx.rotate(degToRad(n.rotation));
      ctx.translate(-c.x, -c.y);
    }
    if (shadowing) {
      if (!traceShadowBody(ctx, n)) {
        ctx.restore();
        continue;
      }
      if (n.shadow) {
        const p = canvasShadowParams(n.shadow);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.blur;
        ctx.shadowOffsetX = p.ox;
        ctx.shadowOffsetY = p.oy;
      }
      ctx.fillStyle = "rgba(63,198,255,0.34)";
      ctx.globalAlpha = 0.92;
      ctx.fill(n.kind === "path" && n.fillRule === "evenodd" ? "evenodd" : "nonzero");
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "rgba(63,198,255,0.88)";
      ctx.lineWidth = Math.max(1.2 / zoom, 1);
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    if (!traceOutline(ctx, n)) {
      ctx.restore();
      continue;
    }
    const width = Math.max(n.strokeWidth ?? 0, 1);
    if (ghost.fillRule != null) {
      ctx.fillStyle = "rgba(63,198,255,0.28)";
      ctx.globalAlpha = 0.92;
      ctx.fill(ghost.fillRule === "evenodd" ? "evenodd" : "nonzero");
    }
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
