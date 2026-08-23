import type { CSSProperties } from "react";

export type Tool =
  | "select"
  | "hand"
  | "rect"
  | "ellipse"
  | "line"
  | "polygon"
  | "star"
  | "text"
  | "pen"
  | "brush"
  | "eraser"
  | "frame"
  | "image";

export type Fill = string | GradientFill;

export interface GradientStop {
  offset: number;
  color: string;
}

export interface GradientFill {
  type: "linear";
  angle: number;
  stops: GradientStop[];
}

export function isGradient(f: Fill): f is GradientFill {
  return typeof f === "object" && f !== null && (f as GradientFill).type === "linear";
}

export interface BaseNode {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  /** Present-mode hotspot: campaign page id or absolute URL. */
  href?: string;
  /** Shared style/copy source across campaign instances. */
  linkId?: string;
}

export interface ShapeNode extends BaseNode {
  kind: "rect" | "ellipse" | "line" | "polygon" | "star";
  fill: Fill;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  points?: number;
}

export interface TextNode extends BaseNode {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
}

export interface PathNode extends BaseNode {
  kind: "path";
  d: string;
  fill: Fill;
  stroke?: string;
  strokeWidth?: number;
  closed?: boolean;
}

export interface ImageNode extends BaseNode {
  kind: "image";
  src: string;
  fit?: "cover" | "contain" | "fill";
  crop?: { x: number; y: number; w: number; h: number };
  mask?: "none" | "circle" | "rounded";
}

export interface PaintNode extends BaseNode {
  kind: "paint";
  src: string;
}

export type DesignNode = ShapeNode | TextNode | PathNode | ImageNode | PaintNode;

export function isText(n: DesignNode): n is TextNode {
  return n.kind === "text";
}
export function isPath(n: DesignNode): n is PathNode {
  return n.kind === "path";
}
export function isImage(n: DesignNode): n is ImageNode {
  return n.kind === "image";
}
export function isPaint(n: DesignNode): n is PaintNode {
  return n.kind === "paint";
}

export interface Artboard {
  width: number;
  height: number;
  background: Fill;
  name: string;
  formatId: string;
  /** Extra pixels around PNG/JPG export (print bleed). */
  bleed?: number;
}

export interface DesignDocument {
  id: string;
  name: string;
  artboard: Artboard;
  nodes: DesignNode[];
  updatedAt: number;
  createdAt: number;
  thumbnail?: string;
  /** Hash of artboard+nodes used to skip re-raster when content is unchanged. */
  thumbHash?: string;
  /** Manual ruler guides in artboard space. */
  guides?: { id: string; axis: "x" | "y"; pos: number }[];
  /** Shared id for a campaign set (story + square + banner). */
  campaignId?: string;
  /** Present-mode speaker notes (local only). */
  notes?: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  formatId: string;
  width: number;
  height: number;
  updatedAt: number;
  thumbnail?: string;
  /** Pinned projects sort to the front of Recents. */
  pinned?: boolean;
  folder?: string;
  tags?: string[];
  campaignId?: string;
}

export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandKit {
  name: string;
  /** Named brand colours — used by inspector swatches and new ink. */
  colors: BrandColor[];
  /** Preferred display (headline) font family. */
  displayFont: string;
  /** Preferred body font family. */
  bodyFont: string;
  /** Extra brand fonts available in the pairing list. */
  fonts: string[];
}

export interface BrushSettings {
  id: string;
  size: number;
  opacity: number;
  hardness: number;
  spacing: number;
  color: string;
  symmetry: "none" | "x" | "y" | "xy";
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
