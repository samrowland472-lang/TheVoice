import type { DesignNode } from "./types";

export type StrokeGhost = {
  strokeWidth?: number;
  strokeDash?: number;
  strokeDashOffset?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  miterLimit?: number;
} | null;

export function applyStrokeGhost(n: DesignNode, ghost: StrokeGhost): DesignNode {
  if (!ghost) return n;
  return { ...n, ...ghost };
}
