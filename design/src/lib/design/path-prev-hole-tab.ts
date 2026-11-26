import { holeIndexFromHoleControl } from "./path-point-tab";

export function shouldShiftTabToPrevHoleLastPoint(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const header = from.closest("[data-select-hole]");
  if (!header) return false;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 0) return false;
  const inspector = from.closest("[data-path-inspector]");
  if (!inspector) return false;
  if (h === 0) return inspector.querySelector(`[data-point^="path-"]`) != null;
  return inspector.querySelector(`[data-point^="hole-${h - 1}-"]`) != null;
}

function lastAxisInput(row: HTMLElement | null | undefined): HTMLElement | null {
  if (!row) return null;
  return (
    row.querySelector<HTMLElement>('input[data-path-axis="x"]') ??
    row.querySelector<HTMLElement>('input[data-path-axis="y"]') ??
    row
  );
}

export function pickPrevHoleLastPointTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null || h < 0) return null;
  const inspector = from.closest("[data-path-inspector]");
  if (!inspector) return null;
  if (h === 0) {
    const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="path-"]`)];
    return lastAxisInput(rows.at(-1));
  }
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h - 1}-"]`)];
  return lastAxisInput(rows.at(-1));
}
