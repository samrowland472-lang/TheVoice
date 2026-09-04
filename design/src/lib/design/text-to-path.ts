import { tightenPathNode } from "./align";
import { contourArea, orientContour } from "./boolean-ops";
import { applyFontFace } from "./fonts";
import { pathNode } from "./node-factory";
import { simplifyPolyline, toPathPoints, type Vec } from "./path-offset";
import type { PathNode, PathPoint, TextNode } from "./types";

export type Ring = Vec[];

function key(x: number, y: number) {
  return `${x},${y}`;
}

/** Marching-squares segments on a binary mask, then chain into closed rings. */
export function traceMaskContours(mask: Uint8Array, width: number, height: number): Ring[] {
  const segs = new Map<string, number[]>();
  const points: Vec[] = [];
  const indexOf = (x: number, y: number) => {
    const k = key(x, y);
    const existing = segs.get(k);
    if (existing) return existing[0]!;
    const i = points.length;
    points.push({ x, y });
    segs.set(k, [i]);
    return i;
  };
  const edges: [number, number][] = [];

  const at = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return mask[y * width + x] ? 1 : 0;
  };

  for (let y = -1; y < height; y++) {
    for (let x = -1; x < width; x++) {
      const tl = at(x, y);
      const tr = at(x + 1, y);
      const br = at(x + 1, y + 1);
      const bl = at(x, y + 1);
      const code = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (code === 0 || code === 15) continue;
      const top: Vec = { x: x + 1, y };
      const right: Vec = { x: x + 1.5, y: y + 1 };
      const bottom: Vec = { x: x + 1, y: y + 1.5 };
      const left: Vec = { x: x + 0.5, y: y + 1 };
      const pair = (a: Vec, b: Vec) => {
        const ia = indexOf(a.x, a.y);
        const ib = indexOf(b.x, b.y);
        edges.push([ia, ib]);
      };
      switch (code) {
        case 1:
          pair(left, bottom);
          break;
        case 2:
          pair(bottom, right);
          break;
        case 3:
          pair(left, right);
          break;
        case 4:
          pair(top, right);
          break;
        case 5:
          pair(left, top);
          pair(bottom, right);
          break;
        case 6:
          pair(top, bottom);
          break;
        case 7:
          pair(left, top);
          break;
        case 8:
          pair(left, top);
          break;
        case 9:
          pair(top, bottom);
          break;
        case 10:
          pair(left, bottom);
          pair(top, right);
          break;
        case 11:
          pair(top, right);
          break;
        case 12:
          pair(left, right);
          break;
        case 13:
          pair(bottom, right);
          break;
        case 14:
          pair(left, bottom);
          break;
        default:
          break;
      }
    }
  }

  const adj = new Map<number, number[]>();
  for (const [a, b] of edges) {
    if (a === b) continue;
    const la = adj.get(a) ?? [];
    const lb = adj.get(b) ?? [];
    la.push(b);
    lb.push(a);
    adj.set(a, la);
    adj.set(b, lb);
  }

  const used = new Set<string>();
  const rings: Ring[] = [];
  const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  for (const start of adj.keys()) {
    for (const first of adj.get(start) ?? []) {
      if (used.has(edgeKey(start, first))) continue;
      const ring: Ring = [];
      let prev = start;
      let cur = first;
      used.add(edgeKey(prev, cur));
      ring.push(points[prev]!);
      let guard = 0;
      while (guard++ < points.length + 4) {
        ring.push(points[cur]!);
        const nexts = adj.get(cur) ?? [];
        let nxt = -1;
        for (const cand of nexts) {
          if (cand === prev) continue;
          if (!used.has(edgeKey(cur, cand))) {
            nxt = cand;
            break;
          }
        }
        if (nxt < 0) break;
        used.add(edgeKey(cur, nxt));
        prev = cur;
        cur = nxt;
        if (cur === start) break;
      }
      if (ring.length >= 4) rings.push(ring);
    }
  }
  return rings;
}

function pointInRing(pt: Vec, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const hit = a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y + 1e-12) + a.x;
    if (hit) inside = !inside;
  }
  return inside;
}

