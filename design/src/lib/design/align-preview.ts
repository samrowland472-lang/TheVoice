import { geometryBox, type AlignEdge } from "./align";
import { expandMovePlaces } from "./group-transform";
import { useDesign } from "./store-impl";
import { getStudioStatus, holdStudioStatus, releaseStudioStatus } from "./studio-status";
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

/** Layers that shift under an armed align preview. Stay rows stay unmarked. */
export function alignPreviewMoverIds(plan: AlignPlan): string[] {
  return plan.deltas.filter((_, i) => plan.ghosts[i] && !plan.ghosts[i].stay).map((d) => d.id);
}

export function alignEdgeChipLabel(plan: AlignPlan): string {
  const raw = plan.target === "board" ? "board" : plan.keyName.trim() || "key";
  const who = raw.length > 16 ? `${raw.slice(0, 15)}…` : raw;
  return `${plan.edge} · ${who}`;
}

/** Solid-beat lead shared by the status strip, inspector line, and mover rows. */
export function alignCommitSolidLead(chipLabel: string, moveCount: number): string {
  return `${chipLabel} · ${moveCount} move`;
}

/**
 * Fade append on the status strip. Keeps the solid lead in front, then names
 * the cropped pill and the same move count the inspector fade line shows
 * (left · key · 2 move · fade left · poster title… · 2 move).
 */
export function alignCommitFadeAppend(pill: string, moveCount: number): string {
  return `fade ${pill} · ${moveCount} move`;
}

/**
 * Layers fade line. Keeps the solid lead and appends the cropped pill with the
 * same move count the status strip shows
 * (left · key · 2 move · fade left · poster title… · 2 move).
 */
export function alignCommitLayerFadeLine(chipLabel: string, pill: string, moveCount: number): string {
  return `${alignCommitSolidLead(chipLabel, moveCount)} · ${alignCommitFadeAppend(pill, moveCount)}`;
}

export type AlignEdgeChip = { x: number; y: number; w: number; h: number; label: string };

function spansOverlap(a0: number, a1: number, b0: number, b1: number) {
  return a0 < b1 && a1 > b0;
}

/**
 * Seat the edge chip on the tick, clear of stay boxes.
 * The pill names the edge and the key or board. Outer edges hang the longer
 * pill off the stay side so it does not cover the box. Center and middle
 * stay on the line, in a gap or just past the stay box.
 */
export function placeAlignEdgeChip(plan: AlignPlan, zoom: number): AlignEdgeChip {
  const z = Math.max(zoom, 0.01);
  const label = alignEdgeChipLabel(plan);
  const w = (Math.max(36, label.length * 6.6) + 12) / z;
  const h = 16 / z;
  const line = plan.edgeLine;
  const along = line.axis === "x" ? h : w;
  const gap = 6 / z;
  const pad = 4 / z;
  const stays = plan.ghosts.filter((g) => g.stay);
  const nameStack = 24 / z;
  const blocked = stays.map((g) =>
    line.axis === "x"
      ? [g.y - nameStack, g.y + g.h + gap] as const
      : [g.x - gap, g.x + g.w + gap] as const,
  );
  const hits = (center: number) => {
    const a = center - along / 2;
    const b = center + along / 2;
    return blocked.some(([oa, ob]) => spansOverlap(a, b, oa, ob));
  };
  const candidates: number[] = [(line.from + line.to) / 2];
  for (const [a, b] of blocked) {
    candidates.push(b + along / 2);
    candidates.push(a - along / 2);
  }
  candidates.push(line.from + along / 2);
  candidates.push(line.to - along / 2);
  let alongCenter = candidates.find((c) => Number.isFinite(c) && !hits(c));
  if (alongCenter == null) {
    const end = blocked.length ? Math.max(...blocked.map(([, b]) => b)) : line.to;
    alongCenter = end + along / 2;
  }
  if (plan.edge === "left") return { x: line.at - w / 2 - pad, y: alongCenter, w, h, label };
  if (plan.edge === "right") return { x: line.at + w / 2 + pad, y: alongCenter, w, h, label };
  if (plan.edge === "top") return { x: alongCenter, y: line.at - h / 2 - pad, w, h, label };
  if (plan.edge === "bottom") return { x: alongCenter, y: line.at + h / 2 + pad, w, h, label };
  if (line.axis === "x") return { x: line.at, y: alongCenter, w, h, label };
  return { x: alongCenter, y: line.at, w, h, label };
}

