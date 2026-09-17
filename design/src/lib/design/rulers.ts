import type { DesignDocument, Viewport } from "./types";

export const RULER = 20;

export type GuideDrag =
  | { kind: "new"; axis: "x" | "y"; pos: number }
  | { kind: "move"; id: string; axis: "x" | "y"; pos: number };

export function screenFromDoc(pos: number, origin: number, zoom: number) {
  return origin + pos * zoom;
}

export function docFromScreen(screen: number, origin: number, zoom: number) {
  return (screen - origin) / zoom;
}

export function hitRulerBand(sx: number, sy: number): "top" | "left" | null {
  if (sx < RULER && sy < RULER) return null;
  if (sy < RULER) return "top";
  if (sx < RULER) return "left";
  return null;
}
