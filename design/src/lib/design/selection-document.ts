import { aabb } from "./geometry";
import { shadowCropExtents } from "./shadow";
import type { DesignDocument, DesignNode } from "./types";

/** Keep only the named nodes; same artboard. Empty or missing ids → null. */
export function selectionDocument(doc: DesignDocument, ids: string[]): DesignDocument | null {
  if (!ids.length) return null;
  const keep = new Set(ids);
  const nodes = doc.nodes.filter((n) => keep.has(n.id));
  if (!nodes.length) return null;
  return { ...doc, nodes, name: `${doc.name} selection` };
}

/** Visible layers only — used when isolate is on. Same artboard. */
export function isolateDocument(doc: DesignDocument): DesignDocument | null {
  const ids = doc.nodes.filter((n) => n.visible).map((n) => n.id);
  const slice = selectionDocument(doc, ids);
  if (!slice) return null;
  return { ...slice, name: `${doc.name} isolate` };
}

const CROP_PAD = 2;

function shiftNode(n: DesignNode, dx: number, dy: number): DesignNode {
  return { ...n, x: n.x + dx, y: n.y + dy };
}

/** Selection on a tight artboard around the AABB of those nodes. */
export function cropSelectionDocument(doc: DesignDocument, ids: string[]): DesignDocument | null {
  const slice = selectionDocument(doc, ids);
  if (!slice) return null;
  const box = aabb(slice.nodes);
  if (box.w <= 0 || box.h <= 0) return slice;
  const halo = shadowCropExtents(slice.nodes);
  const padL = CROP_PAD + halo.left;
  const padT = CROP_PAD + halo.top;
  const padR = CROP_PAD + halo.right;
  const padB = CROP_PAD + halo.bottom;
  const ox = box.x - padL;
  const oy = box.y - padT;
  const width = Math.max(1, Math.ceil(box.w + padL + padR));
  const height = Math.max(1, Math.ceil(box.h + padT + padB));
  return {
    ...slice,
    name: `${doc.name} crop`,
    artboard: { ...slice.artboard, width, height, name: "Crop" },
    nodes: slice.nodes.map((n) => shiftNode(n, -ox, -oy)),
    guides: undefined,
  };
}

/** Isolate set on a tight artboard. */
export function cropIsolateDocument(doc: DesignDocument): DesignDocument | null {
  const ids = doc.nodes.filter((n) => n.visible).map((n) => n.id);
  const cropped = cropSelectionDocument(doc, ids);
  if (!cropped) return null;
  return { ...cropped, name: `${doc.name} isolate crop` };
}
