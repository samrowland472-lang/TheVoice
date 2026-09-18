export type Guide = {
  id: string;
  axis: "x" | "y";
  pos: number;
  locked?: boolean;
  hidden?: boolean;
  label?: string;
};

export function sanitizeGuideLabel(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 32);
}

export function guideDisplayName(g: { axis: "x" | "y"; pos: number; label?: string }): string {
  const named = sanitizeGuideLabel(g.label ?? "");
  if (named) return named;
  const axis = g.axis === "x" ? "V" : "H";
  const pos = Number.isFinite(g.pos) ? String(Math.round(g.pos * 10) / 10) : "0";
  return `${axis} ${pos}`;
}

export function clearGuideLabels(guides: Guide[]): Guide[] {
  return guides.map((g) => {
    if (!g.label) return g;
    const { label: _drop, ...rest } = g;
    return rest;
  });
}

export function toggleGuideIds(current: string[], ids: string[]): string[] {
  const next = new Set(current);
  for (const id of ids) {
    if (next.has(id)) next.delete(id);
    else next.add(id);
  }
  return [...next];
}

export function pruneGuideIds(current: string[], guides: Guide[]): string[] {
  const live = new Set(guides.map((g) => g.id));
  return current.filter((id) => live.has(id));
}

/** Move selected vertical guides by dx and selected horizontal guides by dy. */
export function nudgeGuidePositions(guides: Guide[], ids: string[], dx: number, dy: number): Guide[] {
  if (!ids.length || (!dx && !dy)) return guides;
  const set = new Set(ids);
  return guides.map((g) => {
    if (!set.has(g.id) || g.locked || g.hidden) return g;
    const delta = g.axis === "x" ? dx : dy;
    if (!delta) return g;
    return { ...g, pos: Math.round((g.pos + delta) * 10) / 10 };
  });
}

/**
 * Space selected guides of the same axis evenly between the first and last.
 * Hidden guides are ignored. Locked guides keep their position (ends still
 * act as anchors). Each axis is handled independently. Needs 3+ guides.
 */
export function distributeGuidePositions(guides: Guide[], ids: string[]): Guide[] {
  const pick = ids.length ? new Set(ids) : null;
  const next = guides.map((g) => ({ ...g }));
  for (const axis of ["x", "y"] as const) {
    const group = next
      .filter((g) => g.axis === axis && !g.hidden && (!pick || pick.has(g.id)))
      .sort((a, b) => a.pos - b.pos);
    if (group.length < 3) continue;
    const lo = group[0].pos;
    const hi = group[group.length - 1].pos;
    if (hi === lo) continue;
    const span = group.length - 1;
    for (let i = 1; i < group.length - 1; i++) {
      const g = group[i];
      if (g.locked) continue;
      g.pos = Math.round((lo + ((hi - lo) * i) / span) * 10) / 10;
    }
  }
  return next;
}

export function canDistributeGuides(guides: Guide[], ids: string[]): boolean {
  const pick = ids.length ? new Set(ids) : null;
  for (const axis of ["x", "y"] as const) {
    const n = guides.filter((g) => g.axis === axis && !g.hidden && (!pick || pick.has(g.id))).length;
    if (n >= 3) return true;
  }
  return false;
}
