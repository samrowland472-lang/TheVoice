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
  | { type: "fit-selection" }
  | { type: "zoom"; zoom: number }
  | null;

// NOTE: truncated restore marker - full file must be restored from local workspace
export const __STORE_RESTORE_NEEDED = true;
