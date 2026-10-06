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
 * Fade append shared by the status strip, inspector line, and mover rows.
 * Keeps the solid lead in front, then names the cropped pill and the same
 * move count (left · key · 2 move · fade left · poster title… · 2 move).
 */
export function alignCommitFadeAppend(pill: string, moveCount: number): string {
  return `fade ${pill} · ${moveCount} move`;
}

/**
 * Inspector and layers fade line. Keeps the solid lead and appends the cropped
 * pill with the same move count the status strip shows
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
 * While the commit caption eases, the status strip, inspector align line, and
 * each mover row keep the solid lead and append the cropped pill with the same
 * move count (left · key · 2 move · fade left · poster title… · 2 move). Esc
 * still clears it early. Before that fade, the three lead with the same
 * truncated chip and move count (left · key · 2 move) so the rail and the strip agree. each mover's layers row keeps the lead, and each mover row keeps
 * that lead while the inspector fade line matches it.
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

export type AlignEdgeCaption = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** Fitted lines when the release line is wider than the rail. */
  lines?: string[];
  /** Screen px before zoom. Shrinks so a long release line still fits. */
  fontPx?: number;
  /** Move-count line parked beside the short mover when both crop ends are blocked. */
  tuckedMoveCount?: { x: number; y: number; w: number; h: number; text: string };
};

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
  fit?: { w: number; h: number; lines: string[]; fontPx: number },
): AlignEdgeCaption {
  const z = Math.max(zoom, 0.01);
  const w = fit?.w ?? (Math.max(22, label.length * 5.6) + 8) / z;
  const h = fit?.h ?? 12 / z;
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
    return {
      x,
      y: clamp(y, crop.y + h / 2 + 2 / z, crop.y + crop.h - h / 2 - 2 / z),
      w,
      h,
      label,
      lines: fit?.lines,
      fontPx: fit?.fontPx,
    };
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
  return {
    x: clamp(x, crop.x + w / 2 + 2 / z, crop.x + crop.w - w / 2 - 2 / z),
    y,
    w,
    h,
    label,
    lines: fit?.lines,
    fontPx: fit?.fontPx,
  };
}

/**
 * Split a release line once on the phosphor separator so a cropped tick can
 * keep every word. Prefers a break near the middle.
 */
