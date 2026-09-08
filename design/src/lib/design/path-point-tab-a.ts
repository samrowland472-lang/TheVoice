import { holeIndexFromHoleControl, holeIndexFromPointKey } from "./path-point-key";

export function holePointIndexFromPointKey(key: string | null | undefined): number | null {
  const hole = /^hole-(\d+)-(\d+)$/.exec(key ?? "");
  if (hole) return Number(hole[2]);
  const path = /^path-(\d+)$/.exec(key ?? "");
  if (path) return Number(path[1]);
  return null;
}

function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

function firstAxisInput(row: HTMLElement | null | undefined): HTMLElement | null {
  if (!row) return null;
  return (
    row.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    row.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    row
  );
}

function lastAxisInput(row: HTMLElement | null | undefined): HTMLElement | null {
  if (!row) return null;
  return (
    row.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    row.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    row
  );
}

export function shouldTabToSameHoleFirstPoint(from: Element | null | undefined, shift: boolean): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const header = from.closest("[data-select-hole]");
  if (!header) return false;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 0) return false;
  const inspector = inspectorOf(from);
  return Boolean(inspector?.querySelector(`[data-point^="hole-${h}-"]`));
}

export function pickSameHoleFirstPointTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const row = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h}-"]`);
  return firstAxisInput(row);
}

export function pickSameHoleLastPointTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h}-"]`)];
  return lastAxisInput(rows.at(-1));
}

export function pickNextHolePointTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 0) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const row = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  return firstAxisInput(row);
}

export function shouldShiftTabToSameHoleHeader(from: Element | null | undefined, shift: boolean): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 0) return false;
  const i = holePointIndexFromPointKey(key);
  if (i !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  return inspectorOf(from)?.querySelector(`[data-select-hole="${h}"]`) != null;
}

export function pickSameHoleHeaderTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 0) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>(`[data-select-hole="${h}"]`) ?? null;
}

export function shouldTabToNextHoleHeader(from: Element | null | undefined, shift: boolean): boolean {
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
  return inspector.querySelector(`[data-select-hole="${h + 1}"]`) != null;
}

export function pickNextHoleHeaderTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const h = holeIndexFromPointKey(pointKey(from));
  if (h == null || h < 0) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>(`[data-select-hole="${h + 1}"]`) ?? null;
}

export function isCrossingHolePointTab(from: Element | null | undefined, to: Element | null | undefined): boolean {
  if (!from || !to) return false;
  const a = holeIndexFromPointKey(pointKey(from));
  const b = holeIndexFromPointKey(pointKey(to));
  if (a == null || b == null) return false;
  return a !== b;
}

export function isCrossingHoleHeaderToPointTab(
  from: Element | null | undefined,
  to: Element | null | undefined,
): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  const header = from.closest("[data-select-hole]");
  if (!header) return false;
  return to.closest("[data-point]") != null;
}

export function isCrossingHolePointToHeaderTab(
  from: Element | null | undefined,
  to: Element | null | undefined,
): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  if (!from.closest("[data-point]")) return false;
  return to.closest("[data-select-hole]") != null;
}

export function shouldTabFromClosedToOffset(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const exit = from.closest("[data-path-exit]");
  if (!exit || exit.getAttribute("data-path-exit") !== "Closed") return false;
  return inspectorOf(from)?.querySelector('[data-path-exit="Offset"]') != null;
}

export function shouldTabFromOffsetToFirstOuterPoint(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const exit = from.closest("[data-path-exit]");
  if (!exit || exit.getAttribute("data-path-exit") !== "Offset") return false;
  const inspector = inspectorOf(from);
  return inspector?.querySelector('[data-point^="path-"]') != null;
}

export function shouldTabFromOffsetToOutline(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const exit = from.closest("[data-path-exit]");
  if (!exit || exit.getAttribute("data-path-exit") !== "Offset") return false;
  return inspectorOf(from)?.querySelector('[data-path-exit="Outline"]') != null;
}

export function pickOutlineTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>('[data-path-exit="Outline"]') ?? null;
}

export function shouldTabFromOutlineToRound(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const exit = from.closest("[data-path-exit]");
  if (!exit || exit.getAttribute("data-path-exit") !== "Outline") return false;
  return inspectorOf(from)?.querySelector('[data-path-exit="Round"]') != null;
}

export function pickRoundTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>('[data-path-exit="Round"]') ?? null;
}

export function shouldTabFromRoundToSimplify(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const exit = from.closest("[data-path-exit]");
  if (!exit || exit.getAttribute("data-path-exit") !== "Round") return false;
  return inspectorOf(from)?.querySelector('[data-path-exit="Simplify"]') != null;
}

export function pickSimplifyTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>('[data-path-exit="Simplify"]') ?? null;
}

export function pickFirstOuterPointTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const row = inspector.querySelector<HTMLElement>('[data-point^="path-"]');
  return firstAxisInput(row);
}

export function shouldShiftTabFromFirstOuterToOffset(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  if (key !== "path-0") return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  return inspectorOf(from)?.querySelector('[data-path-exit="Offset"]') != null;
}

export function pickOffsetTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>('[data-path-exit="Offset"]') ?? null;
}
