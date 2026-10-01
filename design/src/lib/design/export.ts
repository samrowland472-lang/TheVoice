import { partitionPathHoles, pathFillRule } from "./fill-rule";
import { applyFontFace, canvasFont, clampAxis, variationSettings } from "./fonts";
import { bakeRotatedPoints, pathD } from "./path-curve";
import { isConvertibleShape, shapeContour } from "./shape-to-path";
import { drawPrintMarks, resolveBleed } from "./print-marks";
import { drawDocument } from "./render";
import { canvasShadowParams } from "./shadow";
import { layoutTextLines, measureTracked } from "./text-layout";
import type { DesignDocument, DesignNode, GroupNode, PathNode, PathPoint, Shadow, ShapeNode, TextNode } from "./types";
import { isGroup } from "./types";
import {
  buildJpegPdf as writeJpegPdf,
  downloadBytes,
  jpegFromDataUrl,
  type JpegPdfPage,
} from "./export-pdf";
export { jpegFromDataUrl, downloadBytes } from "./export-pdf";

export { canvasShadowParams } from "./shadow";
void applyFontFace;

/** JPEG pages are written with /Filter /DCTDecode. */
export function buildJpegPdf(pages: JpegPdfPage[], title = "The Voice"): Uint8Array {
  return writeJpegPdf(pages, title);
}

