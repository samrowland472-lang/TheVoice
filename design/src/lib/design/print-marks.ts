import type { DesignDocument, Viewport } from "./types";

export type BleedEdges = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PrintMarkLayout = {
  bleed: number;
  edges: BleedEdges;
  width: number;
  height: number;
  mark: number;
  gap: number;
  corners: Array<{ x: number; y: number; sx: number; sy: number }>;
};

export function resolveBleed(doc: DesignDocument): BleedEdges {
  const raw = doc.artboard.bleedEdges;
  if (raw) {
    return {
      top: Math.max(0, raw.top ?? 0),
      right: Math.max(0, raw.right ?? 0),
      bottom: Math.max(0, raw.bottom ?? 0),
      left: Math.max(0, raw.left ?? 0),
    };
  }
  const b = Math.max(0, doc.artboard.bleed ?? 0);
  return { top: b, right: b, bottom: b, left: b };
}

export function uniformBleed(edges: BleedEdges): number | null {
  if (edges.top === edges.right && edges.right === edges.bottom && edges.bottom === edges.left) {
    return edges.top;
  }
  return null;
}

/** CSS-pixel bleed from millimetres (96 CSS px / in). */
export function bleedMmToPx(mm: number): number {
  return Math.max(0, Math.round((mm * 96) / 25.4));
}

export const BLEED_PRESETS = [
  { id: "none", label: "None", mm: 0, px: 0 },
  { id: "3mm", label: "3 mm", mm: 3, px: bleedMmToPx(3) },
  { id: "6mm", label: "6 mm", mm: 6, px: bleedMmToPx(6) },
] as const;
