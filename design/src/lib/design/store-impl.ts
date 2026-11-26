import type { TypeGhost } from "./type-ghost";
import type { FontAxisTag } from "./fonts";
import { create } from "zustand";
import { campaignPageName, campaignPages } from "./campaign";
import { formatById } from "./formats";
import { uid } from "./id";
import { canDistributeGuides, canSpaceGuidesByGap, distributeGuidePositions, spaceGuidesByGap, nudgeGuidePositions, pruneGuideIds, toggleGuideIds } from "./guide-select";
import { cloneNode, paintLayer, shape, text } from "./node-factory";
import { brushById } from "./brushes";
import { bakePaintIfSized, bakePaintNode, paintNeedsBake } from "./paint-bake";
import {
  deleteDoc,
  loadBrand,
  loadDoc,
  loadIndex,
  patchIndex,
  saveBrand,
  saveDoc,
  writeCampaignOrder,
} from "./persist";
import { blankDocument, instantiateTemplate } from "./templates";
import { expandMovePlaces, getNudgeCue, keyboardSnapNudge, nudgeSelection, nudgeStatus, setNudgeCue } from "./group-transform";
import { setStudioStatus } from "./studio-status";
import type { GuideSet } from "./snap";
import { isGroup } from "./types";
import { applyLayerDrop, makeGroup, nudgeLayer, reverseSelectedStacking, ungroup, withDescendants, type LayerDrop } from "./groups";
import { applyIsolate } from "./layers-isolate";
import type { BrandKit, DesignDocument, DesignNode, PathNode, Shadow, Tool, Viewport } from "./types";
import type { StrokeGhost } from "./stroke-ghost";

export type StyleClipboard = {
  fill: string | { type: "linear" | "radial"; angle: number; stops: { offset: number; color: string }[] };
  stroke: string;
  strokeWidth: number;
  opacity: number;
  blend: string;
  shadow: Shadow | null;
  strokeDash: number;
  strokeDashOffset: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  miterLimit: number;
};

const MAX_HISTORY = 60;

export type ViewIntent = { type: "fit" } | { type: "zoom"; zoom: number } | { type: "fit-sel" } | null;

export type PathPointAlignPreview = {
  nodeId: string;
  edge: string;
  points: { index: number; hole?: number; fromX: number; fromY: number; toX: number; toY: number }[];
} | null;

export type PathPointNumericPreview = {
  nodeId: string;
  index: number;
  hole?: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  axis: "x" | "y";
} | null;

export type PathPointHandleNumericPreview = {
  nodeId: string;
  index: number;
  hole?: number;
  arm: "in" | "out";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  axis: "x" | "y" | "len";
} | null;

