import { partitionPathHoles, pathFillRule } from "./fill-rule";
import { variationSettings } from "./fonts";
import { aabb } from "./geometry";
import { pathD } from "./path-curve";
import { shapeContour } from "./shape-to-path";
import { drawPrintMarks, resolveBleed } from "./print-marks";
import { drawDocument } from "./render";
import { canvasShadowParams } from "./shadow";
import type { DesignDocument, DesignNode, PathNode, Shadow, TextNode } from "./types";

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

const SVG_BLENDS = "multiply,screen,overlay,darken,lighten,soft-light,hard-light,color-dodge,color-burn";

function blendAttr(n: DesignNode): string {
  const blend = n.blend;
  if (!blend || blend === "source-over") return "";
  if (!SVG_BLENDS.split(",").includes(blend)) return "";
  return ` style="mix-blend-mode:${blend}"`;
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
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "artboard";
}

export function downloadPrintPdf(doc: DesignDocument) {
  downloadDataUrl(exportPrintPng(doc), `${slug(doc.name)}-print.png`);
}

export function exportSvg(doc: DesignDocument): string {
  const { width, height, background } = doc.artboard;
  const bg = typeof background === "string" ? background : "#ffffff";
  const body = doc.nodes
    .filter((n) => n.visible)
    .map((n) => {
      const fill = typeof n.fill === "string" ? n.fill : "#3fc6ff";
      const extra = svgStrokeStyle(n);
      const shadow = n.shadow ? svgShadowFilter(n.id, n.shadow) : "";
      if (n.kind === "text") {
        const t = n as TextNode;
        return `${shadow}<text x="${n.x}" y="${n.y + n.h * 0.8}" fill="${esc(fill)}" font-size="${t.fontSize}"${shadowAttr(n)}${blendAttr(n)}>${esc(t.text)}</text>`;
      }
      if (n.kind === "path") {
        const p = n as PathNode;
        return `${shadow}<path d="${esc(pathD(p.x, p.y, p.points, p.closed))}" fill="${esc(fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${shadowAttr(n)}${blendAttr(n)}/>`;
      }
      return `${shadow}<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${esc(fill)}" stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"${extra}${shadowAttr(n)}${blendAttr(n)}/>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${esc(bg)}"/>${body}</svg>`;
}

export function downloadSvg(doc: DesignDocument) {
  const blob = new Blob([exportSvg(doc)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(doc.name)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function esc(s: string) {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}
