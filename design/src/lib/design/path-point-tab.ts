/** Tab order for path inspector point fields: x → y → next x. */

export function nextPathAxis(
  axis: "x" | "y",
  shift: boolean,
): { neighbor: -1 | 0 | 1; axis: "x" | "y" } {
  if (!shift && axis === "x") return { neighbor: 0, axis: "y" };
  if (!shift && axis === "y") return { neighbor: 1, axis: "x" };
  if (shift && axis === "y") return { neighbor: 0, axis: "x" };
  return { neighbor: -1, axis: "y" };
}

/** True when Tab/Shift+Tab should leave the Points list (no wrap). */
export function pathTabLeavesList(
  index: number,
  count: number,
  axis: "x" | "y",
  shift: boolean,
): boolean {
  if (count <= 0 || index < 0 || index >= count) return true;
  const step = nextPathAxis(axis, shift);
  const next = index + step.neighbor;
  return next < 0 || next >= count;
}

/** Last point y + Tab, or first point x + Shift+Tab. */
export function pathTabExitsAtEdge(
  index: number,
  count: number,
  axis: "x" | "y",
  shift: boolean,
): boolean {
  if (count <= 0) return true;
  if (!shift && axis === "y" && index === count - 1) return true;
  if (shift && axis === "x" && index === 0) return true;
  return pathTabLeavesList(index, count, axis, shift);
}
