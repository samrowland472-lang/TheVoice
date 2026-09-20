import { create } from "zustand";
import { BRUSHES } from "./brushes";
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
import type {
  BrandKit,
  BrushSettings,
  DesignDocument,
  DesignNode,
  ProjectMeta,
  Tool,
  Viewport,
} from "./types";

export type ViewIntent =
  | { type: "fit" }
  | { type: "zoom"; zoom: number }
  | { type: "fit-sel" }
  | { type: "center" }
  | null;
