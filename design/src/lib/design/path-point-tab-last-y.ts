import { holeIndexFromPointKey } from "./path-point-key";

function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

function holePointIndexFromPointKey(key: string | null | undefined): number | null {
  const hole = /^hole-(\d+)-(\d+)$/.exec(key ?? "");
  if (hole) return Number(hole[2]);
  const path = /^path-(\d+)$/.exec(path ?? "");
  if (path) return Number(path[1]);
  return null;
}
