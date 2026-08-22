import { fontStack } from "./fonts";
import { degToRad, nodeCenter } from "./geometry";
import { isGradient, isImage, isPaint, isPath, isText, type DesignDocument, type DesignNode, type Fill, type Viewport } from "./types";

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string): HTMLImageElement | null {
  const hit = imageCache.get(src);
  if (hit && hit.complete) return hit;
  if (hit) return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  imageCache.set(src, img);
  return img.complete ? img : null;
}

export function applyFill(ctx: CanvasRenderingContext2D, fill: Fill, x: number, y: number, w: number, h: number) {
  if (isGradient(fill)) {
    const ang = (fill.angle * Math.PI) / 180;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.hypot(w, h) / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(ang) * r, cy - Math.sin(ang) * r, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    for (const s of fill.stops) g.addColorStop(s.offset, s.color);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = fill;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, points = 5) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ro = Math.min(w, h) / 2;
  const ri = ro * 0.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
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
    const px = cx + Math.cos(a) * rx;
    const py = cy + Math.sin(a) * ry;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, content: string, maxW: number): string[] {
  const paragraphs = content.split("\n");
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

export function drawNode(ctx: CanvasRenderingContext2D, n: DesignNode) {
  if (!n.visible) return;
  ctx.save();
  ctx.globalAlpha *= n.opacity;
  ctx.globalCompositeOperation = n.blend;
  const c = nodeCenter(n);
  ctx.translate(c.x, c.y);
  ctx.rotate(degToRad(n.rotation));
  ctx.translate(-c.x, -c.y);

  if (n.shadow) {
    ctx.shadowColor = n.shadow.color;
    ctx.shadowBlur = n.shadow.blur;
    ctx.shadowOffsetX = n.shadow.ox;
    ctx.shadowOffsetY = n.shadow.oy;
  }

  if (isText(n)) {
    const weight = n.fontWeight;
    ctx.font = `${weight} ${n.fontSize}px ${fontStack(n.fontFamily)}`;
    ctx.fillStyle = typeof n.fill === "string" ? n.fill : "#d9f5e3";
    ctx.textBaseline = "top";
    ctx.textAlign = n.align;
    const ax = n.align === "center" ? n.x + n.w / 2 : n.align === "right" ? n.x + n.w : n.x;
    const content = n.uppercase ? n.text.toUpperCase() : n.text;
    if ("letterSpacing" in ctx) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${n.letterSpacing}px`;
    }
    const lines = wrapLines(ctx, content, n.w);
    const lh = n.fontSize * n.lineHeight;
    lines.forEach((line, i) => {
      ctx.fillText(line, ax, n.y + i * lh, n.w);
    });
  } else if (isImage(n)) {
    const img = getCachedImage(n.src);
    if (img) {
      ctx.save();
      roundRect(ctx, n.x, n.y, n.w, n.h, n.radius);
      ctx.clip();
      if (n.filters.blur || n.filters.brightness !== 1 || n.filters.contrast !== 1 || n.filters.saturate !== 1) {
        ctx.filter = `brightness(${n.filters.brightness}) contrast(${n.filters.contrast}) saturate(${n.filters.saturate}) blur(${n.filters.blur}px)`;
      }
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      const c = n.crop;
      if (c && c.w > 0 && c.h > 0 && nw > 0 && nh > 0) {
        const sx = Math.max(0, Math.min(nw - 1, c.x * nw));
        const sy = Math.max(0, Math.min(nh - 1, c.y * nh));
        const sw = Math.max(1, Math.min(nw - sx, c.w * nw));
        const sh = Math.max(1, Math.min(nh - sy, c.h * nh));
        ctx.drawImage(img, sx, sy, sw, sh, n.x, n.y, n.w, n.h);
      } else {
        ctx.drawImage(img, n.x, n.y, n.w, n.h);
      }
      ctx.restore();
    } else {
      applyFill(ctx, "#1a201c", n.x, n.y, n.w, n.h);
      ctx.fillRect(n.x, n.y, n.w, n.h);
    }
  } else if (isPaint(n)) {
    if (n.bitmap) {
      const img = getCachedImage(n.bitmap);
      if (img) ctx.drawImage(img, n.x, n.y, n.w, n.h);
    }
  } else if (isPath(n)) {
    if (n.points.length) {
      ctx.beginPath();
      ctx.moveTo(n.x + n.points[0]!.x, n.y + n.points[0]!.y);
      for (let i = 1; i < n.points.length; i++) {
        ctx.lineTo(n.x + n.points[i]!.x, n.y + n.points[i]!.y);
      }
      if (n.closed) ctx.closePath();
      if (n.fill !== "transparent") {
        applyFill(ctx, n.fill, n.x, n.y, n.w, n.h);
        ctx.fill();
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
      case "arrow":
        ctx.beginPath();
        ctx.moveTo(n.x, n.y + n.h * 0.35);
        ctx.lineTo(n.x + n.w * 0.62, n.y + n.h * 0.35);
        ctx.lineTo(n.x + n.w * 0.62, n.y);
        ctx.lineTo(n.x + n.w, n.y + n.h / 2);
        ctx.lineTo(n.x + n.w * 0.62, n.y + n.h);
        ctx.lineTo(n.x + n.w * 0.62, n.y + n.h * 0.65);
        ctx.lineTo(n.x, n.y + n.h * 0.65);
        ctx.closePath();
        break;
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

  ctx.restore();
}

export function drawDocument(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocument,
  viewport: Viewport,
  opts?: { skipChrome?: boolean; dpr?: number },
) {
  const dpr = opts?.dpr ?? 1;
  const { width, height } = doc.artboard;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (!opts?.skipChrome) {
    ctx.fillStyle = "#070908";
    ctx.fillRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);
  }

  ctx.save();
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.zoom, viewport.zoom);

  if (!opts?.skipChrome) {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 48 / viewport.zoom;
    ctx.shadowOffsetY = 18 / viewport.zoom;
  }
  applyFill(ctx, doc.artboard.background, 0, 0, width, height);
  ctx.fillRect(0, 0, width, height);
  ctx.shadowColor = "transparent";

  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  for (const n of doc.nodes) drawNode(ctx, n);
  ctx.restore();
}

export function fitViewport(
  artW: number,
  artH: number,
  viewW: number,
  viewH: number,
  pad = 56,
): Viewport {
  const z = Math.min((viewW - pad * 2) / artW, (viewH - pad * 2) / artH, 1.4);
  return {
    zoom: z,
    x: (viewW - artW * z) / 2,
    y: (viewH - artH * z) / 2,
  };
}

export function screenToDoc(sx: number, sy: number, vp: Viewport) {
  return { x: (sx - vp.x) / vp.zoom, y: (sy - vp.y) / vp.zoom };
}

export function docToScreen(x: number, y: number, vp: Viewport) {
  return { x: x * vp.zoom + vp.x, y: y * vp.zoom + vp.y };
}
