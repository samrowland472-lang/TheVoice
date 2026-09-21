import { applyFontFace } from "./fonts";
import { degToRad, nodeCenter } from "./geometry";
import { hitNode, nodeLocalPoint } from "./hit";
import { tracePath } from "./path-curve";
import { canvasShadowParams } from "./shadow";
import { arrowPoints } from "./shape-to-path";
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

function arrowPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, headScale = 1) {
  const pts = arrowPoints(w, h, headScale);
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    if (i === 0) ctx.moveTo(x + p.x, y + p.y);
    else ctx.lineTo(x + p.x, y + p.y);
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

export function applyStrokeStyle(ctx: CanvasRenderingContext2D, n: DesignNode) {
  const dash = n.strokeDash ?? 0;
  if (dash > 0) {
    ctx.setLineDash([dash, dash]);
    ctx.lineDashOffset = n.strokeDashOffset ?? 0;
  } else {
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }
  ctx.lineCap = n.lineCap ?? "butt";
  ctx.lineJoin = n.lineJoin ?? "miter";
  ctx.miterLimit = n.miterLimit ?? 10;
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
    case "arrow":
      arrowPath(ctx, n.x, n.y, n.w, n.h, "headScale" in n ? (n.headScale as number) ?? 1 : 1);
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
