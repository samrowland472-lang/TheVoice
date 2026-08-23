import { fontStack } from "./fonts";
import { drawDocument } from "./render";
import { isGradient, isImage, isPaint, isPath, isText, type DesignDocument, type Fill, type GradientFill } from "./types";

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
  const artW = doc.artboard.width * scale;
  const artH = doc.artboard.height * scale;
  const bg = typeof doc.artboard.background === "string" ? doc.artboard.background : "#ffffff";
  ctx.fillStyle = bg;
  ctx.fillRect(pad, pad, artW, artH);
  drawDocument(ctx, doc, { x: pad, y: pad, zoom: scale }, { skipChrome: true, dpr: 1 });
  if (opts?.cropMarks || paper > 0) {
    drawCropMarks(ctx, pad, pad, artW, artH, paper * scale, scale);
  }
  return canvas;
}

function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  margin: number,
  scale: number,
) {
  const mark = Math.min(margin * 0.72, 22 * scale);
  const gap = Math.max(2 * scale, 1);
  ctx.save();
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = Math.max(1, scale * 0.75);
  ctx.lineCap = "butt";
  const ticks: [number, number, number, number][] = [
    [x, y - gap, x, y - mark],
    [x - gap, y, x - mark, y],
    [x + w, y - gap, x + w, y - mark],
    [x + w + gap, y, x + w + mark, y],
    [x, y + h + gap, x, y + h + mark],
    [x - gap, y + h, x - mark, y + h],
    [x + w, y + h + gap, x + w, y + h + mark],
    [x + w + gap, y + h, x + w + mark, y + h],
  ];
  for (const [x1, y1, x2, y2] of ticks) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  const midX = x + w / 2;
  const midY = y + h / 2;
  ctx.beginPath();
  ctx.moveTo(midX, y - gap);
  ctx.lineTo(midX, y - mark);
  ctx.moveTo(midX, y + h + gap);
  ctx.lineTo(midX, y + h + mark);
  ctx.moveTo(x - gap, midY);
  ctx.lineTo(x - mark, midY);
  ctx.moveTo(x + w + gap, midY);
  ctx.lineTo(x + w + mark, midY);
  ctx.stroke();
  ctx.restore();
}

export function exportPng(doc: DesignDocument, scale = 2): string {
  return rasterize(doc, scale).toDataURL("image/png");
}

export function exportJpeg(doc: DesignDocument, scale = 2, quality = 0.92): string {
  return rasterize(doc, scale).toDataURL("image/jpeg", quality);
}

/** ~300 dpi print PNG with crop marks (4×, 36px paper if no bleed). */
export function exportPrintPng(doc: DesignDocument): string {
  return rasterize(doc, 4, { cropMarks: true, paper: 36 }).toDataURL("image/png");
}

export function downloadPrintPdf(doc: DesignDocument) {
  const canvas = rasterize(doc, 4, { cropMarks: true, paper: 36 });
  const jpeg = canvas.toDataURL("image/jpeg", 0.93);
  const paper = Math.max(doc.artboard.bleed ?? 0, 36);
  const wPt = doc.artboard.width + paper * 2;
  const hPt = doc.artboard.height + paper * 2;
  const bytes = jpegToPdf(jpeg, wPt, hPt, canvas.width, canvas.height);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(doc.name)}-print.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function jpegToPdf(dataUrl: string, wPt: number, hPt: number, pxW: number, pxH: number): Uint8Array {
  const b64 = dataUrl.split(",")[1] ?? "";
  const raw = atob(b64);
  const img = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) img[i] = raw.charCodeAt(i);
  const enc = new TextEncoder();
  const header = enc.encode("%PDF-1.4\n");
  const objects: Uint8Array[] = [];
  objects.push(enc.encode("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"));
  objects.push(enc.encode("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"));
  objects.push(
    enc.encode(
      `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >> endobj\n`,
    ),
  );
  const content = `q ${wPt.toFixed(2)} 0 0 ${hPt.toFixed(2)} 0 0 cm /Im0 Do Q\n`;
  objects.push(enc.encode(`4 0 obj << /Length ${content.length} >> stream\n${content}endstream endobj\n`));
  const imgHead = enc.encode(
    `5 0 obj << /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >> stream\n`,
  );
  const imgTail = enc.encode("\nendstream endobj\n");
  const imgObj = new Uint8Array(imgHead.length + img.length + imgTail.length);
  imgObj.set(imgHead, 0);
  imgObj.set(img, imgHead.length);
  imgObj.set(imgTail, imgHead.length + img.length);
  objects.push(imgObj);

  const parts: Uint8Array[] = [header];
  const offsets = [0];
  let pos = header.length;
  for (const obj of objects) {
    offsets.push(pos);
    parts.push(obj);
    pos += obj.length;
  }
  const xrefStart = pos;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  parts.push(enc.encode(xref));
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

