import { create } from "zustand";
import { campaignPageName, campaignPages } from "./campaign";
import { formatById } from "./formats";
import { uid } from "./id";
import { paintLayer, shape, text } from "./node-factory";
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

export type ViewIntent = { type: "fit" } | { type: "zoom"; zoom: number } | { type: "fit-sel" } | null;

export const useDesign = create((set, get) => ({
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
    const fmt = formatById(formatId);
    const page = blankDocument(formatId, campaignPageName(live.name, fmt.label));
    page.campaignId = cid;
    saveDoc(page);
    const after = campaignPages(loadIndex(), cid).map((p) => p.id);
    if (!after.includes(page.id)) after.push(page.id);
    writeCampaignOrder(cid, after);
    set({ index: loadIndex() });
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
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    saveDoc(copy);
    set({ index: loadIndex() });
    return copy.id;
  },
  reorderCampaignPages: (ids) => {
    const { doc } = get();
    if (!doc?.campaignId) return;
    set({ index: writeCampaignOrder(doc.campaignId, ids) });
  },
  remove: (id) => {
    deleteDoc(id);
    const { doc } = get();
    set({ index: loadIndex(), doc: doc?.id === id ? null : doc });
  },
  setTool: (tool) => set({ tool }),
  setViewport: (v) => set({ viewport: { ...get().viewport, ...v } }),
  select: (ids) => set({ selection: ids }),
  addNode: (node) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, nodes: [...doc.nodes, node] }, selection: [node.id], dirty: true });
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
void campaignPageName;
void deleteDoc;
void patchIndex;
void saveBrand;
void uid;
void formatById;
void loadDoc;
