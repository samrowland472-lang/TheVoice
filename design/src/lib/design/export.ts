import { partitionPathHoles, pathFillRule } from "./fill-rule";
import { applyFontFace, canvasFont, clampAxis, variationSettings } from "./fonts";
import { bakeRotatedPoints, pathD } from "./path-curve";
import { isConvertibleShape, shapeContour } from "./shape-to-path";
import { drawPrintMarks, resolveBleed } from "./print-marks";
import { drawDocument } from "./render";
import { canvasShadowParams } from "./shadow";
import { layoutTextLines, measureTracked } from "./text-layout";
import type { DesignDocument, DesignNode, PathNode, PathPoint, Shadow, ShapeNode, TextNode } from "./types";
import { buildJpegPdf, downloadBytes, jpegFromDataUrl } from "./export-pdf";
export { jpegFromDataUrl, buildJpegPdf, downloadBytes } from "./export-pdf";

export { canvasShadowParams } from "./shadow";

function svgFilterId(id: string) {
  return `sh-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function svgShadowFilter(id: string, shadow: Shadow): string {
  const p = canvasShadowParams(shadow);
  const fid = svgFilterId(id);
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

function shadowAttr(n: DesignNode): string {
  if (!n.shadow) return "";
  return ` filter="url(#${svgFilterId(n.id)})"`;
}
