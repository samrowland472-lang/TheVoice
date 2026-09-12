import { holeIndexFromHoleControl } from "./path-point-key";
import { shouldShiftTabFromNextHoleHeaderToLastHoleDelete } from "./path-point-tab-hole-delete";
import {
  shouldShiftTabFromNextHoleHeaderToLastHoleX,
  shouldShiftTabFromNextHoleHeaderToLastHoleY,
} from "./path-point-tab-next-header-x";

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

export function pickLastHoleFillFromHeaderTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const fills = inspector.querySelectorAll<HTMLElement>(
    `[data-hole="${h - 1}"] [data-hole-fill]`,
  );
  return fills.length ? fills[fills.length - 1] : null;
}

export function shouldShiftTabFromNextHoleHeaderToLastHoleFill(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  if (shouldShiftTabFromNextHoleHeaderToLastHoleY(from, true)) return false;
  if (shouldShiftTabFromNextHoleHeaderToLastHoleX(from, true)) return false;
  if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) return false;
  const header = from.closest("[data-select-hole]");
  if (!header) return false;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 1) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h)) return false;
  if (!holeHeaderHasNoPointFields(inspector, h - 1)) return false;
  return pickLastHoleFillFromHeaderTabTarget(from) != null;
}

export function pickLastHoleDeleteFromFillTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const fill = from.closest("[data-hole-fill]");
  if (!fill) return null;
  const h = holeIndexFromHoleControl(fill);
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const dels = inspector.querySelectorAll<HTMLElement>(
    `[data-hole="${h - 1}"] [data-delete-hole]`,
  );
  return dels.length ? dels[dels.length - 1] : null;
}

export function shouldShiftTabFromNextHoleFillToLastHoleDelete(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  if (shouldShiftTabFromNextHoleHeaderToLastHoleDelete(from, true)) return false;
  if (shouldShiftTabFromNextHoleHeaderToLastHoleFill(from, true)) return false;
  const fill = from.closest("[data-hole-fill]");
  if (!fill) return false;
  const h = holeIndexFromHoleControl(fill);
  if (h == null || h < 1) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h - 1)) return false;
  return pickLastHoleDeleteFromFillTabTarget(from) != null;
}