export type AlignStayStamp = { x: number; y: number; w: number; h: number; label: string };

/**
 * Edge name on the stay box corner so the box and the pill agree
 * when the inspector is collapsed to a rail. Inset on the matched
 * corner so the outer edge chip stays clear of the stamp.
 */
export function placeAlignStayStamp(
  ghost: { x: number; y: number; w: number; h: number },
  edge: AlignEdge,
  zoom: number,
): AlignStayStamp {
  const z = Math.max(zoom, 0.01);
  const label = edge;
  const w = (Math.max(28, label.length * 6.2) + 8) / z;
  const h = 14 / z;
  const inset = 2 / z;
  if (edge === "right") return { x: ghost.x + ghost.w - inset - w / 2, y: ghost.y + inset + h / 2, w, h, label };
  if (edge === "bottom") return { x: ghost.x + inset + w / 2, y: ghost.y + ghost.h - inset - h / 2, w, h, label };
  if (edge === "center") return { x: ghost.x + ghost.w / 2, y: ghost.y + inset + h / 2, w, h, label };
  if (edge === "middle") return { x: ghost.x + inset + w / 2, y: ghost.y + ghost.h / 2, w, h, label };
  return { x: ghost.x + inset + w / 2, y: ghost.y + inset + h / 2, w, h, label };
}

let preview: AlignPlan | null = null;
const listeners = new Set<() => void>();

const TARGET_KEY = "voice-design.align-target";
let alignTarget: AlignTarget = "key";
const targetListeners = new Set<() => void>();

function readStoredTarget(): AlignTarget {
  try {
    return localStorage.getItem(TARGET_KEY) === "board" ? "board" : "key";
  } catch {
    return "key";
  }
}

if (typeof localStorage !== "undefined") alignTarget = readStoredTarget();

/** Key object or artboard. The same edge row reads this chip. */
export function getAlignTarget(): AlignTarget {
  return alignTarget;
}

export function setAlignTarget(next: AlignTarget) {
  if (alignTarget === next) return;
  alignTarget = next;
  try {
    localStorage.setItem(TARGET_KEY, next);
  } catch {
    /* private mode */
  }
  for (const fn of targetListeners) fn();
}

export function subscribeAlignTarget(fn: () => void) {
  targetListeners.add(fn);
  return () => targetListeners.delete(fn);
}


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
  clearAlignCommitEcho();
  const stay = plan.ghosts.filter((g) => g.stay).length;
  const where = plan.target === "board" ? "board edge" : `${plan.keyName} stays`;
  const chip = alignEdgeChipLabel(plan);
  holdStudioStatus(`Align preview · ${plan.target} · ${plan.edge} edge · ${where} · ${stay} stay · ${alignMoveCount(plan)} move · strip reads ${chip} · edge caption if chip crops names key or board · Enter commits`);
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

export type AlignCommitEcho = {
  edge: AlignEdge;
  boxes: { x: number; y: number; w: number; h: number }[];
  /** Short tick on the landed edge, spanning only the boxes that moved. */
  edgeTick: AlignEdgeLine;
  /** Same pill the preview chip used (left · key, center · board). */
  chipLabel: string;
  /** Movers that shifted. The inspector line keeps this beside the pill. */
  moveCount: number;
  /** Cropped pill while the caption eases. Null on the solid beat. */
  fadePill: string | null;
  /** Layers that shifted. The row repeats the pill beside the name. */
  moverIds: string[];
  born: number;
  until: number;
  /** Bumps while the stamp fades so the stage redraws. */
  tick: number;
  /** Solid-phase line. The fade may append the cropped pill, then restore this. */
  baseStatus: string;
  status: string;
};

/**
 * Short matched-edge tick for the commit beat. Spans the movers only,
 * so the rail still shows which edge landed without redrawing the board line.
 */
