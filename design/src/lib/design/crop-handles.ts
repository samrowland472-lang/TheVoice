import { applyHandle, hitHandle, type Handle } from "./hit";
import { cropSourceBox, normalizeCrop, type ImageCrop } from "./image-filters";
import type { DesignNode, ImageNode, PaintNode } from "./types";
import { isBitmap } from "./types";

export type BitmapNode = ImageNode | PaintNode;

export type CropHandle = Exclude<Handle, "move" | "rotate">;

const CROP_HANDLES: CropHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function isCropHandle(h: Handle | null): h is CropHandle {
  return h != null && h !== "move" && h !== "rotate";
}

export function sourceBoxFor(n: Pick<BitmapNode, "x" | "y" | "w" | "h" | "crop">) {
  return cropSourceBox(n, n.crop);
}

/** Crop window of `node` inside frozen source box, source-normalized. */
export function cropFromBoxes(
  node: { x: number; y: number; w: number; h: number },
  source: { x: number; y: number; w: number; h: number },
): ImageCrop | null {
  const sw = source.w || 1;
  const sh = source.h || 1;
  return normalizeCrop({
    x: (node.x - source.x) / sw,
    y: (node.y - source.y) / sh,
    w: node.w / sw,
    h: node.h / sh,
  });
}

export function clampNodeToSource(
  node: { x: number; y: number; w: number; h: number },
  source: { x: number; y: number; w: number; h: number },
) {
  const min = 8;
  const x = Math.min(Math.max(node.x, source.x), source.x + source.w - min);
  const y = Math.min(Math.max(node.y, source.y), source.y + source.h - min);
  const w = Math.min(Math.max(node.w, min), source.x + source.w - x);
  const h = Math.min(Math.max(node.h, min), source.y + source.h - y);
  return { x, y, w, h };
}

export function hitCropHandle(n: BitmapNode, sx: number, sy: number, zoom: number): CropHandle | null {
  const hit = hitHandle(n, sx, sy, zoom);
  return isCropHandle(hit) ? hit : null;
}

export function applyCropHandle(
  n: BitmapNode,
  handle: CropHandle,
  dx: number,
  dy: number,
  source: { x: number; y: number; w: number; h: number },
  lockAspect = false,
): Pick<BitmapNode, "x" | "y" | "w" | "h" | "crop"> {
  const geo = applyHandle(n, handle, dx, dy);
  let boxed = clampNodeToSource(
    { x: geo.x ?? n.x, y: geo.y ?? n.y, w: geo.w ?? n.w, h: geo.h ?? n.h },
    source,
  );
  if (lockAspect && (handle === "nw" || handle === "ne" || handle === "se" || handle === "sw")) {
    const aspect = (n.w || 1) / (n.h || 1);
    // Prefer the larger delta so the locked box still follows the drag
    const proposedW = boxed.w;
    const proposedH = boxed.h;
    let nw = proposedW;
    let nh = proposedW / aspect;
    if (Math.abs(proposedH - n.h) > Math.abs(proposedW - n.w)) {
      nh = proposedH;
      nw = proposedH * aspect;
    }
    // Anchor opposite the handle
    let nx = boxed.x;
    let ny = boxed.y;
    if (handle === "nw") {
      nx = n.x + n.w - nw;
      ny = n.y + n.h - nh;
    } else if (handle === "ne") {
      nx = n.x;
      ny = n.y + n.h - nh;
    } else if (handle === "sw") {
      nx = n.x + n.w - nw;
      ny = n.y;
    } else {
      // se
      nx = n.x;
      ny = n.y;
    }
    boxed = clampNodeToSource({ x: nx, y: ny, w: nw, h: nh }, source);
  }
  return { ...boxed, crop: cropFromBoxes(boxed, source) };
}

export function drawCropHandles(
  ctx: CanvasRenderingContext2D,
  n: BitmapNode,
  zoom: number,
) {
  const src = sourceBoxFor(n);
  const lw = 1.2 / zoom;
  ctx.save();
  ctx.strokeStyle = "rgba(63,198,255,0.35)";
  ctx.lineWidth = lw;
  ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.strokeRect(src.x, src.y, src.w, src.h);
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.lineWidth = 1.6 / zoom;
  ctx.strokeRect(n.x, n.y, n.w, n.h);
  const size = 7 / zoom;
  const spots: { x: number; y: number }[] = CROP_HANDLES.map((id) => {
    switch (id) {
      case "nw":
        return { x: n.x, y: n.y };
      case "n":
        return { x: n.x + n.w / 2, y: n.y };
      case "ne":
        return { x: n.x + n.w, y: n.y };
      case "e":
        return { x: n.x + n.w, y: n.y + n.h / 2 };
      case "se":
        return { x: n.x + n.w, y: n.y + n.h };
      case "s":
        return { x: n.x + n.w / 2, y: n.y + n.h };
      case "sw":
        return { x: n.x, y: n.y + n.h };
      case "w":
        return { x: n.x, y: n.y + n.h / 2 };
    }
  });
  for (const p of spots) {
    ctx.fillStyle = "#061014";
    ctx.strokeStyle = "#3fc6ff";
    ctx.lineWidth = 1.2 / zoom;
    ctx.beginPath();
    ctx.rect(p.x - size / 2, p.y - size / 2, size, size);
    ctx.fill();
    ctx.stroke();
  }
  // Live crop readout chip (top-right of crop frame)
  const crop = n.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const pctW = Math.round((crop.w ?? 1) * 100);
  const pctH = Math.round((crop.h ?? 1) * 100);
  const label = `${pctW}% × ${pctH}%`;
  ctx.font = `${Math.max(9, 11 / zoom)}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const tw = ctx.measureText(label).width;
  const chipW = tw + 10 / zoom;
  const chipH = 14 / zoom;
  const cx = n.x + n.w - chipW;
  const cy = n.y - chipH - 2 / zoom;
  ctx.fillStyle = "rgba(6,16,20,0.92)";
  ctx.strokeStyle = "rgba(63,198,255,0.7)";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.roundRect(cx, cy, chipW, chipH, 2 / zoom);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3fc6ff";
  ctx.fillText(label, cx + 5 / zoom, cy + chipH - 2 / zoom);
  ctx.restore();
}

export function patchImageCrop(
  nodes: DesignNode[],
  id: string,
  patch: Partial<BitmapNode>,
): DesignNode[] {
  return nodes.map((n) => {
    if (n.id !== id || !isBitmap(n)) return n;
    if (n.kind === "image") return { ...n, ...(patch as Partial<ImageNode>) };
    return { ...n, ...(patch as Partial<PaintNode>) };
  });
}

export const patchBitmapCrop = patchImageCrop;

/** Arrow-key crop: move the edge named by `handle` by dx/dy, source frozen. */
export function nudgeCropHandle(
  n: BitmapNode,
  handle: CropHandle,
  dx: number,
  dy: number,
): Pick<BitmapNode, "x" | "y" | "w" | "h" | "crop"> {
  return applyCropHandle(n, handle, dx, dy, sourceBoxFor(n));
}

export function cropHandleForArrow(key: string): CropHandle | null {
  if (key === "ArrowLeft") return "w";
  if (key === "ArrowRight") return "e";
  if (key === "ArrowUp") return "n";
  if (key === "ArrowDown") return "s";
  return null;
}
