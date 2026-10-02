import { geometryBox, type AlignEdge } from "./align";
import { expandMovePlaces } from "./group-transform";
import { useDesign } from "./store-impl";
import { holdStudioStatus, releaseStudioStatus } from "./studio-status";
import type { DesignNode } from "./types";

export type { AlignEdge };

export type AlignGhost = { x: number; y: number; w: number; h: number; stay: boolean };

export type AlignEdgeLine = {
  axis: "x" | "y";
  at: number;
  from: number;
  to: number;
};

export type AlignTarget = "key" | "board";

export type AlignPlan = {
  edge: AlignEdge;
  target: AlignTarget;
  keyId: string;
  keyName: string;
  ids: string[];
  deltas: { id: string; dx: number; dy: number }[];
  ghosts: AlignGhost[];
  edgeLine: AlignEdgeLine;
};

const EDGES: AlignEdge[] = ["left", "center", "right", "top", "middle", "bottom"];

export function isAlignEdge(value: string): value is AlignEdge {
  return (EDGES as string[]).includes(value);
}

/** Selected unlocked layers, skipping anything nested inside another selection. */
export function alignRoots(nodes: DesignNode[], ids: string[]): DesignNode[] {
  const set = new Set(ids);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: DesignNode[] = [];
  for (const id of ids) {
    const n = byId.get(id);
    if (!n || n.locked) continue;
    let parent = n.parentId;
    let nested = false;
    while (parent) {
      if (set.has(parent)) {
        nested = true;
        break;
      }
      parent = byId.get(parent)?.parentId;
    }
    if (!nested) roots.push(n);
  }
  return roots;
}

/** Last selected unlocked root is the key. Nested picks fall back to their root. */
export function alignKey(nodes: DesignNode[], ids: string[]): DesignNode | null {
  const roots = alignRoots(nodes, ids);
  if (roots.length < 2) return null;
  const rootIds = new Set(roots.map((n) => n.id));
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i];
    if (!id) continue;
    if (rootIds.has(id)) return roots.find((n) => n.id === id) ?? null;
  }
  return roots[roots.length - 1] ?? null;
}

function edgeOffset(box: { x: number; y: number; w: number; h: number }, key: { x: number; y: number; w: number; h: number }, edge: AlignEdge) {
  if (edge === "left") return { dx: key.x - box.x, dy: 0 };
  if (edge === "center") return { dx: key.x + key.w / 2 - (box.x + box.w / 2), dy: 0 };
  if (edge === "right") return { dx: key.x + key.w - (box.x + box.w), dy: 0 };
  if (edge === "top") return { dx: 0, dy: key.y - box.y };
  if (edge === "middle") return { dx: 0, dy: key.y + key.h / 2 - (box.y + box.h / 2) };
  return { dx: 0, dy: key.y + key.h - (box.y + box.h) };
}

function edgeAt(key: { x: number; y: number; w: number; h: number }, edge: AlignEdge) {
  if (edge === "left") return key.x;
  if (edge === "center") return key.x + key.w / 2;
  if (edge === "right") return key.x + key.w;
  if (edge === "top") return key.y;
  if (edge === "middle") return key.y + key.h / 2;
  return key.y + key.h;
}

/**
 * Align unlocked roots to the key object's edge. The key stays.
 * Returns null until two unlocked roots can share that edge.
 */
export function planAlign(nodes: DesignNode[], ids: string[], edge: AlignEdge): AlignPlan | null {
  const roots = alignRoots(nodes, ids);
  const key = alignKey(nodes, ids);
  if (!key || roots.length < 2) return null;
  const keyBox = geometryBox(key);
  const deltas: AlignPlan["deltas"] = [];
  const ghosts: AlignGhost[] = [];
  let from = Infinity;
  let to = -Infinity;
  const vertical = edge === "left" || edge === "center" || edge === "right";
  for (const n of roots) {
    const box = geometryBox(n);
    const stay = n.id === key.id;
    const { dx, dy } = stay ? { dx: 0, dy: 0 } : edgeOffset(box, keyBox, edge);
    deltas.push({ id: n.id, dx, dy });
    const ghost = { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h, stay };
    ghosts.push(ghost);
    if (vertical) {
      from = Math.min(from, ghost.y);
      to = Math.max(to, ghost.y + ghost.h);
    } else {
      from = Math.min(from, ghost.x);
      to = Math.max(to, ghost.x + ghost.w);
    }
  }
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return {
    edge,
    target: "key",
    keyId: key.id,
    keyName: key.name?.trim() || "key",
    ids: roots.map((n) => n.id),
    deltas,
    ghosts,
    edgeLine: { axis: vertical ? "x" : "y", at: edgeAt(keyBox, edge), from, to },
  };
}

