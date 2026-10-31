import { dropHole, setHoleFillRule as stampHoleFillRule, type PathFillRule } from "./fill-rule";
import { applyPathEdit, type PathEditHit } from "./path-edit";
import { autoSmoothPoint, closePathWithCubic, hasHandle } from "./path-curve";
import { joinOpenPathNodes, nearestOpenPathEnd, PEN_SNAP_PX, type PathEnd } from "./path-join";
import { pathNode } from "./node-factory";
import { applyKnifePointToPath, applyKnifeStrokeToPath } from "./knife-apply";
import { asEditablePath } from "./shape-to-path";
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

export function togglePathPointSelection(index: number, hole?: number) {
  const s = useDesign.getState();
  const key = (p: { index: number; hole?: number }) => `${p.hole ?? ""}:${p.index}`;
  const targetKey = `${hole ?? ""}:${index}`;
  const cur = s.pathPointSelection ?? [];
  const exists = cur.some((p) => key(p) === targetKey);
  const next = exists ? cur.filter((p) => key(p) !== targetKey) : [...cur, { index, hole }];
  useDesign.setState({ pathPointSelection: next, pathEditHit: { index, arm: "anchor", hole } });
}

export function setPathPointSelection(points: { index: number; hole?: number }[]) {
  useDesign.setState({ pathPointSelection: points });
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

export function selectPathHole(hole: number) {
  setPathEditHit({ index: 0, arm: "anchor", hole });
}

/** Walk the selected compound path's holes. Returns true when the hit moved. */
export function stepPathHole(delta: number): boolean {
  if (!delta) return false;
  const s = useDesign.getState();
  const hit = s.pathEditHit;
  if (hit?.hole == null) return false;
  const id = s.selection[0];
  if (!id) return false;
  const n = livePath(id);
  const count = n?.holes?.length ?? 0;
  if (count < 1) return false;
  const next = Math.max(0, Math.min(count - 1, hit.hole + delta));
  if (next === hit.hole) return false;
  selectPathHole(next);
  return true;
}

/** Jump to the first (end=false) or last hole. Returns true when the hit moved. */
export function jumpPathHole(end: boolean): boolean {
  const s = useDesign.getState();
  const hit = s.pathEditHit;
  if (hit?.hole == null) return false;
  const id = s.selection[0];
  if (!id) return false;
  const n = livePath(id);
  const count = n?.holes?.length ?? 0;
  if (count < 1) return false;
  const next = end ? count - 1 : 0;
  if (next === hit.hole) return false;
  selectPathHole(next);
  return true;
}

/** Walk points on the picked hole ring. Left/Right. Returns true when handled. */
export function stepPathHolePoint(delta: number): boolean {
  if (!delta) return false;
  const s = useDesign.getState();
  const hit = s.pathEditHit;
  if (hit?.hole == null) return false;
  const id = s.selection[0];
  if (!id) return false;
  const n = livePath(id);
  const ring = n?.holes?.[hit.hole];
  const count = ring?.length ?? 0;
  if (count < 1) return false;
  const cur = ((hit.index % count) + count) % count;
  const next = ((cur + delta) % count + count) % count;
  selectPathPoint(next, hit.hole);
  return true;
}

/** Jump to the first (end=false) or last point on the picked hole ring. */
export function jumpPathHolePoint(end: boolean): boolean {
  const s = useDesign.getState();
  const hit = s.pathEditHit;
  if (hit?.hole == null) return false;
  const id = s.selection[0];
  if (!id) return false;
  const n = livePath(id);
  const ring = n?.holes?.[hit.hole];
  const count = ring?.length ?? 0;
  if (count < 1) return false;
  const next = end ? count - 1 : 0;
  const cur = ((hit.index % count) + count) % count;
  if (cur === next) return false;
  selectPathPoint(next, hit.hole);
  return true;
}

export function setHoleFillRule(id: string, hole: number, rule: PathFillRule) {
  const n = livePath(id);
  if (!n) return;
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(id, stampHoleFillRule(n, hole, rule), false);
  if (s.pathEditHit?.hole !== hole) selectPathHole(hole);
}

export function deletePathHole(id: string, hole: number) {
  const n = livePath(id);
  if (!n) return;
  if (hole < 0 || hole >= (n.holes?.length ?? 0)) return;
  const s = useDesign.getState();
  s.commit();
  const next = dropHole(n, hole);
  s.replaceNode(id, next, false);
  const remaining = next.holes?.length ?? 0;
  if (remaining === 0) {
    setPathEditHit(null);
    return;
  }
  selectPathHole(Math.min(hole, remaining - 1));
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

/** Update in/out handle offsets (relative to the anchor). Pass null to clear a handle. */
export function setPathPointHandles(
  id: string,
  index: number,
  next: { in?: { x: number; y: number } | null; out?: { x: number; y: number } | null },
  hole?: number,
) {
  const n = livePath(id);
  if (!n) return;
  const ring = hole == null ? n.points : (n.holes?.[hole] ?? []);
  const pt = ring[index];
  if (!pt) return;
  const nextPt: PathPoint = {
    ...pt,
    in: next.in !== undefined ? next.in : pt.in,
    out: next.out !== undefined ? next.out : pt.out,
  };
  // If both handles are cleared, force corner.
  if (!nextPt.in && !nextPt.out) nextPt.smooth = false;
  const nextRing = ring.map((p, i) => (i === index ? nextPt : p));
  const nextNode: PathNode =
    hole == null ? { ...n, points: nextRing } : { ...n, holes: (n.holes ?? []).map((h, i) => (i === hole ? nextRing : h)) };
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(id, nextNode, false);
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

function knifePaths(): PathNode[] {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return [];
  const paths: PathNode[] = [];
  for (const n of doc.nodes) {
    if (!n.visible || n.locked) continue;
    const p = asEditablePath(n);
    if (!p || p.points.length < 2) continue;
    paths.push(p);
  }
  const preferred = s.selection[0] ? paths.find((n) => n.id === s.selection[0]) : undefined;
  return preferred ? [preferred, ...paths.filter((n) => n.id !== preferred.id)] : paths;
}

export function knifeCutAt(wx: number, wy: number, zoom: number): boolean {
  const s = useDesign.getState();
  for (const n of knifePaths()) {
    const applied = applyKnifePointToPath(n, wx, wy, zoom);
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
    const applied = applyKnifeStrokeToPath(n, ax, ay, bx, by);
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
    s.replaceNode(id, dropHole(n, hole), false);
    setPathEditHit(null);
    return;
  }
  const nextHole = holeRing.filter((_, i) => i !== index);
  s.replaceNode(id, { ...n, holes: (n.holes ?? []).map((h, i) => (i === hole ? nextHole : h)) }, false);
  setPathEditHit({ index: Math.min(index, nextHole.length - 1), arm: "anchor", hole });
}

/** Reverse path direction: flip point order and swap in/out handles so curves stay continuous. */
export function reverseSelectedPath(): boolean {
  const s = useDesign.getState();
  const id = s.selection[0];
  if (!id) return false;
  const n = livePath(id);
  if (!n || n.points.length < 2) return false;
  const reverseRing = (pts: PathPoint[]): PathPoint[] =>
    pts.slice().reverse().map((p) => ({
      ...p,
      in: p.out ?? null,
      out: p.in ?? null,
    }));
  s.commit();
  s.replaceNode(
    id,
    {
      ...n,
      points: reverseRing(n.points),
      holes: n.holes?.map(reverseRing),
    },
    false,
  );
  setPathPointSelection([]);
  setPathEditHit(null);
  return true;
}

/** Reverse relative order of multi-selected points (same slots, points reordered among themselves).
 * Swaps in/out handles so local curves reverse with the order. Selection indices stay valid.
 * Mirror flags follow the points. */
export function reverseRelativeSelectedPoints(
  node: PathNode,
  selected: { index: number; hole?: number }[],
): boolean {
  if (selected.length < 2) return false;
  const s = useDesign.getState();
  const byHole = new Map<number | null, number[]>();
  for (const p of selected) {
    const h = p.hole ?? null;
    if (!byHole.has(h)) byHole.set(h, []);
    const arr = byHole.get(h)!;
    if (!arr.includes(p.index)) arr.push(p.index);
  }
  let changed = false;
  let nextPoints = node.points.slice();
  let nextHoles = node.holes ? node.holes.map((h) => h.slice()) : undefined;
  const mirrorMoves: { from: string; to: string; value: boolean }[] = [];
  const mirrorPoints = s.mirrorPoints || {};

  for (const [h, rawIdx] of byHole) {
    const indices = rawIdx.slice().sort((a, b) => a - b);
    if (indices.length < 2) continue;
    const ring = h == null ? nextPoints : nextHoles?.[h];
    if (!ring) continue;
    const picked = indices.map((i) => ring[i]).filter(Boolean);
    if (picked.length !== indices.length) continue;
    const reversed = picked.slice().reverse().map((p) => ({
      ...p,
      in: p.out ?? null,
      out: p.in ?? null,
    }));
    for (let k = 0; k < indices.length; k++) {
      ring[indices[k]!] = reversed[k]!;
    }
    // mirror flags follow the points
    for (let k = 0; k < indices.length; k++) {
      const fromIdx = indices[k]!;
      const toIdx = indices[indices.length - 1 - k]!;
      if (fromIdx === toIdx) continue;
      const fromKey = `${node.id}:${h ?? ""}:${fromIdx}`;
      const toKey = `${node.id}:${h ?? ""}:${toIdx}`;
      const value = !!mirrorPoints[fromKey];
      mirrorMoves.push({ from: fromKey, to: toKey, value });
    }
    changed = true;
  }
  if (!changed) return false;
  s.commit();
  s.replaceNode(
    node.id,
    {
      ...node,
      points: nextPoints,
      holes: nextHoles && nextHoles.length ? nextHoles : undefined,
    },
    false,
  );
  // apply mirror moves (two-pass to avoid overwrite)
  if (mirrorMoves.length) {
    const temp: Record<string, boolean> = {};
    for (const m of mirrorMoves) temp[m.to] = m.value;
    const setMirrorPoint = s.setMirrorPoint;
    for (const m of mirrorMoves) {
      if (temp[m.to] !== undefined) {
        setMirrorPoint(m.to, temp[m.to]!);
      }
    }
  }
  return true;
}

/** Reverse relative order within each consecutive run of multi-selected points.
 * Non-consecutive selected points form separate runs; each run of length >= 2 is reversed independently.
 * Unselected points and isolated selected points stay put. Handles and Mirror flags follow as in reverseRelativeSelectedPoints. */
export function reverseConsecutiveRunsSelectedPoints(
  node: PathNode,
  selected: { index: number; hole?: number }[],
): boolean {
  if (selected.length < 2) return false;
  const s = useDesign.getState();
  const byHole = new Map<number | null, number[]>();
  for (const p of selected) {
    const h = p.hole ?? null;
    if (!byHole.has(h)) byHole.set(h, []);
    const arr = byHole.get(h)!;
    if (!arr.includes(p.index)) arr.push(p.index);
  }
  let changed = false;
  let nextPoints = node.points.slice();
  let nextHoles = node.holes ? node.holes.map((h) => h.slice()) : undefined;
  const mirrorMoves: { from: string; to: string; value: boolean }[] = [];
  const mirrorPoints = s.mirrorPoints || {};

  for (const [h, rawIdx] of byHole) {
    const indices = rawIdx.slice().sort((a, b) => a - b);
    if (indices.length < 2) continue;
    const ring = h == null ? nextPoints : nextHoles?.[h];
    if (!ring) continue;

    // group into consecutive runs
    const runs: number[][] = [];
    let current: number[] = [indices[0]!];
    for (let i = 1; i < indices.length; i++) {
      if (indices[i]! === indices[i - 1]! + 1) {
        current.push(indices[i]!);
      } else {
        if (current.length >= 2) runs.push(current);
        current = [indices[i]!];
      }
    }
    if (current.length >= 2) runs.push(current);

    for (const run of runs) {
      const picked = run.map((i) => ring[i]).filter(Boolean);
      if (picked.length !== run.length) continue;
      const reversed = picked.slice().reverse().map((p) => ({
        ...p,
        in: p.out ?? null,
        out: p.in ?? null,
      }));
      for (let k = 0; k < run.length; k++) {
        ring[run[k]!] = reversed[k]!;
      }
      // mirror flags follow the points
      for (let k = 0; k < run.length; k++) {
        const fromIdx = run[k]!;
        const toIdx = run[run.length - 1 - k]!;
        if (fromIdx === toIdx) continue;
        const fromKey = `${node.id}:${h ?? ""}:${fromIdx}`;
        const toKey = `${node.id}:${h ?? ""}:${toIdx}`;
        const value = !!mirrorPoints[fromKey];
        mirrorMoves.push({ from: fromKey, to: toKey, value });
      }
      changed = true;
    }
  }
  if (!changed) return false;
  s.commit();
  s.replaceNode(
    node.id,
    {
      ...node,
      points: nextPoints,
      holes: nextHoles && nextHoles.length ? nextHoles : undefined,
    },
    false,
  );
  // apply mirror moves (two-pass to avoid overwrite)
  if (mirrorMoves.length) {
    const temp: Record<string, boolean> = {};
    for (const m of mirrorMoves) temp[m.to] = m.value;
    const setMirrorPoint = s.setMirrorPoint;
    for (const m of mirrorMoves) {
      if (temp[m.to] !== undefined) {
        setMirrorPoint(m.to, temp[m.to]!);
      }
    }
  }
  return true;
}

/** Compute a rotated relative order preview without committing. Direction +1 cycles points to next higher selected slot. */
export function computeRotatedRelativePoints(
  node: PathNode,
  selected: { index: number; hole?: number }[],
  direction: 1 | -1,
): PathNode | null {
  if (selected.length < 2) return null;
  const byHole = new Map<number | null, number[]>();
  for (const p of selected) {
    const h = p.hole ?? null;
    if (!byHole.has(h)) byHole.set(h, []);
    const arr = byHole.get(h)!;
    if (!arr.includes(p.index)) arr.push(p.index);
  }
  let changed = false;
  const nextPoints = node.points.slice();
  const nextHoles = node.holes ? node.holes.map((h) => h.slice()) : undefined;

  for (const [h, rawIdx] of byHole) {
    const indices = rawIdx.slice().sort((a, b) => a - b);
    if (indices.length < 2) continue;
    const ring = h == null ? nextPoints : nextHoles?.[h];
    if (!ring) continue;
    const picked = indices.map((i) => ring[i]).filter(Boolean);
    if (picked.length !== indices.length) continue;
    const rotated = direction === 1
      ? [...picked.slice(1), picked[0]]
      : [picked[picked.length - 1], ...picked.slice(0, -1)];
    for (let k = 0; k < indices.length; k++) {
      ring[indices[k]!] = rotated[k]!;
    }
    changed = true;
  }
  if (!changed) return null;
  return {
    ...node,
    points: nextPoints,
    holes: nextHoles && nextHoles.length ? nextHoles : undefined,
  };
}

/** Rotate relative order of multi-selected points by one step among their slots.
 * Direction +1 moves each point to the next higher selected index (cycling); -1 the opposite.
 * Handles stay with the points. Mirror flags follow the points. Selection indices remain valid.
 * Non-selected points stay put. */
export function rotateRelativeSelectedPoints(
  node: PathNode,
  selected: { index: number; hole?: number }[],
  direction: 1 | -1,
): boolean {
  if (selected.length < 2) return false;
  const s = useDesign.getState();
  const byHole = new Map<number | null, number[]>();
  for (const p of selected) {
    const h = p.hole ?? null;
    if (!byHole.has(h)) byHole.set(h, []);
    const arr = byHole.get(h)!;
    if (!arr.includes(p.index)) arr.push(p.index);
  }
  let changed = false;
  let nextPoints = node.points.slice();
  let nextHoles = node.holes ? node.holes.map((h) => h.slice()) : undefined;
  const mirrorMoves: { from: string; to: string; value: boolean }[] = [];
  const mirrorPoints = s.mirrorPoints || {};

  for (const [h, rawIdx] of byHole) {
    const indices = rawIdx.slice().sort((a, b) => a - b);
    if (indices.length < 2) continue;
    const ring = h == null ? nextPoints : nextHoles?.[h];
    if (!ring) continue;
    const picked = indices.map((i) => ring[i]).filter(Boolean);
    if (picked.length !== indices.length) continue;
    const rotated = direction === 1
      ? [...picked.slice(1), picked[0]]
      : [picked[picked.length - 1], ...picked.slice(0, -1)];
    for (let k = 0; k < indices.length; k++) {
      ring[indices[k]!] = rotated[k]!;
    }
    // mirror flags follow the points
    for (let k = 0; k < indices.length; k++) {
      // original index of the point that moves to this slot
      const srcK = direction === 1 ? (k + 1) % indices.length : (k - 1 + indices.length) % indices.length;
      const fromIdx = indices[srcK]!;
      const toIdx = indices[k]!;
      if (fromIdx === toIdx) continue;
      const fromKey = `${node.id}:${h ?? ""}:${fromIdx}`;
      const toKey = `${node.id}:${h ?? ""}:${toIdx}`;
      const value = !!mirrorPoints[fromKey];
      mirrorMoves.push({ from: fromKey, to: toKey, value });
    }
    changed = true;
  }
  if (!changed) return false;
  s.commit();
  s.replaceNode(
    node.id,
    {
      ...node,
      points: nextPoints,
      holes: nextHoles && nextHoles.length ? nextHoles : undefined,
    },
    false,
  );
  // apply mirror moves (two-pass to avoid overwrite)
  if (mirrorMoves.length) {
    const temp: Record<string, boolean> = {};
    for (const m of mirrorMoves) temp[m.to] = m.value;
    const setMirrorPoint = s.setMirrorPoint;
    for (const m of mirrorMoves) {
      if (temp[m.to] !== undefined) {
        setMirrorPoint(m.to, temp[m.to]!);
      }
    }
  }
  return true;
}
