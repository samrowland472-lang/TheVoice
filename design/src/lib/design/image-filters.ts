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
