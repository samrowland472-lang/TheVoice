import { create } from "zustand";
import { campaignPageName, campaignPages } from "./campaign";
import { formatById } from "./formats";
import { uid } from "./id";
import { cloneNode, paintLayer, shape, text } from "./node-factory";
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
import type { BrandKit, DesignDocument, DesignNode, Tool, Viewport } from "./types";

const MAX_HISTORY = 60;

export type ViewIntent = { type: "fit" } | { type: "zoom"; zoom: number } | { type: "fit-sel" } | null;

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
  rulers: true,
  safeArea: false,
  brand: loadBrand(),
  brush: { id: "ink", size: 16, opacity: 1, hardness: 0.95, spacing: 0.12, color: "#0a0d0c", symmetry: "none" },
  color: "#0a0d0c",
  editingText: null,
  dirty: false,
  clipboard: [],
  pasteCount: 1,
  present: false,
  viewIntent: null,
  paletteOpen: false,
  printMarks: false,
  pathEditHit: null,
  booleanPreview: null,
  guideSelection: [],
  guideLooks: { x: {}, y: {} },
  alignTarget: "selection",
  hydrate: () => set({ index: loadIndex(), brand: loadBrand() }),
  open: (id) => {
    const doc = loadDoc(id);
    if (doc) set({ doc, selection: [], dirty: false, present: get().present });
  },
  fromTemplate: (templateId) => {
    const doc = instantiateTemplate(templateId);
    saveDoc(doc);
    set({ doc, dirty: false, index: loadIndex() });
    return doc.id;
  },
  fromBlank: (formatId) => {
    const fmt = formatById(formatId);
    const doc = blankDocument(formatId, `Untitled ${fmt.label}`);
    saveDoc(doc);
    set({ doc, dirty: false, index: loadIndex() });
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
  setViewport: (v) => set({ viewport: { ...get().viewport, ...v } }),
  select: (ids, additive) => {
    if (additive) {
      const cur = new Set(get().selection);
      for (const id of ids) {
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
      }
      set({ selection: [...cur] });
    } else set({ selection: ids, pathEditHit: null });
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
  placeNodes: (places) => {
    const { doc } = get();
    if (!doc) return;
    const map = new Map(places.map((p) => [p.id, p]));
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
    set({ clipboard: doc.nodes.filter((n) => selection.includes(n.id)).map((n) => cloneNode(n, 0, 0)), pasteCount: 1 });
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
