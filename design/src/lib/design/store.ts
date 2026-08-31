import { create } from "zustand";
import { BRUSHES } from "./brushes";
import { formatById } from "./formats";
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
const LOCAL_PATCH = new Set(["x", "y", "w", "h", "rotation", "name", "locked", "visible", "href"]);
const CAMPAIGN_FORMATS = ["ig-story", "ig-post", "x-post"] as const;

export type ViewIntent =
  | { type: "fit" }
  | { type: "fit-sel" }
  | { type: "zoom"; zoom: number }
  | null;

interface DesignState {
  index: ProjectMeta[];
  doc: DesignDocument | null;
  selection: string[];
  tool: Tool;
  viewport: Viewport;
  past: DesignDocument[];
  future: DesignDocument[];
  paintPast: { id: string; bitmap: string }[];
  paintFuture: { id: string; bitmap: string }[];
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
  booleanPreview: BooleanOp | null;
  pathEditHit: PathEditHit | null;
  paletteOpen: boolean;
  nudgePulseAt: number | null;

  hydrate: () => void;
  open: (id: string) => void;
  fromTemplate: (templateId: string) => string;
  fromBlank: (formatId: string) => string;
  makeCampaign: () => string[];
  addCampaignPage: (formatId: string) => string;
  save: () => void;
  remove: (id: string) => void;
  togglePin: (id: string) => void;
  setProjectFolder: (id: string, folder: string) => void;
  toggleProjectTag: (id: string, tag: string) => void;
  rename: (name: string) => void;
  setNotes: (notes: string) => void;
  setTool: (t: Tool) => void;
  setViewport: (v: Partial<Viewport>) => void;
  select: (ids: string[], additive?: boolean) => void;
  updateNodes: (ids: string[], patch: Partial<DesignNode>, commit?: boolean) => void;
  replaceNode: (id: string, node: DesignNode, commit?: boolean) => void;
  addNode: (node: DesignNode, commit?: boolean) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  duplicateLinked: () => void;
  unlinkSelected: () => void;
  reorder: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  reorderInsert: (ids: string | string[], visualInsertIndex: number) => void;
  setArtboardBg: (bg: DesignDocument["artboard"]["background"]) => void;
  resizeArtboard: (formatId: string, magic: boolean) => void;
  undo: () => void;
  redo: () => void;
  commit: () => void;
  beginPaintStroke: (id: string) => void;
  restoreHistory: (slot: "past" | "future", index: number) => void;
  popLastPathPoint: () => void;
  closeSelectedPath: () => void;
  finishPen: () => void;
  setBrush: (p: Partial<BrushSettings>) => void;
  setColor: (c: string) => void;
  setBrand: (b: BrandKit) => void;
  addBrandColor: (hex: string) => boolean;
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
  applyNodes: (nodes: DesignNode[], mode?: "append" | "replace") => void;
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
  requestFitSel: () => void;
  requestZoom: (zoom: number) => void;
  clearViewIntent: () => void;
  setPaletteOpen: (v: boolean) => void;
  lockSelected: () => void;
  hideSelected: () => void;
  bringSelected: (dir: "up" | "down" | "top" | "bottom") => void;
  placeNodes: (places: { id: string; x: number; y: number }[]) => void;
}
