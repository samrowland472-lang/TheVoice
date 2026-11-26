import type { KeyboardEvent } from "react";

/**
 * Compute the next value for a phosphor fill range from keyboard.
 * Home → min, End → max, PageUp/PageDown → ~10% of the range (snapped to step).
 * Returns null if the key is not handled.
 */
export function nextFromRangeKey(
  e: KeyboardEvent<HTMLInputElement>,
  value: number,
  min: number,
  max: number,
  step = 1,
): number | null {
  if (e.key === "Home") {
    e.preventDefault();
    return min;
  }
  if (e.key === "End") {
    e.preventDefault();
    return max;
  }
  if (e.key === "PageUp" || e.key === "PageDown") {
    e.preventDefault();
    const dir = e.key === "PageUp" ? 1 : -1;
    const coarse = Math.max(step, (max - min) * 0.1);
    let next = value + dir * coarse;
    const steps = Math.round((next - min) / step);
    next = min + steps * step;
    return Math.min(max, Math.max(min, next));
  }
  return null;
}
