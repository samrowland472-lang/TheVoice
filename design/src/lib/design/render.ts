import { applyFontFace } from "./fonts";
import { degToRad, nodeCenter } from "./geometry";
import { hitNode, nodeLocalPoint } from "./hit";
import { tracePath } from "./path-curve";
import { canvasShadowParams } from "./shadow";
import { layoutTextLines } from "./text-layout";
import { isGradient, isImage, isPaint, isPath, isText, type DesignDocument, type DesignNode, type Fill, type Shadow, type Viewport } from "./types";

const imageCache = new Map<string, HTMLImageElement>();

function clampFilter(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function getCachedImage(src: string): HTMLImageElement | null {
  const hit = imageCache.get(src);
  if (hit) return hit;
  if (typeof Image === "undefined") return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  imageCache.set(src, img);
  return img;
}

export function applyFill(ctx: CanvasRenderingContext2D, fill: Fill, x: number, y: number, w: number, h: number) {
  if (isGradient(fill)) {
    const ang = (fill.angle * Math.PI) / 180;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const len = Math.max(w, h);
    const g = ctx.createLinearGradient(cx - Math.cos(ang) * len, cy - Math.sin(ang) * len, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
    for (const s of fill.stops) g.addColorStop(s.offset, s.color);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = fill;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function polygonPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sides = 6) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const px = cx + rx * Math.cos(a);
    const py = cy + ry * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, points = 5) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : 0.4;
    const px = cx + rx * r * Math.cos(a);
    const py = cy + ry * r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function fillSilhouette(ctx: CanvasRenderingContext2D, n: DesignNode) {
  ctx.fillStyle = "#000";
  if (isText(n)) {
    applyFontFace(ctx, n);
    ctx.textAlign = n.align === "center" ? "center" : n.align === "right" ? "right" : "left";
    ctx.textBaseline = "top";
    const measure = (s: string) => ctx.measureText(s).width;
    const { lines, lineHeight, startY } = layoutTextLines(n, measure);
    ctx.beginPath();
    ctx.rect(n.x, n.y, n.w, n.h);
    ctx.clip();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      let ax = n.x;
      if (n.align === "center") ax = n.x + n.w / 2;
      if (n.align === "right") ax = n.x + n.w;
      const maxW = n.wrap === false ? n.w : undefined;
      ctx.fillText(line, ax, n.y + startY + i * lineHeight, maxW);
    }
    return;
  }
  if (isImage(n) || isPaint(n)) {
    ctx.fillRect(n.x, n.y, n.w, n.h);
    return;
  }
  if (isPath(n) && n.points.length) {
    ctx.beginPath();
    tracePath(ctx, n.x, n.y, n.points, n.closed);
    const holes = n.holes ?? [];
    for (const hole of holes) {
      if (hole.length < 3) continue;
      tracePath(ctx, n.x, n.y, hole, true);
    }
    ctx.fill(n.fillRule ?? (holes.length ? "evenodd" : "nonzero"));
    return;
  }
  switch (n.kind) {
    case "rect":
      roundRect(ctx, n.x, n.y, n.w, n.h, "radius" in n ? (n.radius as number) : 0);
      break;
    case "ellipse":
      ctx.beginPath();
      ctx.ellipse(n.x + n.w / 2, n.y + n.h / 2, Math.abs(n.w / 2), Math.abs(n.h / 2), 0, 0, Math.PI * 2);
      break;
    case "polygon":
      polygonPath(ctx, n.x, n.y, n.w, n.h, "sides" in n ? (n.sides as number) ?? 6 : 6);
      break;
    case "star":
      starPath(ctx, n.x, n.y, n.w, n.h, "sides" in n ? (n.sides as number) ?? 5 : 5);
      break;
    default:
      roundRect(ctx, n.x, n.y, n.w, n.h, 0);
  }
  ctx.fill();
}

function paintInsetShadow(ctx: CanvasRenderingContext2D, n: DesignNode, shadow: Shadow) {
  if (typeof document === "undefined") return;
  const p = canvasShadowParams(shadow);
  const pad = Math.ceil(p.blur * 2 + Math.abs(p.ox) + Math.abs(p.oy) + p.spread + 8);
  const w = Math.max(2, Math.ceil(Math.abs(n.w) + pad * 2));
  const h = Math.max(2, Math.ceil(Math.abs(n.h) + pad * 2));
  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const m = mask.getContext("2d");
  if (!m) return;
  m.translate(pad - n.x, pad - n.y);
  fillSilhouette(m, n);

  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const s = layer.getContext("2d");
  if (!s) return;
  s.fillStyle = p.color;
  s.fillRect(0, 0, w, h);
  s.globalCompositeOperation = "destination-out";
  s.shadowColor = "#000000";
  s.shadowBlur = p.blur;
  s.shadowOffsetX = p.ox;
  s.shadowOffsetY = p.oy;
  s.drawImage(mask, 0, 0);
  s.globalCompositeOperation = "destination-in";
  s.shadowColor = "transparent";
  s.shadowBlur = 0;
  s.shadowOffsetX = 0;
  s.shadowOffsetY = 0;
  s.drawImage(mask, 0, 0);

  ctx.save();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(layer, n.x - pad, n.y - pad);
  ctx.restore();
}

function drawNode(ctx: CanvasRenderingContext2D, n: DesignNode, livePaint?: { id: string; canvas: HTMLCanvasElement } | null) {
  if (!n.visible) return;
  ctx.save();
  ctx.globalAlpha = n.opacity;
  ctx.globalCompositeOperation = n.blend as GlobalCompositeOperation;
  const c = nodeCenter(n);
  if (n.rotation) {
    ctx.translate(c.x, c.y);
    ctx.rotate(degToRad(n.rotation));
    ctx.translate(-c.x, -c.y);
  }
  const drop = n.shadow ? canvasShadowParams(n.shadow) : null;
  if (drop && !drop.inset) {
    ctx.shadowColor = drop.color;
    ctx.shadowBlur = drop.blur;
    ctx.shadowOffsetX = drop.ox;
    ctx.shadowOffsetY = drop.oy;
  } else {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  if (isText(n)) {
    applyFontFace(ctx, n);
    ctx.textAlign = n.align === "center" ? "center" : n.align === "right" ? "right" : "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = typeof n.fill === "string" ? n.fill : "#d9f5e3";
    const measure = (s: string) => ctx.measureText(s).width;
    const { lines, lineHeight, startY } = layoutTextLines(n, measure);
    ctx.save();
    ctx.beginPath();
    ctx.rect(n.x, n.y, n.w, n.h);
    ctx.clip();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      let ax = n.x;
      if (n.align === "center") ax = n.x + n.w / 2;
      if (n.align === "right") ax = n.x + n.w;
      const maxW = n.wrap === false ? n.w : undefined;
      ctx.fillText(line, ax, n.y + startY + i * lineHeight, maxW);
    }
    ctx.restore();
  } else if (isImage(n)) {
    const img = getCachedImage(n.src);
    if (img && img.complete && img.naturalWidth > 0) {
      const f = n.filters ?? { brightness: 1, contrast: 1, saturate: 1, blur: 0 };
      const parts: string[] = [];
      if (f.brightness !== 1) parts.push(`brightness(${clampFilter(f.brightness, 0, 4)})`);
      if (f.contrast !== 1) parts.push(`contrast(${clampFilter(f.contrast, 0, 4)})`);
      if (f.saturate !== 1) parts.push(`saturate(${clampFilter(f.saturate, 0, 4)})`);
      if (f.blur > 0) parts.push(`blur(${clampFilter(f.blur, 0, 80)}px)`);
      if (parts.length) ctx.filter = parts.join(" ");
      const crop = n.crop;
      if (crop && crop.w > 0 && crop.h > 0) {
        const sx = crop.x * img.naturalWidth;
        const sy = crop.y * img.naturalHeight;
        const sw = Math.max(1, crop.w * img.naturalWidth);
        const sh = Math.max(1, crop.h * img.naturalHeight);
        ctx.drawImage(img, sx, sy, sw, sh, n.x, n.y, n.w, n.h);
      } else {
        ctx.drawImage(img, n.x, n.y, n.w, n.h);
      }
      if (parts.length) ctx.filter = "none";
    } else {
      applyFill(ctx, "#1a201c", n.x, n.y, n.w, n.h);
      ctx.fillRect(n.x, n.y, n.w, n.h);
    }
  } else if (isPaint(n)) {
    if (livePaint && livePaint.id === n.id) {
      ctx.drawImage(livePaint.canvas, n.x, n.y, n.w, n.h);
    } else if (n.bitmap) {
      const img = getCachedImage(n.bitmap);
      if (img) ctx.drawImage(img, n.x, n.y, n.w, n.h);
    }
  } else if (isPath(n)) {
    if (n.points.length) {
      ctx.beginPath();
      tracePath(ctx, n.x, n.y, n.points, n.closed);
      const holes = n.holes ?? [];
      for (const hole of holes) {
        if (hole.length < 3) continue;
        tracePath(ctx, n.x, n.y, hole, true);
      }
      if (n.fill !== "transparent") {
        applyFill(ctx, n.fill, n.x, n.y, n.w, n.h);
        ctx.fill(n.fillRule ?? (holes.length ? "evenodd" : "nonzero"));
      }
      if (n.strokeWidth > 0 && n.stroke !== "transparent") {
        ctx.strokeStyle = n.stroke;
        ctx.lineWidth = n.strokeWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
  } else {
    switch (n.kind) {
      case "rect":
        roundRect(ctx, n.x, n.y, n.w, n.h, n.radius);
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(n.x + n.w / 2, n.y + n.h / 2, Math.abs(n.w / 2), Math.abs(n.h / 2), 0, 0, Math.PI * 2);
        break;
      case "line":
        ctx.beginPath();
        ctx.moveTo(n.x, n.y + n.h / 2);
        ctx.lineTo(n.x + n.w, n.y + n.h / 2);
        break;
      case "polygon":
        polygonPath(ctx, n.x, n.y, n.w, n.h, n.sides ?? 6);
        break;
      case "star":
        starPath(ctx, n.x, n.y, n.w, n.h, n.sides ?? 5);
        break;
      default:
        roundRect(ctx, n.x, n.y, n.w, n.h, 0);
    }
    if (n.kind !== "line" && n.fill !== "transparent") {
      applyFill(ctx, n.fill, n.x, n.y, n.w, n.h);
      ctx.fill();
    }
    if (n.strokeWidth > 0 && n.stroke !== "transparent") {
      ctx.strokeStyle = n.stroke;
      ctx.lineWidth = n.strokeWidth;
      ctx.stroke();
    }
  }
  if (drop?.inset && n.shadow) paintInsetShadow(ctx, n, n.shadow);
  ctx.restore();
}

export function drawDocument(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocument,
  opts?: {
    skipChrome?: boolean;
    dpr?: number;
    livePaint?: { id: string; canvas: HTMLCanvasElement } | null;
    viewport?: Viewport;
    ox?: number;
    oy?: number;
  },
) {
  const dpr = opts?.dpr ?? 1;
  const { width, height, background } = doc.artboard;
  const vp = opts?.viewport;
  const ox = opts?.ox ?? 0;
  const oy = opts?.oy ?? 0;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!opts?.skipChrome) {
    ctx.fillStyle = "#070908";
    ctx.fillRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);
  }
  if (vp) {
    ctx.translate(vp.x, vp.y);
    ctx.scale(vp.zoom, vp.zoom);
  }
  ctx.translate(ox, oy);
  applyFill(ctx, background, 0, 0, width, height);
  ctx.fillRect(0, 0, width, height);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  for (const n of doc.nodes) drawNode(ctx, n, opts?.livePaint);
  ctx.restore();
}

export function fitViewport(artW: number, artH: number, viewW: number, viewH: number, pad = 56): Viewport {
  const z = Math.min((viewW - pad * 2) / artW, (viewH - pad * 2) / artH, 1.4);
  return { zoom: z, x: (viewW - artW * z) / 2, y: (viewH - artH * z) / 2 };
}

export function fitBoxViewport(box: { x: number; y: number; w: number; h: number }, viewW: number, viewH: number, pad = 64): Viewport {
  const bw = Math.max(1, box.w);
  const bh = Math.max(1, box.h);
  const z = Math.min((viewW - pad * 2) / bw, (viewH - pad * 2) / bh, 4);
  const zoom = Math.max(0.05, z);
  return { zoom, x: viewW / 2 - (box.x + bw / 2) * zoom, y: viewH / 2 - (box.y + bh / 2) * zoom };
}

export function screenToDoc(sx: number, sy: number, vp: Viewport) {
  return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom };
}

export function docToScreen(dx: number, dy: number, vp: Viewport) {
  return { x: dx * vp.zoom + vp.x, y: dy * vp.zoom + vp.y };
}

export function sampleDocColor(doc: DesignDocument, x: number, y: number): string | null {
  return null;
}