function wrapReleaseLineOnce(label: string): [string, string] | null {
  const parts = label.split(" · ");
  if (parts.length < 2) return null;
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < parts.length; i++) {
    const left = parts.slice(0, i).join(" · ");
    const right = parts.slice(i).join(" · ");
    const diff = Math.abs(left.length - right.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [parts.slice(0, best).join(" · "), parts.slice(best).join(" · ")];
}

function captionBox(text: string, fontPx: number, zoom: number) {
  const z = Math.max(zoom, 0.01);
  const w = (Math.max(22, text.length * 5.6 * (fontPx / 9)) + 8) / z;
  const h = (fontPx + 3) / z;
  return { w, h };
}

/**
 * When the release line is wider than the rail, shrink the type or wrap once
 * rather than clipping the move count. A cropped tick that is only partly on
 * the rail still names the full line (left · key · 2 move · fade left · poster
 * title… · 2 move).
 */
function fitAlignCommitCaption(label: string, zoom: number, crop: AlignViewCrop) {
  const z = Math.max(zoom, 0.01);
  const maxW = Math.max(24 / z, crop.w - 8 / z);
  const maxH = Math.max(14 / z, crop.h - 8 / z);
  const fonts = [9, 8, 7, 6];
  const single = fonts
    .map((fontPx) => ({ fontPx, lines: [label], ...captionBox(label, fontPx, zoom) }))
    .find((box) => box.w <= maxW && box.h <= maxH);
  if (single) return single;
  const wrapped = wrapReleaseLineOnce(label);
  if (wrapped) {
    const fit = fonts
      .map((fontPx) => {
        const a = captionBox(wrapped[0], fontPx, zoom);
        const b = captionBox(wrapped[1], fontPx, zoom);
        return { fontPx, lines: [...wrapped], w: Math.max(a.w, b.w), h: a.h + b.h };
      })
      .find((box) => box.w <= maxW && box.h <= maxH);
    if (fit) return fit;
    const fontPx = 6;
    const a = captionBox(wrapped[0], fontPx, zoom);
    const b = captionBox(wrapped[1], fontPx, zoom);
    return {
      fontPx,
      lines: [...wrapped],
      w: Math.min(maxW, Math.max(a.w, b.w)),
      h: Math.min(maxH, a.h + b.h),
    };
  }
  const fontPx = 6;
  const box = captionBox(label, fontPx, zoom);
  return { fontPx, lines: [label], w: Math.min(maxW, box.w), h: Math.min(maxH, box.h) };
}

function captionOverlapsBoxes(
  caption: { x: number; y: number; w: number; h: number },
  boxes: { x: number; y: number; w: number; h: number }[],
) {
  const left = caption.x - caption.w / 2;
  const top = caption.y - caption.h / 2;
  return boxes.some(
    (box) =>
      spansOverlap(left, left + caption.w, box.x, box.x + box.w) &&
      spansOverlap(top, top + caption.h, box.y, box.y + box.h),
  );
}

/**
 * Open end of the crop along the tick. A short mover leaves one rail end
 * clear; the farther clear end is the one that keeps the move count off the art.
 */
function openCropEndAlong(
  tick: AlignEdgeLine,
  crop: AlignViewCrop,
  along: number,
  zoom: number,
  boxes: { x: number; y: number; w: number; h: number }[],
): number | null {
  const z = Math.max(zoom, 0.01);
  const gap = 6 / z;
  const min = tick.axis === "x" ? crop.y + along / 2 + 2 / z : crop.x + along / 2 + 2 / z;
  const max = tick.axis === "x" ? crop.y + crop.h - along / 2 - 2 / z : crop.x + crop.w - along / 2 - 2 / z;
  if (!(min <= max)) return null;
  const blocked = boxes.map((g) =>
    tick.axis === "x"
      ? ([g.y - gap, g.y + g.h + gap] as const)
      : ([g.x - gap, g.x + g.w + gap] as const),
  );
  const hits = (center: number) => {
    const a = center - along / 2;
    const b = center + along / 2;
    return blocked.some(([oa, ob]) => spansOverlap(a, b, oa, ob));
  };
  const open = [min, max].filter((end) => !hits(end));
  if (!open.length) return null;
  const centers = boxes.map((g) => (tick.axis === "x" ? g.y + g.h / 2 : g.x + g.w / 2));
  const mid = centers.reduce((sum, c) => sum + c, 0) / centers.length;
  return open.sort((a, b) => Math.abs(b - mid) - Math.abs(a - mid))[0];
}

/**
 * Seat a wrapped commit tick caption off the landed boxes the way the edge
 * chip hangs clear of a stay. Outer edges hang the two-line pill off the
 * mover; center and middle slide along the tick into a gap. When the rail clamp pulls that two-line pill back onto a short mover, it slides to the open end of the crop so the move count stays off the art. When both crop ends are blocked, it tucks the move-count line into the nearest gap beside the short mover so the count stays off the art. The pill stays
 * on the rail so a cropped tick still names the full line, and still eases
 * with the stamp alpha. When the swapped move-count line lands on a blocked other crop edge, it slides along that edge into the first clear gap so the count stays off the art and off the lead. When that first clear gap still shares a span with a stay stamp on that edge, the count nudges one caption-height further into the gap so it clears the stamp as well as the art. When that extra caption-height still leaves the count sharing a span with a second stay stamp on that edge, it steps one more caption-height into the gap so the count clears both stamps. When that second caption-height still leaves the count sharing a span with a third stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that third caption-height still leaves the count sharing a span with a fourth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that fourth caption-height still leaves the count sharing a span with a fifth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that fifth caption-height still leaves the count sharing a span with a sixth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that sixth caption-height still leaves the count sharing a span with a seventh stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that seventh caption-height still leaves the count sharing a span with an eighth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that eighth caption-height still leaves the count sharing a span with a ninth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that ninth caption-height still leaves the count sharing a span with a tenth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that tenth caption-height still leaves the count sharing a span with an eleventh stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. When that eleventh caption-height still leaves the count sharing a span with a twelfth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps. The status strip keeps the unwrapped release line.
 * Esc still clears it early.
 */
function seatWrappedCommitCaption(
  tick: AlignEdgeLine,
  edge: AlignEdge,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  crop: AlignViewCrop,
  label: string,
  fit: { w: number; h: number; lines: string[]; fontPx: number },
): AlignEdgeCaption {
  const z = Math.max(zoom, 0.01);
  const pad = 4 / z;
  const gap = 6 / z;
  const base = seatEdgeCaption(tick, edge, zoom, crop, label, fit);
  if (!captionOverlapsBoxes(base, boxes)) return base;
  let w = fit.w;
  let h = fit.h;
  const along = tick.axis === "x" ? h : w;
  const blocked = boxes.map((g) =>
    tick.axis === "x"
      ? ([g.y - gap, g.y + g.h + gap] as const)
      : ([g.x - gap, g.x + g.w + gap] as const),
  );
  const hits = (center: number) => {
    const a = center - along / 2;
    const b = center + along / 2;
    return blocked.some(([oa, ob]) => spansOverlap(a, b, oa, ob));
  };
  const candidates: number[] = [(tick.from + tick.to) / 2];
  for (const [a, b] of blocked) {
    candidates.push(b + along / 2);
    candidates.push(a - along / 2);
  }
  candidates.push(tick.from - along / 2 - gap);
  candidates.push(tick.to + along / 2 + gap);
  let alongCenter = candidates.find((c) => Number.isFinite(c) && !hits(c));
  if (alongCenter == null) {
    const end = blocked.length ? Math.max(...blocked.map(([, b]) => b)) : tick.to;
    alongCenter = end + along / 2;
  }
  let x = base.x;
  let y = base.y;
  if (edge === "left") {
    x = tick.at - w / 2 - pad;
    y = alongCenter;
  } else if (edge === "right") {
    x = tick.at + w / 2 + pad;
    y = alongCenter;
  } else if (edge === "top") {
    x = alongCenter;
    y = tick.at - h / 2 - pad;
  } else if (edge === "bottom") {
    x = alongCenter;
    y = tick.at + h / 2 + pad;
  } else if (tick.axis === "x") {
    x = tick.at;
    y = alongCenter;
  } else {
    x = alongCenter;
    y = tick.at;
  }
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const beforeClampX = x;
  const beforeClampY = y;
  x = clamp(x, crop.x + w / 2 + 2 / z, crop.x + crop.w - w / 2 - 2 / z);
  y = clamp(y, crop.y + h / 2 + 2 / z, crop.y + crop.h - h / 2 - 2 / z);
  const railClampPulled = x !== beforeClampX || y !== beforeClampY;
  if (railClampPulled && captionOverlapsBoxes({ x, y, w, h }, boxes)) {
    const open = openCropEndAlong(tick, crop, tick.axis === "x" ? h : w, zoom, boxes);
    if (open != null) {
      if (tick.axis === "x") y = open;
      else x = open;
    }
  }
  if (captionOverlapsBoxes({ x, y, w, h }, boxes)) {
    if (tick.axis === "x") {
      const above = crop.y + h / 2 + 2 / z;
      const below = crop.y + crop.h - h / 2 - 2 / z;
      const clearY = [above, below].find((cy) => !captionOverlapsBoxes({ x, y: cy, w, h }, boxes));
      if (clearY != null) y = clearY;
    } else {
      const left = crop.x + w / 2 + 2 / z;
      const right = crop.x + crop.w - w / 2 - 2 / z;
      const clearX = [left, right].find((cx) => !captionOverlapsBoxes({ x: cx, y, w, h }, boxes));
      if (clearX != null) x = clearX;
    }
  }
  const endsBlocked = openCropEndAlong(tick, crop, tick.axis === "x" ? h : w, zoom, boxes) == null;
  if (endsBlocked && fit.lines.length > 1 && captionOverlapsBoxes({ x, y, w, h }, boxes)) {
    const tucked = tuckMoveCountBesideShortMover(tick, boxes, zoom, crop, fit.lines[fit.lines.length - 1], fit.fontPx);
    if (tucked) {
      const lead = fit.lines[0];
      const leadSeat = tuckMoveCountBesideShortMover(tick, boxes, zoom, crop, lead, fit.fontPx, tucked);
      if (leadSeat) {
        x = leadSeat.x;
        y = leadSeat.y;
        w = leadSeat.w;
        h = leadSeat.h;
      } else {
        const leadBox = captionBox(lead, fit.fontPx, zoom);
        w = leadBox.w;
        h = leadBox.h;
      }
      const swapped = swapPinnedCountOffSharedCropEdge(
        tick,
        boxes,
        zoom,
        crop,
        { x, y, w, h },
        tucked,
      );
      const slid = slideSwappedCountAlongBlockedEdge(
        tick,
        edge,
        boxes,
        zoom,
        crop,
        { x, y, w, h },
        swapped,
      );
      const dropped = dropSwappedCountOffSharedLeadSpan(zoom, crop, { x, y, w, h }, slid);
      return {
        x,
        y,
        w,
        h,
        label,
        lines: [lead],
        fontPx: fit.fontPx,
        tuckedMoveCount: dropped,
      };
    }
  }
  return { x, y, w, h, label, lines: fit.lines, fontPx: fit.fontPx };
}

/**
 * When the gap beside the short mover sits off the rail, pin the tucked
 * move-count line to the crop edge nearest that mover so the count stays
 * readable. Slides along that edge if the aligned seat would cover a box.
 * Esc still clears it early.
 */
function pinTuckedCountToNearestCropEdge(
  tick: AlignEdgeLine,
  short: { x: number; y: number; w: number; h: number },
  box: { w: number; h: number },
  zoom: number,
  crop: AlignViewCrop,
  boxes: { x: number; y: number; w: number; h: number }[],
  avoid?: { x: number; y: number; w: number; h: number },
  preferOther = false,
): { x: number; y: number } | null {
  const z = Math.max(zoom, 0.01);
  const inset = 2 / z;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const hitsAvoid = (c: { x: number; y: number }) => {
    if (!avoid) return false;
    return (
      spansOverlap(c.x - box.w / 2, c.x + box.w / 2, avoid.x - avoid.w / 2, avoid.x + avoid.w / 2) &&
      spansOverlap(c.y - box.h / 2, c.y + box.h / 2, avoid.y - avoid.h / 2, avoid.y + avoid.h / 2)
    );
  };
  const clear = (c: { x: number; y: number }) =>
    !captionOverlapsBoxes({ ...c, w: box.w, h: box.h }, boxes) && !hitsAvoid(c);
  const seats: { x: number; y: number }[] = [];
  if (tick.axis === "x") {
    const left = crop.x + box.w / 2 + inset;
    const right = crop.x + crop.w - box.w / 2 - inset;
    const mid = short.x + short.w / 2;
    const nearest = Math.abs(mid - crop.x) <= Math.abs(mid - (crop.x + crop.w)) ? left : right;
    const other = nearest === left ? right : left;
    const y = clamp(short.y + short.h / 2, crop.y + box.h / 2 + inset, crop.y + crop.h - box.h / 2 - inset);
    const above = crop.y + box.h / 2 + inset;
    const below = crop.y + crop.h - box.h / 2 - inset;
    const nearSeats = [{ x: nearest, y }, { x: nearest, y: above }, { x: nearest, y: below }];
    const otherSeats = [{ x: other, y }, { x: other, y: above }, { x: other, y: below }];
    seats.push(...(preferOther ? [...otherSeats, ...nearSeats] : [...nearSeats, ...otherSeats]));
  } else {
    const top = crop.y + box.h / 2 + inset;
    const bottom = crop.y + crop.h - box.h / 2 - inset;
    const mid = short.y + short.h / 2;
    const nearest = Math.abs(mid - crop.y) <= Math.abs(mid - (crop.y + crop.h)) ? top : bottom;
    const other = nearest === top ? bottom : top;
    const x = clamp(short.x + short.w / 2, crop.x + box.w / 2 + inset, crop.x + crop.w - box.w / 2 - inset);
    const left = crop.x + box.w / 2 + inset;
    const right = crop.x + crop.w - box.w / 2 - inset;
    const nearSeats = [{ x, y: nearest }, { x: left, y: nearest }, { x: right, y: nearest }];
    const otherSeats = [{ x, y: other }, { x: left, y: other }, { x: right, y: other }];
    seats.push(...(preferOther ? [...otherSeats, ...nearSeats] : [...nearSeats, ...otherSeats]));
  }
  const clearSeat = seats.find(clear);
  if (clearSeat) return clearSeat;
  if (preferOther) return seats[0] ?? null;
  return null;
}



/**
 * When the slid move-count line's first clear gap still shares a span with a
 * stay stamp on that edge, nudge one caption-height further into the gap so
 * the count clears the stamp as well as the art. When that extra caption-height
 * still leaves the count sharing a span with a second stay stamp on that edge,
 * step one more caption-height into the gap so the count clears both stamps.
 * When that second caption-height still leaves the count sharing a span with a
 * third stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that third caption-height still leaves the count sharing a span with a
 * fourth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that fourth caption-height still leaves the count sharing a span with a
 * fifth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that fifth caption-height still leaves the count sharing a span with a
 * sixth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that sixth caption-height still leaves the count sharing a span with a
 * seventh stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that seventh caption-height still leaves the count sharing a span with an
 * eighth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that eighth caption-height still leaves the count sharing a span with a
 * ninth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that ninth caption-height still leaves the count sharing a span with a
 * tenth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that tenth caption-height still leaves the count sharing a span with an
 * eleventh stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that eleventh caption-height still leaves the count sharing a span with a
 * twelfth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * Keeps the stamp alpha. The status strip still reads the unwrapped release
 * line. Esc still clears it early.
 */
function nudgeSlidCountClearOfStayStamp(
  edge: AlignEdge,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  count: { x: number; y: number; w: number; h: number },
  seat: number,
  lo: number,
  hi: number,
  verticalEdge: boolean,
): number {
  if (!boxes.length || hi < lo) return seat;
  const stamps = boxes.map((g) => placeAlignStayStamp(g, edge, zoom));
  const half = verticalEdge ? count.h / 2 : count.w / 2;
  const crossA = verticalEdge ? count.x - count.w / 2 : count.y - count.h / 2;
  const crossB = verticalEdge ? count.x + count.w / 2 : count.y + count.h / 2;
  const overlapping = (center: number) => {
    const a = center - half;
    const b = center + half;
    return stamps.filter((stamp) => {
      const alongA = verticalEdge ? stamp.y - stamp.h / 2 : stamp.x - stamp.w / 2;
      const alongB = verticalEdge ? stamp.y + stamp.h / 2 : stamp.x + stamp.w / 2;
      const stampCrossA = verticalEdge ? stamp.x - stamp.w / 2 : stamp.y - stamp.h / 2;
      const stampCrossB = verticalEdge ? stamp.x + stamp.w / 2 : stamp.y + stamp.h / 2;
      return spansOverlap(a, b, alongA, alongB) && spansOverlap(crossA, crossB, stampCrossA, stampCrossB);
    });
  };
  const first = overlapping(seat);
  if (!first.length) return seat;
  const stampAlong = first.map((stamp) => (verticalEdge ? stamp.y : stamp.x));
  const stampMid = stampAlong.reduce((sum, c) => sum + c, 0) / Math.max(stampAlong.length, 1);
  const dir = seat >= stampMid ? 1 : -1;
  const step = count.h;
  const sameStamp = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.w - b.w) < 0.01 && Math.abs(a.h - b.h) < 0.01;
  const seen = [...first];
  let center = seat;
  // Each new stay stamp on this edge takes one caption-height into the gap.
  // Twelve covers a full row of stay stamps without stacking the count on the last one.
  for (let n = 0; n < 12; n++) {
    const next = Math.min(Math.max(center + dir * step, lo), hi);
    const novel = overlapping(next).filter((stamp) => !seen.some((hit) => sameStamp(hit, stamp)));
    if (!novel.length) return next;
    seen.push(...novel);
    center = next;
    if (center === lo || center === hi) return center;
  }
  return center;
}

