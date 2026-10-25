import { layoutTextLines } from "./text-layout";
import type { DesignNode, TextNode } from "./types";
import { isText } from "./types";

export type TypeGhost = {
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  fontWeight?: number;
} | null;

export function applyTypeGhost(n: TextNode, ghost: TypeGhost): TextNode {
  if (!ghost) return n;
  return {
    ...n,
    fontSize: ghost.fontSize ?? n.fontSize,
    letterSpacing: ghost.letterSpacing ?? n.letterSpacing,
    lineHeight: ghost.lineHeight ?? n.lineHeight,
    fontWeight: ghost.fontWeight ?? n.fontWeight,
  };
}

/**
 * Draw phosphor rhythm guides for selected text layers while type properties are being scrubbed.
 * Horizontal lines mark leading intervals; short vertical ticks approximate tracking density.
 * Weight ghosts update the measured advance and may thicken the leading lines.
 * Size and leading ghosts add baseline ticks at the left and right of each line.
 * Size and leading ghosts also add a mid-line center tick and intermediate density marks along each baseline.
 * Leading density spacing follows the ghosted line height so the vertical rhythm is readable while scrubbing.
 */
export function drawTypeRhythmGhosts(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  ghost: NonNullable<TypeGhost>,
  zoom: number,
) {
  const phosphor = "rgba(63,198,255,0.85)";
  const phosphorSoft = "rgba(63,198,255,0.35)";
  const tickH = Math.max(4 / zoom, 3);

  for (const raw of nodes) {
    if (!isText(raw)) continue;
    const n = applyTypeGhost(raw, ghost);
    const measure = (s: string) => {
      ctx.save();
      ctx.font = `${n.fontWeight} ${n.fontSize}px ${n.fontFamily}`;
      ctx.letterSpacing = "0px";
      const w = ctx.measureText(s).width;
      ctx.restore();
      return w;
    };
    const { lines, lineHeight, startY } = layoutTextLines(n, measure);
    if (!lines.length) continue;

    ctx.save();
    ctx.strokeStyle = phosphor;
    // Slightly thicker lines when weight is being ghosted
    const baseW = Math.max(1 / zoom, 0.75);
    ctx.lineWidth = ghost.fontWeight != null ? baseW * 1.6 : baseW;
    ctx.globalAlpha = 0.9;

    // Leading lines — one per line, spanning the text box width
    for (let i = 0; i < lines.length; i++) {
      const y = n.y + startY + i * lineHeight + n.fontSize * 0.8; // near baseline
      ctx.beginPath();
      ctx.moveTo(n.x, y);
      ctx.lineTo(n.x + n.w, y);
      ctx.stroke();
    }

    // Baseline ticks — left and right markers when size or leading is being ghosted
    if (ghost.fontSize != null || ghost.lineHeight != null) {
      const tickLen = Math.max(7 / zoom, 5);
      ctx.lineWidth = Math.max(1.4 / zoom, 1);
      for (let i = 0; i < lines.length; i++) {
        const y = n.y + startY + i * lineHeight + n.fontSize * 0.8;
        ctx.beginPath();
        // left tick
        ctx.moveTo(n.x, y - tickLen / 2);
        ctx.lineTo(n.x, y + tickLen / 2);
        // right tick
        ctx.moveTo(n.x + n.w, y - tickLen / 2);
        ctx.lineTo(n.x + n.w, y + tickLen / 2);
        ctx.stroke();
      }
    }

    // Size ghosts: mid-line center tick + intermediate density marks along the baseline
    if (ghost.fontSize != null) {
      const midTick = Math.max(5 / zoom, 3.5);
      const densityStep = Math.max(n.fontSize * 0.55, 8 / zoom);
      ctx.lineWidth = Math.max(1.1 / zoom, 0.8);
      for (let i = 0; i < lines.length; i++) {
        const y = n.y + startY + i * lineHeight + n.fontSize * 0.8;
        // center mid-line tick
        const midX = n.x + n.w / 2;
        ctx.beginPath();
        ctx.moveTo(midX, y - midTick / 2);
        ctx.lineTo(midX, y + midTick / 2);
        ctx.stroke();
        // intermediate density marks (skip if too close to edges or center)
        if (densityStep > 4 / zoom && densityStep < n.w * 0.45) {
          ctx.strokeStyle = phosphorSoft;
          ctx.lineWidth = Math.max(0.7 / zoom, 0.5);
          for (let x = n.x + densityStep; x < n.x + n.w - densityStep * 0.4; x += densityStep) {
            if (Math.abs(x - midX) < densityStep * 0.35) continue;
            ctx.beginPath();
            ctx.moveTo(x, y - midTick * 0.35);
            ctx.lineTo(x, y + midTick * 0.35);
            ctx.stroke();
          }
          ctx.strokeStyle = phosphor;
          ctx.lineWidth = Math.max(1.1 / zoom, 0.8);
        }
      }
    }

    // Leading ghosts: mid-line center tick + density marks spaced by the ghosted line height
    if (ghost.lineHeight != null) {
      const midTick = Math.max(5 / zoom, 3.5);
      const densityStep = Math.max(lineHeight * 0.65, 10 / zoom);
      ctx.lineWidth = Math.max(1.1 / zoom, 0.8);
      for (let i = 0; i < lines.length; i++) {
        const y = n.y + startY + i * lineHeight + n.fontSize * 0.8;
        const midX = n.x + n.w / 2;
        ctx.beginPath();
        ctx.moveTo(midX, y - midTick / 2);
        ctx.lineTo(midX, y + midTick / 2);
        ctx.stroke();
        if (densityStep > 5 / zoom && densityStep < n.w * 0.45) {
          ctx.strokeStyle = phosphorSoft;
          ctx.lineWidth = Math.max(0.7 / zoom, 0.5);
          for (let x = n.x + densityStep; x < n.x + n.w - densityStep * 0.4; x += densityStep) {
            if (Math.abs(x - midX) < densityStep * 0.35) continue;
            ctx.beginPath();
            ctx.moveTo(x, y - midTick * 0.35);
            ctx.lineTo(x, y + midTick * 0.35);
            ctx.stroke();
          }
          ctx.strokeStyle = phosphor;
          ctx.lineWidth = Math.max(1.1 / zoom, 0.8);
        }
      }
    }

    // Tracking ticks — approximate density using average advance.
    // Shown while scrubbing tracking or weight (weight changes measured advance).
    if ((ghost.letterSpacing != null || ghost.fontWeight != null) && lines[0]) {
      const sample = lines[0].slice(0, 24) || "A";
      const advance = (measure(sample) / Math.max(1, sample.length)) + (n.letterSpacing || 0);
      if (advance > 2 / zoom) {
        ctx.strokeStyle = phosphorSoft;
        ctx.lineWidth = Math.max(0.8 / zoom, 0.6);
        const count = Math.min(48, Math.floor(n.w / advance));
        for (let k = 0; k <= count; k++) {
          const x = n.x + k * advance;
          if (x > n.x + n.w) break;
          ctx.beginPath();
          ctx.moveTo(x, n.y + startY);
          ctx.lineTo(x, n.y + startY + tickH);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }
}