export function placeAlignCommitEdgeTick(
  boxes: { x: number; y: number; w: number; h: number }[],
  edge: AlignEdge,
): AlignEdgeLine {
  const vertical = edge === "left" || edge === "center" || edge === "right";
  let from = Infinity;
  let to = -Infinity;
  let at = 0;
  for (const box of boxes) {
    if (edge === "left") at = box.x;
    else if (edge === "right") at = box.x + box.w;
    else if (edge === "center") at = box.x + box.w / 2;
    else if (edge === "top") at = box.y;
    else if (edge === "bottom") at = box.y + box.h;
    else at = box.y + box.h / 2;
    if (vertical) {
      from = Math.min(from, box.y);
      to = Math.max(to, box.y + box.h);
    } else {
      from = Math.min(from, box.x);
      to = Math.max(to, box.x + box.w);
    }
  }
  return { axis: vertical ? "x" : "y", at, from, to };
}

const ALIGN_ECHO_MS = 1200;
const ALIGN_ECHO_FADE_AT = 700;

let echo: AlignCommitEcho | null = null;
let echoTimer: ReturnType<typeof setTimeout> | null = null;
const echoListeners = new Set<() => void>();

function emitEcho() {
  for (const fn of echoListeners) fn();
}

export function getAlignCommitEcho(): AlignCommitEcho | null {
  return echo;
}

export function subscribeAlignCommitEcho(fn: () => void) {
  echoListeners.add(fn);
  return () => echoListeners.delete(fn);
}

export function clearAlignCommitEcho() {
  if (echoTimer) clearTimeout(echoTimer);
  echoTimer = null;
  if (!echo) return;
  const held = echo.status;
  echo = null;
  emitEcho();
  if (held && getStudioStatus() === held) releaseStudioStatus();
}

/** Hold the edge name on boxes that moved so the commit matches the stay stamp. */
function settleAlignCommitEcho() {
  const held = echo?.status;
  echo = null;
  echoTimer = null;
  emitEcho();
  if (held && getStudioStatus() === held) releaseStudioStatus();
}

/** 1 while the stamp is solid, then eases to 0 so the beat reads as a release. */
export function alignCommitEchoAlpha(held: AlignCommitEcho, now = Date.now()): number {
  const age = now - held.born;
  if (age <= ALIGN_ECHO_FADE_AT) return 1;
  const span = Math.max(1, held.until - held.born - ALIGN_ECHO_FADE_AT);
  return Math.max(0, 1 - (age - ALIGN_ECHO_FADE_AT) / span);
}

export function holdAlignCommitEcho(plan: AlignPlan) {
  const boxes = plan.ghosts.filter((g) => !g.stay).map((g) => ({ x: g.x, y: g.y, w: g.w, h: g.h }));
  if (!boxes.length) {
    clearAlignCommitEcho();
    return;
  }
  const moved = boxes.length;
  const chipLabel = alignEdgeChipLabel(plan);
  const lead = alignCommitSolidLead(chipLabel, moved);
  const baseStatus = `${lead} · Aligned · strip reads ${chipLabel} · ${plan.edge} stamp holds on ${moved} moved · edge tick fades with it · caption if stamp crops names key or board and fades with the stamp`;
  const born = Date.now();
  const moverIds = alignPreviewMoverIds(plan);
  echo = { edge: plan.edge, boxes, edgeTick: placeAlignCommitEdgeTick(boxes, plan.edge), chipLabel, moveCount: boxes.length, fadePill: null, moverIds, born, until: born + ALIGN_ECHO_MS, tick: 0, baseStatus, status: baseStatus };
  emitEcho();
  if (echoTimer) clearTimeout(echoTimer);
  const step = () => {
    if (!echo) return;
    if (Date.now() >= echo.until) {
      settleAlignCommitEcho();
      return;
    }
    echo = { ...echo, tick: echo.tick + 1 };
    emitEcho();
    echoTimer = setTimeout(step, 50);
  };
  echoTimer = setTimeout(step, 50);
}

