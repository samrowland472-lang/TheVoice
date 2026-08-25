import { create } from "zustand";
import { BRUSHES } from "./brushes";
import { blankDocument, instantiateTemplate } from "./templates";
import { deleteDoc, loadBrand, loadDoc, loadIndex, saveBrand, saveDoc } from "./persist";
import type { BrandKit, BrushSettings, DesignNode, Tool, Viewport } from "./types";

export type ViewIntent =
  | { type: "fit" }
  | { type: "fit-selection" }
  | { type: "zoom"; zoom: number }
  | null;

export const useDesign = create<any>((set, get) => ({
  index: [],
  doc: null,
  selection: [],
  tool: "select",
  viewport: { x: 0, y: 0, zoom: 1 },
  past: [],
  future: [],
  paintPast: [],
  paintFuture: [],
  grid: false,
  snap: true,
  rulers: true,
  safeArea: false,
  brand: loadBrand(),
  brush: BRUSHES[0] ?? { id: "round", size: 12, opacity: 1, hardness: 0.8 },
  color: "#c8f560",
  editingText: null,
  dirty: false,
  clipboard: [],
  pasteCount: 0,
  present: false,
  viewIntent: null,
  paletteOpen: false,
  hydrate: () => set({ index: loadIndex(), brand: loadBrand() }),
  open: (id: string) => {
    const doc = loadDoc(id);
    if (doc) set({ doc, selection: [], past: [], future: [], dirty: false, viewIntent: { type: "fit" } });
  },
  fromTemplate: (templateId: string) => {
    const doc = instantiateTemplate(templateId);
    saveDoc(doc);
    set({ index: loadIndex() });
    return doc.id;
  },
  fromBlank: (formatId: string) => {
    const doc = blankDocument(formatId);
    saveDoc(doc);
    set({ index: loadIndex() });
    return doc.id;
  },
  makeCampaign: () => [] as string[],
  addCampaignPage: () => "",
  save: () => {
    const { doc } = get();
    if (!doc) return;
    const next = { ...doc, updatedAt: Date.now() };
    saveDoc(next);
    set({ doc: next, dirty: false, index: loadIndex() });
  },
  remove: (id: string) => {
    deleteDoc(id);
    set({ index: loadIndex() });
  },
  togglePin: () => {},
  setProjectFolder: () => {},
  toggleProjectTag: () => {},
  rename: (name: string) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, name }, dirty: true });
  },
  setNotes: () => {},
  setTool: (tool: Tool) => set({ tool }),
  setViewport: (v: Partial<Viewport>) => set({ viewport: { ...get().viewport, ...v } }),
  select: (ids: string[], additive?: boolean) => {
    if (additive) {
      const cur = new Set(get().selection);
      for (const id of ids) {
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
      }
      set({ selection: [...cur] });
    } else set({ selection: ids });
  },
  updateNodes: (ids: string[], patch: Partial<DesignNode>) => {
    const { doc } = get();
    if (!doc) return;
    const idSet = new Set(ids);
    set({
      doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => (idSet.has(n.id) ? { ...n, ...patch } : n)) },
      dirty: true,
    });
  },
  replaceNode: () => {},
  addNode: (node: DesignNode) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, nodes: [...doc.nodes, node] }, selection: [node.id], dirty: true });
  },
  removeSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const drop = new Set(selection);
    set({ doc: { ...doc, nodes: doc.nodes.filter((n: DesignNode) => !drop.has(n.id)) }, selection: [], dirty: true });
  },
  duplicateSelected: () => {},
  duplicateLinked: () => {},
  unlinkSelected: () => {},
  reorder: () => {},
  reorderInsert: () => {},
  setArtboardBg: () => {},
  resizeArtboard: () => {},
  undo: () => {},
  redo: () => {},
  commit: () => {},
  beginPaintStroke: () => {},
  restoreHistory: () => {},
  popLastPathPoint: () => {},
  closeSelectedPath: () => {},
  finishPen: () => {},
  setBrush: (p: Partial<BrushSettings>) => set({ brush: { ...get().brush, ...p } }),
  setColor: (color: string) => set({ color }),
  setBrand: (brand: BrandKit) => {
    saveBrand(brand);
    set({ brand });
  },
  addBrandColor: () => false,
  setEditingText: (editingText: string | null) => set({ editingText }),
  toggleGrid: () => set({ grid: !get().grid }),
  toggleSnap: () => set({ snap: !get().snap }),
  toggleRulers: () => set({ rulers: !get().rulers }),
  toggleSafeArea: () => set({ safeArea: !get().safeArea }),
  setBleed: () => {},
  addGuide: () => "",
  moveGuide: () => {},
  removeGuide: () => {},
  clearGuides: () => {},
  applyNodes: () => {},
  translateSelected: (dx: number, dy: number) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const idSet = new Set(selection);
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n: DesignNode) => (idSet.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
      },
      dirty: true,
    });
  },
  alignSelected: () => {},
  copySelected: () => {},
  cutSelected: () => {},
  pasteClipboard: () => {},
  selectAll: () => {
    const { doc } = get();
    if (doc) set({ selection: doc.nodes.map((n: DesignNode) => n.id) });
  },
  flipSelected: () => {},
  rotateSelected: () => {},
  distributeSelected: () => {},
  duplicateProject: () => "",
  togglePresent: () => set({ present: !get().present }),
  setPresent: (present: boolean) => set({ present }),
  requestFit: () => set({ viewIntent: { type: "fit" } }),
  requestFitSelection: () => set({ viewIntent: { type: "fit-selection" } }),
  requestZoom: (zoom: number) => set({ viewIntent: { type: "zoom", zoom } }),
  clearViewIntent: () => set({ viewIntent: null }),
  setPaletteOpen: (paletteOpen: boolean) => set({ paletteOpen }),
  lockSelected: () => {},
  hideSelected: () => {},
  bringSelected: () => {},
  placeNodes: () => {},
}));

export function ensurePaintLayer() {
  return null;
}
export function makeShape() {
  return null;
}
export function makeText() {
  return null;
}
