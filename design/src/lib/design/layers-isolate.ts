export type IsolateNode = { id: string; visible: boolean };

function sameSet(a: string[], b: Iterable<string>): boolean {
  const other = new Set(b);
  if (a.length !== other.size) return false;
  return a.every((id) => other.has(id));
}

function visibleIds<T extends IsolateNode>(nodes: T[]): string[] {
  return nodes.filter((n) => n.visible).map((n) => n.id);
}

function restoreFromSnapshot<T extends IsolateNode>(
  nodes: T[],
  snapshot: Record<string, boolean>,
): T[] {
  return nodes.map((n) => ({
    ...n,
    visible: snapshot[n.id] ?? n.visible,
  }));
}

/**
 * Isolate `keepIds` (hide everything else).
 * Empty `keepIds` restores the snapshot (Show all).
 * A second call with the same keep set also restores.
 * A different keep set while isolated restores first, then isolates the new set
 * so hidden layers from the first pass do not stay hidden.
 */
export function applyIsolate<T extends IsolateNode>(
  nodes: T[],
  keepIds: string[],
  snapshot: Record<string, boolean> | null,
): { nodes: T[]; isolateSnapshot: Record<string, boolean> | null } {
  const allIds = new Set(nodes.map((n) => n.id));
  const askingShowAll =
    keepIds.length === 0 || (snapshot != null && keepIds.length === allIds.size && keepIds.every((id) => allIds.has(id)));
  if (askingShowAll) {
    if (!snapshot) return { nodes, isolateSnapshot: null };
    return {
      isolateSnapshot: null,
      nodes: restoreFromSnapshot(nodes, snapshot),
    };
  }

  if (snapshot && sameSet(keepIds, visibleIds(nodes))) {
    return {
      isolateSnapshot: null,
      nodes: restoreFromSnapshot(nodes, snapshot),
    };
  }

  const base = snapshot ? restoreFromSnapshot(nodes, snapshot) : nodes;
  const snap: Record<string, boolean> = snapshot ? { ...snapshot } : {};
  if (!snapshot) {
    for (const n of base) snap[n.id] = n.visible;
  } else {
    for (const n of base) {
      if (!(n.id in snap)) snap[n.id] = n.visible;
    }
  }
  const keep = new Set(keepIds);
  return {
    isolateSnapshot: snap,
    nodes: base.map((n) => ({ ...n, visible: keep.has(n.id) })),
  };
}
