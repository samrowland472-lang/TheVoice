import { splitCompoundIslands } from "./align";
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
  const islands = parts.flatMap((part) => splitCompoundIslands(part));
  if (!islands.length) return;
  commit();
  const keepId = order[0]!.id;
  const drop = new Set(order.map((n) => n.id));
  drop.delete(keepId);
  const stamped = islands.map((island, i) =>
    i === 0 ? { ...island, id: keepId, name: island.name } : island,
  );
  const extras = stamped.slice(1);
  const live = useDesign.getState().doc;
  if (!live) return;
  const replaced = live.nodes
    .map((n) => (n.id === keepId ? stamped[0]! : n))
    .filter((n) => !drop.has(n.id));
  const keepIdx = replaced.findIndex((n) => n.id === keepId);
  const nextNodes = [...replaced];
  if (keepIdx >= 0) nextNodes.splice(keepIdx + 1, 0, ...extras);
  else nextNodes.push(...extras);
  useDesign.setState({
    doc: { ...live, nodes: nextNodes },
    selection: stamped.map((n) => n.id),
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
