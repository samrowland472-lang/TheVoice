export type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "soft-light"
  | "hard-light"
  | "color-dodge"
  | "color-burn";

export type Align = "left" | "center" | "right";
export type Tool =
  | "select"
  | "hand"
  | "frame"
  | "rect"
  | "ellipse"
  | "line"
  | "polygon"
  | "star"
  | "arrow"
  | "text"
  | "pen"
  | "brush"
  | "eraser"
  | "image"
  | "eyedropper";

export type NodeKind =
  | "rect"
  | "ellipse"
  | "line"
  | "polygon"
  | "star"
  | "arrow"
  | "text"
  | "image"
  | "path"
  | "paint";

export interface GradientFill {
  type: "linear";
  angle: number;
  stops: { offset: number; color: string }[];
}

export type Fill = string | GradientFill;

export interface Shadow {
  color: string;
  blur: number;
  ox: number;
  oy: number;
}

export interface BaseNode {
  id: string;
  name: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blend: BlendMode;
  fill: Fill;
  stroke: string;
  strokeWidth: number;
  radius: number;
  shadow: Shadow | null;
  /** Shared id — style/copy edits update every instance. Transform stays local. */
  linkId?: string;
  /** Present hotspot: `doc:<id>` or a URL. */
  href?: string;
}

export interface TextNode extends BaseNode {
  kind: "text";
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  align: Align;
  uppercase: boolean;
}

export interface ImageNode extends BaseNode {
  kind: "image";
  src: string;
  /** Normalized source rect (0–1). Null = full image. */
  crop: { x: number; y: number; w: number; h: number } | null;
  filters: {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
  };
}

export interface PathNode extends BaseNode {
  kind: "path";
  points: { x: number; y: number }[];
  closed: boolean;
}

export interface PaintNode extends BaseNode {
  kind: "paint";
  bitmap: string;
}

export interface ShapeNode extends BaseNode {
  kind: "rect" | "ellipse" | "line" | "polygon" | "star" | "arrow";
  sides?: number;
}

export type DesignNode = TextNode | ImageNode | PathNode | PaintNode | ShapeNode;

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

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BrushSettings {
  id: string;
  size: number;
  opacity: number;
  hardness: number;
  spacing: number;
  color: string;
  symmetry: "none" | "x" | "y" | "xy" | "radial";
}

export function isGradient(fill: Fill): fill is GradientFill {
  return typeof fill === "object" && fill !== null && fill.type === "linear";
}

export function isText(n: DesignNode): n is TextNode {
  return n.kind === "text";
}

export function isImage(n: DesignNode): n is ImageNode {
  return n.kind === "image";
}

export function isPath(n: DesignNode): n is PathNode {
  return n.kind === "path";
}

export function isPaint(n: DesignNode): n is PaintNode {
  return n.kind === "paint";
}
