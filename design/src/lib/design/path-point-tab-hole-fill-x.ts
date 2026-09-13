import { holeIndexFromHoleControl, holeIndexFromPointKey } from "./path-point-key";
import {
  shouldShiftTabFromNextHoleFirstXToLastHoleHeader,
  shouldShiftTabFromNextHoleFirstXToLastHoleX,
  shouldShiftTabFromNextHoleFirstXToLastHoleY,
  shouldTabFromHoleFillToNextHeader,
} from "./path-point-tab-next-header-x";
import { shouldShiftTabFromNextHoleHeaderToLastHoleFill } from "./path-point-tab-hole-fill-shift";

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

export function pickNextHoleFirstPointXFromFillTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const fill = from.closest("[data-hole-fill]");
  if (!fill) return null;
  const h = holeIndexFromHoleControl(fill);
  if (h == null) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const next = inspector.querySelector<HTMLElement>(`[data-point^="hole-${h + 1}-"]`);
  return next?.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? null;
}

export function shouldTabFromHoleFillToNextFirstX(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  if (shouldTabFromHoleFillToNextHeader(from, false)) return false;
  const fill = from.closest("[data-hole-fill]");
  if (!fill) return false;
  const h = holeIndexFromHoleControl(fill);
  if (h == null) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h)) return false;
  return pickNextHoleFirstPointXFromFillTabTarget(from) != null;
}

export function pickLastHoleFillFromFirstXTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const point = from.closest("[data-point]");
  const key = point?.getAttribute("data-point") ?? null;
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const fills = inspector.querySelectorAll<HTMLElement>(
    `[data-hole="${h - 1}"] [data-hole-fill]`,
  );
  return fills.length ? fills[fills.length - 1] : null;
}

export function shouldShiftTabFromNextHoleFirstXToLastHoleFill(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  if (shouldShiftTabFromNextHoleFirstXToLastHoleY(from, true)) return false;
  if (shouldShiftTabFromNextHoleFirstXToLastHoleX(from, true)) return false;
  if (shouldShiftTabFromNextHoleFirstXToLastHoleHeader(from, true)) return false;
  if (shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return false;
  const point = from.closest("[data-point]");
  const key = point?.getAttribute("data-point") ?? null;
  const h = holeIndexFromPointKey(key);
  if (h == null || h < 1) return false;
  const i = /^hole-\d+-(\d+)$/.exec(key ?? "");
  if (!i || Number(i[1]) !== 0) return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h - 1)) return false;
  if (holeHeaderHasNoPointFields(inspector, h)) return false;
  const first = inspector.querySelector(`[data-point^="hole-${h}-"]`);
  if (!first?.querySelector('input[data-path-axis="x"]')) return false;
  return pickLastHoleFillFromFirstXTabTarget(from) != null;
}