/**
 * While the commit caption eases, the status strip keeps the solid lead and
 * appends the cropped pill with the same move count the inspector fade line
 * shows (left · key · 2 move · fade left · poster title… · 2 move). Esc still
 * clears it early. The inspector align line and each mover's layers row repeat
 * the cropped pill (left · key, center · board) so the rail and the strip agree
 * with a collapsed inspector. Before that fade, the status strip leads with the
 * same truncated chip and move count the inspector solid line and each mover
 * row show (left · key · 2 move). While the caption eases, each mover row keeps
 * that solid lead and appends the cropped pill with the same move count
 * (left · key · 2 move · fade left · poster title… · 2 move). Esc still clears it early.
 */
export function noteAlignCommitFadeCaption(pill: string | null) {
  if (!echo) return;
  const next = pill
    ? `${echo.baseStatus} · ${alignCommitFadeAppend(pill, echo.moveCount)}`
    : echo.baseStatus;
  const fadePill = pill;
  const statusSame = echo.status === next && getStudioStatus() === next;
  const pillSame = echo.fadePill === fadePill;
  if (statusSame && pillSame) return;
  const prev = echo.status;
  echo = { ...echo, status: next, fadePill };
  if (getStudioStatus() === prev || getStudioStatus() === echo.baseStatus) holdStudioStatus(next);
  if (!pillSame) emitEcho();
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
  holdAlignCommitEcho(plan);
  const moved = plan.ghosts.filter((g) => !g.stay).length;
  const chip = alignEdgeChipLabel(plan);
  holdStudioStatus(
    moved
      ? echo?.status ?? `${alignCommitSolidLead(chip, moved)} · Aligned · strip reads ${chip} · ${plan.edge} stamp holds on ${moved} moved · edge tick fades with it`
      : `${alignCommitSolidLead(chip, moved)} · Aligned · strip reads ${chip}`,
  );
  return true;
}

