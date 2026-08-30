import { applyPathEdit, type PathEditHit } from "./path-edit";
import { pathNode } from "./node-factory";
import { useDesign } from "./store";
import { isPath } from "./types";

export function appendPenPoint(wx: number, wy: number): string | null {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return null;
  const sel = s.selection[0] ? doc.nodes.find((x) => x.id === s.selection[0]) : null;
  if (sel && isPath(sel) && !sel.closed) {
    const pt = { x: wx - sel.x, y: wy - sel.y, in: null, out: null, smooth: true };
    s.replaceNode(sel.id, { ...sel, points: [...sel.points, pt] }, false);
    return sel.id;
  }
  const node = pathNode({
    x: 0,
    y: 0,
    w: doc.artboard.width,
    h: doc.artboard.height,
    points: [{ x: wx, y: wy, in: null, out: null, smooth: true }],
    closed: false,
    stroke: s.color || "#3fc6ff",
    strokeWidth: 3,
    fill: "transparent",
  });
  s.addNode(node, true);
  return node.id;
}

export function setPathEditHit(hit: PathEditHit | null) {
  useDesign.setState({ pathEditHit: hit } as { pathEditHit: PathEditHit | null });
}

export function editPathHit(
  id: string,
  hit: PathEditHit,
  localX: number,
  localY: number,
  keepSmooth: boolean,
  commit = false,
) {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return;
  const n = doc.nodes.find((x) => x.id === id);
  if (!n || !isPath(n)) return;
  if (commit) s.commit();
  const next = applyPathEdit(n, hit, localX, localY, keepSmooth);
  s.replaceNode(id, next, false);
  setPathEditHit(hit);
}