/**
 * When the swapped move-count line lands on a blocked other crop edge, slide
 * it along that edge into the first clear gap so the count stays off the art
 * and off the lead. When that first clear gap still shares a span with a stay
 * stamp on that edge, nudge one caption-height further into the gap so the
 * count clears the stamp as well as the art. When that extra caption-height
 * still leaves the count sharing a span with a second stay stamp on that edge,
 * step one more caption-height into the gap so the count clears both stamps.
 * When that second caption-height still leaves the count sharing a span with a
 * third stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that third caption-height still leaves the count sharing a span with a
 * fourth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that fourth caption-height still leaves the count sharing a span with a
 * fifth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that fifth caption-height still leaves the count sharing a span with a
 * sixth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that sixth caption-height still leaves the count sharing a span with a
 * seventh stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that seventh caption-height still leaves the count sharing a span with an
 * eighth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that eighth caption-height still leaves the count sharing a span with a
 * ninth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that ninth caption-height still leaves the count sharing a span with a
 * tenth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that tenth caption-height still leaves the count sharing a span with an
 * eleventh stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps.
 * When that eleventh caption-height still leaves the count sharing a span with a
 * twelfth stay stamp on that edge, step one more caption-height into the gap so
 * the count clears the row of stamps. The walk stops at twelve so a full row
 * clears without another one-off. Same twelve-step stay-stamp walk the slid
 * line uses.
 * Keeps the stamp alpha. The status strip still reads the unwrapped release
 * line. Esc still clears it early.
 */
