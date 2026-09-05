import { create } from "zustand";
import { BRUSHES } from "./brushes";
import { formatById } from "./formats";
import { alignNodes, distributeNodes, explodeSelectedIslands, unionOrientedBox } from "./align";
import { aabb } from "./geometry";
import { uid } from "./id";
import { cloneNode, paintLayer, shape, text } from "./node-factory";
import { deleteDoc, loadBrand, loadDoc, loadIndex, patchIndex, saveBrand, saveDoc } from "./persist";
import { exportPng } from "./export";
import { paletteName } from "./palette";
import { blankDocument, instantiateTemplate } from "./templates";
import type { BooleanOp } from "./boolean-ops";
import type { PathEditHit } from "./path-edit";
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

export type ViewIntent = { type: "fit" } | { type: "zoom"; zoom: number } | { type: "fit-sel" } | null;

export const useDesign = create<any>((set: any, get: any) => ({
  index: [],
  doc: null,
  selection: [],
  tool: "select",
  viewport: { x: 0, y: 0, zoom: 0.4 },
  past: [],
  future: [],
  paintPast: [],
  paintFuture: [],
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
  booleanPreview: null,
  pathEditHit: null,
  hydrate: () => set({ index: loadIndex(), brand: loadBrand() }),
  open: (id: string) => {
    const doc = loadDoc(id);
    if (!doc) return;
    set({ doc, selection: [], past: [], future: [], dirty: false, editingText: null, present: false, pathEditHit: null });
  },
  fromTemplate: (templateId: string) => {
    const doc = instantiateTemplate(templateId);
    saveDoc(doc);
    set({ doc, selection: [], past: [], future: [], dirty: false, index: loadIndex() });
    return doc.id;
  },
  fromBlank: (formatId: string) => {
    const fmt = formatById(formatId);
    const doc = blankDocument(formatId, `Untitled ${fmt.label}`);
    saveDoc(doc);
    set({ doc, selection: [], past: [], future: [], dirty: false, index: loadIndex() });
    return doc.id;
  },
  makeCampaign: () => {
    const { doc } = get();
    if (!doc) return [];
    get().save();
    return [get().doc.id];
  },
  addCampaignPage: (formatId: string) => get().fromBlank(formatId),
  save: () => {
    const { doc } = get();
    if (!doc) return;
    let thumbnail: string | undefined;
    try { thumbnail = exportPng(doc, 0.18); } catch { thumbnail = undefined; }
    const next = { ...doc, updatedAt: Date.now(), thumbnail };
    saveDoc(next);
    set({ doc: next, dirty: false, index: loadIndex() });
  },
  remove: (id: string) => {
    deleteDoc(id);
    const { doc } = get();
    set({ index: loadIndex(), doc: doc?.id === id ? null : doc });
  },
  togglePin: (id: string) => {
    const cur = get().index.find((p: ProjectMeta) => p.id === id);
    if (!cur) return;
    set({ index: patchIndex(id, { pinned: !cur.pinned }) });
  },
  setProjectFolder: (id: string, folder: string) => set({ index: patchIndex(id, { folder: folder.trim() || undefined }) }),
  toggleProjectTag: (id: string, tag: string) => {
    const cur = get().index.find((p: ProjectMeta) => p.id === id);
    if (!cur) return;
    const tags = cur.tags ?? [];
    const next = tags.includes(tag) ? tags.filter((t: string) => t !== tag) : [...tags, tag];
    set({ index: patchIndex(id, { tags: next }) });
  },
  rename: (name: string) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, name }, dirty: true });
  },
  setNotes: (notes: string) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, notes }, dirty: true });
  },
  setTool: (tool: Tool) => set({ tool, editingText: null }),
  setViewport: (v: Partial<Viewport>) => set({ viewport: { ...get().viewport, ...v } }),
  select: (ids: string[], additive?: boolean) => {
    if (additive) {
      const cur = new Set(get().selection as string[]);
      for (const id of ids) {
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
      }
      set({ selection: [...cur] });
    } else set({ selection: ids, pathEditHit: null });
  },
  updateNodes: (ids: string[], patch: Partial<DesignNode>, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    const idset = new Set(ids);
    set({ doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => (idset.has(n.id) ? { ...n, ...patch } : n)) }, dirty: true });
  },
  mapNodes: (ids: string[], map: (n: DesignNode) => DesignNode, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    const idset = new Set(ids);
    set({
      doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => (idset.has(n.id) ? map(n) : n)) },
      dirty: true,
    });
  },
  replaceNode: (id: string, node: DesignNode, commit = false) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    set({ doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => (n.id === id ? node : n)) }, dirty: true });
  },
  addNode: (node: DesignNode, commit = true) => {
    const { doc } = get();
    if (!doc) return;
    if (commit) get().commit();
    set({ doc: { ...doc, nodes: [...doc.nodes, node] }, selection: [node.id], dirty: true });
  },
  removeSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const drop = new Set(selection);
    set({ doc: { ...doc, nodes: doc.nodes.filter((n: DesignNode) => !drop.has(n.id)) }, selection: [], dirty: true });
  },
  duplicateSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const copies = doc.nodes.filter((n: DesignNode) => selection.includes(n.id)).map((n: DesignNode) => cloneNode(n));
    set({ doc: { ...doc, nodes: [...doc.nodes, ...copies] }, selection: copies.map((c: DesignNode) => c.id), dirty: true });
  },
  duplicateLinked: () => get().duplicateSelected(),
  unlinkSelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const drop = new Set(selection);
    set({ doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => (drop.has(n.id) ? { ...n, linkId: undefined } : n)) }, dirty: true });
  },
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    const nodes = [...doc.nodes];
    const i = nodes.findIndex((n: DesignNode) => n.id === id);
    if (i < 0) return;
    const [item] = nodes.splice(i, 1);
    if (!item) return;
    if (dir === "top") nodes.push(item);
    else if (dir === "bottom") nodes.unshift(item);
    else if (dir === "up") nodes.splice(Math.min(i + 1, nodes.length), 0, item);
    else nodes.splice(Math.max(i - 1, 0), 0, item);
    set({ doc: { ...doc, nodes }, dirty: true });
  },
  reorderInsert: (ids: string | string[], visualInsertIndex: number) => {
    const { doc } = get();
    if (!doc) return;
    const idList = Array.isArray(ids) ? ids : [ids];
    const idSet = new Set(idList);
    const visual = [...doc.nodes].reverse();
    const moving = visual.filter((n: DesignNode) => idSet.has(n.id));
    if (!moving.length) return;
    get().commit();
    const rest = visual.filter((n: DesignNode) => !idSet.has(n.id));
    rest.splice(Math.max(0, Math.min(rest.length, visualInsertIndex)), 0, ...moving);
    set({ doc: { ...doc, nodes: rest.reverse() }, dirty: true });
  },
  setArtboardBg: (background: DesignDocument["artboard"]["background"]) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, artboard: { ...doc.artboard, background } }, dirty: true });
  },
  resizeArtboard: (formatId: string, magic: boolean) => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    const fmt = formatById(formatId);
    const sx = fmt.width / doc.artboard.width;
    const sy = fmt.height / doc.artboard.height;
    const nodes = magic ? doc.nodes.map((n: DesignNode) => ({ ...n, x: n.x * sx, y: n.y * sy, w: n.w * sx, h: n.kind === "text" ? n.h : n.h * sy })) : doc.nodes;
    set({ doc: { ...doc, artboard: { ...doc.artboard, width: fmt.width, height: fmt.height, formatId: fmt.id, name: fmt.label }, nodes }, dirty: true });
  },
  commit: () => {
    const { doc, past } = get();
    if (!doc) return;
    set({ past: [...past.slice(-MAX_HISTORY), structuredClone(doc)], future: [], paintPast: [], paintFuture: [] });
  },
  beginPaintStroke: (id: string) => {
    const { doc, paintPast } = get();
    const n = doc?.nodes.find((x: DesignNode) => x.id === id);
    if (!n || n.kind !== "paint") return;
    set({ paintPast: [...paintPast.slice(-23), { id, bitmap: n.bitmap }], paintFuture: [] });
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
  restoreHistory: (slot: "past" | "future", index: number) => {
    const { past, future, doc } = get();
    if (!doc) return;
    const target = slot === "past" ? past[index] : future[index];
    if (!target) return;
    set({ doc: structuredClone(target), selection: [], dirty: true });
  },
  popLastPathPoint: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const n = doc.nodes.find((x: DesignNode) => x.id === selection[0]);
    if (!n || n.kind !== "path") return;
    get().commit();
    const pts = n.points.slice(0, -1);
    if (!pts.length) { get().removeSelected(); return; }
    get().replaceNode(n.id, { ...n, points: pts, closed: false });
  },
  closeSelectedPath: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const n = doc.nodes.find((x: DesignNode) => x.id === selection[0]);
    if (!n || n.kind !== "path" || n.points.length < 3) return;
    get().commit();
    get().replaceNode(n.id, { ...n, closed: true });
    set({ selection: [] });
  },
  finishPen: () => set({ selection: [] }),
  setBrush: (p: Partial<BrushSettings>) => {
    const next = { ...get().brush, ...p };
    const def = BRUSHES.find((b) => b.id === next.id);
    if (p.id && def) { next.hardness = def.hardness; next.spacing = def.spacing; next.opacity = def.opacity; }
    set({ brush: next, color: p.color ?? get().color });
  },
  setColor: (color: string) => set({ color, brush: { ...get().brush, color } }),
  setBrand: (brand: BrandKit) => { saveBrand(brand); set({ brand }); },
  addBrandColor: (hex: string) => {
    const n = hex.toLowerCase();
    const { brand } = get();
    if (brand.colors.some((c: { hex: string }) => c.hex.toLowerCase() === n)) return false;
    const next = { ...brand, colors: [...brand.colors, { name: paletteName(hex, brand.colors.length), hex }] };
    saveBrand(next);
    set({ brand: next });
    return true;
  },
  setEditingText: (editingText: string | null) => set({ editingText }),
  toggleGrid: () => set({ grid: !get().grid }),
  toggleSnap: () => set({ snap: !get().snap }),
  toggleRulers: () => set({ rulers: !get().rulers }),
  toggleSafeArea: () => set({ safeArea: !get().safeArea }),
  setBleed: (px: number) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, artboard: { ...doc.artboard, bleed: Math.max(0, Math.round(px)) } }, dirty: true });
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
    set({ doc: { ...doc, guides: (doc.guides ?? []).map((g: { id: string; pos: number }) => (g.id === id ? { ...g, pos } : g)) }, dirty: true });
  },
  removeGuide: (id: string) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, guides: (doc.guides ?? []).filter((g: { id: string }) => g.id !== id) }, dirty: true });
  },
  clearGuides: () => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: { ...doc, guides: [] }, dirty: true });
  },
  applyNodes: (nodes: DesignNode[], mode = "append") => {
    const { doc } = get();
    if (!doc) return;
    get().commit();
    set({ doc: { ...doc, nodes: mode === "replace" ? nodes : [...doc.nodes, ...nodes] }, selection: [], dirty: true });
  },
  translateSelected: (dx: number, dy: number) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    const ids = new Set(selection);
    set({ doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => (ids.has(n.id) && !n.locked ? { ...n, x: n.x + dx, y: n.y + dy } : n)) }, dirty: true });
  },
  alignSelected: (edge: string, relative?: string) => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const exploded = explodeSelectedIslands(doc.nodes, selection);
    const ids = new Set(exploded.selection);
    const selected = exploded.nodes.filter((n: DesignNode) => ids.has(n.id));
    const toSelection = relative === "selection" || (relative !== "artboard" && selected.length > 1);
    const box = toSelection ? unionOrientedBox(selected) : { x: 0, y: 0, w: doc.artboard.width, h: doc.artboard.height };
    set({
      doc: { ...doc, nodes: alignNodes(exploded.nodes, ids, edge, box) },
      selection: exploded.selection,
      dirty: true,
    });
  },
  copySelected: () => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    set({ clipboard: doc.nodes.filter((n: DesignNode) => selection.includes(n.id)).map((n: DesignNode) => cloneNode(n, 0, 0)), pasteCount: 1 });
  },
  cutSelected: () => { get().copySelected(); get().removeSelected(); },
  pasteClipboard: () => {
    const { doc, clipboard, pasteCount } = get();
    if (!doc || !clipboard.length) return;
    get().commit();
    const copies = clipboard.map((n: DesignNode) => cloneNode(n, 28 * pasteCount, 28 * pasteCount));
    set({ doc: { ...doc, nodes: [...doc.nodes, ...copies] }, selection: copies.map((c: DesignNode) => c.id), pasteCount: pasteCount + 1, dirty: true });
  },
  selectAll: () => {
    const { doc } = get();
    if (!doc) return;
    set({ selection: doc.nodes.filter((n: DesignNode) => n.visible).map((n: DesignNode) => n.id) });
  },
  flipSelected: (axis: "h" | "v") => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const ids = new Set(selection);
    const box = aabb(doc.nodes.filter((n: DesignNode) => ids.has(n.id)));
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    set({
      doc: {
        ...doc,
        nodes: doc.nodes.map((n: DesignNode) => {
          if (!ids.has(n.id) || n.locked) return n;
          if (axis === "h") return { ...n, x: 2 * cx - n.x - n.w, rotation: -n.rotation };
          return { ...n, y: 2 * cy - n.y - n.h, rotation: -n.rotation };
        }),
      },
      dirty: true,
    });
  },
  rotateSelected: (deg: number) => {
    const { selection } = get();
    if (!selection.length) return;
    get().updateNodes(selection, {}, true);
    void deg;
  },
  distributeSelected: (axis: "h" | "v" = "h") => {
    const { doc, selection } = get();
    if (!doc || !selection.length) return;
    get().commit();
    const exploded = explodeSelectedIslands(doc.nodes, selection);
    set({
      doc: { ...doc, nodes: distributeNodes(exploded.nodes, exploded.selection, axis) },
      selection: exploded.selection,
      dirty: true,
    });
  },
  duplicateProject: (id: string) => {
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
  setPresent: (present: boolean) => set({ present }),
  requestFit: () => set({ viewIntent: { type: "fit" } }),
  requestZoom: (zoom: number) => set({ viewIntent: { type: "zoom", zoom } }),
  clearViewIntent: () => set({ viewIntent: null }),
  setPaletteOpen: (paletteOpen: boolean) => set({ paletteOpen }),
  lockSelected: () => {
    const { selection, doc } = get();
    if (!selection.length || !doc) return;
    const first = doc.nodes.find((n: DesignNode) => n.id === selection[0]);
    get().updateNodes(selection, { locked: !first?.locked }, true);
  },
  hideSelected: () => {
    const { selection } = get();
    if (!selection.length) return;
    get().updateNodes(selection, { visible: false }, true);
    set({ selection: [] });
  },
  bringSelected: (dir: "up" | "down" | "top" | "bottom") => {
    for (const id of get().selection) get().reorder(id, dir);
  },
  placeNodes: (places: { id: string; x: number; y: number }[]) => {
    const { doc } = get();
    if (!doc) return;
    const map = new Map(places.map((p) => [p.id, p]));
    set({ doc: { ...doc, nodes: doc.nodes.map((n: DesignNode) => { const p = map.get(n.id); return p ? { ...n, x: p.x, y: p.y } : n; }) }, dirty: true });
  },
}));

export function makeShape(kind: "rect" | "ellipse" | "line" | "polygon" | "star" | "arrow", x: number, y: number, w: number, h: number, color: string) {
  return shape(kind, { x, y, w, h, fill: kind === "line" ? "transparent" : color, stroke: kind === "line" ? color : "transparent", strokeWidth: kind === "line" ? 4 : 0 });
}

export function makeText(x: number, y: number, color: string) {
  const brand = useDesign.getState().brand;
  const display = brand.displayFont || brand.fonts[0] || "Chakra Petch";
  return text({ x, y, w: 420, h: 80, text: "Type here", fill: color, fontFamily: display, fontSize: 56, fontWeight: 600 });
}

export function ensurePaintLayer(doc: DesignDocument): DesignNode {
  const existing = doc.nodes.find((n) => n.kind === "paint");
  if (existing) return existing;
  const layer = paintLayer(doc.artboard.width, doc.artboard.height);
  useDesign.getState().addNode(layer, true);
  return layer;
}
