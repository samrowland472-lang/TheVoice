import { computeBooleanParts, type BooleanOp } from "./boolean-ops";
import { smoothPathCorners } from "./path-curve";
import { useDesign } from "./store";
import type { DesignNode } from "./types";
import { isPath } from "./types";

export function setBooleanPreview(op: BooleanOp | null) {
  useDesign.setState({ booleanPreview: op });
}

export function applyBoolean(op: BooleanOp) {
  const { doc, selection, commit } = useDesign.getState();
  if (!doc || selection.length < 2) return;
  const order = selection
    .map((id) => doc.nodes.find((n) => n.id === id))
    .filter((n): n is DesignNode => Boolean(n));
  const parts = computeBooleanParts(order, op);
  if (!parts.length) return;
  commit();
  const primary = parts[0]!;
  const extras = parts.slice(1);
  const keepId = order.find((n) => n.id === primary.id)?.id ?? order[0]!.id;
  const drop = new Set(order.filter((n) => n.id !== keepId).map((n) => n.id));
  const live = useDesign.getState().doc;
  if (!live) return;
  const replaced = live.nodes
    .map((n) => (n.id === keepId ? { ...primary, id: keepId } : n))
    .filter((n) => !drop.has(n.id));
  const keepIdx = replaced.findIndex((n) => n.id === keepId);
  const nextNodes = [...replaced];
  if (keepIdx >= 0) nextNodes.splice(keepIdx + 1, 0, ...extras);
  else nextNodes.push(...extras);
  useDesign.setState({
    doc: { ...live, nodes: nextNodes },
    selection: [keepId, ...extras.map((n) => n.id)],
    booleanPreview: null,
    dirty: true,
  });
}

export function requestFitSelection() {
  useDesign.setState({ viewIntent: { type: "fit-sel" } });
}

export function smoothSelectedPath() {
  const { doc, selection, commit, replaceNode } = useDesign.getState();
  if (!doc || !selection.length) return;
  const n = doc.nodes.find((x) => x.id === selection[0]);
  if (!n || !isPath(n) || n.points.length < 2) return;
  commit();
  replaceNode(
    n.id,
    {
      ...n,
      points: smoothPathCorners(n.points, n.closed),
      holes: n.holes?.map((h) => smoothPathCorners(h, true)),
    },
    false,
  );
}