function ringCentroid(ring: Ring): Vec {
  let x = 0;
  let y = 0;
  for (const p of ring) {
    x += p.x;
    y += p.y;
  }
  const n = Math.max(1, ring.length);
  return { x: x / n, y: y / n };
}

function ringArea(ring: Ring): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]!;
    const q = ring[(i + 1) % ring.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export interface GlyphContour {
  outer: Ring;
  holes: Ring[];
}

/** Nest smaller rings that sit inside a larger one as holes. */
export function nestContours(rings: Ring[]): GlyphContour[] {
  const cleaned = rings
    .map((r) => {
      const simple = r.length > 8 ? simplifyPolyline(r, 0.85) : r;
      return simple.length >= 3 ? simple : r;
    })
    .filter((r) => Math.abs(ringArea(r)) > 4)
    .sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));

  const claimed = new Array(cleaned.length).fill(false);
  const glyphs: GlyphContour[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (claimed[i]) continue;
    const outer = cleaned[i]!;
    const holes: Ring[] = [];
    claimed[i] = true;
    for (let j = i + 1; j < cleaned.length; j++) {
      if (claimed[j]) continue;
      const cand = cleaned[j]!;
      if (pointInRing(ringCentroid(cand), outer)) {
        holes.push(cand);
        claimed[j] = true;
      }
    }
    glyphs.push({ outer, holes });
  }
  return glyphs;
}

function paintText(ctx: CanvasRenderingContext2D, n: TextNode, ox: number, oy: number) {
  applyFontFace(ctx, n);
  ctx.textAlign = n.align === "center" ? "center" : n.align === "right" ? "right" : "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  const lines = n.text.split("\n");
  const lh = n.fontSize * n.lineHeight;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!;
    if (n.uppercase) line = line.toUpperCase();
    let ax = ox;
    if (n.align === "center") ax = ox + n.w / 2;
    if (n.align === "right") ax = ox + n.w;
    ctx.fillText(line, ax, oy + i * lh, n.w);
  }
}

function rasterizeText(n: TextNode, pad: number, scale: number): { mask: Uint8Array; width: number; height: number } | null {
  if (typeof document === "undefined") return null;
  const w = Math.max(2, Math.ceil((n.w + pad * 2) * scale));
  const h = Math.max(2, Math.ceil((n.h + pad * 2) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, w, h);
  paintText(ctx, n, pad, pad);
  const data = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 24 ? 1 : 0;
  return { mask, width: w, height: h };
}

function toLocalPoints(ring: Ring, scale: number, pad: number): PathPoint[] {
  const pts = ring.map((p) => ({ x: p.x / scale - pad, y: p.y / scale - pad }));
  return toPathPoints(simplifyPolyline(pts, Math.max(0.6, 1.2 / scale)));
}

export function textNodeToPathNodes(n: TextNode): PathNode[] {
  const pad = Math.max(4, n.fontSize * 0.15);
  const scale = n.fontSize >= 72 ? 2 : n.fontSize >= 28 ? 3 : 4;
  const raster = rasterizeText(n, pad, scale);
  if (!raster) return [];
  const rings = traceMaskContours(raster.mask, raster.width, raster.height);
  const glyphs = nestContours(rings);
  const nodes: PathNode[] = [];
  for (const g of glyphs) {
    const points = toLocalPoints(g.outer, scale, pad);
    if (points.length < 3) continue;
    const holes = g.holes
      .map((h) => toLocalPoints(h, scale, pad))
      .filter((h) => h.length >= 3);
    const outerPos = contourArea(points) >= 0;
    const orientedHoles = holes.map((h) => orientContour(h, !outerPos));
    const node = pathNode({
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
      rotation: n.rotation,
      points,
      closed: true,
      holes: orientedHoles.length ? orientedHoles : undefined,
      fillRule: orientedHoles.length ? "evenodd" : "nonzero",
      fill: n.fill,
      stroke: "transparent",
      strokeWidth: 0,
      opacity: n.opacity,
      blend: n.blend,
      name: n.name,
      visible: n.visible,
      locked: n.locked,
      shadow: n.shadow,
    });
    node.linkId = n.linkId;
    node.href = n.href;
    nodes.push(tightenPathNode(node));
  }
  return nodes;
}
