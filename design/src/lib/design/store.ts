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
