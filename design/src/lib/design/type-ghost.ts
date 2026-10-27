import { layoutTextLines, measureTracked } from "./text-layout";
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
 * Horizontal lines mark leading intervals; tracking density marks follow the measured average advance of each line.
 * Weight ghosts update the measured advance and may thicken the leading lines.
 * Size and leading ghosts add baseline ticks at the left and right of each line.
 * Size and leading ghosts also add a mid-line center tick and intermediate density marks along each baseline.
 * Leading density spacing follows the ghosted line height so the vertical rhythm is readable while scrubbing.
 * Tracking ghosts on short lines (≤8 glyphs) draw per-glyph advance ticks aligned to the text.
 * When preferPerGlyph is true, per-glyph ticks are used for all lines up to a safe length, independent of the short-line cutoff.
 * When weightTickThickness is true, density and per-glyph ticks scale thickness and height with the ghosted font weight.
 * When glyphDensityScale is true, intermediate density and average-advance tick spacing scale with the ghosted font size (denser for larger type).
 */
export function drawTypeRhythmGhosts(
  ctx: CanvasRenderingContext2D,
  nodes: DesignNode[],
  ghost: NonNullable<TypeGhost>,
  zoom: number,
  preferPerGlyph = true,
  weightTickThickness = true,
  glyphDensityScale = true,
) {
  const phosphor = "rgba(63,198,255,0.85)";
  const phosphorSoft = "rgba(63,198,255,0.35)";
  const tickH = Math.max(4 / zoom, 3);

  for (const raw of nodes) {
    if (!isText(raw)) continue;
    const n = applyTypeGhost(raw, ghost);
    const densityFactor = glyphDensityScale
      ? Math.max(0.55, Math.min(2.4, Math.sqrt(Math.max(6, n.fontSize) / 16)))
      : 1;
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
      const densityStep = Math.max(n.fontSize * 0.55 / densityFactor, 8 / zoom);
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
      const densityStep = Math.max(lineHeight * 0.65 / densityFactor, 10 / zoom);
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

    // Tracking density marks — spaced by the measured average advance of the line content.
    // Shown while scrubbing tracking or weight (weight changes measured advance).
    // Drawn near each baseline so they follow the actual text density more closely than a single top row.
    // Per-glyph advance ticks (aligned to the line’s text-align) are used for short lines by default,
    // or for any line up to 32 glyphs when preferPerGlyph is on, so the rhythm stays precise independent of length.
    // When weightTickThickness is on and weight is being scrubbed, tick thickness and height scale with the ghosted weight.
    if ((ghost.letterSpacing != null || ghost.fontWeight != null) && lines.length) {
      ctx.strokeStyle = phosphorSoft;
      const baseTickW = Math.max(0.75 / zoom, 0.55);
      const baseMid = Math.max(3.2 / zoom, 2.4);
      let wFactor = 1;
      if (weightTickThickness && ghost.fontWeight != null) {
        wFactor = Math.max(0.6, Math.min(2.6, (n.fontWeight || 400) / 400));
      }
      ctx.lineWidth = baseTickW * wFactor;
      const midTick = baseMid * Math.pow(wFactor, 0.55);
      const SHORT = 8;
      const PER_GLYPH_MAX = 32;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] || "";
        if (!line) continue;
        const y = n.y + startY + i * lineHeight + n.fontSize * 0.8;
        const tracking = n.letterSpacing || 0;
        const usePerGlyph = preferPerGlyph ? line.length <= PER_GLYPH_MAX : line.length <= SHORT;

        if (usePerGlyph) {
          // Per-glyph advance ticks
          const lineW = measureTracked(line, measure, tracking);
          let startX = n.x;
          if (n.align === "center") startX = n.x + Math.max(0, (n.w - lineW) / 2);
          else if (n.align === "right") startX = n.x + Math.max(0, n.w - lineW);
          let cum = 0;
          for (let g = 0; g < line.length; g++) {
            const chW = measure(line[g]);
            const tickX = startX + cum + chW * 0.5;
            if (tickX > n.x && tickX < n.x + n.w) {
              ctx.beginPath();
              ctx.moveTo(tickX, y - midTick);
              ctx.lineTo(tickX, y + midTick * 0.4);
              ctx.stroke();
            }
            cum += chW + (g < line.length - 1 ? tracking : 0);
          }
        } else {
          // Average advance for longer lines
          const sample = line.slice(0, 32) || "A";
          const glyphW = measure(sample);
          const advance = Math.max(
            2 / zoom,
            (glyphW / Math.max(1, sample.length) + tracking) / densityFactor,
          );
          if (advance < 2.2 / zoom) continue;
          const startX = n.x + Math.min(advance * 0.35, 8 / zoom);
          for (let x = startX; x < n.x + n.w - advance * 0.2; x += advance) {
            ctx.beginPath();
            ctx.moveTo(x, y - midTick);
            ctx.lineTo(x, y + midTick * 0.4);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }
}