function svgFilterId(id: string, prefix = "") {
  return `${prefix}sh-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function svgShadowFilter(id: string, shadow: Shadow, prefix = ""): string {
  const p = canvasShadowParams(shadow);
  const fid = svgFilterId(id, prefix);
  const std = Math.max(0.01, p.blur / 2);
  if (p.inset) {
    return `<filter id="${fid}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="${p.ox}" dy="${p.oy}" result="off"/><feGaussianBlur in="off" stdDeviation="${std}" result="blur"/><feComposite in="SourceAlpha" in2="blur" operator="out" result="hollow"/><feFlood flood-color="${esc(p.color)}" result="tint"/><feComposite in="tint" in2="hollow" operator="in" result="shade"/><feComposite in="shade" in2="SourceGraphic" operator="over"/></filter>`;
  }
  const dilate =
    p.spread > 0
      ? `<feMorphology in="SourceAlpha" operator="dilate" radius="${p.spread}" result="fat"/><feOffset in="fat" dx="${p.ox}" dy="${p.oy}" result="off"/>`
      : `<feOffset in="SourceAlpha" dx="${p.ox}" dy="${p.oy}" result="off"/>`;
  return `<filter id="${fid}" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">${dilate}<feGaussianBlur in="off" stdDeviation="${std}" result="blur"/><feFlood flood-color="${esc(p.color)}" result="tint"/><feComposite in="tint" in2="blur" operator="in" result="shade"/><feMerge><feMergeNode in="shade"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

function shadowAttr(n: DesignNode, prefix = ""): string {
  if (!n.shadow) return "";
  return ` filter="url(#${svgFilterId(n.id, prefix)})"`;
}

const SVG_BLENDS = "multiply,screen,overlay,darken,lighten,soft-light,hard-light,color-dodge,color-burn";

function blendAttr(n: DesignNode): string {
  const blend = n.blend;
  if (!blend || blend === "source-over") return "";
  if (!SVG_BLENDS.split(",").includes(blend)) return "";
  return ` style="mix-blend-mode:${blend}"`;
}

/** Non-normal group blend. Isolation flattens the nest before the blend hits the artboard. */
export function svgGroupBlendStyle(n: { blend: string }): string {
  const blend = n.blend;
  if (!blend || blend === "source-over") return "";
  if (!SVG_BLENDS.split(",").includes(blend)) return "";
  return ` style="isolation:isolate;mix-blend-mode:${blend}" data-isolate="1"`;
}

/** Own opacity. A wrapping group multiplies this via the parent <g>, it does not replace it. */
export function svgOpacityAttr(n: { opacity: number }): string {
  if (n.opacity === 1 || Number.isNaN(n.opacity)) return "";
  return ` opacity="${n.opacity}"`;
}

/** Canvas rotates about the node box center — SVG must match. */
export function svgRotateTransform(n: Pick<DesignNode, "x" | "y" | "w" | "h" | "rotation">): string {
  const rot = n.rotation ?? 0;
  if (!rot) return "";
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  return `rotate(${rot} ${cx} ${cy})`;
}

function rotateWrap(n: DesignNode, inner: string): string {
  const t = svgRotateTransform(n);
  if (!t) return inner;
  return `<g transform="${t}">${inner}</g>`;
}

/** World-space path d with rotation baked into anchors and cubic handles. */
export function bakedPathD(
  n: Pick<DesignNode, "x" | "y" | "w" | "h" | "rotation">,
  pts: PathPoint[],
  closed: boolean,
): string {
  const rot = n.rotation ?? 0;
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const baked = bakeRotatedPoints(n.x, n.y, pts, rot, cx, cy);
  return pathD(0, 0, baked, closed);
}

export function svgStrokeStyle(
  n: Pick<DesignNode, "strokeDash" | "strokeDashOffset" | "lineCap" | "lineJoin" | "miterLimit">,
): string {
  const parts: string[] = [];
  const dash = n.strokeDash ?? 0;
  if (dash > 0) {
    parts.push(` stroke-dasharray="${dash} ${dash}"`);
    const off = n.strokeDashOffset ?? 0;
    if (off) parts.push(` stroke-dashoffset="${off}"`);
  }
  const cap = n.lineCap ?? "round";
  parts.push(` stroke-linecap="${cap}"`);
  const join = n.lineJoin ?? "round";
  parts.push(` stroke-linejoin="${join}"`);
  const miter = n.miterLimit ?? 4;
  if (join === "miter") parts.push(` stroke-miterlimit="${miter}"`);
  return parts.join("");
}

export function rasterize(
  doc: DesignDocument,
  scale = 1,
  opts?: { cropMarks?: boolean; paper?: number },
): HTMLCanvasElement {
  const edges = resolveBleed(doc);
  const paperBase = opts?.cropMarks ? (opts.paper ?? 36) : 0;
  const paper = Math.max(edges.left, edges.right, edges.top, edges.bottom, paperBase);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((doc.artboard.width + paper * 2) * scale);
  canvas.height = Math.round((doc.artboard.height + paper * 2) * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawDocument(ctx, doc, { skipChrome: true, dpr: scale, ox: paper, oy: paper });
  if (opts?.cropMarks) {
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.translate(paper, paper);
    drawPrintMarks(ctx, doc, scale, { bleedBand: false, marks: true });
    ctx.restore();
  }
  return canvas;
}

export function exportPng(doc: DesignDocument, scale = 2): string {
  return rasterize(doc, scale).toDataURL("image/png");
}

export function exportJpeg(doc: DesignDocument, scale = 2, quality = 0.92): string {
  return rasterize(doc, scale).toDataURL("image/jpeg", quality);
}

export function exportPrintPng(doc: DesignDocument): string {
  return rasterize(doc, 4, { cropMarks: true, paper: 36 }).toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "artboard"
  );
}

export function printJpegPage(doc: DesignDocument, scale = 2, quality = 0.92) {
  const url = rasterize(doc, scale, { cropMarks: true, paper: 36 }).toDataURL("image/jpeg", quality);
  const edges = resolveBleed(doc);
  const paper = Math.max(edges.left, edges.right, edges.top, edges.bottom, 36);
  return {
    width: Math.round((doc.artboard.width + paper * 2) * scale),
    height: Math.round((doc.artboard.height + paper * 2) * scale),
    jpeg: jpegFromDataUrl(url),
  };
}

export function downloadPrintPdf(doc: DesignDocument) {
  const page = printJpegPage(doc, 2, 0.92);
  downloadBytes(buildJpegPdf([page], doc.name), `${slug(doc.name)}-print.pdf`, "application/pdf");
}

function estimateGlyphWidth(text: string, fontSize: number, opticalScale = 1) {
  if (!text) return 0;
  return text.length * fontSize * 0.52 * opticalScale;
}

/**
 * Caption optical size (low opsz) runs wider per em than display optical size.
 * Canvas wrap uses measureText after applyFontFace — SVG wrap must follow the
 * same direction so line breaks do not drift when opsz moves off fontSize.
 */
export function opticalWrapScale(
  t: Pick<TextNode, "fontFamily" | "fontSize" | "opticalSize">,
): number {
  const axis = canvasFont(t.fontFamily)?.opsz;
  if (!axis) return 1;
  const opsz = clampAxis(axis, t.opticalSize, t.fontSize);
  const span = Math.max(1, axis.max - axis.min);
  const tnorm = (opsz - axis.min) / span;
  return 1.08 - 0.12 * tnorm;
}

function estimateWidth(
  text: string,
  fontSize: number,
  letterSpacing: number,
  opticalScale = 1,
) {
  return measureTracked(text, (s) => estimateGlyphWidth(s, fontSize, opticalScale), letterSpacing);
}

function svgTextClipId(id: string, prefix = "") {
  return `${prefix}tb-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Clip overflowing glyphs to the text box, matching canvas ctx.clip() on the node rect. */
