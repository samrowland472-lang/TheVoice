import { uid } from "./id";
import type {
  Align,
  BlendMode,
  DesignNode,
  Fill,
  ImageNode,
  PaintNode,
  PathNode,
  ShapeNode,
  TextNode,
} from "./types";

const BASE = {
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  blend: "source-over" as BlendMode,
  fill: "#d9f5e3" as Fill,
  stroke: "transparent",
  strokeWidth: 0,
  radius: 0,
  shadow: null,
};

export function shape(
  kind: ShapeNode["kind"],
  patch: Partial<ShapeNode> & { x: number; y: number; w: number; h: number },
): ShapeNode {
  return {
    ...BASE,
    id: uid("sh"),
    name: kind,
    kind,
    sides: kind === "polygon" ? 6 : kind === "star" ? 5 : undefined,
    ...patch,
  };
}

export function text(
  patch: Partial<TextNode> & { x: number; y: number; w: number; h: number; text: string },
): TextNode {
  return {
    ...BASE,
    id: uid("tx"),
    name: "Text",
    kind: "text",
    fontFamily: "Chakra Petch",
    fontWeight: 600,
    fontSize: 48,
    letterSpacing: 0,
    lineHeight: 1.1,
    align: "left" as Align,
    uppercase: false,
    fill: "#d9f5e3",
    ...patch,
  };
}

export function imageNode(
  patch: Partial<ImageNode> & { x: number; y: number; w: number; h: number; src: string },
): ImageNode {
  return {
    ...BASE,
    id: uid("im"),
    name: "Image",
    kind: "image",
    crop: null,
    filters: { brightness: 1, contrast: 1, saturate: 1, blur: 0 },
    fill: "transparent",
    ...patch,
  };
}

export function pathNode(
  patch: Partial<PathNode> & { x: number; y: number; w: number; h: number; points: { x: number; y: number }[] },
): PathNode {
  return {
    ...BASE,
    id: uid("pt"),
    name: "Path",
    kind: "path",
    closed: false,
    fill: "transparent",
    stroke: "#3fc6ff",
    strokeWidth: 3,
    ...patch,
  };
}

export function paintLayer(
  w: number,
  h: number,
  bitmap = "",
): PaintNode {
  return {
    ...BASE,
    id: uid("pn"),
    name: "Paint",
    kind: "paint",
    x: 0,
    y: 0,
    w,
    h,
    fill: "transparent",
    bitmap,
  };
}

export function cloneNode(n: DesignNode, dx = 16, dy = 16): DesignNode {
  return { ...n, id: uid(n.kind.slice(0, 2)), x: n.x + dx, y: n.y + dy, name: n.name };
}
