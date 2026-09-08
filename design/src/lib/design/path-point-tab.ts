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

export function pathInspectorExitStatus(control: string): string {
  const name = control.trim() || "control";
  return `Left Points · ${name}`;
}

export function holeIndexFromPointKey(key: string | null | undefined): number | null {
  const hole = /^hole-(\d+)-\d+$/.exec(key ?? "");
  if (hole) return Number(hole[1]);
  if (/^path-\d+$/.test(key ?? "")) return -1;
  return null;
}
