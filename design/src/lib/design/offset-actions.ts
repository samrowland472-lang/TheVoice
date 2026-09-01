import { pathNode } from "./node-factory";
import { offsetPolyline, outlineStroke, roundPolylineCorners, simplifyPolyline, toPathPoints } from "./path-offset";
import { useDesign } from "./store";
import type { PathNode, PathPoint } from "./types";
import { isPath } from "./types";

function selectedPath(): PathNode | null {
  const { doc, selection } = useDesign.getState();
  if (!doc || !selection.length) return null;
  const n = doc.nodes.find((x) => x.id === selection[0]);
  return n && isPath(n) ? n : null;
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
  addOutlined(n, outlined.points, holes.length ? holes : undefined);
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
    holes,
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
