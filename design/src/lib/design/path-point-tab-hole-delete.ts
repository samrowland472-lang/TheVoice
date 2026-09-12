import { holeIndexFromHoleControl } from "./path-point-key";

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

export function pickNextHoleHeaderFromDeleteTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const del = from.closest("[data-delete-hole]");
  if (!del) return null;
  const h = holeIndexFromHoleControl(del);
  if (h == null) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  return inspector.querySelector<HTMLElement>(`[data-select-hole="${h + 1}"]`);
}

export function shouldTabFromHoleDeleteToNextHeader(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (shift || !from || !(from instanceof Element)) return false;
  const del = from.closest("[data-delete-hole]");
  if (!del) return false;
  const h = holeIndexFromHoleControl(del);
  if (h == null) return false;
  const inspector = inspectorOf(from);
  if (!inspector) return false;
  if (!holeHeaderHasNoPointFields(inspector, h)) return false;
  if (!holeHeaderHasNoPointFields(inspector, h + 1)) return false;
  return pickNextHoleHeaderFromDeleteTabTarget(from) != null;
}

export function pickLastHoleDeleteFromHeaderTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 1) return null;
  const inspector = inspectorOf(from);
  if (!inspector) return null;
  const dels = inspector.querySelectorAll<HTMLElement>(
    `[data-hole="${h - 1}"] [data-delete-hole]`,
  );
  return dels.length ? dels[dels.length - 1] : null;
}

export function shouldShiftTabFromNextHoleHeaderToLastHoleDelete(
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
  if (!holeHeaderHasNoPointFields(inspector, h - 1)) return false;
  return pickLastHoleDeleteFromHeaderTabTarget(from) != null;
}
