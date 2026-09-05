import { variationSettings } from "./fonts";
import { aabb } from "./geometry";
import { pathD } from "./path-curve";
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

export function rasterize(
  doc: DesignDocument,
  scale = 1,
  opts?: { cropMarks?: boolean; paper?: number },
): HTMLCanvasElement {
  const bleed = Math.max(0, doc.artboard.bleed ?? 0);
  const paper = opts?.cropMarks ? Math.max(bleed, opts.paper ?? 36) : bleed;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((doc.artboard.width + paper * 2) * scale);
  canvas.height = Math.round((doc.artboard.height + paper * 2) * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawDocument(ctx, doc, { skipChrome: true, dpr: scale, ox: paper, oy: paper });
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

export function downloadPrintPdf(doc: DesignDocument) {
  downloadDataUrl(exportPrintPng(doc), `${slug(doc.name)}-print.png`);
}

function esc(s: string) {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, """);
}

function nodeSvg(n: DesignNode): string {
  const fill = typeof n.fill === "string" ? n.fill : "#d9f5e3";
  const opacity = n.opacity < 1 ? ` opacity="${n.opacity}"` : "";
  const rot = n.rotation ? ` transform="rotate(${n.rotation} ${n.x + n.w / 2} ${n.y + n.h / 2})"` : "";
  const stroke =
    n.strokeWidth > 0 && n.stroke !== "transparent"
      ? ` stroke="${esc(n.stroke)}" stroke-width="${n.strokeWidth}"`
      : "";
  if (n.kind === "path") {
    const p = n as PathNode;
    const holes = p.holes ?? [];
    const d = pathD(p.x, p.y, p.points, p.closed || holes.length > 0) + holes.map((h) => pathD(p.x, p.y, h, true)).join("");
    const rule = p.fillRule ?? (holes.length ? "evenodd" : "nonzero");
    return `<path d="${esc(d)}" fill="${esc(fill)}" fill-rule="${rule}" clip-rule="${rule}"${stroke}${opacity}${rot}${shadowAttr(n)}/>`;
  }
  if (n.kind === "ellipse") {
    return `<ellipse cx="${n.x + n.w / 2}" cy="${n.y + n.h / 2}" rx="${Math.abs(n.w / 2)}" ry="${Math.abs(n.h / 2)}" fill="${esc(fill)}"${stroke}${opacity}${rot}${shadowAttr(n)}/>`;
  }
  if (n.kind === "text") {
    const t = n as TextNode;
    const settings = variationSettings(t);
    const axes = settings ? ` font-variation-settings="${esc(settings)}"` : "";
    const track = t.letterSpacing ? ` letter-spacing="${t.letterSpacing}px"` : "";
    const caseAttr = t.uppercase ? ` text-transform="uppercase"` : "";
    const anchor = t.align === "center" ? "middle" : t.align === "right" ? "end" : "start";
    let tx = t.x;
    if (t.align === "center") tx = t.x + t.w / 2;
    if (t.align === "right") tx = t.x + t.w;
    const copy = t.uppercase ? t.text.toUpperCase() : t.text;
    return `<text x="${tx}" y="${t.y + t.fontSize}" fill="${esc(fill)}" font-size="${t.fontSize}" font-weight="${t.fontWeight}" font-family="${esc(t.fontFamily)}" text-anchor="${anchor}"${track}${axes}${caseAttr}${opacity}${rot}${shadowAttr(n)}>${esc(copy)}</text>`;
  }
  if (n.kind === "line") {
    return `<line x1="${n.x}" y1="${n.y + n.h / 2}" x2="${n.x + n.w}" y2="${n.y + n.h / 2}" stroke="${esc(n.stroke === "transparent" ? fill : n.stroke)}" stroke-width="${Math.max(n.strokeWidth, 1)}"${opacity}${rot}${shadowAttr(n)}/>`;
  }
  return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${esc(fill)}"${stroke}${opacity}${rot}${shadowAttr(n)}/>`;
}

function svgShadowDefs(nodes: DesignNode[]): string {
  const filters = nodes.filter((n) => n.shadow).map((n) => svgShadowFilter(n.id, n.shadow!));
  if (!filters.length) return "";
  return `<defs>${filters.join("")}</defs>`;
}

export function exportSvg(doc: DesignDocument, ids?: string[]): string {
  const { width, height } = doc.artboard;
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";
  const wanted = ids?.length ? new Set(ids) : null;
  const nodes = doc.nodes.filter((n) => n.visible && (!wanted || wanted.has(n.id)));
  const defs = svgShadowDefs(nodes);
  const body = nodes.map(nodeSvg).join("");
  if (wanted && nodes.length) {
    const box = aabb(nodes);
    const pad = 8;
    const x = box.x - pad;
    const y = box.y - pad;
    const w = Math.max(1, box.w + pad * 2);
    const h = Math.max(1, box.h + pad * 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${defs}${body}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs}<rect width="${width}" height="${height}" fill="${esc(bg)}"/>${body}</svg>`;
}

export function downloadSvg(doc: DesignDocument, ids?: string[]) {
  const blob = new Blob([exportSvg(doc, ids)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const suffix = ids?.length ? "-selection" : "";
  downloadDataUrl(url, `${slug(doc.name)}${suffix}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSelectionPng(doc: DesignDocument, ids: string[], scale = 2): string | null {
  const nodes = doc.nodes.filter((n) => ids.includes(n.id) && n.visible);
  if (!nodes.length) return null;
  const box = aabb(nodes);
  const pad = 8;
  const crop: DesignDocument = {
    ...doc,
    artboard: { ...doc.artboard, width: Math.max(1, box.w + pad * 2), height: Math.max(1, box.h + pad * 2), background: "transparent" },
    nodes: nodes.map((n) => ({ ...n, x: n.x - box.x + pad, y: n.y - box.y + pad })),
  };
  return rasterize(crop, scale).toDataURL("image/png");
}

export function downloadSelectionPng(doc: DesignDocument, ids: string[], scale = 2) {
  const url = exportSelectionPng(doc, ids, scale);
  if (!url) return false;
  downloadDataUrl(url, `${slug(doc.name)}-selection.png`);
  return true;
}

export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "design";
}