function slideSwappedCountAlongBlockedEdge(
  tick: AlignEdgeLine,
  edge: AlignEdge,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  crop: AlignViewCrop,
  lead: { x: number; y: number; w: number; h: number },
  count: { x: number; y: number; w: number; h: number; text: string },
): { x: number; y: number; w: number; h: number; text: string } {
  if (!boxes.length) return count;
  const z = Math.max(zoom, 0.01);
  const inset = 2 / z;
  const tol = 1.5 / z;
  const blocked = (c: { x: number; y: number }) =>
    captionOverlapsBoxes({ ...c, w: count.w, h: count.h }, boxes) ||
    captionOverlapsBoxes({ ...c, w: count.w, h: count.h }, [lead]);
  if (!blocked(count)) return count;
  const onLeft = Math.abs(count.x - (crop.x + count.w / 2 + inset)) <= tol;
  const onRight = Math.abs(count.x - (crop.x + crop.w - count.w / 2 - inset)) <= tol;
  const onTop = Math.abs(count.y - (crop.y + count.h / 2 + inset)) <= tol;
  const onBottom = Math.abs(count.y - (crop.y + crop.h - count.h / 2 - inset)) <= tol;
  let fixedX = count.x;
  let fixedY = count.y;
  let alongMin = 0;
  let alongMax = 0;
  let alongStart = count.y;
  let verticalEdge = false;
  if (tick.axis === "x" && (onLeft || onRight)) {
    verticalEdge = true;
    fixedX = onLeft ? crop.x + count.w / 2 + inset : crop.x + crop.w - count.w / 2 - inset;
    alongMin = crop.y + count.h / 2 + inset;
    alongMax = crop.y + crop.h - count.h / 2 - inset;
    alongStart = count.y;
  } else if (tick.axis === "y" && (onTop || onBottom)) {
    fixedY = onTop ? crop.y + count.h / 2 + inset : crop.y + crop.h - count.h / 2 - inset;
    alongMin = crop.x + count.w / 2 + inset;
    alongMax = crop.x + crop.w - count.w / 2 - inset;
    alongStart = count.x;
  } else return count;
  if (alongMax < alongMin) return count;
  const half = verticalEdge ? count.h / 2 : count.w / 2;
  const edgeA = verticalEdge ? fixedX - count.w / 2 : fixedY - count.h / 2;
  const edgeB = verticalEdge ? fixedX + count.w / 2 : fixedY + count.h / 2;
  const intervals: [number, number][] = [];
  for (const g of [...boxes, lead]) {
    const crossA = verticalEdge ? g.x : g.y;
    const crossB = verticalEdge ? g.x + g.w : g.y + g.h;
    if (!spansOverlap(edgeA, edgeB, crossA, crossB)) continue;
    const a0 = verticalEdge ? g.y : g.x;
    const b0 = verticalEdge ? g.y + g.h : g.x + g.w;
    intervals.push([a0 - inset, b0 + inset]);
  }
  intervals.sort((p, q) => p[0] - q[0]);
  const merged: [number, number][] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (!last || iv[0] > last[1]) merged.push([iv[0], iv[1]]);
    else last[1] = Math.max(last[1], iv[1]);
  }
  const free: [number, number][] = [];
  let cursor = alongMin - half;
  for (const [a0, b0] of merged) {
    if (a0 > cursor) free.push([cursor, Math.min(a0, alongMax + half)]);
    cursor = Math.max(cursor, b0);
  }
  if (cursor < alongMax + half) free.push([cursor, alongMax + half]);
  const seats = free
    .map(([a0, b0]) => {
      const lo = a0 + half;
      const hi = b0 - half;
      if (hi < lo - 0.001) return null;
      return { seat: Math.min(Math.max(alongStart, lo), hi), lo, hi };
    })
    .filter((row): row is { seat: number; lo: number; hi: number } => row != null)
    .sort((p, q) => Math.abs(p.seat - alongStart) - Math.abs(q.seat - alongStart));
  for (const row of seats) {
    // Same twelve-step stay-stamp walk the slid line uses. Stops at twelve so a full row clears.
    const seat = nudgeSlidCountClearOfStayStamp(
      edge,
      boxes,
      zoom,
      { ...count, x: fixedX, y: verticalEdge ? count.y : fixedY },
      row.seat,
      row.lo,
      row.hi,
      verticalEdge,
    );
    const next = verticalEdge ? { x: fixedX, y: seat } : { x: seat, y: fixedY };
    if (!blocked(next)) return { ...count, ...next };
  }
  return count;
}

