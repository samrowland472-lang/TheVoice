import { holeIndexFromHoleControl, holeIndexFromPointKey } from "./path-point-key";

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

function holeHeaderHasNoPointFields(inspector: Element, h: number): boolean {
  const points = inspector.querySelector(`[data-point^="hole-${h}-"]`);
  if (!points) return true;
  const hasAxis =
    points.querySelector('input[data-path-axis="x"]') != null ||
    points.querySelector('input[data-path-axis="y"]') != null;
  return !hasAxis;
}

export function shouldShiftTabFromNextHoleHeaderToLastHoleX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const header = from.closest("[data-select-hole]");
  if (!header) return false;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 1) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h)) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  if (!last) return false;
  if (last.querySelector(`input[data-path-axis="y"]`)) return false;
  return last.querySelector(`input[data-path-axis="x"]`) != null;
}

export function pickLastHoleLastPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  const h = header ? holeIndexFromHoleControl(header) : null;
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  return last?.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? null;
}

export function shouldShiftTabFromNextHoleHeaderToLastHoleY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const header = from.closest("[data-select-hole]");
  if (!header) return false;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 1) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h)) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  if (!last) return false;
  return last.querySelector(`input[data-path-axis="y"]`) != null;
}

export function pickLastHoleLastPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  const point = from.closest("[data-point]");
  const pointKey = point?.getAttribute("data-point");
  const h = header
    ? holeIndexFromHoleControl(header)
    : holeIndexFromPointKey(pointKey);
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  return last?.querySelector<HTMLElement>('input[data-path-axis="y"]') ?? null;
}

export function shouldShiftTabFromNextHoleFirstYToLastHoleY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const point = from.closest("[data-point]");
  const key = point?.getAttribute("data-point") ?? null;
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return false;
  const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
  if (!i || Number(i[1]) !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "y") return false;
  return pickLastHoleLastPointYTabTarget(from) != null;
}

export function shouldShiftTabFromNextHoleFirstXToLastHoleY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const point = from.closest("[data-point]");
  const key = point?.getAttribute("data-point") ?? null;
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return false;
  const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
  if (!i || Number(i[1]) !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  return pickLastHoleLastPointYTabTarget(from) != null;
}
