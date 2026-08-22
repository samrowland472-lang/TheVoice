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

interface DesignState {
  index: ProjectMeta[];
  doc: DesignDocument | null;
  selection: string[];
  tool: Tool;
  viewport: Viewport;
  past: DesignDocument[];
  future: DesignDocument[];
  grid: boolean;
  snap: boolean;
  rulers: boolean;
  safeArea: boolean;
  brand: BrandKit;
  brush: BrushSettings;
  color: string;
  editingText: string | null;
  dirty: boolean;
  clipboard: DesignNode[];
  pasteCount: number;
  present: boolean;
  viewIntent: ViewIntent;
  paletteOpen: boolean;

  hydrate: () => void;
  open: (id: string) => void;
  fromTemplate: (templateId: string) => string;
  fromBlank: (formatId: string) => string;
  save: () => void;
  remove: (id: string) => void;
  togglePin: (id: string) => void;
  setProjectFolder: (id: string, folder: string) => void;
  toggleProjectTag: (id: string, tag: string) => void;
  rename: (name: string) => void;
  setTool: (t: Tool) => void;
  setViewport: (v: Partial<Viewport>) => void;
  select: (ids: string[], additive?: boolean) => void;
  updateNodes: (ids: string[], patch: Partial<DesignNode>, commit?: boolean) => void;
  replaceNode: (id: string, node: DesignNode, commit?: boolean) => void;
  addNode: (node: DesignNode, commit?: boolean) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  reorderInsert: (ids: string | string[], visualInsertIndex: number) => void;
  setArtboardBg: (bg: DesignDocument["artboard"]["background"]) => void;
  resizeArtboard: (formatId: string, magic: boolean) => void;
  undo: () => void;
  redo: () => void;
  commit: () => void;
  restoreHistory: (slot: "past" | "future", index: number) => void;
  popLastPathPoint: () => void;
  closeSelectedPath: () => void;
  finishPen: () => void;
  setBrush: (p: Partial<BrushSettings>) => void;
  setColor: (c: string) => void;
  setBrand: (b: BrandKit) => void;
  setEditingText: (id: string | null) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleRulers: () => void;
  toggleSafeArea: () => void;
  setBleed: (px: number) => void;
  addGuide: (axis: "x" | "y", pos: number) => string;
  moveGuide: (id: string, pos: number) => void;
  removeGuide: (id: string) => void;
  clearGuides: () => void;
  applyNodes: (nodes: DesignNode[]) => void;
  translateSelected: (dx: number, dy: number) => void;
  alignSelected: (edge: "left" | "center" | "right" | "top" | "middle" | "bottom", relative?: "selection" | "artboard") => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;
  selectAll: () => void;
  flipSelected: (axis: "h" | "v") => void;
  rotateSelected: (deg: number) => void;
  distributeSelected: (axis: "h" | "v") => void;
  duplicateProject: (id: string) => string;
  togglePresent: () => void;
  setPresent: (v: boolean) => void;
  requestFit: () => void;
  requestZoom: (zoom: number) => void;
  clearViewIntent: () => void;
  setPaletteOpen: (v: boolean) => void;
  lockSelected: () => void;
  hideSelected: () => void;
  bringSelected: (dir: "up" | "down" | "top" | "bottom") => void;
  placeNodes: (places: { id: string; x: number; y: number }[]) => void;
}

function snapshot(doc: DesignDocument): DesignDocument {
  return structuredClone(doc);
}

function thumb(doc: DesignDocument): string | undefined {
  try {
    return exportPng(doc, 0.18);
  } catch {
    return undefined;
  }
}

