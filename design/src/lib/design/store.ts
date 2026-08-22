import { create } from "zustand";
import { BRUSHES } from "./brushes";
import { formatById } from "./formats";
import { aabb } from "./geometry";
import { uid } from "./id";
import { cloneNode, paintLayer, shape, text } from "./node-factory";
import { deleteDoc, loadBrand, loadDoc, loadIndex, patchIndex, saveBrand, saveDoc } from "./persist";
import { exportPng } from "./export";
import { blankDocument, instantiateTemplate } from "./templates";
import type {
  BrandKit,
  BrushSettings,
  DesignDocument,
  DesignNode,
  ProjectMeta,
  Tool,
  Viewport,
} from "./types";

const MAX_HISTORY = 60;

export type ViewIntent = { type: "fit" } | { type: "zoom"; zoom: number } | null;

// RESTORED STUB - full content pending
export const useDesign = create((set: any, get: any) => ({
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
  hydrate: () => set({ index: loadIndex(), brand: loadBrand() }),
  open: (id: string) => { const doc = loadDoc(id); if (doc) set({ doc, selection: [], past: [], future: [] }); },
  fromTemplate: (templateId: string) => { const doc = instantiateTemplate(templateId); saveDoc(doc); set({ index: loadIndex() }); return doc.id; },
  fromBlank: (formatId: string) => { const doc = blankDocument(formatId); saveDoc(doc); set({ index: loadIndex() }); return doc.id; },
  save: () => { const { doc } = get(); if (doc) { doc.updatedAt = Date.now(); try { doc.thumbnail = exportPng(doc, 0.18); } catch {} saveDoc(doc); set({ index: loadIndex(), dirty: false }); } },
  remove: (id: string) => { deleteDoc(id); set({ index: loadIndex() }); },
  setBrand: (brand: BrandKit) => { saveBrand(brand); set({ brand }); },
  setTool: (t: Tool) => set({ tool: t }),
  setColor: (c: string) => set({ color: c }),
  setEditingText: (id: string | null) => set({ editingText: id }),
  addNode: (node: DesignNode) => { const { doc } = get(); if (!doc) return; const next = { ...doc, nodes: [...doc.nodes, node] }; set({ doc: next, selection: [node.id], dirty: true }); },
  updateNodes: () => {},
  undo: () => {},
  redo: () => {},
  commit: () => {},
  setViewport: (v: Partial<Viewport>) => set({ viewport: { ...get().viewport, ...v } }),
  select: (ids: string[]) => set({ selection: ids }),
  togglePin: (id: string) => { const index = loadIndex().map((p: ProjectMeta) => p.id === id ? { ...p, pinned: !p.pinned } : p); saveDoc; set({ index: loadIndex() }); },
  setProjectFolder: () => {},
  toggleProjectTag: () => {},
  rename: () => {},
  removeSelected: () => {},
  duplicateSelected: () => {},
  reorder: () => {},
  reorderInsert: () => {},
  setArtboardBg: () => {},
  resizeArtboard: () => {},
  restoreHistory: () => {},
  popLastPathPoint: () => {},
  closeSelectedPath: () => {},
  finishPen: () => {},
  setBrush: () => {},
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
  translateSelected: () => {},
  alignSelected: () => {},
  copySelected: () => {},
  cutSelected: () => {},
  pasteClipboard: () => {},
  selectAll: () => {},
  flipSelected: () => {},
  rotateSelected: () => {},
  distributeSelected: () => {},
  duplicateProject: (id: string) => id,
  togglePresent: () => set({ present: !get().present }),
  setPresent: (v: boolean) => set({ present: v }),
  requestFit: () => set({ viewIntent: { type: "fit" } }),
  requestZoom: (zoom: number) => set({ viewIntent: { type: "zoom", zoom } }),
  clearViewIntent: () => set({ viewIntent: null }),
  setPaletteOpen: (v: boolean) => set({ paletteOpen: v }),
  lockSelected: () => {},
  hideSelected: () => {},
  bringSelected: () => {},
  placeNodes: () => {},
  replaceNode: () => {},
}));

export function makeShape(kind: any, x: number, y: number, w: number, h: number, color: string) {
  return shape(kind, { x, y, w, h, fill: kind === "line" ? "transparent" : color, stroke: kind === "line" ? color : "transparent", strokeWidth: kind === "line" ? 4 : 0 });
}

export function makeText(x: number, y: number, color: string) {
  const brand = useDesign.getState().brand;
  return text({ x, y, w: 420, h: 80, text: "Type here", fill: color, fontFamily: brand.displayFont || brand.fonts[0] || "Chakra Petch", fontSize: 56, fontWeight: 600 });
}

export function ensurePaintLayer(doc: DesignDocument): DesignNode {
  const existing = doc.nodes.find((n) => n.kind === "paint");
  if (existing) return existing;
  const layer = paintLayer(doc.artboard.width, doc.artboard.height);
  useDesign.getState().addNode(layer);
  return layer;
}

void uid;
