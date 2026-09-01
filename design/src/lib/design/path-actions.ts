import { applyPathEdit, type PathEditHit } from "./path-edit";
import {
  autoSmoothPoint,
  closePathWithCubic,
  hasHandle,
  joinOpenPathNodes,
  nearestOpenPathEnd,
  PEN_SNAP_PX,
  type PathEnd,
} from "./path-curve";
import { pathNode } from "./node-factory";
import { useDesign } from "./store";
import type { PathNode, PathPoint } from "./types";
import { isPath } from "./types";

/** After a pen point is released, Alt converts it to a corner (drop outgoing handle). */
export function cornerLastPenPoint(): boolean {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc || s.tool !== "pen") return false;
  const sel = s.selection[0] ? doc.nodes.find((x) => x.id === s.selection[0]) : null;
  if (!sel || !isPath(sel) || sel.closed || !sel.points.length) return false;
  const last = sel.points[sel.points.length - 1]!;
  if (!hasHandle(last.out) && last.smooth === false) return false;
  const nextPt: PathPoint = { ...last, out: null, smooth: false };
  const points = sel.points.map((p, i) => (i === sel.points.length - 1 ? nextPt : p));
  s.commit();
  s.replaceNode(sel.id, { ...sel, points }, false);
  setPathEditHit({ index: points.length - 1, arm: "anchor" });
  return true;
}

export function appendPenPoint(wx: number, wy: number): string | null {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return null;
  const sel = s.selection[0] ? doc.nodes.find((x) => x.id === s.selection[0]) : null;
  if (sel && isPath(sel) && !sel.closed) {
    const pt = { x: wx - sel.x, y: wy - sel.y, in: null, out: null, smooth: true };
    s.commit();
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
  useDesign.setState({ pathEditHit: hit });
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

function livePath(id: string): PathNode | null {
  const n = useDesign.getState().doc?.nodes.find((x) => x.id === id);
  return n && isPath(n) ? n : null;
}

export function selectPathPoint(index: number, hole?: number) {
  setPathEditHit({ index, arm: "anchor", hole });
}

export function setPathClosed(id: string, closed: boolean) {
  const n = livePath(id);
  if (!n) return;
  if (closed && n.points.length < 3) return;
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(id, closed ? closePathWithCubic(n) : { ...n, closed: false }, false);
}

export function setPathPointPosition(id: string, index: number, x: number, y: number, hole?: number) {
  const n = livePath(id);
  if (!n) return;
  const hit: PathEditHit = { index, arm: "anchor", hole };
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(id, applyPathEdit(n, hit, x, y, true), false);
  setPathEditHit(hit);
}

export function setPathPointSmooth(id: string, index: number, smooth: boolean, hole?: number) {
  const n = livePath(id);
  if (!n) return;
  const ring = hole == null ? n.points : (n.holes?.[hole] ?? []);
  const pt = ring[index];
  if (!pt) return;
  let nextPt: PathPoint;
  if (smooth) {
    nextPt = autoSmoothPoint(ring, index, hole == null ? n.closed : true);
  } else {
    nextPt = { ...pt, smooth: false };
  }
  const nextRing = ring.map((p, i) => (i === index ? nextPt : p));
  const next: PathNode =
    hole == null ? { ...n, points: nextRing } : { ...n, holes: (n.holes ?? []).map((h, i) => (i === hole ? nextRing : h)) };
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(id, next, false);
  setPathEditHit({ index, arm: "anchor", hole });
}

export function joinSelectedPathToNearest(wx: number, wy: number, zoom: number): boolean {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return false;
  const thresh = PEN_SNAP_PX / zoom;
  const open = doc.nodes.filter(isPath).filter((n) => !n.closed);
  const sel = s.selection[0] ? open.find((n) => n.id === s.selection[0]) : null;
  const from = sel
    ? nearestOpenPathEnd([sel], wx, wy, thresh) ?? nearestOpenPathEnd(open, wx, wy, thresh)
    : nearestOpenPathEnd(open, wx, wy, thresh);
  if (!from) return false;
  const to = nearestOpenPathEnd(open, wx, wy, thresh, { id: from.node.id, end: from.end });
  if (!to) return false;
  if (from.node.id === to.node.id) {
    if (from.node.points.length < 3) return false;
    s.commit();
    s.replaceNode(from.node.id, closePathWithCubic(from.node), false);
    setPathEditHit({ index: 0, arm: "anchor" });
    return true;
  }
  const keep = from.node;
  const other = to.node;
  const keepEnd: PathEnd = from.end;
  const merged = joinOpenPathNodes(keep, keepEnd, other, to.end);
  s.commit();
  s.replaceNode(keep.id, merged, false);
  const leftover = useDesign.getState().doc;
  if (leftover) {
    useDesign.setState({
      doc: { ...leftover, nodes: leftover.nodes.filter((n) => n.id !== other.id) },
      selection: [keep.id],
      dirty: true,
    });
  }
  setPathEditHit({
    index: keepEnd === "end" ? Math.max(0, keep.points.length - 1) : 0,
    arm: "anchor",
  });
  return true;
}

export function deletePathPoint(id: string, index: number, hole?: number) {
  const n = livePath(id);
  if (!n) return;
  const s = useDesign.getState();
  if (hole == null) {
    if (n.points.length <= 1) {
      s.select([id]);
      s.removeSelected();
      setPathEditHit(null);
      return;
    }
    const points = n.points.filter((_, i) => i !== index);
    s.commit();
    s.replaceNode(id, { ...n, points, closed: points.length >= 3 ? n.closed : false }, false);
    const nextIndex = Math.min(index, points.length - 1);
    setPathEditHit({ index: nextIndex, arm: "anchor" });
    return;
  }
  const holeRing = n.holes?.[hole];
  if (!holeRing) return;
  s.commit();
  if (holeRing.length <= 2) {
    s.replaceNode(id, { ...n, holes: (n.holes ?? []).filter((_, i) => i !== hole) }, false);
    setPathEditHit(null);
    return;
  }
  const nextHole = holeRing.filter((_, i) => i !== index);
  s.replaceNode(id, { ...n, holes: (n.holes ?? []).map((h, i) => (i === hole ? nextHole : h)) }, false);
  setPathEditHit({ index: Math.min(index, nextHole.length - 1), arm: "anchor", hole });
}