export const useDesign = create<DesignState>((set, get) => ({
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
  brush: {
    id: "ink",
    size: 16,
    opacity: 1,
    hardness: 0.95,
    spacing: 0.12,
    color: "#0a0d0c",
    symmetry: "none",
  },
  color: "#0a0d0c",
  editingText: null,
  dirty: false,
  clipboard: [],
  pasteCount: 1,
  present: false,
  viewIntent: null,
  paletteOpen: false,

  hydrate: () => set({ index: loadIndex(), brand: loadBrand() }),

  open: (id) => {
    const doc = loadDoc(id);
    if (!doc) return;
    set({
      doc,
      selection: [],
      past: [],
      future: [],
      dirty: false,
      editingText: null,
      present: false,
    });
  },

  fromTemplate: (templateId) => {
    const doc = instantiateTemplate(templateId);
    saveDoc(doc);
    set({
      doc,
      selection: [],
      past: [],
      future: [],
      dirty: false,
      index: loadIndex(),
    });
    return doc.id;
  },

  fromBlank: (formatId) => {
    const fmt = formatById(formatId);
    const doc = blankDocument(formatId, `Untitled ${fmt.label}`);
    saveDoc(doc);
    set({
      doc,
      selection: [],
      past: [],
      future: [],
      dirty: false,
      index: loadIndex(),
    });
    return doc.id;
  },

  save: () => {
    const { doc } = get();
    if (!doc) return;
    const next = { ...doc, updatedAt: Date.now(), thumbnail: thumb(doc) };
    saveDoc(next);
    set({ doc: next, dirty: false, index: loadIndex() });
  },

  remove: (id) => {
    deleteDoc(id);
    const { doc } = get();
    set({
      index: loadIndex(),
      doc: doc?.id === id ? null : doc,
    });
  },

  togglePin: (id) => {
    const cur = get().index.find((p) => p.id === id);
    if (!cur) return;
    set({ index: patchIndex(id, { pinned: !cur.pinned }) });
  },

  setProjectFolder: (id, folder) => {
    set({ index: patchIndex(id, { folder: folder.trim() || undefined }) });
  },

  toggleProjectTag: (id, tag) => {
    const cur = get().index.find((p) => p.id === id);
    if (!cur) return;
    const tags = cur.tags ?? [];
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    set({ index: patchIndex(id, { tags: next }) });
  },

  rename: (name) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, name }, dirty: true });
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
    } else set({ selection: ids });
  },

  updateNodes: (ids, patch, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    const idset = new Set(ids);
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => (idset.has(n.id) ? ({ ...n, ...patch } as DesignNode) : n)),
      },
      dirty: true,
    });
  },

  replaceNode: (id, node, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    set({
      doc: { ...doc, nodes: doc.nodes.map((n) => (n.id === id ? node : n)) },
      dirty: true,
    });
  },

  addNode: (node, commit = true) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    set({
      doc: { ...doc, nodes: [...doc.nodes, node] },
      selection: [node.id],
      dirty: true,
    });
  },

  removeSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const drop = new Set(selection);
    set({
      doc: { ...doc, nodes: doc.nodes.filter((n) => !drop.has(n.id)) },
      selection: [],
      dirty: true,
    });
  },

  duplicateSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const copies = doc.nodes.filter((n) => selection.includes(n.id)).map((n) => cloneNode(n));
    set({
      doc: { ...doc, nodes: [...doc.nodes, ...copies] },
      selection: copies.map((c) => c.id),
      dirty: true,
    });
  },

  reorder: (id, dir) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    const nodes = [...doc.nodes];
    const i = nodes.findIndex((n) => n.id === id);
    if (i < 0) return;
    const [item] = nodes.splice(i, 1);
    if (!item) return;
    if (dir === "top") nodes.push(item);
    else if (dir === "bottom") nodes.unshift(item);
    else if (dir === "up") nodes.splice(Math.min(i + 1, nodes.length), 0, item);
    else nodes.splice(Math.max(i - 1, 0), 0, item);
    set({ doc: { ...doc, nodes }, dirty: true });
  },

  reorderInsert: (ids, visualInsertIndex) => {
    const { doc } = get();
    if (!doc) return;
    const idList = Array.isArray(ids) ? ids : [ids];
    if (!idList.length) return;
    const idSet = new Set(idList);
    const visual = [...doc.nodes].reverse();
    const moving = visual.filter((n) => idSet.has(n.id));
    if (!moving.length) return;
    const start = visual.findIndex((n) => idSet.has(n.id));
    const contiguous = moving.every((n, i) => visual[start + i]?.id === n.id);
    if (contiguous && (visualInsertIndex === start || visualInsertIndex === start + moving.length)) return;
    let removedBefore = 0;
    for (let i = 0; i < visualInsertIndex && i < visual.length; i++) {
      if (idSet.has(visual[i]!.id)) removedBefore += 1;
    }
    get().commit();
    const rest = visual.filter((n) => !idSet.has(n.id));
    const to = Math.max(0, Math.min(rest.length, visualInsertIndex - removedBefore));
    rest.splice(to, 0, ...moving);
    set({ doc: { ...doc, nodes: rest.reverse() }, dirty: true });
  },

  setArtboardBg: (background) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, artboard: { ...doc.artboard, background } }, dirty: true });
  },

  resizeArtboard: (formatId, magic) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    const fmt = formatById(formatId);
    const sx = fmt.width / doc.artboard.width;
    const sy = fmt.height / doc.artboard.height;
    const nodes = magic
      ? doc.nodes.map((n) => ({
          ...n,
          x: n.x * sx,
          y: n.y * sy,
          w: n.w * sx,
          h: n.h * (n.kind === "text" ? 1 : sy),
          ...(n.kind === "text" ? { fontSize: (n as { fontSize: number }).fontSize * Math.min(sx, sy) } : {}),
        }))
      : doc.nodes;
    set({
      doc: {
        ...doc,
        artboard: { ...doc.artboard, width: fmt.width, height: fmt.height, formatId: fmt.id, name: fmt.label },
        nodes: nodes as DesignNode[],
      },
      dirty: true,
    });
  },

  commit: () => {
    const { doc, past } = get();
    if (!doc) return;
    set({
      past: [...past.slice(-MAX_HISTORY), snapshot(doc)],
      future: [],
    });
  },

  undo: () => {
    const { past, doc, future } = get();
    const prev = past[past.length - 1];
    if (!prev || !doc) return;
    set({
      doc: prev,
      past: past.slice(0, -1),
      future: [snapshot(doc), ...future],
      dirty: true,
    });
  },

  redo: () => {
    const { future, doc, past } = get();
    const next = future[0];
    if (!next || !doc) return;
    set({
      doc: next,
      future: future.slice(1),
      past: [...past, snapshot(doc)],
      dirty: true,
    });
  },

  restoreHistory: (slot, index) => {
    const { past, future, doc } = get();
    if (!doc) return;
    if (slot === "past") {
      const target = past[index];
      if (!target) return;
      set({
        doc: snapshot(target),
        past: past.slice(0, index),
        future: [...past.slice(index + 1).map(snapshot), snapshot(doc), ...future],
        selection: [],
        dirty: true,
      });
      return;
    }
    const target = future[index];
    if (!target) return;
    set({
      doc: snapshot(target),
      past: [...past, snapshot(doc), ...future.slice(0, index).map(snapshot)],
      future: future.slice(index + 1),
      selection: [],
      dirty: true,
    });
  },

  popLastPathPoint: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const n = doc.nodes.find((x) => x.id === selection[0]);
    if (!n || n.kind !== "path") return;
    get().commit();
    const pts = n.points.slice(0, -1);
    if (pts.length === 0) {
      get().removeSelected();
      return;
    }
    get().replaceNode(n.id, { ...n, points: pts, closed: false });
  },

  closeSelectedPath: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const n = doc.nodes.find((x) => x.id === selection[0]);
    if (!n || n.kind !== "path" || n.points.length < 3) return;
    get().commit();
    get().replaceNode(n.id, { ...n, closed: true });
    set({ selection: [] });
  },

  finishPen: () => {
    set({ selection: [] });
  },

  setBrush: (p) => {
    const next = { ...get().brush, ...p };
    const def = BRUSHES.find((b) => b.id === next.id);
    if (p.id && def) {
      next.hardness = def.hardness;
      next.spacing = def.spacing;
      next.opacity = def.opacity;
    }
    set({ brush: next, color: p.color ?? get().color });
  },

  setColor: (color) => set({ color, brush: { ...get().brush, color } }),
  setBrand: (brand) => {
    saveBrand(brand);
    set({ brand });
  },
  setEditingText: (editingText) => set({ editingText }),
  toggleGrid: () => set({ grid: !get().grid }),
  toggleSnap: () => set({ snap: !get().snap }),
  toggleRulers: () => set({ rulers: !get().rulers }),
  toggleSafeArea: () => set({ safeArea: !get().safeArea }),
  setBleed: (px) => {
    const { doc } = get();
    if (!doc) return;
    set({
      doc: { ...doc, artboard: { ...doc.artboard, bleed: Math.max(0, Math.round(px)) } },
      dirty: true,
    });
  },
  addGuide: (axis, pos) => {
    const { doc } = get();
    if (!doc) return "";
    const g = { id: uid("gd"), axis, pos };
    set({ doc: { ...doc, guides: [...(doc.guides ?? []), g] }, dirty: true });
    return g.id;
  },
  moveGuide: (id, pos) => {
    const { doc } = get();
    if (!doc) return;
    set({
      doc: { ...doc, guides: (doc.guides ?? []).map((g) => (g.id === id ? { ...g, pos } : g)) },
      dirty: true,
    });
  },
  removeGuide: (id) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, guides: (doc.guides ?? []).filter((g) => g.id !== id) }, dirty: true });
  },
  clearGuides: () => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, guides: [] }, dirty: true });
  },

  applyNodes: (nodes) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, nodes: [...doc.nodes, ...nodes] }, dirty: true });
  },

  translateSelected: (dx, dy) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const ids = new Set(selection);
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => (ids.has(n.id) && !n.locked ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
      },
      dirty: true,
    });
  },

  alignSelected: (edge, relative) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const ids = new Set(selection);
    const selected = doc.nodes.filter((n) => ids.has(n.id));
    const toSelection = relative === "selection" || (relative !== "artboard" && selected.length > 1);
    const box = toSelection ? aabb(selected) : { x: 0, y: 0, w: doc.artboard.width, h: doc.artboard.height };
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (!ids.has(n.id) || n.locked) return n;
          const p = { ...n };
          if (edge === "left") p.x = box.x;
          if (edge === "center") p.x = box.x + (box.w - n.w) / 2;
          if (edge === "right") p.x = box.x + box.w - n.w;
          if (edge === "top") p.y = box.y;
          if (edge === "middle") p.y = box.y + (box.h - n.h) / 2;
          if (edge === "bottom") p.y = box.y + box.h - n.h;
          return p;
        }),
      },
      dirty: true,
    });
  },

  copySelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    set({
      clipboard: doc.nodes.filter((n) => selection.includes(n.id)).map((n) => cloneNode(n, 0, 0)),
      pasteCount: 1,
    });
  },

  cutSelected: () => {
    get().copySelected();
    get().removeSelected();
  },

  pasteClipboard: () => {
    const { doc, clipboard, pasteCount } = get();
    if (!doc || !clipboard.length) return;
    get().commit();
    const copies = clipboard.map((n) => cloneNode(n, 28 * pasteCount, 28 * pasteCount));
    set({
      doc: { ...doc, nodes: [...doc.nodes, ...copies] },
      selection: copies.map((c) => c.id),
      pasteCount: pasteCount + 1,
      dirty: true,
    });
  },

  selectAll: () => {
    const { doc } = get();
    if (!doc) return;
    set({ selection: doc.nodes.filter((n) => n.visible).map((n) => n.id) });
  },

  flipSelected: (axis) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const ids = new Set(selection);
    const box = aabb(doc.nodes.filter((n) => ids.has(n.id)));
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (!ids.has(n.id) || n.locked) return n;
          if (axis === "h") return { ...n, x: 2 * cx - n.x - n.w, rotation: -n.rotation };
          return { ...n, y: 2 * cy - n.y - n.h, rotation: -n.rotation };
        }),
      },
      dirty: true,
    });
  },

  rotateSelected: (deg) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const ids = new Set(selection);
    const box = aabb(doc.nodes.filter((n) => ids.has(n.id)));
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const rad = (deg * Math.PI) / 180;
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          if (!ids.has(n.id) || n.locked) return n;
          const nx = n.x + n.w / 2;
          const ny = n.y + n.h / 2;
          const dx = nx - cx;
          const dy = ny - cy;
          const rx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
          const ry = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
          return { ...n, x: rx - n.w / 2, y: ry - n.h / 2, rotation: n.rotation + deg };
        }),
      },
      dirty: true,
    });
  },

  distributeSelected: (axis) => {
    const { doc, selection } = get();
    if (!doc || selection.length < 3) return;
    get().commit();
    const ids = new Set(selection);
    const items = doc.nodes.filter((n) => ids.has(n.id) && !n.locked);
    if (items.length < 3) return;
    const sorted = [...items].sort((a, b) => (axis === "h" ? a.x - b.x : a.y - b.y));
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const start = axis === "h" ? first.x : first.y;
    const end = axis === "h" ? last.x + last.w : last.y + last.h;
    const total = sorted.reduce((s, n) => s + (axis === "h" ? n.w : n.h), 0);
    const gap = (end - start - total) / (sorted.length - 1);
    let cursor = start;
    const pos = new Map<string, number>();
    for (const n of sorted) {
      pos.set(n.id, cursor);
      cursor += (axis === "h" ? n.w : n.h) + gap;
    }
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n) => {
          const p = pos.get(n.id);
          if (p === undefined) return n;
          return axis === "h" ? { ...n, x: p } : { ...n, y: p };
        }),
      },
      dirty: true,
    });
  },

  duplicateProject: (id) => {
    const src = loadDoc(id);
    if (!src) return "";
    const next = structuredClone(src);
    next.id = uid("doc");
    next.name = `${src.name} copy`;
    next.createdAt = Date.now();
    next.updatedAt = Date.now();
    saveDoc(next);
    set({ index: loadIndex() });
    return next.id;
  },

  togglePresent: () => set({ present: !get().present, paletteOpen: false }),
  setPresent: (present) => set({ present }),
  requestFit: () => set({ viewIntent: { type: "fit" } }),
  requestZoom: (zoom) => set({ viewIntent: { type: "zoom", zoom } }),
  clearViewIntent: () => set({ viewIntent: null }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  lockSelected: () => {
    const { selection } = get();
    if (!selection.length) return;
    const { doc } = get();
    if (!doc) return;
    const first = doc.nodes.find((n) => n.id === selection[0]);
    get().updateNodes(selection, { locked: !first?.locked }, true);
  },

  hideSelected: () => {
    const { selection } = get();
    if (!selection.length) return;
    get().updateNodes(selection, { visible: false }, true);
    set({ selection: [] });
  },

  bringSelected: (dir) => {
    const { selection } = get();
    for (const id of selection) get().reorder(id, dir);
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
}));

export function makeShape(kind: "rect" | "ellipse" | "line" | "polygon" | "star" | "arrow", x: number, y: number, w: number, h: number, color: string) {
  return shape(kind, {
    x,
    y,
    w,
    h,
    fill: kind === "line" ? "transparent" : color,
    stroke: kind === "line" ? color : "transparent",
    strokeWidth: kind === "line" ? 4 : 0,
  });
}

export function makeText(x: number, y: number, color: string) {
  const brand = useDesign.getState().brand;
  const display = brand.fonts[0] || "Chakra Petch";
  return text({
    x,
    y,
    w: 420,
    h: 80,
    text: "Type here",
    fill: color,
    fontFamily: display,
    fontSize: 56,
    fontWeight: 600,
  });
}

export function ensurePaintLayer(doc: DesignDocument): DesignNode {
  const existing = doc.nodes.find((n) => n.kind === "paint");
  if (existing) return existing;
  const layer = paintLayer(doc.artboard.width, doc.artboard.height);
  useDesign.getState().addNode(layer, true);
  return layer;
}

void uid;
