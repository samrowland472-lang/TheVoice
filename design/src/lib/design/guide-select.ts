export type Guide = { id: string; axis: "x" | "y"; pos: number };

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
    if (!set.has(g.id)) return g;
    const delta = g.axis === "x" ? dx : dy;
    if (!delta) return g;
    return { ...g, pos: Math.round((g.pos + delta) * 10) / 10 };
  });
}
