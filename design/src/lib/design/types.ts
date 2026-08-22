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

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DesignNode {
  id: string;
  kind: NodeKind;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  blendMode?: BlendMode;
  fill?: Fill;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  /** Text */
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  align?: Align;
  lineHeight?: number;
  letterSpacing?: number;
  /** Path */
  points?: { x: number; y: number }[];
  closed?: boolean;
  /** Image */
  src?: string;
  crop?: CropRect;
  /** Paint layer bitmap (data URL) */
  bitmap?: string;
  /** Star / polygon points */
  sides?: number;
  innerRadius?: number;
  /** Arrow tip */
  arrowHead?: boolean;
}

export interface Guide {
  id: string;
  axis: "x" | "y";
  pos: number;
}

export interface Artboard {
  width: number;
  height: number;
  formatId: string;
  background: string;
  /** Extra pixels around PNG/JPG export (print bleed). */
  bleed?: number;
}

export interface DesignDocument {
  id: string;
  name: string;
  artboard: Artboard;
  nodes: DesignNode[];
  guides?: Guide[];
  updatedAt: number;
  thumbnail?: string;
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
}

export interface BrandKit {
  colors: string[];
  fonts: string[];
  name: string;
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
}