/**
 * Align unlocked roots to an artboard edge. Layers already on that edge stay.
 * One unlocked layer is enough. Groups move with their children on commit.
 */
export function planAlignBoard(
  nodes: DesignNode[],
  ids: string[],
  edge: AlignEdge,
  board: { width: number; height: number },
): AlignPlan | null {
  const roots = alignRoots(nodes, ids);
  if (!roots.length || board.width <= 0 || board.height <= 0) return null;
  const frame = { x: 0, y: 0, w: board.width, h: board.height };
  const deltas: AlignPlan["deltas"] = [];
  const ghosts: AlignGhost[] = [];
  const vertical = edge === "left" || edge === "center" || edge === "right";
  for (const n of roots) {
    const box = geometryBox(n);
    const { dx, dy } = edgeOffset(box, frame, edge);
    deltas.push({ id: n.id, dx, dy });
    ghosts.push({ x: box.x + dx, y: box.y + dy, w: box.w, h: box.h, stay: dx === 0 && dy === 0 });
  }
  const from = vertical ? 0 : 0;
  const to = vertical ? board.height : board.width;
  return {
    edge,
    target: "board",
    keyId: "artboard",
    keyName: "board",
    ids: roots.map((n) => n.id),
    deltas,
    ghosts,
    edgeLine: { axis: vertical ? "x" : "y", at: edgeAt(frame, edge), from, to },
  };
}

