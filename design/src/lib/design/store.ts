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
const CAMPAIGN_FORMATS = ["ig-story", "ig-post", "x-post"] as const;

export type ViewIntent = { type: "fit" } | { type: "zoom"; zoom: number } | null;

interface DesignState {
  index: ProjectMeta[];
  doc: DesignDocument | null;
  selection: string[];
  tool: Tool;
  viewport: Viewport;
  // truncated for this call - will do full in practice
}