/** Phosphor edge on the key, solid key box, dashed ghosts for layers that will shift. */
export function drawAlignPreview(
  ctx: CanvasRenderingContext2D,
  plan: AlignPlan,
  zoom: number,
  crop: AlignViewCrop | null = null,
) {
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
    const stamp = placeAlignStayStamp(g, plan.edge, zoom);
    ctx.beginPath();
    ctx.roundRect(stamp.x - stamp.w / 2, stamp.y - stamp.h / 2, stamp.w, stamp.h, 2 / z);
    ctx.fillStyle = "rgba(7, 16, 22, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(63,198,255,0.95)";
    ctx.stroke();
    ctx.fillStyle = "rgba(63,198,255,0.95)";
    ctx.fillText(stamp.label, stamp.x, stamp.y);
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.fillStyle = "rgba(63,198,255,0.95)";
  const tick = 6 / z;
  const line = plan.edgeLine;
  const chip = placeAlignEdgeChip(plan, zoom);
  const from = line.axis === "x" ? Math.min(line.from, chip.y) : Math.min(line.from, chip.x);
  const to = line.axis === "x" ? Math.max(line.to, chip.y) : Math.max(line.to, chip.x);
  ctx.beginPath();
  if (line.axis === "x") {
    ctx.moveTo(line.at, from);
    ctx.lineTo(line.at, to);
    ctx.moveTo(line.at - tick, line.from);
    ctx.lineTo(line.at + tick, line.from);
    ctx.moveTo(line.at - tick, line.to);
    ctx.lineTo(line.at + tick, line.to);
  } else {
    ctx.moveTo(from, line.at);
    ctx.lineTo(to, line.at);
    ctx.moveTo(line.from, line.at - tick);
    ctx.lineTo(line.from, line.at + tick);
    ctx.moveTo(line.to, line.at - tick);
    ctx.lineTo(line.to, line.at + tick);
  }
  ctx.stroke();
  ctx.beginPath();
  if (line.axis === "x") {
    ctx.moveTo(line.at, chip.y);
    ctx.lineTo(chip.x, chip.y);
  } else {
    ctx.moveTo(chip.x, line.at);
    ctx.lineTo(chip.x, chip.y);
  }
  ctx.stroke();
  const radius = 3 / z;
  ctx.beginPath();
  ctx.roundRect(chip.x - chip.w / 2, chip.y - chip.h / 2, chip.w, chip.h, radius);
  ctx.fillStyle = "rgba(7, 16, 22, 0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.stroke();
  ctx.fillStyle = "rgba(63,198,255,0.95)";
  ctx.font = `${11 / z}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.fillText(chip.label, chip.x, chip.y);
  const caption = placeAlignPreviewEdgeCaption(plan, zoom, crop);
  if (caption) paintAlignEdgeCaption(ctx, caption, z);
  ctx.restore();
}

export type AlignViewCrop = { x: number; y: number; w: number; h: number };

export type AlignEdgeCaption = { x: number; y: number; w: number; h: number; label: string };

function stampOffCrop(
  stamp: { x: number; y: number; w: number; h: number },
  crop: AlignViewCrop,
): boolean {
  const left = stamp.x - stamp.w / 2;
  const top = stamp.y - stamp.h / 2;
  return left < crop.x || top < crop.y || left + stamp.w > crop.x + crop.w || top + stamp.h > crop.y + crop.h;
}

function seatEdgeCaption(
  tick: AlignEdgeLine,
  edge: AlignEdge,
  zoom: number,
  crop: AlignViewCrop,
  label: string = edge,
): AlignEdgeCaption {
  const z = Math.max(zoom, 0.01);
  const w = (Math.max(22, label.length * 5.6) + 8) / z;
  const h = 12 / z;
  const pad = 6 / z;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  if (tick.axis === "x") {
    const visFrom = Math.max(tick.from, crop.y);
    const visTo = Math.min(tick.to, crop.y + crop.h);
    const x = clamp(tick.at, crop.x + w / 2 + 2 / z, crop.x + crop.w - w / 2 - 2 / z);
    let y: number;
    if (visTo - visFrom < h + pad) {
      y = tick.to < crop.y ? crop.y + h / 2 + pad : crop.y + crop.h - h / 2 - pad;
    } else if (tick.from < crop.y && tick.to <= crop.y + crop.h) y = visFrom + h / 2 + pad;
    else if (tick.to > crop.y + crop.h && tick.from >= crop.y) y = visTo - h / 2 - pad;
    else y = (Math.max(visFrom, crop.y) + Math.min(visTo, crop.y + crop.h)) / 2;
    return { x, y: clamp(y, crop.y + h / 2 + 2 / z, crop.y + crop.h - h / 2 - 2 / z), w, h, label };
  }
  const visFrom = Math.max(tick.from, crop.x);
  const visTo = Math.min(tick.to, crop.x + crop.w);
  const y = clamp(tick.at, crop.y + h / 2 + 2 / z, crop.y + crop.h - h / 2 - 2 / z);
  let x: number;
  if (visTo - visFrom < w + pad) {
    x = tick.to < crop.x ? crop.x + w / 2 + pad : crop.x + crop.w - w / 2 - pad;
  } else if (tick.from < crop.x && tick.to <= crop.x + crop.w) x = visFrom + w / 2 + pad;
  else if (tick.to > crop.x + crop.w && tick.from >= crop.x) x = visTo - w / 2 - pad;
  else x = (Math.max(visFrom, crop.x) + Math.min(visTo, crop.x + crop.w)) / 2;
  return { x: clamp(x, crop.x + w / 2 + 2 / z, crop.x + crop.w - w / 2 - 2 / z), y, w, h, label };
}

function paintAlignEdgeCaption(
  ctx: CanvasRenderingContext2D,
  caption: AlignEdgeCaption,
  z: number,
  alpha = 1,
) {
  const ink = Math.max(0, Math.min(1, alpha));
  if (ink <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.beginPath();
  ctx.roundRect(caption.x - caption.w / 2, caption.y - caption.h / 2, caption.w, caption.h, 2 / z);
  ctx.fillStyle = "rgba(7, 16, 22, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.stroke();
  ctx.fillStyle = "rgba(63,198,255,0.95)";
  ctx.font = `${9 / z}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.fillText(caption.label, caption.x, caption.y);
  ctx.restore();
}

