import { applyHandle, hitHandle, type Handle } from "./hit";
import { cropSourceBox, normalizeCrop, type ImageCrop } from "./image-filters";
import type { DesignNode, ImageNode } from "./types";

export type CropHandle = Exclude<Handle, "move" | "rotate">;

const CROP_HANDLES: CropHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export function isCropHandle(h: Handle | null): h is CropHandle {
  return h != null && h !== "move" && h !== "rotate";
}

export function sourceBoxFor(n: Pick<ImageNode, "x" | "y" | "w" | "h" | "crop">) {
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

export function hitCropHandle(n: ImageNode, sx: number, sy: number, zoom: number): CropHandle | null {
  const hit = hitHandle(n, sx, sy, zoom);
  return isCropHandle(hit) ? hit : null;
}

export function applyCropHandle(
  n: ImageNode,
  handle: CropHandle,
  dx: number,
  dy: number,
  source: { x: number; y: number; w: number; h: number },
): Pick<ImageNode, "x" | "y" | "w" | "h" | "crop"> {
  const geo = applyHandle(n, handle, dx, dy);
  const boxed = clampNodeToSource(
    { x: geo.x ?? n.x, y: geo.y ?? n.y, w: geo.w ?? n.w, h: geo.h ?? n.h },
    source,
  );
  return { ...boxed, crop: cropFromBoxes(boxed, source) };
}

export function drawCropHandles(
  ctx: CanvasRenderingContext2D,
  n: ImageNode,
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
  ctx.restore();
}

export function patchImageCrop(
  nodes: DesignNode[],
  id: string,
  patch: Partial<ImageNode>,
): DesignNode[] {
  return nodes.map((n) => (n.id === id && n.kind === "image" ? { ...n, ...patch } : n));
}
