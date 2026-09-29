export type IsolateNode = { id: string; visible: boolean };

export function applyIsolate<T extends IsolateNode>(
  nodes: T[],
  keepIds: string[],
  snapshot: Record<string, boolean> | null,
): { nodes: T[]; isolateSnapshot: Record<string, boolean> | null } {
  if (snapshot) {
    return {
      isolateSnapshot: null,
      nodes: nodes.map((n) => ({
        ...n,
        visible: snapshot[n.id] ?? n.visible,
      })),
    };
  }
  if (keepIds.length === 0) return { nodes, isolateSnapshot: snapshot };
  const snap: Record<string, boolean> = {};
  for (const n of nodes) snap[n.id] = n.visible;
  const keep = new Set(keepIds);
  return {
    isolateSnapshot: snap,
    nodes: nodes.map((n) => ({ ...n, visible: keep.has(n.id) })),
  };
}
