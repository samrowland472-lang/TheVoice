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
