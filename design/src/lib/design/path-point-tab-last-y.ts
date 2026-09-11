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
  const path = /^path-(\d+)$/.exec(key ?? "");
  if (path) return Number(path[1]);
  return null;
}

function lastHoleToNextFirstAxis(
  from: Element | null | undefined,
  shift: boolean,
  axisWanted: "x" | "y", targetAxis: "x" | "y",
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x" && axis !== "y") return false;
  if (axis && axis !== axisWanted) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h}-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  const next = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  if (!next) return false;
  return next.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}
