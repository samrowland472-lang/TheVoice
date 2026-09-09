function pointKey(el: Element | null | undefined): string | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-point]")?.getAttribute("data-point") ?? null;
}

function inspectorOf(el: Element | null | undefined): Element | null {
  if (!el || !(el instanceof Element)) return null;
  return el.closest("[data-path-inspector]");
}

export function shouldShiftTabFromFirstOuterToClosed(
  from: Element | null | undefined,
  shift: boolean,
): boolean {
  if (!shift || !from || !(from instanceof Element)) return false;
  const key = pointKey(from);
  if (key !== "path-0") return false;
  const axis = from.getAttribute?.("data-path-axis");
  if (axis && axis !== "x") return false;
  const inspector = inspectorOf(from);
  if (!inspector?.querySelector('[data-path-exit="Closed"]')) return false;
  if (inspector.querySelector('[data-path-exit="Offset"]')) return false;
  return inspector.querySelector('[data-path-exit="Outline"]') == null;
}

export function pickClosedTabTarget(from: Element | null | undefined): HTMLElement | null {
  if (!from || !(from instanceof Element)) return null;
  return inspectorOf(from)?.querySelector<HTMLElement>('[data-path-exit="Closed"]') ?? null;
}