export function applyAlign(nodes: DesignNode[], plan: AlignPlan): DesignNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const places = plan.deltas
    .map((d) => {
      const n = byId.get(d.id);
      if (!n || (!d.dx && !d.dy)) return null;
      return { id: d.id, x: n.x + d.dx, y: n.y + d.dy };
    })
    .filter((p): p is { id: string; x: number; y: number } => Boolean(p));
  if (!places.length) return nodes;
  const expanded = expandMovePlaces(nodes, places);
  const map = new Map(expanded.map((p) => [p.id, p]));
  return nodes.map((n) => {
    const p = map.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}

export function alignMoveCount(plan: AlignPlan): number {
  return plan.deltas.filter((d) => d.dx || d.dy).length;
}

let preview: AlignPlan | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function getAlignPreview(): AlignPlan | null {
  return preview;
}

export function subscribeAlignPreview(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearAlignPreview(silent = false) {
  if (!preview && silent) return;
  preview = null;
  emit();
  if (!silent) releaseStudioStatus();
}

export function armAlignPreview(edge: AlignEdge, target: AlignTarget = "key"): AlignPlan | null {
  const doc = useDesign.getState().doc;
  const selection = useDesign.getState().selection;
  if (!doc) return null;
  const plan = target === "board"
    ? planAlignBoard(doc.nodes, selection, edge, doc.artboard)
    : planAlign(doc.nodes, selection, edge);
  if (!plan) {
    preview = null;
    emit();
    holdStudioStatus(target === "board" ? "Align to board needs an unlocked layer" : "Align needs two unlocked layers");
    return null;
  }
  preview = plan;
  emit();
  const stay = plan.ghosts.filter((g) => g.stay).length;
  const where = plan.target === "board" ? "board edge" : `${plan.keyName} stays`;
  holdStudioStatus(`Align preview · ${plan.edge} edge · ${where} · ${stay} stay · ${alignMoveCount(plan)} move · Enter commits`);
  return plan;
}

/** First click previews the phosphor edge. A second click on the same edge commits. */
export function toggleAlignPreview(edge: AlignEdge, target: AlignTarget = "key") {
  if (preview?.edge === edge && preview.target === target) {
    commitAlignPreview();
    return;
  }
  armAlignPreview(edge, target);
}

export function commitAlignPreview(): boolean {
  const plan = preview;
  const doc = useDesign.getState().doc;
  if (!plan || !doc) return false;
  const next = applyAlign(doc.nodes, plan);
  useDesign.getState().commit();
  useDesign.setState({ doc: { ...doc, nodes: next }, dirty: true });
  preview = null;
  emit();
  holdStudioStatus(`Aligned ${plan.edge} to ${plan.target === "board" ? "board" : plan.keyName}`);
  return true;
}

/** Phosphor edge on the key, solid key box, dashed ghosts for layers that will shift. */
export function drawAlignPreview(ctx: CanvasRenderingContext2D, plan: AlignPlan, zoom: number) {
  const z = Math.max(zoom, 0.01);
  ctx.save();
  ctx.lineWidth = 1.2 / z;
  ctx.font = `${10 / z}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const g of plan.ghosts) {
    ctx.setLineDash(g.stay ? [] : [5 / z, 4 / z]);
    ctx.strokeStyle = "rgba(63,198,255,0.92)";
    ctx.fillStyle = g.stay ? "rgba(63,198,255,0.05)" : "rgba(63,198,255,0.10)";
    ctx.beginPath();
    ctx.rect(g.x, g.y, g.w, g.h);
    ctx.fill();
    ctx.stroke();
    if (!g.stay) continue;
    const pin = 7 / z;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + pin);
    ctx.lineTo(g.x, g.y);
    ctx.lineTo(g.x + pin, g.y);
    ctx.moveTo(g.x + g.w - pin, g.y);
    ctx.lineTo(g.x + g.w, g.y);
    ctx.lineTo(g.x + g.w, g.y + pin);
    ctx.moveTo(g.x, g.y + g.h - pin);
    ctx.lineTo(g.x, g.y + g.h);
    ctx.lineTo(g.x + pin, g.y + g.h);
    ctx.moveTo(g.x + g.w - pin, g.y + g.h);
    ctx.lineTo(g.x + g.w, g.y + g.h);
    ctx.lineTo(g.x + g.w, g.y + g.h - pin);
    ctx.stroke();
    ctx.fillStyle = "rgba(63,198,255,0.95)";
    ctx.fillText(plan.target === "board" ? "stay" : "key", g.x + g.w / 2, g.y - 9 / z);
    if (plan.target !== "board") ctx.fillText(plan.keyName, g.x + g.w / 2, g.y - 20 / z);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.fillStyle = "rgba(63,198,255,0.95)";
  const tick = 6 / z;
  const line = plan.edgeLine;
  ctx.beginPath();
  if (line.axis === "x") {
    ctx.moveTo(line.at, line.from);
    ctx.lineTo(line.at, line.to);
    ctx.moveTo(line.at - tick, line.from);
    ctx.lineTo(line.at + tick, line.from);
    ctx.moveTo(line.at - tick, line.to);
    ctx.lineTo(line.at + tick, line.to);
  } else {
    ctx.moveTo(line.from, line.at);
    ctx.lineTo(line.to, line.at);
    ctx.moveTo(line.from, line.at - tick);
    ctx.lineTo(line.from, line.at + tick);
    ctx.moveTo(line.to, line.at - tick);
    ctx.lineTo(line.to, line.at + tick);
  }
  ctx.stroke();
  const label = plan.target === "board"
    ? `${plan.edge} board · ${alignMoveCount(plan)} move`
    : `${plan.edge} · ${plan.keyName} · ${alignMoveCount(plan)} move`;
  ctx.font = `${11 / z}px "IBM Plex Mono", ui-monospace, monospace`;
  if (line.axis === "x") ctx.fillText(label, line.at + 28 / z, (line.from + line.to) / 2);
  else ctx.fillText(label, (line.from + line.to) / 2, line.at - 12 / z);
  ctx.restore();
}