/**
 * When the pinned move-count line and the lead line share the crop edge nearest the short mover, swaps the count to the other crop edge so the two lines do not stack. Esc still clears it early.
 */

/**
 * When a wrapped commit tick caption still stacks the swapped move-count line on the lead after the twelve-step walk, drop the count one caption-height off that shared vertical span so the two lines no longer read as one stack.
 * Prefer down; if the crop clamp holds that drop inside the lead band, step one caption-height up instead.
 * When that one-caption drop still shares a vertical span with the lead because the crop clamp held it in the band, step one more caption-height off that shared span. Prefer the second step down; if the clamp holds that second step inside the lead band, step one more caption-height up.
 * Keeps the stamp alpha. The status strip still reads the unwrapped release line. Esc still clears it early.
 */
function dropSwappedCountOffSharedLeadSpan(
  zoom: number,
  crop: AlignViewCrop,
  lead: { x: number; y: number; w: number; h: number },
  count: { x: number; y: number; w: number; h: number; text: string },
): { x: number; y: number; w: number; h: number; text: string } {
  const sharesLead = (box: { y: number; h: number }) =>
    spansOverlap(
      box.y - box.h / 2,
      box.y + box.h / 2,
      lead.y - lead.h / 2,
      lead.y + lead.h / 2,
    );
  if (!sharesLead(count)) return count;
  const z = Math.max(zoom, 0.01);
  const inset = 2 / z;
  const lo = crop.y + count.h / 2 + inset;
  const hi = crop.y + crop.h - count.h / 2 - inset;
  if (hi < lo) return count;
  const step = count.h;
  const clampY = (y: number) => Math.min(Math.max(y, lo), hi);
  const at = (delta: number) => {
    const y = clampY(count.y + delta);
    return { box: { ...count, y }, y };
  };
  const down = at(step);
  if (!sharesLead(down.box)) return down.box;
  const up = at(-step);
  if (!sharesLead(up.box)) return up.box;
  // Second caption-height when the one-caption drop is still in the lead band.
  const down2 = at(step * 2);
  if (!sharesLead(down2.box)) return down2.box;
  const up2 = at(-step * 2);
  if (!sharesLead(up2.box)) return up2.box;
  const best = [down, up, down2, up2].reduce((a, b) =>
    Math.abs(b.y - lead.y) > Math.abs(a.y - lead.y) ? b : a,
  );
  return best.box;
}