export const useDesign = create<any>((set: any, get: any) => ({
  index: [],
  doc: null,
  selection: [],
  tool: "select",
  viewport: { x: 0, y: 0, zoom: 0.4 },
  past: [],
  future: [],
  grid: true,
  snap: true,
  nudgeHold: 0,
  rulers: true,
  safeArea: false,
  brand: loadBrand(),
  brush: { id: "ink", size: 16, opacity: 1, hardness: 0.95, spacing: 0.12, scatter: 0, color: "#0a0d0c", symmetry: "none" },
  color: "#0a0d0c",
  editingText: null,
  dirty: false,
  clipboard: [],
  opacityClipboard: null as number | null,
  styleClipboard: null as StyleClipboard | null,
  opacityScrubId: null as string | null,
  axisScrubTag: null as FontAxisTag | null,
  axisHoverTag: null as FontAxisTag | null,
  filterHoverKey: null as "brightness" | "contrast" | "saturate" | "blur" | null,
  typeHoverKey: null as "size" | "leading" | "weight" | "tracking" | null,
  cropHoverKey: null as "x" | "y" | "w" | "h" | null,
  pathDashHoverKey: null as "miter" | "sides" | "headScale" | "offset" | null,
  gradientHoverKey: null as "angle" | "length" | "offset" | "centre" | "focal" | "r0" | "angle-only" | "length-only" | null,
  gradientHoverStop: null as number | null,
  radiusScrubId: null as string | null,
  shadowBlurScrubId: null as string | null,
  rotationScrubId: null as string | null,
  shadowOxScrubId: null as string | null,
  shadowOyScrubId: null as string | null,
  shadowSpreadScrubId: null as string | null,
  strokeWidthScrubId: null as string | null,
  strokeDashScrubId: null as string | null,
  strokeDashOffsetScrubId: null as string | null,
  miterLimitScrubId: null as string | null,
  gradientAngleScrubId: null as string | null,
  radialR0ScrubId: null as string | null,
  radialCentreScrubId: null as string | null,
  radialFocalScrubId: null as string | null,
  sidesScrubId: null as string | null,
  headScaleScrubId: null as string | null,
  pasteCount: 1,
  present: false,
  viewIntent: null,
  paletteOpen: false,
  printMarks: false,
  pathEditHit: null,
  pathPointSelection: [] as { index: number; hole?: number }[],
  showTangentLengths: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-tangent-lengths") !== "0",
  showPerGlyphTicks: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-per-glyph-ticks") !== "0",
  showWeightTickThickness: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-weight-tick-thickness") !== "0",
  showGlyphDensityScale: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-glyph-density-scale") !== "0",
  reverseTypeLeading: typeof localStorage !== "undefined" && localStorage.getItem("voice-design-reverse-type-leading") === "1",
  typeBaseline: (() => {
    if (typeof localStorage === "undefined") return "hanging" as const;
    const raw = localStorage.getItem("voice-design-type-baseline");
    return raw === "alphabetic" || raw === "middle" ? raw : "hanging";
  })(),
  glyphDensityScaleFactor: (() => {
    if (typeof localStorage === "undefined") return 1;
    const raw = localStorage.getItem("voice-design-glyph-density-factor");
    const n = raw == null ? 1 : Number(raw);
    return Number.isFinite(n) ? Math.max(0.4, Math.min(2.5, n)) : 1;
  })(),
  mirrorPoints: (() => {
    if (typeof localStorage === "undefined") return {};
    try {
      const raw = localStorage.getItem("voice-design-mirror-points");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })(),
  booleanPreview: null,
  guideSelection: [],
  guideLooks: { x: {}, y: {} },
  isolateSnapshot: null as Record<string, boolean> | null,
  alignTarget: "selection",
  strokeGhost: null as StrokeGhost | null,
  typeGhost: null as TypeGhost | null,
  pathOrderGhost: null as PathNode | null,
  pathPointAlignPreview: null as PathPointAlignPreview,
  pathPointNumericPreview: null as PathPointNumericPreview,
  pathPointHandleNumericPreview: null as PathPointHandleNumericPreview,
  hydrate: () => set({ index: loadIndex(), brand: loadBrand() }),
  open: (id) => {
    const doc = loadDoc(id);
    if (doc) set({ doc, selection: [], dirty: false, present: get().present, isolateSnapshot: null });
  },
  fromTemplate: (templateId) => {
    const doc = instantiateTemplate(templateId);
    saveDoc(doc);
    set({ doc, dirty: false, index: loadIndex(), isolateSnapshot: null });
    return doc.id;
  },
  fromBlank: (formatId) => {
    const fmt = formatById(formatId);
    const doc = blankDocument(formatId, `Untitled ${fmt.label}`);
    saveDoc(doc);
    set({ doc, dirty: false, index: loadIndex(), isolateSnapshot: null });
    return doc.id;
  },
  save: () => {
    const { doc } = get();
    if (!doc) return;
    const next = { ...doc, updatedAt: Date.now() };
    saveDoc(next);
    set({ doc: next, dirty: false, index: loadIndex() });
  },
  setNotes: (notes) => {
    const { doc } = get();
    if (!doc) return;
    const next = { ...doc, notes, updatedAt: Date.now() };
    saveDoc(next);
    set({ doc: next, dirty: false, index: loadIndex() });
  },
  setPresent: (present) => set({ present }),
  setShowTangentLengths: (v: boolean) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-tangent-lengths", v ? "1" : "0");
    set({ showTangentLengths: v });
  },
  setShowPerGlyphTicks: (v: boolean) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-per-glyph-ticks", v ? "1" : "0");
    set({ showPerGlyphTicks: v });
  },
  setShowWeightTickThickness: (v: boolean) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-weight-tick-thickness", v ? "1" : "0");
    set({ showWeightTickThickness: v });
  },
  setShowGlyphDensityScale: (v: boolean) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-glyph-density-scale", v ? "1" : "0");
    set({ showGlyphDensityScale: v });
  },
  setReverseTypeLeading: (v: boolean) => {
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-reverse-type-leading", v ? "1" : "0");
    set({ reverseTypeLeading: v });
  },
  setTypeBaseline: (v: "hanging" | "alphabetic" | "middle") => {
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-type-baseline", v);
    set({ typeBaseline: v });
  },
  setGlyphDensityScaleFactor: (v: number) => {
    const next = Math.max(0.4, Math.min(2.5, Number.isFinite(v) ? v : 1));
    if (typeof localStorage !== "undefined") localStorage.setItem("voice-design-glyph-density-factor", String(next));
    set({ glyphDensityScaleFactor: next });
  },
  setMirrorPoint: (key: string, v: boolean) => {
    const prev = get().mirrorPoints || {};
    const next = { ...prev, [key]: v };
    if (typeof localStorage !== "undefined") {
      try { localStorage.setItem("voice-design-mirror-points", JSON.stringify(next)); } catch {}
    }
    set({ mirrorPoints: next });
  },
  togglePresent: () => set({ present: !get().present, paletteOpen: false }),
  makeCampaign: () => {
    const { doc } = get();
    if (!doc) return [];
    get().save();
    const live = get().doc;
    const cid = live.campaignId ?? uid("camp");
    const named = { ...live, campaignId: cid, updatedAt: Date.now() };
    saveDoc(named);
    set({ doc: named, dirty: false, index: loadIndex() });
    return [named.id];
  },
  addCampaignPage: (formatId) => {
    const { doc } = get();
    if (!doc) return "";
    get().save();
    const live = get().doc;
    const cid = live.campaignId ?? uid("camp");
    if (!live.campaignId) {
      const named = { ...live, campaignId: cid, updatedAt: Date.now() };
      saveDoc(named);
      set({ doc: named });
    }
    const fmt = formatById(formatId);
    const page = blankDocument(formatId, campaignPageName(live.name, fmt.label));
    page.campaignId = cid;
    saveDoc(page);
    const after = campaignPages(loadIndex(), cid).map((p) => p.id);
    if (!after.includes(page.id)) after.push(page.id);
    set({ index: writeCampaignOrder(cid, after) });
    return page.id;
  },
  duplicateCampaignPage: () => {
    const { doc } = get();
    if (!doc) return "";
    get().save();
    const live = get().doc;
    const cid = live.campaignId ?? uid("camp");
    const copy = structuredClone(live);
    copy.id = uid("doc");
    copy.campaignId = cid;
    copy.name = `${live.name} copy`;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    saveDoc(copy);
    const after = campaignPages(loadIndex(), cid).map((p) => p.id);
    if (!after.includes(copy.id)) {
      const at = after.indexOf(live.id);
      after.splice(at >= 0 ? at + 1 : after.length, 0, copy.id);
    }
    set({ index: writeCampaignOrder(cid, after) });
    return copy.id;
  },
  reorderCampaignPages: (ids) => {
    const { doc } = get();
    if (!doc?.campaignId) return;
    set({ index: writeCampaignOrder(doc.campaignId, ids) });
  },
  nudgeCampaignPage: (id, dir) => {
    const { doc } = get();
    const cid = doc?.campaignId;
    if (!cid) return;
    const ids = campaignPages(get().index, cid).map((p) => p.id);
    const from = ids.indexOf(id);
    if (from < 0) return;
    const to = from + (dir < 0 ? -1 : 1);
    if (to < 0 || to >= ids.length) return;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    set({ index: writeCampaignOrder(cid, ids) });
  },
  renameCampaignPage: (id, name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    const { doc } = get();
    if (doc?.id === id) {
      const next = { ...doc, name: trimmed, updatedAt: Date.now() };
      saveDoc(next);
      set({ doc: next, dirty: false, index: loadIndex() });
      return;
    }
    const other = loadDoc(id);
    if (!other) return;
    saveDoc({ ...other, name: trimmed, updatedAt: Date.now() });
    set({ index: loadIndex() });
  },
  unlinkCampaignPage: (id) => {
    const { doc } = get();
    const target = loadDoc(id);
    if (!target) return;
    const camp = target.campaignId ?? doc?.campaignId;
    saveDoc({ ...target, campaignId: undefined, updatedAt: Date.now() });
    if (doc?.id === id) set({ doc: { ...doc, campaignId: undefined }, dirty: false });
    if (camp) {
      const rest = campaignPages(loadIndex(), camp).map((p) => p.id).filter((pid) => pid !== id);
      set({ index: writeCampaignOrder(camp, rest) });
    } else {
      set({ index: loadIndex() });
    }
  },
  removeCampaignPage: (id) => {
    const target = loadDoc(id);
    const camp = target?.campaignId;
    const rest = camp ? campaignPages(loadIndex(), camp).map((p) => p.id).filter((pid) => pid !== id) : [];
    deleteDoc(id);
    if (camp) writeCampaignOrder(camp, rest);
    const { doc } = get();
    set({ index: loadIndex(), doc: doc?.id === id ? null : doc });
    return rest[0] ?? null;
  },
  remove: (id) => {
    deleteDoc(id);
    const { doc } = get();
    set({ index: loadIndex(), doc: doc?.id === id ? null : doc });
  },
  setTool: (tool) => set({ tool, editingText: null }),
  setBrush: (patch) => {
    const cur = get().brush;
    const next = { ...cur, ...patch };
    if (patch.id && patch.id !== cur.id) {
      const def = brushById(patch.id);
      next.hardness = def.hardness;
      next.spacing = def.spacing;
      next.scatter = def.scatter;
      // Clear grain override so the new preset's grain applies until toggled.
      delete next.grain;
    }
    if (patch.color == null && patch.id) next.color = get().color || cur.color;
    set({ brush: next });
  },
  setViewport: (v) => set({ viewport: { ...get().viewport, ...v } }),
  setStrokeGhost: (ghost: StrokeGhost) => set({ strokeGhost: ghost }),
  setOpacityScrubId: (id: string | null) => set({ opacityScrubId: id }),
  setAxisScrubTag: (tag: FontAxisTag | null) => set({ axisScrubTag: tag }),
  setAxisHoverTag: (tag: FontAxisTag | null) => set({ axisHoverTag: tag }),
  setFilterHoverKey: (key: "brightness" | "contrast" | "saturate" | "blur" | null) => set({ filterHoverKey: key }),
  setTypeHoverKey: (key: "size" | "leading" | "weight" | "tracking" | null) => set({ typeHoverKey: key }),
  setCropHoverKey: (key: "x" | "y" | "w" | "h" | null) => set({ cropHoverKey: key }),
  setPathDashHoverKey: (key: "miter" | "sides" | "headScale" | "offset" | null) => set({ pathDashHoverKey: key }),
  setGradientHoverKey: (key: "angle" | "length" | "offset" | "centre" | "focal" | "r0" | "angle-only" | "length-only" | null) => set({ gradientHoverKey: key }),
  setGradientHoverStop: (idx: number | null) => set({ gradientHoverStop: idx }),
  setRadiusScrubId: (id: string | null) => set({ radiusScrubId: id }),
  setShadowBlurScrubId: (id: string | null) => set({ shadowBlurScrubId: id }),
  setRotationScrubId: (id: string | null) => set({ rotationScrubId: id }),
  setShadowOxScrubId: (id: string | null) => set({ shadowOxScrubId: id }),
  setShadowOyScrubId: (id: string | null) => set({ shadowOyScrubId: id }),
  setShadowSpreadScrubId: (id: string | null) => set({ shadowSpreadScrubId: id }),
  setStrokeWidthScrubId: (id: string | null) => set({ strokeWidthScrubId: id }),
  setStrokeDashScrubId: (id: string | null) => set({ strokeDashScrubId: id }),
  setStrokeDashOffsetScrubId: (id: string | null) => set({ strokeDashOffsetScrubId: id }),
  setMiterLimitScrubId: (id: string | null) => set({ miterLimitScrubId: id }),
  setGradientAngleScrubId: (id: string | null) => set({ gradientAngleScrubId: id }),
  setRadialR0ScrubId: (id: string | null) => set({ radialR0ScrubId: id }),
  setRadialCentreScrubId: (id: string | null) => set({ radialCentreScrubId: id }),
  setRadialFocalScrubId: (id: string | null) => set({ radialFocalScrubId: id }),
  setSidesScrubId: (id: string | null) => set({ sidesScrubId: id }),
  setHeadScaleScrubId: (id: string | null) => set({ headScaleScrubId: id }),
  setPathPointAlignPreview: (preview: PathPointAlignPreview) => set({ pathPointAlignPreview: preview }),
  setPathPointNumericPreview: (preview: PathPointNumericPreview) => set({ pathPointNumericPreview: preview }),
  setPathPointHandleNumericPreview: (preview: PathPointHandleNumericPreview) => set({ pathPointHandleNumericPreview: preview }),
  setTypeGhost: (ghost: TypeGhost) => set({ typeGhost: ghost }),
  setPathOrderGhost: (ghost: PathNode | null) => set({ pathOrderGhost: ghost }),
  requestFit: () => set({ viewIntent: { type: "fit" } }),
  requestZoom: (zoom: number) => set({ viewIntent: { type: "zoom", zoom } }),
  select: (ids, additive) => {
    if (additive) {
      const cur = new Set(get().selection);
      for (const id of ids) {
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
      }
      set({ selection: [...cur] });
    } else set({ selection: ids, pathEditHit: null, pathPointSelection: [] });
  },
  commit: () => {
    const { doc, past } = get();
    if (!doc) return;
    set({ past: [...past.slice(-MAX_HISTORY), structuredClone(doc)], future: [] });
  },
  undo: () => {
    const { doc, past, future } = get();
    const prev = past[past.length - 1];
    if (!prev || !doc) return;
    set({ doc: prev, past: past.slice(0, -1), future: [structuredClone(doc), ...future], dirty: true });
  },
  redo: () => {
    const { doc, past, future } = get();
    const next = future[0];
    if (!next || !doc) return;
    set({ doc: next, future: future.slice(1), past: [...past, structuredClone(doc)], dirty: true });
  },
  restoreHistory: (slot, index) => {
    const { past, future, doc } = get();
    if (!doc) return;
    const stack = slot === "past" ? past : future;
    const chosen = stack[index];
    if (!chosen) return;
    get().commit();
    set({ doc: structuredClone(chosen), dirty: true });
  },
  toggleIsolate: (keepIds: string[]) => {
    const { doc, isolateSnapshot } = get();
    if (!doc) return;
    const next = applyIsolate(doc.nodes, keepIds, isolateSnapshot);
    get().commit();
    set({
      doc: { ...doc, nodes: next.nodes },
      isolateSnapshot: next.isolateSnapshot,
      dirty: true,
    });
  },
  groupSelection: () => {
    const { doc, selection } = get();
    if (!doc) return;
    const made = makeGroup(doc.nodes, selection);
    if (!made) return;
    get().commit();
    set({ doc: { ...doc, nodes: made.nodes }, selection: [made.groupId], dirty: true });
  },
  ungroupSelection: () => {
    const { doc, selection } = get();
    if (!doc) return;
    const groups = selection.filter((id) => doc.nodes.some((n) => n.id === id && n.kind === "group"));
    if (!groups.length) return;
    const kids = doc.nodes.filter((n) => n.parentId && groups.includes(n.parentId)).map((n) => n.id);
    const next = ungroup(doc.nodes, groups);
    get().commit();
    set({
      doc: { ...doc, nodes: next },
      selection: kids.length ? kids : selection.filter((id) => !groups.includes(id)),
      dirty: true,
    });
  },
  dropLayers: (ids: string[], drop: LayerDrop) => {
    const { doc } = get();
    if (!doc || !ids.length) return;
    const next = applyLayerDrop(doc.nodes, ids, drop);
    if (!next) return;
    get().commit();
    set({ doc: { ...doc, nodes: next }, dirty: true });
  },
  reorder: (id: string, dir: "up" | "down") => {
    const { doc } = get();
    if (!doc) return;
    const next = nudgeLayer(doc.nodes, id, dir);
    if (!next) return;
    get().commit();
    set({ doc: { ...doc, nodes: next }, dirty: true });
  },
  reverseStacking: () => {
    const { doc, selection } = get();
    if (!doc || selection.length < 2) return;
    const next = reverseSelectedStacking(doc.nodes, selection);
    if (!next) return;
    get().commit();
    set({ doc: { ...doc, nodes: next }, dirty: true });
  },
  updateNodes: (ids, patch, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    const idset = new Set(ids);
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (!idset.has(n.id)) return n;
          if (n.kind === "paint") return bakePaintIfSized(n, patch);
          return { ...n, ...patch };
        }),
      },
      dirty: true,
    });
  },
  mapNodes: (ids, map, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    const idset = new Set(ids);
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (!idset.has(n.id)) return n;
          const next = map(n);
          if (n.kind === "paint" && next.kind === "paint" && paintNeedsBake(n, next.w, next.h)) {
            return bakePaintNode(next, next.w, next.h);
          }
          return next;
        }),
      },
      dirty: true,
    });
  },
  replaceNode: (id, node, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (n.id !== id) return n;
          if (n.kind === "paint" && node.kind === "paint" && paintNeedsBake(n, node.w, node.h)) {
            return bakePaintNode(node, node.w, node.h);
          }
          return node;
        }),
      },
      dirty: true,
    });
  },
  addNode: (node, commit = true) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    set({ doc: { ...doc, nodes: [...doc.nodes, node] }, selection: [node.id], dirty: true });
  },
  resizeArtboard: (formatId, magic) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    const fmt = formatById(formatId);
    const sx = fmt.width / doc.artboard.width;
    const sy = fmt.height / doc.artboard.height;
    const nodes = magic
      ? doc.nodes.map((n) => {
          const next = { ...n, x: n.x * sx, y: n.y * sy, w: n.w * sx, h: n.kind === "text" ? n.h : n.h * sy };
          if (n.kind === "paint") return bakePaintNode(next, next.w, next.h);
          return next;
        })
      : doc.nodes;
    set({
      doc: {
        ...doc,
        artboard: { ...doc.artboard, width: fmt.width, height: fmt.height, formatId: fmt.id, name: fmt.label },
        nodes,
      },
      dirty: true,
    });
  },
  translateSelected: (dx: number, dy: number, opts?: { snap?: boolean }) => {
    const { doc, selection } = get();
    if (!doc || !selection.length || (!dx && !dy)) return;
    let appliedX = dx;
    let appliedY = dy;
    let guides: GuideSet = { x: [], y: [], spaces: [], equalGaps: [] };
    let snapped = false;
    if (opts?.snap) {
      const extra = {
        x: (doc.guides ?? []).filter((g) => g.axis === "x").map((g) => g.pos),
        y: (doc.guides ?? []).filter((g) => g.axis === "y").map((g) => g.pos),
      };
      const hit = keyboardSnapNudge(doc.nodes, selection, dx, dy, doc.artboard, extra);
      appliedX = hit.dx;
      appliedY = hit.dy;
      guides = hit.guides;
      snapped = hit.snapped;
    }
    if (!appliedX && !appliedY) return;
    const next = nudgeSelection(doc.nodes, selection, appliedX, appliedY);
    if (next === doc.nodes) return;
    get().commit();
    const only = selection.length === 1 ? doc.nodes.find((n: DesignNode) => n.id === selection[0]) : null;
    const group = Boolean(only && isGroup(only) && !only.locked);
    setNudgeCue({ dx: appliedX, dy: appliedY, group, guides, snapped });
    setStudioStatus(nudgeStatus(appliedX, appliedY, group, snapped, guides.equalGaps ?? []));
    set({ doc: { ...doc, nodes: next }, dirty: true, nudgeHold: Date.now() });
  },
  releaseNudgeGuides: () => {
    const cue = getNudgeCue();
    if (cue?.guides && (cue.guides.x.length || cue.guides.y.length || (cue.guides.spaces?.length ?? 0) > 0)) {
      setNudgeCue({ ...cue, guides: { x: [], y: [], spaces: [], equalGaps: [] }, snapped: false });
    }
    set({ nudgeHold: Date.now() });
  },
  placeNodes: (places) => {
    const { doc } = get();
    if (!doc) return;
    const expanded = expandMovePlaces(doc.nodes, places);
    const map = new Map(expanded.map((p) => [p.id, p]));
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          const p = map.get(n.id);
          return p ? { ...n, x: p.x, y: p.y } : n;
        }),
      },
      dirty: true,
    });
  },
  copySelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const ids = withDescendants(doc.nodes, selection);
    const clones = doc.nodes
      .filter((n) => ids.has(n.id))
      .map((n) => structuredClone(n));
    set({ clipboard: clones, pasteCount: 1 });
    setStudioStatus(`Copied ${selection.length} layer${selection.length === 1 ? "" : "s"}`);
  },
  duplicateSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const ids = withDescendants(doc.nodes, selection);
    const idMap = new Map<string, string>();
    const clones: DesignNode[] = [];
    for (const n of doc.nodes) {
      if (!ids.has(n.id)) continue;
      const newId = uid(n.kind.slice(0, 2));
      idMap.set(n.id, newId);
      const c = structuredClone(n);
      c.id = newId;
      c.x += 16;
      c.y += 16;
      clones.push(c);
    }
    const remapped = clones.map((n) =>
      n.parentId && idMap.has(n.parentId) ? { ...n, parentId: idMap.get(n.parentId)! } : n,
    );
    const newSel = selection.map((id) => idMap.get(id)).filter((id): id is string => Boolean(id));
    set({
      doc: { ...doc, nodes: [...doc.nodes, ...remapped] },
      selection: newSel.length ? newSel : remapped.map((n) => n.id),
      dirty: true,
    });
    setStudioStatus(`Duplicated ${selection.length} layer${selection.length === 1 ? "" : "s"}`);
  },
  cutSelected: () => {
    get().copySelected();
    get().removeSelected();
    setStudioStatus("Cut selection");
  },
  pasteClipboard: () => {
    const { doc, clipboard, pasteCount } = get();
    if (!doc || !clipboard.length) return;
    get().commit();
    const offset = 16 * (pasteCount || 1);
    const idMap = new Map<string, string>();
    const clones: DesignNode[] = clipboard.map((n) => {
      const newId = uid(n.kind.slice(0, 2));
      idMap.set(n.id, newId);
      const c = structuredClone(n);
      c.id = newId;
      c.x += offset;
      c.y += offset;
      return c;
    });
    const remapped = clones.map((n) =>
      n.parentId && idMap.has(n.parentId) ? { ...n, parentId: idMap.get(n.parentId)! } : n,
    );
    const copiedIds = new Set(clipboard.map((n) => n.id));
    const topIds = clipboard.filter((n) => !n.parentId || !copiedIds.has(n.parentId)).map((n) => idMap.get(n.id)!);
    const newSel = topIds.length ? topIds : remapped.map((n) => n.id);
    set({
      doc: { ...doc, nodes: [...doc.nodes, ...remapped] },
      selection: newSel.length ? newSel : remapped.map((n) => n.id),
      pasteCount: (pasteCount || 1) + 1,
      dirty: true,
    });
    setStudioStatus(`Pasted ${newSel.length || remapped.length} layer${(newSel.length || remapped.length) === 1 ? "" : "s"}`);
  },
  removeSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const ids = withDescendants(doc.nodes, selection);
    set({
      doc: { ...doc, nodes: doc.nodes.filter((n) => !ids.has(n.id)) },
      selection: [],
      dirty: true,
    });
    setStudioStatus(`Removed ${selection.length} layer${selection.length === 1 ? "" : "s"}`);
  },
  selectAll: () => {
    const { doc } = get();
    if (!doc) return;
    set({ selection: doc.nodes.filter((n) => !n.locked).map((n) => n.id) });
  },
  copyOpacity: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const nodes = doc.nodes.filter((n) => selection.includes(n.id));
    if (!nodes.length) return;
    const value = nodes[0].opacity;
    const mixed = new Set(nodes.map((n) => n.opacity)).size > 1;
    set({ opacityClipboard: value });
    setStudioStatus(`Copied opacity ${Math.round(value * 100)}%${mixed ? " (mixed — first layer)" : ""}`);
  },
  pasteOpacity: () => {
    const { selection, opacityClipboard } = get();
    if (!selection.length || opacityClipboard == null) return;
    get().updateNodes(selection, { opacity: opacityClipboard }, true);
    setStudioStatus(`Pasted opacity ${Math.round(opacityClipboard * 100)}%`);
  },
  copyStyle: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const nodes = doc.nodes.filter((n) => selection.includes(n.id));
    if (!nodes.length) return;
    const src = nodes[0];
    const style: StyleClipboard = {
      fill: structuredClone(src.fill),
      stroke: src.stroke,
      strokeWidth: src.strokeWidth,
      opacity: src.opacity,
      blend: src.blend,
      shadow: src.shadow ? structuredClone(src.shadow) : null,
      strokeDash: src.strokeDash ?? 0,
      strokeDashOffset: src.strokeDashOffset ?? 0,
      lineCap: src.lineCap ?? "round",
      lineJoin: src.lineJoin ?? "round",
      miterLimit: src.miterLimit ?? 4,
    };
    const mixed = nodes.length > 1 && nodes.some((n) =>
      n.fill !== src.fill || n.stroke !== src.stroke || n.strokeWidth !== src.strokeWidth ||
      n.opacity !== src.opacity || n.blend !== src.blend ||
      JSON.stringify(n.shadow) !== JSON.stringify(src.shadow) ||
      (n.strokeDash ?? 0) !== (src.strokeDash ?? 0) ||
      (n.strokeDashOffset ?? 0) !== (src.strokeDashOffset ?? 0) ||
      (n.lineCap ?? "round") !== (src.lineCap ?? "round") ||
      (n.lineJoin ?? "round") !== (src.lineJoin ?? "round") ||
      (n.miterLimit ?? 4) !== (src.miterLimit ?? 4)
    );
    set({ styleClipboard: style });
    setStudioStatus(`Copied style${mixed ? " (mixed — first layer)" : ""}`);
  },
  pasteStyle: () => {
    const { selection, styleClipboard } = get();
    if (!selection.length || !styleClipboard) return;
    get().updateNodes(selection, {
      fill: structuredClone(styleClipboard.fill),
      stroke: styleClipboard.stroke,
      strokeWidth: styleClipboard.strokeWidth,
      opacity: styleClipboard.opacity,
      blend: styleClipboard.blend,
      shadow: styleClipboard.shadow ? structuredClone(styleClipboard.shadow) : null,
      strokeDash: styleClipboard.strokeDash,
      strokeDashOffset: styleClipboard.strokeDashOffset,
      lineCap: styleClipboard.lineCap,
      lineJoin: styleClipboard.lineJoin,
      miterLimit: styleClipboard.miterLimit,
    }, true);
    setStudioStatus("Pasted style");
  },
  addGuide: (axis: "x" | "y", pos: number) => {
    const { doc } = get();
    if (!doc) return "";
    const g = { id: uid("gd"), axis, pos };
    set({ doc: { ...doc, guides: [...(doc.guides ?? []), g] }, dirty: true });
    return g.id;
  },
  moveGuide: (id: string, pos: number) => {
    const { doc } = get();
    if (!doc) return;
    set({
      doc: {
        ...doc,
        guides: (doc.guides ?? []).map((g) => (g.id === id && !g.locked ? { ...g, pos } : g)),
      },
      dirty: true,
    });
  },
  removeGuide: (id: string) => {
    const { doc } = get();
    if (!doc) return;
    const target = (doc.guides ?? []).find((g) => g.id === id);
    if (target?.locked) return;
    set({ doc: { ...doc, guides: (doc.guides ?? []).filter((g) => g.id !== id) }, dirty: true });
  },
  clearGuides: () => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, guides: [] }, dirty: true, guideSelection: [] });
  },
  patchGuide: (id: string, patch: Partial<{ locked?: boolean; hidden?: boolean; pos?: number; label?: string; color?: string; dash?: "solid" | "dash" | "tight" }>) => {
    const { doc } = get();
    if (!doc) return;
    set({
      doc: {
        ...doc,
        guides: (doc.guides ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
      },
      dirty: true,
    });
  },
  selectGuides: (ids: string[], additive = false) => {
    const cur = (get().guideSelection ?? []) as string[];
    if (additive) {
      const next = toggleGuideIds(cur, ids);
      set({ guideSelection: next, selection: [] });
      return;
    }
    set({ guideSelection: ids, selection: [] });
  },
  nudgeGuides: (dx: number, dy: number) => {
    const { doc, guideSelection } = get();
    if (!doc || !guideSelection?.length) return;
    const next = nudgeGuidePositions(doc.guides ?? [], guideSelection, dx, dy);
    set({ doc: { ...doc, guides: next }, dirty: true });
  },
  removeSelectedGuides: () => {
    const { doc, guideSelection } = get();
    if (!doc || !guideSelection?.length) return;
    const drop = new Set(guideSelection);
    set({
      doc: {
        ...doc,
        guides: (doc.guides ?? []).filter((g) => g.locked || !drop.has(g.id)),
      },
      guideSelection: [],
      dirty: true,
    });
  },
  lockSelectedGuides: (locked = true) => {
    const { doc, guideSelection } = get();
    if (!doc || !guideSelection?.length) return;
    const setIds = new Set(guideSelection);
    set({
      doc: {
        ...doc,
        guides: (doc.guides ?? []).map((g) => (setIds.has(g.id) ? { ...g, locked } : g)),
      },
      dirty: true,
    });
  },
  unlockSelectedGuides: () => {
    get().lockSelectedGuides(false);
  },
  distributeSelectedGuides: () => {
    const { doc, guideSelection } = get();
    if (!doc) return;
    const guides = doc.guides ?? [];
    if (!guides.length) return;
    const ids = (guideSelection ?? []).length ? guideSelection! : guides.map((g) => g.id);
    if (!canDistributeGuides(guides, ids)) return;
    get().commit();
    const next = distributeGuidePositions(guides, ids);
    set({ doc: { ...doc, guides: next }, dirty: true });
    setStudioStatus("Guides distributed evenly");
  },
  spaceSelectedGuidesByGap: (gap: number) => {
    const { doc, guideSelection } = get();
    if (!doc) return;
    const guides = doc.guides ?? [];
    if (!guides.length) return;
    const ids = (guideSelection ?? []).length ? guideSelection! : guides.map((g) => g.id);
    if (!canSpaceGuidesByGap(guides, ids)) return;
    get().commit();
    const next = spaceGuidesByGap(guides, ids, gap);
    set({ doc: { ...doc, guides: next }, dirty: true });
    setStudioStatus(`Guides spaced by ${gap}`);
  },
  setSelectedGuidesDash: (dash: "solid" | "dash" | "tight" | undefined) => {
    const { doc, guideSelection } = get();
    if (!doc) return;
    const guides = doc.guides ?? [];
    if (!guides.length) return;
    const ids = guideSelection?.length ? new Set(guideSelection) : null;
    get().commit();
    set({
      doc: {
        ...doc,
        guides: guides.map((g) => {
          if (ids && !ids.has(g.id)) return g;
          if (dash === undefined) {
            const { dash: _drop, ...rest } = g;
            return rest;
          }
          return { ...g, dash };
        }),
      },
      dirty: true,
    });
  },
  setSelectedGuidesColor: (color: string | undefined) => {
    const { doc, guideSelection } = get();
    if (!doc) return;
    const guides = doc.guides ?? [];
    if (!guides.length) return;
    const ids = guideSelection?.length ? new Set(guideSelection) : null;
    get().commit();
    set({
      doc: {
        ...doc,
        guides: guides.map((g) => {
          if (ids && !ids.has(g.id)) return g;
          if (color === undefined) {
            const { color: _drop, ...rest } = g;
            return rest;
          }
          return { ...g, color };
        }),
      },
      dirty: true,
    });
  },
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePrintMarks: () => set({ printMarks: !get().printMarks }),
  setBleed: (px) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, artboard: { ...doc.artboard, bleed: px } }, dirty: true });
  },
  setBleedEdges: (patch) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    const prev = doc.artboard.bleedEdges ?? { top: 0, right: 0, bottom: 0, left: 0 };
    set({ doc: { ...doc, artboard: { ...doc.artboard, bleedEdges: { ...prev, ...patch } } }, dirty: true });
  },
  rename: (name) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, name }, dirty: true });
  },
}));

export function makeShape(kind, x, y, w, h, color) {
  return shape(kind, { x, y, w, h, fill: kind === "line" ? "transparent" : color, stroke: kind === "line" ? color : "transparent", strokeWidth: kind === "line" ? 4 : 0 });
}
export function makeText(x, y, color) {
  return text({ x, y, w: 420, h: 80, text: "Type here", fill: color, fontFamily: "Chakra Petch", fontSize: 56, fontWeight: 600 });
}
export function ensurePaintLayer(doc) {
  const existing = doc.nodes.find((n) => n.kind === "paint");
  if (existing) return existing;
  const layer = paintLayer(doc.artboard.width, doc.artboard.height);
  useDesign.getState().addNode(layer, true);
  return layer;
}
export type { BrandKit, DesignDocument, DesignNode, Tool, Viewport };