/**
 * Tiny edge name on the visible end of the preview tick when the edge chip
 * or a stay stamp sits off the rail crop. If the chip is the thing off the
 * rail, the caption repeats the chip pill (left · key, center · board) so
 * the rail still reads the target. Stay-only crops keep the short edge name.
 * Null when both already read on screen.
 */
export function placeAlignPreviewEdgeCaption(
  plan: AlignPlan,
  zoom: number,
  crop: AlignViewCrop | null,
): AlignEdgeCaption | null {
  if (!crop || crop.w <= 0 || crop.h <= 0) return null;
  const chip = placeAlignEdgeChip(plan, zoom);
  const stays = plan.ghosts.filter((g) => g.stay);
  const chipOff = stampOffCrop(chip, crop);
  const stampsOff = stays.some((g) => stampOffCrop(placeAlignStayStamp(g, plan.edge, zoom), crop));
  if (!chipOff && !stampsOff) return null;
  const label = chipOff ? alignEdgeChipLabel(plan) : plan.edge;
  return seatEdgeCaption(plan.edgeLine, plan.edge, zoom, crop, label);
}

/**
 * Tiny edge name on the visible end of the commit tick when a stamp or the tick
 * sits off the rail crop. If a mover stamp is the thing off the rail, the
 * caption repeats the preview pill (left · key, center · board) so the fade
 * still names the target. A tick-only crop keeps the short edge name.
 * The pill uses the stamp alpha so a cropped caption releases with the beat.
 * Null when the whole beat is already on screen.
 */
export function placeAlignCommitEdgeCaption(
  tick: AlignEdgeLine,
  edge: AlignEdge,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  crop: AlignViewCrop | null,
  chipLabel?: string,
): AlignEdgeCaption | null {
  if (!crop || crop.w <= 0 || crop.h <= 0 || !boxes.length) return null;
  const stampsOff = boxes.some((g) => stampOffCrop(placeAlignStayStamp(g, edge, zoom), crop));
  const tickOff =
    tick.axis === "x"
      ? tick.at < crop.x || tick.at > crop.x + crop.w || tick.from < crop.y || tick.to > crop.y + crop.h
      : tick.at < crop.y || tick.at > crop.y + crop.h || tick.from < crop.x || tick.to > crop.x + crop.w;
  if (!stampsOff && !tickOff) return null;
  const label = stampsOff && chipLabel ? chipLabel : edge;
  return seatEdgeCaption(tick, edge, zoom, crop, label);
}

/** After Enter, the matched edge name, the short edge tick, and a cropped caption fade together. */
export function drawAlignCommitEcho(
  ctx: CanvasRenderingContext2D,
  held: AlignCommitEcho,
  zoom: number,
  crop: AlignViewCrop | null = null,
) {
  const z = Math.max(zoom, 0.01);
  const alpha = alignCommitEchoAlpha(held);
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.2 / z;
  ctx.font = `${10 / z}px "IBM Plex Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(63,198,255,0.95)";
  ctx.fillStyle = "rgba(63,198,255,0.95)";
  const tick = 6 / z;
  const line = held.edgeTick;
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
  const pin = 8 / z;
  for (const g of held.boxes) {
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
    const stamp = placeAlignStayStamp(g, held.edge, zoom);
    ctx.beginPath();
    ctx.roundRect(stamp.x - stamp.w / 2, stamp.y - stamp.h / 2, stamp.w, stamp.h, 2 / z);
    ctx.fillStyle = "rgba(7, 16, 22, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(63,198,255,0.95)";
    ctx.stroke();
    ctx.fillStyle = "rgba(63,198,255,0.95)";
    ctx.fillText(stamp.label, stamp.x, stamp.y);
  }
  ctx.restore();
  const caption = placeAlignCommitEdgeCaption(line, held.edge, held.boxes, zoom, crop, held.chipLabel);
  if (caption) paintAlignEdgeCaption(ctx, caption, z, alpha);
  const fadingPill = alpha < 0.999 && caption && caption.label === held.chipLabel ? caption.label : null;
  noteAlignCommitFadeCaption(fadingPill);
}
