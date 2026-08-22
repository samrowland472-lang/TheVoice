import { drawDocument } from "./render";
import type { DesignDocument } from "./types";

export function rasterize(doc: DesignDocument, scale = 1): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(doc.artboard.width * scale);
  canvas.height = Math.round(doc.artboard.height * scale);
  const ctx = canvas.getContext("2d")!;
  drawDocument(
    ctx,
    doc,
    { x: 0, y: 0, zoom: scale },
    { skipChrome: true, dpr: 1 },
  );
  return canvas;
}

export function exportPng(doc: DesignDocument, scale = 2): string {
  return rasterize(doc, scale).toDataURL("image/png");
}

export function exportJpeg(doc: DesignDocument, scale = 2, quality = 0.92): string {
  return rasterize(doc, scale).toDataURL("image/jpeg", quality);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function exportSvg(doc: DesignDocument): string {
  const { width, height, background } = doc.artboard;
  const bg = typeof background === "string" ? background : "#ffffff";
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${bg}"/>`,
  ];
  for (const n of doc.nodes) {
    if (!n.visible) continue;
    const t = n.rotation ? ` transform="rotate(${n.rotation} ${n.x + n.w / 2} ${n.y + n.h / 2})"` : "";
    const fill = typeof n.fill === "string" ? n.fill : "none";
    const op = n.opacity < 1 ? ` opacity="${n.opacity}"` : "";
    if (n.kind === "text") {
      const content = n.uppercase ? n.text.toUpperCase() : n.text;
      const anchor = n.align === "center" ? "middle" : n.align === "right" ? "end" : "start";
      const x = n.align === "center" ? n.x + n.w / 2 : n.align === "right" ? n.x + n.w : n.x;
      parts.push(
        `<text x="${x}" y="${n.y + n.fontSize}" font-family="${n.fontFamily}" font-size="${n.fontSize}" font-weight="${n.fontWeight}" fill="${fill}" text-anchor="${anchor}"${op}${t}>${escapeXml(content)}</text>`,
      );
    } else if (n.kind === "ellipse") {
      parts.push(
        `<ellipse cx="${n.x + n.w / 2}" cy="${n.y + n.h / 2}" rx="${n.w / 2}" ry="${n.h / 2}" fill="${fill}" stroke="${n.stroke}" stroke-width="${n.strokeWidth}"${op}${t}/>`,
      );
    } else if (n.kind === "rect") {
      parts.push(
        `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.radius}" fill="${fill}" stroke="${n.stroke}" stroke-width="${n.strokeWidth}"${op}${t}/>`,
      );
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
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