const BLEND_CSS: Record<string, string> = {
  "source-over": "normal",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
  darken: "darken",
  lighten: "lighten",
  "soft-light": "soft-light",
  "hard-light": "hard-light",
  "color-dodge": "color-dodge",
  "color-burn": "color-burn",
};

function escapeXml(s: string) {
  return s
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function gradientVector(fill: GradientFill, x: number, y: number, w: number, h: number) {
  const ang = (fill.angle * Math.PI) / 180;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.hypot(w, h) / 2;
  return {
    x1: cx - Math.cos(ang) * r,
    y1: cy - Math.sin(ang) * r,
    x2: cx + Math.cos(ang) * r,
    y2: cy + Math.sin(ang) * r,
  };
}

function polyPoints(cx: number, cy: number, rx: number, ry: number, sides: number, start = -Math.PI / 2) {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = start + (i / sides) * Math.PI * 2;
    pts.push(`${cx + Math.cos(a) * rx},${cy + Math.sin(a) * ry}`);
  }
  return pts.join(" ");
}

function starPoints(cx: number, cy: number, w: number, h: number, points: number) {
  const ro = Math.min(w, h) / 2;
  const ri = ro * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = (i * Math.PI) / points - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return pts.join(" ");
}

function arrowD(x: number, y: number, w: number, h: number) {
  return [
    `M ${x} ${y + h * 0.35}`,
    `L ${x + w * 0.62} ${y + h * 0.35}`,
    `L ${x + w * 0.62} ${y}`,
    `L ${x + w} ${y + h / 2}`,
    `L ${x + w * 0.62} ${y + h}`,
    `L ${x + w * 0.62} ${y + h * 0.65}`,
    `L ${x} ${y + h * 0.65}`,
    "Z",
  ].join(" ");
}

function wrapLines(content: string, maxW: number, font: string, letterSpacing: number): string[] {
  const paragraphs = content.split("\n");
  if (typeof document === "undefined") return paragraphs;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return paragraphs;
  ctx.font = font;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
  }
  const lines: string[] = [];
  for (const p of paragraphs) {
    if (!p) {
      lines.push("");
      continue;
    }
    const words = p.split(" ");
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width <= maxW || !cur) cur = next;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

