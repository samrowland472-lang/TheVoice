import { holeIndexFromPointKey } from "./path-point-key";

function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

export function holePointIndexFromPointKey(key: string | null | undefined): number | null {
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

function firstHoleToPrevLastAxis(
  from: Element | null | undefined,
  shift: boolean,
  axisWanted: "x" | "y", targetAxis: "x" | "y",
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return false;
  const i = holePointIndexFromPointKey(key);
  if (i !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x" && axis !== "y") return false;
  if (axis && axis !== axisWanted) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const prevRows = [...inspector.querySelectorAll(`[data-point^="hole-${h - 1}-"]`)];
  const prev = prevRows.at(-1);
  if (!prev) return false;
  return prev.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

function lastOuterToFirstHole(
  from: Element | null | undefined,
  shift: boolean,
  axisWanted: "x" | "y", targetAxis: "x" | "y",
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  if (!key || !/^path-\d+$/.test(key)) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x" && axis !== "y") return false;
  if (axis && axis !== axisWanted) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  const first = inspector.querySelector<HTMLElement>(`[data-point^="hole-0-"]`);
  if (!first) return false;
  return first.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

function lastOuterYToFirstHole(
  from: Element | null | undefined,
  shift: boolean,
  targetAxis: "x" | "y",
): boolean {
  return lastOuterToFirstHole(from, shift, "y", targetAxis);
}

function lastOuterXToFirstHole(
  from: Element | null | undefined,
  shift: boolean,
  targetAxis: "x" | "y",
): boolean {
  return lastOuterToFirstHole(from, shift, "x", targetAxis);
}

function firstHoleToLastOuter(
  from: Element | null | undefined,
  shift: boolean,
  axisWanted: "x" | "y", targetAxis: "x" | "y",
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h !== 0) return false;
  const i = holePointIndexFromPointKey(key);
  if (i !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x" && axis !== "y") return false;
  if (axis && axis !== axisWanted) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const first = inspector.querySelector(`[data-point^="hole-0-"]`);
  const row = from.closest("[data-point]");
  if (!first || first !== row) return false;
  const outers = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
  const last = outers.at(-1);
  if (!last) return false;
  return last.querySelector(`input[data-path-axis="${targetAxis}"]`) != null;
}

function firstHoleYToLastOuterY(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleToLastOuter(from, shift, "y", "y");
}

function firstHoleXToLastOuterX(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleToLastOuter(from, shift, "x", "x");
}

function firstHoleYToLastOuterX(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleToLastOuter(from, shift, "y", "x");
}

function lastOuterToFirstHoleHeader(from: Element | null | undefined, shift: boolean): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  if (!key || !/^path-\d+$/.test(key)) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "y") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  const rows = [...inspector.querySelectorAll(`[data-point^="path-"]`)];
  const row = from.closest("[data-point]");
  if (!row || rows.at(-1) !== row) return false;
  const firstPoints = inspector.querySelector(`[data-point^="hole-0-"]`);
  if (firstPoints) {
    const hasAxis =
      firstPoints.querySelector('input[data-path-axis="x"]') != null ||
      firstPoints.querySelector('input[data-path-axis="y"]') != null;
    if (hasAxis) return false;
  }
  return inspector.querySelector(`[data-select-hole="0"]`) != null;
}

export function shouldTabFromLastHoleYToNextFirstY(from: Element | null | undefined, shift: boolean): boolean {
  return lastHoleToNextFirstAxis(from, shift, "y", "y");
}

export function shouldTabFromLastHoleYToNextFirstX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldTabFromLastHoleYToNextFirstY(from, shift)) return false;
  return lastHoleToNextFirstAxis(from, shift, "y", "x");
}

export function shouldTabFromLastHoleXToNextFirstY(from: Element | null | undefined, shift: boolean): boolean {
  return lastHoleToNextFirstAxis(from, shift, "x", "y");
}

export function shouldTabFromLastHoleXToNextFirstX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldTabFromLastHoleXToNextFirstY(from, false)) return false;
  return lastHoleToNextFirstAxis(from, shift, "x", "x");
}

