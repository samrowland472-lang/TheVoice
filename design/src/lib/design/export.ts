import { drawDocument } from "./render";
import type { DesignDocument } from "./types";

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
  const pad = paper * scale;
  drawDocument(ctx, doc, { x: pad, y: pad, zoom: scale }, { skipChrome: true, dpr: 1 });
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

export function exportSvg(doc: DesignDocument): string {
  const { width, height } = doc.artboard;
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";
  const body = doc.nodes
    .filter((n) => n.visible)
    .map((n) => {
      const fill = typeof n.fill === "string" ? n.fill : "#d9f5e3";
      const rot = n.rotation ? ` transform=\"rotate(${n.rotation} ${n.x + n.w / 2} ${n.y + n.h / 2})\"` : "";
      return `<rect x=\"${n.x}\" y=\"${n.y}\" width=\"${n.w}\" height=\"${n.h}\" fill=\"${fill}\"${rot}/>`;
    })
    .join("");
  return `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\"><rect width=\"${width}\" height=\"${height}\" fill=\"${bg}\"/>${body}</svg>`;
}

export function downloadSvg(doc: DesignDocument) {
  const blob = new Blob([exportSvg(doc)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(doc.name)}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "design";
}
