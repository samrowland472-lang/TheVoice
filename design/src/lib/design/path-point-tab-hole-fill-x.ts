import { holeIndexFromHoleControl } from "./path-point-key";
import { shouldTabFromHoleFillToNextHeader } from "./path-point-tab-next-header-x";

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
