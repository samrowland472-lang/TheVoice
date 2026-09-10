import { holeIndexFromPointKey } from "./path-point-key";

function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

function lastHoleYToNextFirst(from: Element, targetAxis: "x" | "y"): boolean {
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
  const next = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  if (!next) return false;
  return next.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

export function shouldTabFromLastHoleYToNextFirstY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  return lastHoleYToNextFirst(from, "y");
}

export function shouldTabFromLastHoleYToNextFirstX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  if (shouldTabFromLastHoleYToNextFirstY(from, false)) return false;
  return lastHoleYToNextFirst(from, "x") || lastHoleYToNextFirstFallback(from);
}

function lastHoleYToNextFirstFallback(from: Element): boolean {
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

function lastHoleXToNextFirst(from: Element, targetAxis: "x" | "y"): boolean {
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
  const next = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  if (!next) return false;
  return next.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

export function shouldTabFromLastHoleXToNextFirstY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  return lastHoleXToNextFirst(from, "y");
}

export function shouldTabFromLastHoleXToNextFirstX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  if (shouldTabFromLastHoleXToNextFirstY(from, false)) return false;
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

function firstHoleToPrevLastAxis(from: Element, axisWanted: "x" | "y", targetAxis: "x" | "y"): boolean {
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== axisWanted) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="hole-${h}-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows[0] !== row) return false;
  const prev = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = prev.at(-1);
  if (!last) return false;
  return last.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

function firstHoleToPrevLastX(from: Element, axisWanted: "x" | "y"): boolean {
  return firstHoleToPrevLastAxis(from, axisWanted, "x");
}

export function shouldShiftTabFromFirstHoleXToPrevLastY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  return firstHoleToPrevLastAxis(from, "x", "y");
}

export function shouldShiftTabFromFirstHoleXToPrevLastX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  if (shouldShiftTabFromFirstHoleXToPrevLastY(from, true)) return false;
  return firstHoleToPrevLastX(from, "x");
}

export function shouldShiftTabFromFirstHoleYToPrevLastX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  if (shouldShiftTabFromFirstHoleYToPrevLastY(from, true)) return false;
  return firstHoleToPrevLastX(from, "y");
}

export function shouldShiftTabFromFirstHoleYToPrevLastY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  return firstHoleToPrevLastAxis(from, "y", "y");
}

export function pickPrevHoleLastPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  if (!last) return null;
  return (
    last.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    last.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    last
  );
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

export function pickNextHoleFirstPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const row = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  if (!row) return null;
  return (
    row.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    row.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    row
  );
}

function lastOuterYToFirstHole(from: Element, targetAxis: "x" | "y"): boolean {
  const key = pointKey(from);
  if (!key || !/^path-\d+$/.test(key)) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "y") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll('[data-point^="path-"]')];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  const first = inspector.querySelector<HTMLElement>('[data-point^="hole-0-"]');
  if (!first) return false;
  return first.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

export function shouldTabFromLastOuterYToFirstHoleX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  if (lastOuterYToFirstHole(from, "y")) return false;
  return lastOuterYToFirstHole(from, "x") || lastOuterYToFirstHoleFallback(from);
}

function lastOuterYToFirstHoleFallback(from: Element): boolean {
  const key = pointKey(from);
  if (!key || !/^path-\d+$/.test(key)) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "y") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll('[data-point^="path-"]')];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  return inspector.querySelector('[data-point^="hole-0-"]') != null;
}

function firstHoleXToLastOuterY(from: Element): boolean {
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const holeRows = [...inspector.querySelectorAll('[data-point^="hole-0-"]')];
  const row = from.closest("[data-point]");
  if (!row || holeRows[0] !== row) return false;
  const outer = [...inspector.querySelectorAll<HTMLElement>('[data-point^="path-"]')];
  const last = outer.at(-1);
  if (!last) return false;
  return last.querySelector('input[data-path-axis="y"]') != null || last.querySelector('input[data-path-axis="x"]') != null;
}

export function shouldShiftTabFromFirstHoleXToLastOuterY(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  return firstHoleXToLastOuterY(from);
}

export function pickLastOuterLastPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>('[data-point^="path-"]')];
  const last = rows.at(-1);
  if (!last) return null;
  return (
    last.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    last.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    last
  );
}

export function pickFirstHoleFirstPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const row = inspector.querySelector<HTMLElement>('[data-point^="hole-0-"]');
  if (!row) return null;
  return (
    row.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    row.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    row
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
