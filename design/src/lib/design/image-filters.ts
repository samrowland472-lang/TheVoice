import type { ImageNode } from "./types";

export type ImageFilters = ImageNode["filters"];

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  blur: 0,
};

export function normalizeFilters(filters?: ImageFilters | null): ImageFilters {
  return {
    brightness: filters?.brightness ?? DEFAULT_FILTERS.brightness,
    contrast: filters?.contrast ?? DEFAULT_FILTERS.contrast,
    saturate: filters?.saturate ?? DEFAULT_FILTERS.saturate,
    blur: filters?.blur ?? DEFAULT_FILTERS.blur,
  };
}

export function cloneFilters(filters?: ImageFilters | null): ImageFilters {
  return { ...normalizeFilters(filters) };
}

export function filterKey(filters?: ImageFilters | null): string {
  const f = normalizeFilters(filters);
  return `${f.brightness}:${f.contrast}:${f.saturate}:${f.blur}`;
}

export function filterChipLabel(filters?: ImageFilters | null): string {
  const f = normalizeFilters(filters);
  const flat =
    f.brightness === 1 && f.contrast === 1 && f.saturate === 1 && f.blur === 0;
  if (flat) return "flat";
  const parts = [
    `B${Math.round(f.brightness * 100)}`,
    `C${Math.round(f.contrast * 100)}`,
    `S${Math.round(f.saturate * 100)}`,
  ];
  if (f.blur) parts.push(`R${f.blur}`);
  return parts.join(" ");
}

function clampUnit(n: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(2, Math.max(0, n));
}

/** CSS / canvas `filter` matching SVG export (brightness/contrast/saturate/blur). */
export function cssFilterStyle(filters?: ImageFilters | null): string {
  const f = normalizeFilters(filters);
  const b = clampUnit(f.brightness, 1);
  const c = clampUnit(f.contrast, 1);
  const s = clampUnit(f.saturate, 1);
  const blur = Number.isFinite(f.blur) ? Math.max(0, f.blur) : 0;
  if (b === 1 && c === 1 && s === 1 && blur === 0) return "";
  return `brightness(${b}) contrast(${c}) saturate(${s}) blur(${blur}px)`;
}

export function svgImageFilterStyle(filters?: ImageFilters | null): string {
  const css = cssFilterStyle(filters);
  return css ? ` filter="${css}"` : "";
}

export type ImageCrop = { x: number; y: number; w: number; h: number };

export function normalizeCrop(crop?: ImageCrop | null): ImageCrop | null {
  if (!crop) return null;
  const w = Number.isFinite(crop.w) ? crop.w : 1;
  const h = Number.isFinite(crop.h) ? crop.h : 1;
  if (w <= 0 || h <= 0) return null;
  const x = Number.isFinite(crop.x) ? crop.x : 0;
  const y = Number.isFinite(crop.y) ? crop.y : 0;
  const nx = Math.min(0.99, Math.max(0, x));
  const ny = Math.min(0.99, Math.max(0, y));
  const nw = Math.min(1 - nx, Math.max(0.01, w));
  const nh = Math.min(1 - ny, Math.max(0.01, h));
  if (nx <= 0.0001 && ny <= 0.0001 && nw >= 0.999 && nh >= 0.999) return null;
  return { x: nx, y: ny, w: nw, h: nh };
}

/** Destination box of the full bitmap so the crop window fills the node. */
export function cropSourceBox(
  n: { x: number; y: number; w: number; h: number },
  crop?: ImageCrop | null,
): { x: number; y: number; w: number; h: number } {
  const c = normalizeCrop(crop);
  if (!c) return { x: n.x, y: n.y, w: n.w, h: n.h };
  return {
    x: n.x - (c.x / c.w) * n.w,
    y: n.y - (c.y / c.h) * n.h,
    w: n.w / c.w,
    h: n.h / c.h,
  };
}

export function cropSourceRect(
  img: { naturalWidth: number; naturalHeight: number },
  crop?: ImageCrop | null,
): { sx: number; sy: number; sw: number; sh: number } {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const c = normalizeCrop(crop);
  if (!c) return { sx: 0, sy: 0, sw: nw, sh: nh };
  return {
    sx: c.x * nw,
    sy: c.y * nh,
    sw: Math.max(1, c.w * nw),
    sh: Math.max(1, c.h * nh),
  };
}
