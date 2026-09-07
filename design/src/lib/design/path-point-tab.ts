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
  const m = /^hole-(\d+)-\d+$/.exec(key ?? "");
  return m ? Number(m[1]) : null;
}

export function isCrossingHolePointTab(
  from: Element | null | undefined,
  to: Element | null | undefined,
): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  const a = holeIndexFromPointKey(from.closest("[data-point]")?.getAttribute("data-point"));
  const b = holeIndexFromPointKey(to.closest("[data-point]")?.getAttribute("data-point"));
  return a != null && b != null && a !== b;
}

export function isCrossingHoleHeaderToPointTab(
  from: Element | null | undefined,
  to: Element | null | undefined,
): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  const a = holeIndexFromHoleControl(from);
  const b = holeIndexFromPointKey(to.closest("[data-point]")?.getAttribute("data-point"));
  return a != null && b != null;
}

export function holePointIndexFromPointKey(key: string | null | undefined): number | null {
  const m = /^hole-\d+-(\d+)$/.exec(key ?? "");
  return m ? Number(m[1]) : null;
}

export function isCrossingHolePointToHeaderTab(
  from: Element | null | undefined,
  to: Element | null | undefined,
): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  const a = holeIndexFromPointKey(from.closest("[data-point]")?.getAttribute("data-point"));
  const b = holeIndexFromHoleControl(to);
  return a != null && b != null && a === b;
}

export function shouldShiftTabToSameHoleHeader(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = from.closest("[data-point]")?.getAttribute("data-point");
  const idx = holePointIndexFromPointKey(key);
  const axis = from.getAttribute("data-path-axis") ?? from.closest("[data-path-axis]")?.getAttribute("data-path-axis");
  return idx === 0 && axis === "x";
}

export function pickSameHoleHeaderTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const key = from.closest("[data-point]")?.getAttribute("data-point");
  const h = holeIndexFromPointKey(key);
  if (h == null) return null;
  const inspector = from.closest("[data-path-inspector]");
  if (!inspector) return null;
  const header = inspector.querySelector(`[data-select-hole="${h}"]`);
  return header instanceof HTMLElement ? header : null;
}

export function pickSameHoleLastPointTabTarget(
  from: Element | null | undefined,
): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null) return null;
  const inspector = from.closest("[data-path-inspector]");
  if (!inspector) return null;
  const rows = [...inspector.querySelectorAll<HTMLElement>(`[data-point^="hole-${h}-"]`)];
  const row = rows.at(-1);
  if (!row) return null;
  return row.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? row;
}

export function pickNextHolePointTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  if (!header) return null;
  const h = holeIndexFromHoleControl(header);
  if (h == null) return null;
  const inspector = from.closest("[data-path-inspector]");
  if (!inspector) return null;
  const row = inspector.querySelector(`[data-point="hole-${h + 1}-0"]`);
  if (!(row instanceof HTMLElement)) return null;
  return row.querySelector<HTMLElement>('input[data-path-axis="x"]') ?? row;
}

export function tagHolePointTabCrossing(
  from: Element | null | undefined,
  to: Element | null | undefined,
  input?: Element | null,
): boolean {
  if (
    (!isCrossingHolePointTab(from, to) &&
      !isCrossingHoleHeaderToPointTab(from, to) &&
      !isCrossingHolePointToHeaderTab(from, to)) ||
    !to
  ) {
    return false;
  }
  const list =
    to.closest("[data-point-list]") ??
    from?.closest?.("[data-point-list]") ??
    to.closest("[data-path-inspector]")?.querySelector("[data-point-list]");
  if (list) {
    for (const el of list.querySelectorAll("[data-hole-point]")) {
      el.removeAttribute("data-hole-point");
    }
  }
  const inspector = to.closest("[data-path-inspector]") ?? from?.closest?.("[data-path-inspector]");
  if (inspector) {
    for (const el of inspector.querySelectorAll("[data-hole-point]")) {
      el.removeAttribute("data-hole-point");
    }
  }
  const row = to.closest("[data-point]") ?? to.closest("[data-select-hole]") ?? to;
  row.setAttribute("data-hole-point", "");
  if (input && input instanceof Element) input.setAttribute("data-hole-point", "");
  return true;
}

export function shouldHoldPointListScroll(active: Element | null | undefined): boolean {
  if (!active || !(active instanceof Element)) return false;
  return Boolean(
    active.closest(
      "[data-path-exit], [data-hole-fill], [data-delete-hole], [data-select-hole], [data-hole-point]",
    ),
  );
}

export function holeIndexFromHoleControl(el: Element | null | undefined): number | null {
  if (!el || !(el instanceof Element)) return null;
  const select = el.closest("[data-select-hole]")?.getAttribute("data-select-hole");
  if (select != null && select !== "") {
    const n = Number(select);
    return Number.isFinite(n) ? n : null;
  }
  const hole = el.closest("[data-hole]")?.getAttribute("data-hole");
  if (hole != null && hole !== "") {
    const n = Number(hole);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function isCrossingHoleHeaderTab(
  from: Element | null | undefined,
  to: Element | null | undefined,
): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  const a = holeIndexFromHoleControl(from);
  const b = holeIndexFromHoleControl(to);
  return a != null && b != null && a !== b;
}

export function tagHoleHeaderTabCrossing(
  from: Element | null | undefined,
  to: Element | null | undefined,
  input?: Element | null,
): boolean {
  if (!isCrossingHoleHeaderTab(from, to) || !to) return false;
  const list = to.closest("[data-hole-list]");
  if (list) {
    for (const el of list.querySelectorAll("[data-hole-header-tab]")) {
      el.removeAttribute("data-hole-header-tab");
    }
  }
  const row = to.closest("[data-hole]") ?? to;
  row.setAttribute("data-hole-header-tab", "");
  if (input && input instanceof Element) input.setAttribute("data-hole-header-tab", "");
  return true;
}

export function pickPreviousHoleTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const header = from.closest("[data-select-hole]");
  const list = from.closest("[data-hole-list]");
  if (!header || !list) return null;
  const cards = [...list.querySelectorAll<HTMLElement>(":scope > [data-hole]")];
  const card = from.closest("[data-hole]");
  const i = card instanceof HTMLElement ? cards.indexOf(card) : -1;
  if (i <= 0) return null;
  const prev = cards[i - 1];
  if (!prev) return null;
  const focusable = [
    ...prev.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
    ),
  ];
  return focusable.at(-1) ?? prev.querySelector("[data-select-hole]") ?? prev;
}

export function pickNextHoleTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  const del = from.closest("[data-delete-hole]");
  const list = from.closest("[data-hole-list]");
  if (!del || !list) return null;
  const cards = [...list.querySelectorAll<HTMLElement>(":scope > [data-hole]")];
  const card = from.closest("[data-hole]");
  const i = card instanceof HTMLElement ? cards.indexOf(card) : -1;
  if (i < 0 || i >= cards.length - 1) return null;
  const next = cards[i + 1];
  if (!next) return null;
  return next.querySelector<HTMLElement>("[data-select-hole]") ?? next;
}

export function shouldHoldHoleListScroll(active: Element | null | undefined): boolean {
  if (!active || !(active instanceof Element)) return false;
  return Boolean(
    active.closest("[data-hole-fill], [data-delete-hole], [data-hole-header-tab]"),
  );
}

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

export function isPathExitStatus(text: string | null | undefined): boolean {
  return Boolean(text && /^Left Points · /.test(text));
}

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
