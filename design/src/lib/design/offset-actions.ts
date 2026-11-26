import { contourArea, orientContour } from "./boolean-ops";
import { pathNode } from "./node-factory";
import { offsetPolyline, outlineStroke, roundPolylineCorners, simplifyPolyline, toPathPoints } from "./path-offset";
import { asEditablePath, isConvertibleShape, shapeToPathNode } from "./shape-to-path";
import { useDesign } from "./store";
import { textNodeToPathNodes } from "./text-to-path";
import type { PathNode, PathPoint } from "./types";
import { isPath, isText } from "./types";

function withOrientedHoles(points: PathPoint[], holes?: PathPoint[][]): PathPoint[][] | undefined {
  if (!holes?.length) return holes;
  const outerPos = contourArea(points) >= 0;
  return holes.map((h) => orientContour(h, !outerPos));
}

function selectedPath(convert = true): PathNode | null {
  const { doc, selection } = useDesign.getState();
  if (!doc || !selection.length) return null;
  const n = doc.nodes.find((x) => x.id === selection[0]);
  if (!n) return null;
  if (isPath(n)) return n;
  if (convert && isText(n)) return convertSelectedTextToPath() ?? null;
  if (convert && isConvertibleShape(n)) return convertSelectedShapeToPath() ?? asEditablePath(n);
  return null;
}

/** Replace a primitive shape with an editable path that keeps the same id. */
export function convertSelectedShapeToPath(): PathNode | null {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc || !s.selection.length) return null;
  const n = doc.nodes.find((x) => x.id === s.selection[0]);
  if (!n || isPath(n) || !isConvertibleShape(n)) return n && isPath(n) ? n : null;
  const path = shapeToPathNode(n);
  s.commit();
  s.replaceNode(n.id, path, false);
  return path;
}

/** Replace selected type with editable outline paths (counters become holes). */
export function convertSelectedTextToPath(): PathNode | null {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc || !s.selection.length) return null;
  const n = doc.nodes.find((x) => x.id === s.selection[0]);
  if (!n || !isText(n) || !n.text.trim()) return null;
  const paths = textNodeToPathNodes(n);
  if (!paths.length) return null;
  const [first, ...rest] = paths;
  first.id = n.id;
  s.commit();
  s.replaceNode(n.id, first, false);
  const ids = [n.id];
  for (const extra of rest) {
    extra.name = n.name;
    s.addNode(extra, false);
    ids.push(extra.id);
  }
  s.select(ids);
  return first;
}

function addOutlined(n: PathNode, points: PathPoint[], holes?: PathPoint[][]) {
  const s = useDesign.getState();
  const node = pathNode({
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    rotation: n.rotation,
    points,
    closed: true,
    holes,
    fillRule: holes?.length ? "evenodd" : n.fillRule,
    fill: n.fill === "transparent" ? n.stroke || "#3fc6ff" : n.fill,
    stroke: "transparent",
    strokeWidth: 0,
    name: `${n.name} outline`,
    opacity: n.opacity,
  });
  s.addNode(node, true);
}

export function outlineSelectedStroke(cornerRadius?: number): boolean {
  const n = selectedPath();
  if (!n || n.points.length < 2) return false;
  const width = Math.max(1, n.strokeWidth || 3);
  const outlined = outlineStroke(n.points, n.closed, width, cornerRadius ?? width / 2);
  if (!outlined) return false;
  const holes = [
    ...(outlined.hole ? [outlined.hole] : []),
    ...(n.holes ?? []).flatMap((h) => {
      const inner = outlineStroke(h, true, width, cornerRadius ?? width / 2);
      return inner ? [inner.points, ...(inner.hole ? [inner.hole] : [])] : [];
    }),
  ];
  addOutlined(n, outlined.points, holes.length ? withOrientedHoles(outlined.points, holes) : undefined);
  return true;
}

export function offsetSelectedPath(direction: "out" | "in", cornerRadius?: number): boolean {
  const n = selectedPath();
  if (!n || n.points.length < 2) return false;
  const dist = Math.max(1, n.strokeWidth || 8) * (direction === "out" ? 1 : -1);
  const points = offsetPolyline(n.points, n.closed, dist, cornerRadius ?? Math.abs(dist));
  const holes = n.holes?.map((h) => offsetPolyline(h, true, -dist, cornerRadius ?? Math.abs(dist)));
  const s = useDesign.getState();
  const node = pathNode({
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    rotation: n.rotation,
    points,
    closed: n.closed,
    holes: withOrientedHoles(points, holes),
    fillRule: holes?.length ? "evenodd" : n.fillRule,
    fill: "transparent",
    stroke: n.stroke === "transparent" ? "#3fc6ff" : n.stroke,
    strokeWidth: Math.max(1, n.strokeWidth || 2),
    name: `${n.name} offset`,
    opacity: n.opacity,
  });
  s.addNode(node, true);
  return true;
}

export function simplifySelectedPath(eps = 1.6): boolean {
  const n = selectedPath();
  if (!n || n.points.length < 3) return false;
  const raw = n.points.map((p) => ({ x: p.x, y: p.y }));
  const simple = simplifyPolyline(raw, eps);
  if (simple.length < 2) return false;
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(
    n.id,
    {
      ...n,
      points: toPathPoints(simple),
      holes: n.holes?.map((h) => toPathPoints(simplifyPolyline(h.map((p) => ({ x: p.x, y: p.y })), eps))),
    },
    false,
  );
  return true;
}

export function roundSelectedPathCorners(radius?: number): boolean {
  const n = selectedPath();
  if (!n || n.points.length < 3) return false;
  const r = radius ?? Math.max(4, n.strokeWidth || 8);
  const raw = n.points.map((p) => ({ x: p.x, y: p.y }));
  const rounded = roundPolylineCorners(raw, r, n.closed);
  const s = useDesign.getState();
  s.commit();
  s.replaceNode(
    n.id,
    {
      ...n,
      points: toPathPoints(simplifyPolyline(rounded, Math.max(0.6, r * 0.08))),
      holes: n.holes?.map((h) => {
        const ring = roundPolylineCorners(
          h.map((p) => ({ x: p.x, y: p.y })),
          r,
          true,
        );
        return toPathPoints(simplifyPolyline(ring, Math.max(0.6, r * 0.08)));
      }),
    },
    false,
  );
  return true;
}
