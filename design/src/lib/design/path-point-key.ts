export function holeIndexFromPointKey(key: string | null | undefined): number | null {
  const hole = /^hole-(\d+)-\d+$/.exec(key ?? "");
  if (hole) return Number(hole[1]);
  if (/^path-\d+$/.test(key ?? "")) return -1;
  return null;
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
