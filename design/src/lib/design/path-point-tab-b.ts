export function isPathExitStatus(text: string | null | undefined): boolean {
  return Boolean(text && /^Left Points · /.test(text));
}

export function pathRingWalkStatus(label: string): string {
  return label;
}

export function shouldHoldHoleListScroll(active: { closest?: (sel: string) => unknown } | null | undefined): boolean {
  if (!active || typeof active.closest !== "function") return false;
  return Boolean(
    active.closest("[data-hole-fill], [data-delete-hole], [data-hole-header-tab], [data-select-hole]"),
  );
}

export function shouldHoldPointListScroll(active: { closest?: (sel: string) => unknown } | null | undefined): boolean {
  if (!active || typeof active.closest !== "function") return false;
  return Boolean(
    active.closest("[data-path-exit], [data-hole-fill], [data-delete-hole], [data-select-hole], [data-hole-point]"),
  );
}

export function pickNextHoleTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || typeof from.closest !== "function") return null;
  const del = from.closest("[data-delete-hole]");
  const list = from.closest("[data-hole-list]");
  if (!del || !list) return null;
  const cards = [...list.querySelectorAll(":scope > [data-hole]")];
  const card = from.closest("[data-hole]");
  const i = cards.indexOf(card as Element);
  if (i < 0 || i >= cards.length - 1) return null;
  const next = cards[i + 1] as HTMLElement;
  return next.querySelector<HTMLElement>("[data-select-hole]") ?? next;
}

export function pickPreviousHoleTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || typeof from.closest !== "function") return null;
  const header = from.closest("[data-select-hole]");
  const list = from.closest("[data-hole-list]");
  if (!header || !list) return null;
  const cards = [...list.querySelectorAll(":scope > [data-hole]")];
  const card = from.closest("[data-hole]");
  const i = cards.indexOf(card as Element);
  if (i <= 0) return null;
  const prev = cards[i - 1] as HTMLElement;
  const focusable = prev.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return focusable[focusable.length - 1] ?? prev.querySelector("[data-select-hole]") ?? prev;
}

export function restoreHoleListScroll(list: { scrollTop: number; scrollHeight?: number; clientHeight?: number }, saved: number) {
  const max = Math.max(0, (list.scrollHeight ?? 0) - (list.clientHeight ?? 0));
  const next = Math.min(max, Math.max(0, saved));
  list.scrollTop = next;
  return list.scrollTop;
}

export function restorePointListScroll(list: { scrollTop: number; scrollHeight?: number; clientHeight?: number }, saved: number) {
  return restoreHoleListScroll(list, saved);
}

export function isCrossingHoleHeaderTab(from: Element | null | undefined, to: Element | null | undefined): boolean {
  if (!from || !to || !(from instanceof Element) || !(to instanceof Element)) return false;
  const a = from.closest("[data-hole]");
  const b = to.closest("[data-hole]");
  return Boolean(a && b && a !== b);
}

export function tagHoleHeaderTabCrossing(
  from: Element | null | undefined,
  to: Element | null | undefined,
  mark: Element | null | undefined = to,
): boolean {
  if (!isCrossingHoleHeaderTab(from, to) || !mark || !(mark instanceof Element)) return false;
  from?.closest("[data-hole-header-tab]")?.removeAttribute("data-hole-header-tab");
  mark.setAttribute("data-hole-header-tab", "");
  return true;
}

export function tagHolePointTabCrossing(
  from: Element | null | undefined,
  to: Element | null | undefined,
  mark: Element | null | undefined = to,
): boolean {
  if (!from || !to || !mark || !(mark instanceof Element)) return false;
  const fromPoint = from instanceof Element ? from.closest("[data-point]") : null;
  const toPoint = to instanceof Element ? to.closest("[data-point]") : null;
  const fromHeader = from instanceof Element ? from.closest("[data-select-hole]") : null;
  const toHeader = to instanceof Element ? to.closest("[data-select-hole]") : null;
  const fromExit = from instanceof Element ? from.closest("[data-path-exit]") : null;
  const toExit = to instanceof Element ? to.closest("[data-path-exit]") : null;
  const crossing = Boolean(
    (fromPoint && toHeader) ||
      (fromHeader && toPoint) ||
      (fromPoint && toPoint && fromPoint !== toPoint) ||
      (fromExit && toPoint) ||
      (fromPoint && toExit) ||
      (fromExit && toExit && fromExit !== toExit),
  );
  from instanceof Element && from.closest("[data-hole-point]")?.removeAttribute("data-hole-point");
  if (!crossing) return false;
  const row = mark.closest("[data-point]") ?? mark.closest("[data-select-hole]") ?? mark;
  row.setAttribute("data-hole-point", "");
  return true;
}
