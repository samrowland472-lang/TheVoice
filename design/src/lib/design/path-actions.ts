import { applyPathEdit, pathWorldToLocal, type PathEditHit } from "./path-edit";
import { autoSmoothPoint, closePathWithCubic, hasHandle } from "./path-curve";
import {
  cutContourMany,
  hitCompoundSegment,
  strokeHitsCompound,
  type SegmentHit,
} from "./path-cut";
import { joinOpenPathNodes, nearestOpenPathEnd, PEN_SNAP_PX, type PathEnd } from "./path-join";
import { pathNode } from "./node-factory";
import { useDesign } from "./store";
import type { PathNode, PathPoint } from "./types";
import { isPath } from "./types";

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

function clonePathStyle(n: PathNode, points: PathPoint[], closed: boolean, holes?: PathPoint[][]): PathNode {
  const extra = pathNode({
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    points,
    closed,
    holes: holes && holes.length ? holes : undefined,
    fill: n.fill,
    stroke: n.stroke,
    strokeWidth: n.strokeWidth,
    opacity: n.opacity,
    blend: n.blend,
    rotation: n.rotation,
  });
  extra.name = n.name;
  return extra;
}

function applyCutsToPath(
  n: PathNode,
  groups: { hole: number | null; hits: SegmentHit[] }[],
): { keep: PathNode; extras: PathNode[] } | null {
  if (!groups.length) return null;
  let keep: PathNode = { ...n, holes: n.holes ? n.holes.map((h) => h.map((p) => ({ ...p }))) : n.holes };
  const extras: PathNode[] = [];
  const outerGroup = groups.find((g) => g.hole == null);
  const holeGroups = groups.filter((g) => g.hole != null);
  if (outerGroup) {
    const pieces = cutContourMany(keep.points, keep.closed, outerGroup.hits);
    const released = keep.closed && (keep.holes?.length ?? 0) > 0;
    keep = { ...keep, points: pieces[0] ?? keep.points, closed: false, holes: released ? undefined : keep.holes };
    for (const piece of pieces.slice(1)) {
      if (piece.length >= 2) extras.push(clonePathStyle(n, piece, false));
    }
    if (released) {
      for (const hole of n.holes ?? []) {
        if (hole.length >= 3) extras.push(clonePathStyle(n, hole, true));
      }
    }
  }
  const survivingHoles = [...(keep.holes ?? [])];
  const removed = new Set<number>();
  for (const g of holeGroups.sort((a, b) => (b.hole ?? 0) - (a.hole ?? 0))) {
    const idx = g.hole!;
    const ring = survivingHoles[idx];
    if (!ring) continue;
    const pieces = cutContourMany(ring, true, g.hits);
    removed.add(idx);
    for (const piece of pieces) {
      if (piece.length >= 2) extras.push(clonePathStyle(n, piece, false));
    }
  }
  if (removed.size) {
    keep = { ...keep, holes: survivingHoles.filter((_, i) => !removed.has(i)) };
  }
  return { keep, extras };
}

function knifePaths(): PathNode[] {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return [];
  const paths = doc.nodes.filter(isPath).filter((n) => n.visible && !n.locked && n.points.length >= 2);
  const preferred = s.selection[0] ? paths.find((n) => n.id === s.selection[0]) : undefined;
  return preferred ? [preferred, ...paths.filter((n) => n.id !== preferred.id)] : paths;
}

export function knifeCutAt(wx: number, wy: number, zoom: number): boolean {
  const s = useDesign.getState();
  for (const n of knifePaths()) {
    const local = pathWorldToLocal(n, wx, wy);
    const found = hitCompoundSegment(n, local.x, local.y, zoom);
    if (!found) continue;
    const applied = applyCutsToPath(n, [{ hole: found.hole, hits: [found.hit] }]);
    if (!applied) continue;
    s.commit();
    s.replaceNode(n.id, applied.keep, false);
    const ids = [n.id];
    for (const extra of applied.extras) {
      s.addNode(extra, false);
      ids.push(extra.id);
    }
    s.select(ids);
    setPathEditHit({ index: 0, arm: "anchor" });
    return true;
  }
  return false;
}

export function knifeCutStroke(ax: number, ay: number, bx: number, by: number, zoom: number): boolean {
  const dist = Math.hypot(bx - ax, by - ay);
  if (dist < 4 / zoom) return knifeCutAt(bx, by, zoom);
  const s = useDesign.getState();
  let any = false;
  let firstKeep: string | null = null;
  const extraIds: string[] = [];
  for (const n of knifePaths()) {
    const a = pathWorldToLocal(n, ax, ay);
    const b = pathWorldToLocal(n, bx, by);
    const hits = strokeHitsCompound(n, a, b);
    if (!hits.length) continue;
    const grouped = new Map<number | string, { hole: number | null; hits: SegmentHit[] }>();
    for (const h of hits) {
      const key = h.hole == null ? "outer" : h.hole;
      const g = grouped.get(key) ?? { hole: h.hole, hits: [] };
      g.hits.push(h.hit);
      grouped.set(key, g);
    }
    const applied = applyCutsToPath(n, [...grouped.values()]);
    if (!applied) continue;
    if (!any) s.commit();
    any = true;
    s.replaceNode(n.id, applied.keep, false);
    if (!firstKeep) firstKeep = n.id;
    for (const extra of applied.extras) {
      s.addNode(extra, false);
      extraIds.push(extra.id);
    }
  }
  if (!any) return knifeCutAt(bx, by, zoom);
  s.select([firstKeep!, ...extraIds].filter(Boolean));
  setPathEditHit({ index: 0, arm: "anchor" });
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