function swapPinnedCountOffSharedCropEdge(
  tick: AlignEdgeLine,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  crop: AlignViewCrop,
  lead: { x: number; y: number; w: number; h: number },
  count: { x: number; y: number; w: number; h: number; text: string },
): { x: number; y: number; w: number; h: number; text: string } {
  if (!boxes.length) return count;
  const z = Math.max(zoom, 0.01);
  const inset = 2 / z;
  const tol = 1 / z;
  const short = boxes.reduce((best, g) => {
    const along = tick.axis === "x" ? g.h : g.w;
    const bestAlong = tick.axis === "x" ? best.h : best.w;
    return along < bestAlong ? g : best;
  });
  const onEdge = (center: number, half: number, start: number, end: number, nearestIsStart: boolean) => {
    const startSeat = start + half + inset;
    const endSeat = end - half - inset;
    if (nearestIsStart) return Math.abs(center - startSeat) <= tol;
    return Math.abs(center - endSeat) <= tol;
  };
  const shared =
    tick.axis === "x"
      ? onEdge(lead.x, lead.w / 2, crop.x, crop.x + crop.w, Math.abs(short.x + short.w / 2 - crop.x) <= Math.abs(short.x + short.w / 2 - (crop.x + crop.w))) &&
        onEdge(count.x, count.w / 2, crop.x, crop.x + crop.w, Math.abs(short.x + short.w / 2 - crop.x) <= Math.abs(short.x + short.w / 2 - (crop.x + crop.w)))
      : onEdge(lead.y, lead.h / 2, crop.y, crop.y + crop.h, Math.abs(short.y + short.h / 2 - crop.y) <= Math.abs(short.y + short.h / 2 - (crop.y + crop.h))) &&
        onEdge(count.y, count.h / 2, crop.y, crop.y + crop.h, Math.abs(short.y + short.h / 2 - crop.y) <= Math.abs(short.y + short.h / 2 - (crop.y + crop.h)));
  if (!shared) return count;
  const swapped = pinTuckedCountToNearestCropEdge(tick, short, count, zoom, crop, boxes, lead, true);
  if (!swapped) return count;
  return { ...count, x: swapped.x, y: swapped.y };
}

