import { cropSourceRect, normalizeCrop, type ImageCrop } from "./image-filters";
import type { PaintNode } from "./types";

export function paintBakeSize(w: number, h: number): { w: number; h: number } {
  const nw = Math.max(1, Math.round(Number.isFinite(w) ? w : 1));
  const nh = Math.max(1, Math.round(Number.isFinite(h) ? h : 1));
  return { w: nw, h: nh };
}

export function paintNeedsBake(
  n: Pick<PaintNode, "kind" | "w" | "h" | "bitmap" | "crop">,
  nextW: number,
  nextH: number,
): boolean {
  if (n.kind !== "paint") return false;
  const size = paintBakeSize(nextW, nextH);
  const cur = paintBakeSize(n.w, n.h);
  if (normalizeCrop(n.crop as ImageCrop | null)) return true;
  if (!n.bitmap) return false;
  return size.w !== cur.w || size.h !== cur.h;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof OffscreenCanvas === "function") {
    try {
      return new OffscreenCanvas(w, h);
    } catch {
      /* fall through */
    }
  }
  if (typeof document !== "undefined" && document.createElement) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  return null;
}

function drawBaked(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  img: CanvasImageSource & { naturalWidth?: number; width?: number; naturalHeight?: number; height?: number },
  crop: ImageCrop | null,
  tw: number,
  th: number,
): boolean {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return false;
  const nw = Number(img.naturalWidth ?? img.width ?? 0);
  const nh = Number(img.naturalHeight ?? img.height ?? 0);
  if (nw < 1 || nh < 1) return false;
  const src = cropSourceRect({ naturalWidth: nw, naturalHeight: nh }, crop);
  ctx.clearRect(0, 0, tw, th);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img as CanvasImageSource, src.sx, src.sy, src.sw, src.sh, 0, 0, tw, th);
  return true;
}

function canvasToDataUrl(canvas: HTMLCanvasElement | OffscreenCanvas): string | null {
  if ("toDataURL" in canvas && typeof canvas.toDataURL === "function") {
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }
  return null;
}

/** Resample a paint bitmap into the node box. Crop is flattened into pixels. */
export function bakePaintNode(n: PaintNode, nextW = n.w, nextH = n.h): PaintNode {
  const size = paintBakeSize(nextW, nextH);
  const crop = normalizeCrop(n.crop);
  if (!n.bitmap) {
    return { ...n, w: nextW, h: nextH, crop: null };
  }
  const canvas = makeCanvas(size.w, size.h);
  if (!canvas || typeof Image === "undefined") {
    return { ...n, w: nextW, h: nextH };
  }
  const img = new Image();
  img.src = n.bitmap;
  if (img.complete && (img.naturalWidth || img.width)) {
    if (!drawBaked(canvas, img, crop, size.w, size.h)) return { ...n, w: nextW, h: nextH };
    const url = canvasToDataUrl(canvas);
    if (!url) return { ...n, w: nextW, h: nextH };
    return { ...n, w: nextW, h: nextH, bitmap: url, crop: null };
  }
  return { ...n, w: nextW, h: nextH };
}

export function bakePaintIfSized(n: PaintNode, patch: Partial<PaintNode>): PaintNode {
  const w = patch.w ?? n.w;
  const h = patch.h ?? n.h;
  const merged = { ...n, ...patch };
  if (paintNeedsBake(n, w, h) || (n.crop && (patch.w != null || patch.h != null))) {
    return bakePaintNode(merged, w, h);
  }
  return merged;
}
