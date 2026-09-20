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
export type Valign = "top" | "middle" | "bottom";
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
  | "knife"
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
  spread?: number;
  inset?: boolean;
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
  /** On/off dash length in px. 0 is a solid stroke. */
  strokeDash: number;
  strokeDashOffset: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  miterLimit: number;
  radius: number;
  shadow: Shadow | null;
  linkId?: string;
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
  wrap?: boolean;
  valign?: Valign;
  opticalSize?: number;
  fontWidth?: number;
  fontSlant?: number;
  fontItalic?: number;
  fontGrade?: number;
  fontSoft?: number;
  fontWonk?: number;
}

export interface ImageNode extends BaseNode {
  kind: "image";
  src: string;
  crop: { x: number; y: number; w: number; h: number } | null;
  filters: {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
  };
}

export interface PathPoint {
  x: number;
  y: number;
  in?: { x: number; y: number } | null;
  out?: { x: number; y: number } | null;
  smooth?: boolean;
}

export interface PathNode extends BaseNode {
  kind: "path";
  points: PathPoint[];
  closed: boolean;
  holes?: PathPoint[][];
  fillRule?: "evenodd" | "nonzero";
  /** Per-hole rule. `evenodd` punches; `nonzero` keeps the ring as an island. */
  holeFillRules?: ("evenodd" | "nonzero")[];
}

export interface PaintNode extends BaseNode {
  kind: "paint";
  bitmap: string;
}

export interface ShapeNode extends BaseNode {
  kind: "rect" | "ellipse" | "line" | "polygon" | "star" | "arrow";
  sides?: number;
  /** Arrowhead length as a multiple of the default head (1 = stock). */
  headScale?: number;
}

export type DesignNode = TextNode | ImageNode | PathNode | PaintNode | ShapeNode;

export interface BleedEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Artboard {
  width: number;
  height: number;
  background: Fill;
  name: string;
  formatId: string;
  bleed?: number;
  bleedEdges?: BleedEdges;
}

export interface Guide {
  id: string;
  axis: "x" | "y";
  pos: number;
  locked?: boolean;
  hidden?: boolean;
  /** Hex override; falls back to the axis look. */
  color?: string;
  /** Display name in Print and on the board. */
  label?: string;
  /** Stroke pattern override; falls back to the axis look. */
  dash?: "solid" | "dash" | "tight";
}

export interface DesignDocument {
  id: string;
  name: string;
  artboard: Artboard;
  nodes: DesignNode[];
  updatedAt: number;
  createdAt: number;
  thumbnail?: string;
  guides?: Guide[];
  campaignId?: string;
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
  pinned?: boolean;
  folder?: string;
  tags?: string[];
  campaignId?: string;
  campaignOrder?: number;
}

export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandKit {
  name: string;
  colors: BrandColor[];
  displayFont: string;
  bodyFont: string;
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
