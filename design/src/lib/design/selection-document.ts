import type { DesignDocument } from "./types";

/** Keep only the named nodes; same artboard. Empty or missing ids → null. */
export function selectionDocument(doc: DesignDocument, ids: string[]): DesignDocument | null {
  if (!ids.length) return null;
  const keep = new Set(ids);
  const nodes = doc.nodes.filter((n) => keep.has(n.id));
  if (!nodes.length) return null;
  return { ...doc, nodes, name: `${doc.name} selection` };
}
