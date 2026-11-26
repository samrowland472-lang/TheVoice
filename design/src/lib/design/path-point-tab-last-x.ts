import {
  shouldTabFromLastOuterXToFirstHoleX,
  shouldTabFromLastOuterXToFirstHoleY,
  shouldTabFromLastOuterYToFirstHoleHeader,
} from "./path-point-tab-last-y";

function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

export function lastOuterXToFirstHoleHeader(from: Element | null | undefined, shift: boolean): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  if (!key || !/^path-\d+$/.test(key)) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  if (row.querySelector('input[data-path-axis="y"]') != null) return false;
  const firstPoints = inspector.querySelector(`[data-point^="hole-0-"]`);
  if (firstPoints) {
    const hasAxis =
      firstPoints.querySelector('input[data-path-axis="x"]') != null ||
      firstPoints.querySelector('input[data-path-axis="y"]') != null;
    if (hasAxis) return false;
  }
  return inspector.querySelector(`[data-select-hole="0"]`) != null;
}

export function shouldTabFromLastOuterXToFirstHoleHeader(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldTabFromLastOuterXToFirstHoleX(from, shift) || shouldTabFromLastOuterXToFirstHoleY(from, shift)) return false;
  if (shouldTabFromLastOuterYToFirstHoleHeader(from, shift)) return false;
  return lastOuterXToFirstHoleHeader(from, shift);
}