export function exportSvg(doc: DesignDocument): string {
  const { width, height, background } = doc.artboard;
  const defs: string[] = [];
  const body: string[] = [];
  let gid = 0;

  const fillAttr = (fill: Fill, x: number, y: number, w: number, h: number): string => {
    if (fill === "transparent") return "none";
    if (!isGradient(fill)) return escapeXml(fill);
    const id = `g${gid++}`;
    const v = gradientVector(fill, x, y, w, h);
    const stops = fill.stops
      .map((s) => `<stop offset="${Math.round(s.offset * 100)}%" stop-color="${escapeXml(s.color)}"/>`)
      .join("");
    defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">${stops}</linearGradient>`,
    );
    return `url(#${id})`;
  };

  const bgFill = fillAttr(typeof background === "string" || isGradient(background) ? background : "#ffffff", 0, 0, width, height);
  body.push(`<rect width="${width}" height="${height}" fill="${bgFill}"/>`);

  for (const n of doc.nodes) {
    if (!n.visible) continue;
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const rot = n.rotation ? ` transform="rotate(${n.rotation} ${cx} ${cy})"` : "";
    const op = n.opacity < 1 ? ` opacity="${n.opacity}"` : "";
    const blend = n.blend && n.blend !== "source-over" ? ` style="mix-blend-mode:${BLEND_CSS[n.blend] ?? n.blend}"` : "";
    let filter = "";
    if (n.shadow) {
      const id = `s${gid++}`;
      const std = Math.max(0, n.shadow.blur / 2);
      defs.push(
        `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${n.shadow.ox}" dy="${n.shadow.oy}" stdDeviation="${std}" flood-color="${escapeXml(n.shadow.color)}"/></filter>`,
      );
      filter = ` filter="url(#${id})"`;
    }
    const wrap = (inner: string) => `<g${rot}${op}${blend}${filter}>${inner}</g>`;
    const fill = fillAttr(n.fill, n.x, n.y, n.w, n.h);
    const stroke =
      n.strokeWidth > 0 && n.stroke !== "transparent"
        ? ` stroke="${escapeXml(n.stroke)}" stroke-width="${n.strokeWidth}"`
        : ` stroke="none"`;

    if (isText(n)) {
      const content = n.uppercase ? n.text.toUpperCase() : n.text;
      const font = `${n.fontWeight} ${n.fontSize}px ${fontStack(n.fontFamily)}`;
      const lines = wrapLines(content, n.w, font, n.letterSpacing);
      const lh = n.fontSize * n.lineHeight;
      const anchor = n.align === "center" ? "middle" : n.align === "right" ? "end" : "start";
      const ax = n.align === "center" ? n.x + n.w / 2 : n.align === "right" ? n.x + n.w : n.x;
      const ls = n.letterSpacing ? ` letter-spacing="${n.letterSpacing}"` : "";
      const tspans = lines
        .map((line, i) => `<tspan x="${ax}" y="${n.y + n.fontSize + i * lh}">${escapeXml(line)}</tspan>`)
        .join("");
      body.push(
        wrap(
          `<text font-family="${escapeXml(n.fontFamily)}" font-size="${n.fontSize}" font-weight="${n.fontWeight}" fill="${fill}" text-anchor="${anchor}"${ls}>${tspans}</text>`,
        ),
      );
    } else if (isImage(n)) {
      const filt =
        n.filters.brightness !== 1 || n.filters.contrast !== 1 || n.filters.saturate !== 1 || n.filters.blur
          ? ` style="filter:brightness(${n.filters.brightness}) contrast(${n.filters.contrast}) saturate(${n.filters.saturate}) blur(${n.filters.blur}px)"`
          : "";
      const clipId = `c${gid++}`;
      const rx = Math.max(0, Math.min(n.radius, Math.min(n.w, n.h) / 2));
      defs.push(`<clipPath id="${clipId}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}"/></clipPath>`);
      const c = n.crop && n.crop.w > 0 && n.crop.h > 0 ? n.crop : { x: 0, y: 0, w: 1, h: 1 };
      const iw = n.w / c.w;
      const ih = n.h / c.h;
      const ix = n.x - c.x * iw;
      const iy = n.y - c.y * ih;
      body.push(
        wrap(
          `<g clip-path="url(#${clipId})"><image href="${escapeXml(n.src)}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="none"${filt}/></g>`,
        ),
      );
    } else if (isPaint(n) && n.bitmap) {
      body.push(
        wrap(
          `<image href="${escapeXml(n.bitmap)}" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" preserveAspectRatio="none"/>`,
        ),
      );
    } else if (isPath(n) && n.points.length) {
      const d = n.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${n.x + p.x} ${n.y + p.y}`)
        .join(" ") + (n.closed ? " Z" : "");
      const fillRule = n.closed && n.fill !== "transparent" ? ` fill="${fill}"` : ` fill="none"`;
      body.push(wrap(`<path d="${d}"${fillRule}${stroke} stroke-linejoin="round" stroke-linecap="round"/>`));
    } else if (n.kind === "ellipse") {
      body.push(
        wrap(
          `<ellipse cx="${cx}" cy="${cy}" rx="${Math.abs(n.w / 2)}" ry="${Math.abs(n.h / 2)}" fill="${fill}"${stroke}/>`,
        ),
      );
    } else if (n.kind === "rect") {
      const rx = Math.max(0, Math.min(n.radius, Math.min(n.w, n.h) / 2));
      body.push(wrap(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}" fill="${fill}"${stroke}/>`));
    } else if (n.kind === "line") {
      body.push(
        wrap(
          `<line x1="${n.x}" y1="${n.y + n.h / 2}" x2="${n.x + n.w}" y2="${n.y + n.h / 2}" fill="none"${stroke || ` stroke="${escapeXml(n.stroke || "#d9f5e3")}" stroke-width="${n.strokeWidth || 2}"`}/>`,
        ),
      );
    } else if (n.kind === "polygon") {
      body.push(wrap(`<polygon points="${polyPoints(cx, cy, n.w / 2, n.h / 2, n.sides ?? 6)}" fill="${fill}"${stroke}/>`));
    } else if (n.kind === "star") {
      body.push(wrap(`<polygon points="${starPoints(cx, cy, n.w, n.h, n.sides ?? 5)}" fill="${fill}"${stroke}/>`));
    } else if (n.kind === "arrow") {
      body.push(wrap(`<path d="${arrowD(n.x, n.y, n.w, n.h)}" fill="${fill}"${stroke}/>`));
    } else {
      body.push(wrap(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="${fill}"${stroke}/>`));
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    defs.length ? `<defs>${defs.join("")}</defs>` : "",
    ...body,
    "</svg>",
  ].join("");
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