/**
 * When both crop ends are blocked, tuck the move-count line into the nearest
 * gap beside the short mover so the count stays off the art. Prefers the side
 * closest to the tick, then the other side, and skips a seat that lands on a box.
 * When that gap sits off the rail, pin the line to the crop edge nearest that
 * mover so the count stays readable.
 */
function tuckMoveCountBesideShortMover(
  tick: AlignEdgeLine,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  crop: AlignViewCrop,
  line: string,
  fontPx: number,
  avoid?: { x: number; y: number; w: number; h: number },
): { x: number; y: number; w: number; h: number; text: string } | null {
  if (!boxes.length || !line) return null;
  const z = Math.max(zoom, 0.01);
  const pad = 4 / z;
  const box = captionBox(line, fontPx, zoom);
  const short = boxes.reduce((best, g) => {
    const along = tick.axis === "x" ? g.h : g.w;
    const bestAlong = tick.axis === "x" ? best.h : best.w;
    return along < bestAlong ? g : best;
  });
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const candidates: { x: number; y: number }[] = [];
  if (tick.axis === "x") {
    const y = clamp(short.y + short.h / 2, crop.y + box.h / 2 + 2 / z, crop.y + crop.h - box.h / 2 - 2 / z);
    candidates.push({ x: short.x - box.w / 2 - pad, y });
    candidates.push({ x: short.x + short.w + box.w / 2 + pad, y });
    candidates.push({ x: short.x - box.w / 2 - pad, y: short.y - box.h / 2 - pad });
    candidates.push({ x: short.x + short.w + box.w / 2 + pad, y: short.y + short.h + box.h / 2 + pad });
  } else {
    const x = clamp(short.x + short.w / 2, crop.x + box.w / 2 + 2 / z, crop.x + crop.w - box.w / 2 - 2 / z);
    candidates.push({ x, y: short.y - box.h / 2 - pad });
    candidates.push({ x, y: short.y + short.h + box.h / 2 + pad });
    candidates.push({ x: short.x - box.w / 2 - pad, y: short.y - box.h / 2 - pad });
    candidates.push({ x: short.x + short.w + box.w / 2 + pad, y: short.y + short.h + box.h / 2 + pad });
  }
  const hitsAvoid = (c: { x: number; y: number }) => {
    if (!avoid) return false;
    return (
      spansOverlap(c.x - box.w / 2, c.x + box.w / 2, avoid.x - avoid.w / 2, avoid.x + avoid.w / 2) &&
      spansOverlap(c.y - box.h / 2, c.y + box.h / 2, avoid.y - avoid.h / 2, avoid.y + avoid.h / 2)
    );
  };
  const anchor = tick.axis === "x" ? short.y + short.h / 2 : short.x + short.w / 2;
  const gapDist = (c: { x: number; y: number }) =>
    tick.axis === "x" ? Math.abs(c.x - tick.at) + Math.abs(c.y - anchor) : Math.abs(c.y - tick.at) + Math.abs(c.x - anchor);
  const onRail = (c: { x: number; y: number }) =>
    c.x - box.w / 2 >= crop.x - 0.01 &&
    c.x + box.w / 2 <= crop.x + crop.w + 0.01 &&
    c.y - box.h / 2 >= crop.y - 0.01 &&
    c.y + box.h / 2 <= crop.y + crop.h + 0.01;
  const clear = (c: { x: number; y: number }) =>
    !captionOverlapsBoxes({ ...c, w: box.w, h: box.h }, boxes) && !hitsAvoid(c);
  const openGaps = candidates.filter(clear).sort((a, b) => gapDist(a) - gapDist(b));
  const preferred = openGaps[0];
  if (!preferred || !onRail(preferred)) {
    const pinned = pinTuckedCountToNearestCropEdge(tick, short, box, zoom, crop, boxes, avoid);
    if (pinned) return { x: pinned.x, y: pinned.y, w: box.w, h: box.h, text: line };
  }
  const scored = candidates
    .map((c) => ({
      x: clamp(c.x, crop.x + box.w / 2 + 2 / z, crop.x + crop.w - box.w / 2 - 2 / z),
      y: clamp(c.y, crop.y + box.h / 2 + 2 / z, crop.y + crop.h - box.h / 2 - 2 / z),
    }))
    .filter((c) => !captionOverlapsBoxes({ ...c, w: box.w, h: box.h }, boxes) && !hitsAvoid(c));
  if (!scored.length) return null;
  scored.sort((a, b) => gapDist(a) - gapDist(b));
  const pick = scored[0];
  return { x: pick.x, y: pick.y, w: box.w, h: box.h, text: line };
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
  const fontPx = caption.fontPx ?? 9;
  const lines = caption.lines?.length ? caption.lines : [caption.label];
  ctx.font = `${fontPx / z}px "IBM Plex Mono", ui-monospace, monospace`;
  if (lines.length === 1) ctx.fillText(lines[0], caption.x, caption.y);
  else {
    const lineH = (fontPx + 1) / z;
    const start = caption.y - (lineH * (lines.length - 1)) / 2;
    lines.forEach((line, i) => ctx.fillText(line, caption.x, start + i * lineH));
  }
  const tucked = caption.tuckedMoveCount;
  if (tucked) {
    ctx.beginPath();
    ctx.roundRect(tucked.x - tucked.w / 2, tucked.y - tucked.h / 2, tucked.w, tucked.h, 2 / z);
    ctx.fillStyle = "rgba(7, 16, 22, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(63,198,255,0.95)";
    ctx.stroke();
    ctx.fillStyle = "rgba(63,198,255,0.95)";
    ctx.fillText(tucked.text, tucked.x, tucked.y);
  }
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
 * solid beat still repeats the preview pill (left · key, center · board). While
 * that caption eases, the tick repeats the same release line the inspector,
 * layers row, and status strip show
 * (left · key · 2 move · fade left · poster title… · 2 move). A tick-only crop
 * keeps the short edge name. The caption uses the stamp alpha so a cropped
 * pill releases with the beat. If that release line is wider than the rail,
 * the caption shrinks the type or wraps once rather than clipping the move count,
 * so a tick that is only partly on the rail still names the full line.
 * A wrapped pill seats clear of the landed boxes the way the edge chip does.
 * When the rail clamp pulls it back onto a short mover, the two-line pill slides to the open end of the crop so the move count stays off the art.
 * When both crop ends are blocked, it tucks the move-count line into the nearest gap beside the short mover so the count stays off the art.
 * When that gap sits off the rail, the tucked line pins to the crop edge nearest that mover so the count stays readable.
 * When that pinned count and the lead line share that nearest crop edge, the count swaps to the other crop edge so the two lines do not stack.
When the swapped count still shares a vertical span with the lead after the twelve-step walk, it drops one caption-height off that span, and when that one-caption drop still shares a vertical span with the lead because the crop clamp held it in the band, it steps one more caption-height off that shared span.
 * When that swapped line lands on a blocked other crop edge, it slides along that edge into the first clear gap so the count stays off the art and off the lead.
 * When that first clear gap still shares a span with a stay stamp on that edge, the count nudges one caption-height further into the gap so it clears the stamp as well as the art.
 * When that extra caption-height still leaves the count sharing a span with a second stay stamp on that edge, it steps one more caption-height into the gap so the count clears both stamps.
 * When that second caption-height still leaves the count sharing a span with a third stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps.
 * When that third caption-height still leaves the count sharing a span with a fourth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps,
 * When that fourth caption-height still leaves the count sharing a span with a fifth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps,
 * When that fifth caption-height still leaves the count sharing a span with a sixth stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps,
 * When that sixth caption-height still leaves the count sharing a span with a seventh stay stamp on that edge, it steps one more caption-height into the gap so the count clears the row of stamps,
 * and still eases with the stamp alpha. The status strip keeps the unwrapped
 * release line. Esc still clears it early. Null when the whole beat is already on screen.
 */
export function placeAlignCommitEdgeCaption(
  tick: AlignEdgeLine,
  edge: AlignEdge,
  boxes: { x: number; y: number; w: number; h: number }[],
  zoom: number,
  crop: AlignViewCrop | null,
  chipLabel?: string,
  releaseLine?: string | null,
): AlignEdgeCaption | null {
  if (!crop || crop.w <= 0 || crop.h <= 0 || !boxes.length) return null;
  const stampsOff = boxes.some((g) => stampOffCrop(placeAlignStayStamp(g, edge, zoom), crop));
  const tickOff =
    tick.axis === "x"
      ? tick.at < crop.x || tick.at > crop.x + crop.w || tick.from < crop.y || tick.to > crop.y + crop.h
      : tick.at < crop.y || tick.at > crop.y + crop.h || tick.from < crop.x || tick.to > crop.x + crop.w;
  if (!stampsOff && !tickOff) return null;
  const label = stampsOff && releaseLine ? releaseLine : stampsOff && chipLabel ? chipLabel : edge;
  const fit = fitAlignCommitCaption(label, zoom, crop);
  if (fit.lines.length > 1) return seatWrappedCommitCaption(tick, edge, boxes, zoom, crop, label, fit);
  return seatEdgeCaption(tick, edge, zoom, crop, label, fit);
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
  const fading = alpha < 0.999;
  const releaseLine = fading
    ? alignCommitLayerFadeLine(held.chipLabel, held.chipLabel, held.moveCount)
    : null;
  const caption = placeAlignCommitEdgeCaption(
    line,
    held.edge,
    held.boxes,
    zoom,
    crop,
    held.chipLabel,
    releaseLine,
  );
  if (caption) paintAlignEdgeCaption(ctx, caption, z, alpha);
  const stampCropped =
    caption != null &&
    (caption.label === held.chipLabel || (releaseLine != null && caption.label === releaseLine));
  const fadingPill = fading && stampCropped ? held.chipLabel : null;
  noteAlignCommitFadeCaption(fadingPill);
}
