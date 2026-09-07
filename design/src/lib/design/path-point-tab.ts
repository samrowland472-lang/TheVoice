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

/**
 * After leaving the Points list, stay in the path inspector.
 * Tab from last y → first control outside the list (Closed / Offset).
 * Shift+Tab from first x → last control outside the list.
 */
export function pickPathInspectorExitTarget<T>(
  inspector: T[],
  listMembers: Set<T>,
  from: T,
  shift: boolean,
): T | null {
  const outside = inspector.filter((el) => !listMembers.has(el));
  if (outside.length === 0) return null;
  const fromIdx = inspector.indexOf(from);
  if (fromIdx < 0) return shift ? (outside.at(-1) ?? null) : (outside[0] ?? null);
  if (!shift) {
    for (let i = fromIdx + 1; i < inspector.length; i++) {
      if (!listMembers.has(inspector[i]!)) return inspector[i]!;
    }
    return outside[0] ?? null;
  }
  for (let i = fromIdx - 1; i >= 0; i--) {
    if (!listMembers.has(inspector[i]!)) return inspector[i]!;
  }
  return outside.at(-1) ?? null;
}

/** Human name for the control Tab landed on after leaving Points. */
export function labelPathInspectorControl(el: {
  getAttribute?(name: string): string | null;
  textContent?: string | null;
}): string {
  const tagged = el.getAttribute?.("data-path-exit")?.trim();
  if (tagged) return tagged;
  const aria = el.getAttribute?.("aria-label")?.trim();
  if (aria) {
    if (/close/i.test(aria)) return "Closed";
    if (/offset|outline|round|simplify/i.test(aria)) return "Offset";
    return aria;
  }
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (/^closed$|^open$/i.test(text)) return "Closed";
  if (/offset|outline|round|simplify/i.test(text)) return "Offset";
  return text || "control";
}

/** Status-strip copy after Tab leaves the Points list. */
export function pathInspectorExitStatus(control: string): string {
  const name = control.trim() || "control";
  return `Left Points · ${name}`;
}

/** True when focus is on Closed / Offset or Even-odd / Nonzero — do not steal Points list scroll. */
export function shouldHoldPointListScroll(active: Element | null | undefined): boolean {
  if (!active || !(active instanceof Element)) return false;
  return Boolean(active.closest("[data-path-exit], [data-hole-fill]"));
}

/** True when focus is on Even-odd / Nonzero — do not steal Holes list scroll. */
export function shouldHoldHoleListScroll(active: Element | null | undefined): boolean {
  if (!active || !(active instanceof Element)) return false;
  return Boolean(active.closest("[data-hole-fill]"));
}

/** Clamp and apply a saved Points list scrollTop. */
export function restorePointListScroll(
  list: { scrollTop: number; scrollHeight?: number; clientHeight?: number },
  saved: number,
): number {
  const max = Math.max(0, (list.scrollHeight ?? 0) - (list.clientHeight ?? 0));
  const next = Math.min(max, Math.max(0, saved));
  list.scrollTop = next;
  return list.scrollTop;
}

export const restoreHoleListScroll = restorePointListScroll;

/** True while the strip should keep Left Points instead of the tool hint. */
export function isPathExitStatus(text: string | null | undefined): boolean {
  return Boolean(text && /^Left Points · /.test(text));
}

/** Status-strip copy when ← / → walks a path or hole ring. */
export function pathRingWalkStatus(opts: {
  hole?: number | null;
  index: number;
  count: number;
}): string {
  const count = Math.max(0, opts.count);
  const index = count === 0 ? 0 : ((opts.index % count) + count) % count;
  const n = count === 0 ? 0 : index + 1;
  if (opts.hole == null) return `Point ${n}/${count}`;
  return `Hole ${opts.hole + 1} · Point ${n}/${count}`;
}