export function svgTextBoxClip(t: Pick<TextNode, "id" | "x" | "y" | "w" | "h">, prefix = ""): string {
  const cid = svgTextClipId(t.id, prefix);
  return `<clipPath id="${cid}"><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"/></clipPath>`;
}

export function collectSvgDefs(doc: DesignDocument, prefix = ""): string {
  const parts: string[] = [];
  for (const n of doc.nodes) {
    if (!n.visible) continue;
    if (n.shadow) parts.push(svgShadowFilter(n.id, n.shadow, prefix));
    if (n.kind === "text") parts.push(svgTextBoxClip(n as TextNode, prefix));
  }
  return parts.join("");
}

export function svgTextMarkup(t: TextNode, fill: string, prefix = ""): string {
  const opszScale = opticalWrapScale(t);
  const measure = (s: string) => estimateWidth(s, t.fontSize, t.letterSpacing ?? 0, opszScale);
  const { lines, lineHeight, startY } = layoutTextLines(t, measure);
  const anchor = t.align === "center" ? "middle" : t.align === "right" ? "end" : "start";
  let ax = t.x;
  if (t.align === "center") ax = t.x + t.w / 2;
  if (t.align === "right") ax = t.x + t.w;
  const family = esc(t.fontFamily || "sans-serif");
  const weight = t.fontWeight || 400;
  const tracking = t.letterSpacing ? ` letter-spacing="${t.letterSpacing}"` : "";
  const axes = variationSettings(t);
  const blend = blendAttr(t);
  const styles: string[] = [];
  if (axes) styles.push(`font-variation-settings:${axes}`);
  const blendMatch = blend.match(/mix-blend-mode:([^"]+)/);
  if (blendMatch) styles.push(`mix-blend-mode:${blendMatch[1]}`);
  const styleAttr = styles.length ? ` style="${esc(styles.join(";"))}"` : "";
  const tspans = lines
    .map((line, i) => {
      const y = t.y + startY + i * lineHeight;
      return `<tspan x="${ax}" y="${y}">${esc(line)}</tspan>`;
    })
    .join("");
  const clip = ` clip-path="url(#${svgTextClipId(t.id, prefix)})"`;
  return `<text fill="${esc(fill)}" font-size="${t.fontSize}" font-family="${family}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="hanging"${tracking}${styleAttr}${svgOpacityAttr(t)}${shadowAttr(t, prefix)}${clip}>${tspans}</text>`;
}

function svgLeafMarkup(n: DesignNode, prefix: string): string {
  const fill = typeof n.fill === "string" ? n.fill : "#3fc6ff";
  const extra = svgStrokeStyle(n);
  if (n.kind === "text") {
    return rotateWrap(n, svgTextMarkup(n as TextNode, fill, prefix));
  }
  if (n.kind === "path") {
    const p = n as PathNode;
    const { cut, islands } = partitionPathHoles(p);
    const parts = [bakedPathD(p, p.points, p.closed), ...cut.map((ring) => bakedPathD(p, ring, true))];
    const rule = pathFillRule(p);
    const ruleAttr = cut.length || rule === "evenodd" ? ` fill-rule="${rule}"` : "";
    const holeIslands = islands
      .map(
        (ring) =>
          `<path d="${esc(bakedPathD(p, ring, true))}" fill="${esc(fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${svgOpacityAttr(n)}${blendAttr(n)}/>`,
      )
      .join("");
    const islandGroup = holeIslands ? `<g data-islands="1">${holeIslands}</g>` : "";
    return `<path d="${esc(parts.join(" "))}" fill="${esc(fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${ruleAttr}${svgOpacityAttr(n)}${shadowAttr(n, prefix)}${blendAttr(n)}/>${islandGroup}`;
  }
  if (isConvertibleShape(n)) {
    const s = n as ShapeNode;
    const contour = shapeContour(s);
    return `<path d="${esc(bakedPathD(s, contour.points, contour.closed))}" fill="${esc(fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${svgOpacityAttr(n)}${shadowAttr(n, prefix)}${blendAttr(n)}/>`;
  }
  return rotateWrap(
    n,
    `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${esc(fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${svgOpacityAttr(n)}${shadowAttr(n, prefix)}${blendAttr(n)}/>`,
  );
}

function svgGroupId(id: string, prefix = "") {
  return `${prefix}g-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Logical group wrapper. Children keep artboard coordinates, so the group does not add a transform.
 *  Opacity sits on this <g>. A non-normal blend also isolates the nest so the group composites
 *  as one unit against the artboard, not child-by-child against siblings inside the group.
 *  Leaves still write their own opacity.
 */
export function svgGroupOpen(n: GroupNode, prefix = ""): string {
  return `<g id="${svgGroupId(n.id, prefix)}" data-kind="group" data-name="${esc(n.name || "Group")}"${svgOpacityAttr(n)}${svgGroupBlendStyle(n)}>`;
}

export function exportSvgBody(doc: DesignDocument, prefix = ""): string {
  const ids = new Set(doc.nodes.map((n) => n.id));
  const byParent = new Map<string | undefined, DesignNode[]>();
  for (const n of doc.nodes) {
    const key = n.parentId && ids.has(n.parentId) ? n.parentId : undefined;
    const list = byParent.get(key) ?? [];
    list.push(n);
    byParent.set(key, list);
  }
  const walk = (parentId: string | undefined): string => {
    const kids = byParent.get(parentId) ?? [];
    return kids
      .map((n) => {
        if (isGroup(n)) {
          const inner = walk(n.id);
          if (!n.visible) return inner;
          return `${svgGroupOpen(n, prefix)}${inner}</g>`;
        }
        if (!n.visible) return "";
        return svgLeafMarkup(n, prefix);
      })
      .join("");
  };
  return walk(undefined);
}

export function exportSvg(doc: DesignDocument): string {
  const { width, height, background } = doc.artboard;
  const bg = typeof background === "string" ? background : "#ffffff";
  const defs = collectSvgDefs(doc);
  const defsBlock = defs ? `<defs>${defs}</defs>` : "";
  const body = exportSvgBody(doc);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defsBlock}<rect width="100%" height="100%" fill="${esc(bg)}"/>${body}</svg>`;
}

export function downloadSvg(doc: DesignDocument) {
  const blob = new Blob([exportSvg(doc)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(doc.name)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function esc(s: string) {
  return s
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

export function pdfTypePageCount(bytes: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(bytes);
  return (text.match(/\/Type\s*\/Page(?!s)/g) || []).length;
}

export function pdfPagesCountField(bytes: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(bytes);
  const match = text.match(/\/Count\s+(\d+)/);
  return match ? Number(match[1]) : 0;
}