export function shouldShiftTabFromFirstHoleXToPrevLastY(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleToPrevLastAxis(from, shift, "x", "y");
}

export function shouldShiftTabFromFirstHoleXToPrevLastX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldShiftTabFromFirstHoleXToPrevLastY(from, shift)) return false;
  return firstHoleToPrevLastAxis(from, shift, "x", "x");
}

export function shouldShiftTabFromFirstHoleYToPrevLastX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldShiftTabFromFirstHoleYToPrevLastY(from, shift)) return false;
  return firstHoleToPrevLastAxis(from, shift, "y", "x");
}

export function shouldShiftTabFromFirstHoleYToPrevLastY(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleToPrevLastAxis(from, shift, "y", "y");
}

export function shouldTabFromLastOuterYToFirstHoleX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldTabFromLastOuterYToFirstHoleY(from, shift)) return false;
  return lastOuterYToFirstHole(from, shift, "x");
}

export function shouldTabFromLastOuterYToFirstHoleY(from: Element | null | undefined, shift: boolean): boolean {
  return lastOuterYToFirstHole(from, shift, "y");
}

export function shouldTabFromLastOuterXToFirstHoleY(from: Element | null | undefined, shift: boolean): boolean {
  return lastOuterXToFirstHole(from, shift, "y");
}

export function shouldTabFromLastOuterXToFirstHoleX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldTabFromLastOuterXToFirstHoleY(from, shift)) return false;
  return lastOuterXToFirstHole(from, shift, "x");
}

export function shouldTabFromLastOuterYToFirstHoleHeader(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldTabFromLastOuterYToFirstHoleX(from, shift) || shouldTabFromLastOuterYToFirstHoleY(from, shift)) return false;
  return lastOuterToFirstHoleHeader(from, shift);
}

export function shouldShiftTabFromFirstHoleXToLastOuterY(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleToLastOuter(from, shift, "x", "y");
}

export function shouldShiftTabFromFirstHoleXToLastOuterX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldShiftTabFromFirstHoleXToLastOuterY(from, true)) return false;
  return firstHoleXToLastOuterX(from, shift);
}

export function shouldShiftTabFromFirstHoleYToLastOuterX(from: Element | null | undefined, shift: boolean): boolean {
  if (shouldShiftTabFromFirstHoleYToLastOuterY(from, true)) return false;
  return firstHoleYToLastOuterX(from, shift);
}

export function shouldShiftTabFromFirstHoleYToLastOuterY(from: Element | null | undefined, shift: boolean): boolean {
  return firstHoleYToLastOuterY(from, shift);
}

export function pickNextHoleFirstPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  const next = inspector?.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  return next?.querySelector<HTMLElement>('input[data-path-axis="y"]') ?? null;
}

export function pickNextHoleFirstPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  const next = inspector?.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  return next?.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? null;
}

export function pickPrevHoleLastPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  return last?.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? null;
}

export function pickPrevHoleLastPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  const last = rows.at(-1);
  return last?.querySelector<HTMLElement>('input[data-path-axis="y"]') ?? null;
}

export function pickLastOuterLastPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="path-"]`)];
  const last = rows.at(-1);
  return last?.querySelector<HTMLElement>('input[data-path-axis="y"]') ?? null;
}

export function pickLastOuterLastPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="path-"]`)];
  const last = rows.at(-1);
  return last?.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? null;
}

export function pickFirstHoleFirstPointXTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  const first = inspector?.querySelector<HTMLElement>(`[data-point^="hole-0-"]`);
  return first?.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? null;
}

export function pickFirstHoleFirstPointYTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  const first = inspector?.querySelector<HTMLElement>(`[data-point^="hole-0-"]`);
  return first?.querySelector<HTMLElement>('input[data-path-axis="y"]') ?? null;
}

export function pickFirstHoleHeaderTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>(`[data-select-hole="0"]`) ?? null;
}
