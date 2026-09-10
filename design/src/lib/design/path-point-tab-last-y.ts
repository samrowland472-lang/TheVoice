import { holeIndexFromPointKey } from "./path-point-key";

function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

export function shouldTabFromLastHoleYToNextFirstX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "y") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h}-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  return inspector.querySelector(`[data-point^="hole-${h + 1}-"]`) != null;
}

export function shouldTabFromLastHoleXToNextFirstX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h}-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  return inspector.querySelector(`[data-point^="hole-${h + 1}-"]`) != null;
}

export function shouldShiftTabFromFirstHoleXToPrevLastX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h}-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows[0] !== row) return false;
  const prev = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = prev.at(-1);
  if (!last) return false;
  return last.querySelector('input[data-path-axis="x"]') != null;
}

export function pickPrevHoleLastPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  if (!last) return null;
  return (
    last.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    last.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    last
  );
}

export function pickNextHoleFirstPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const row = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  if (!row) return null;
  return (
    row.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    row.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    row
  );
}
