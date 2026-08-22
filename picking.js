// Clicking on the thing you want to move.
//
// Until now the only way to select an object was to find its row in a list,
// and the only way to move one was to drag a slider. That is a properties
// panel, not a viewport. Every 3D tool worth using lets you point at the
// thing on screen and move it, and the reason is not convenience: it is
// that a slider makes you translate between the picture and a number,
// every single time.
//
// Two problems to solve, and they are the whole of this file. Which object
// is under the cursor, given a projection that has already thrown depth
// away — and how far a drag across flat screen pixels should move an object
// that sits at some depth in front of a camera that may be pointing
// anywhere.

import { projectPoint, toCameraSpace, rotatePoint } from './camera3d.js';
import { unrotatePoint } from './scenegraph.js';
import { meshFor } from './mesh3d.js';

/**
 * How big a shape appears on screen, in pixels.
 *
 * Meshes draw at 18 world units per unit of scale — the constant the
 * renderer uses to match a billboard's size at z=0 — and the perspective
 * divide turns that into pixels. A 2D scene has no perspective, so its
 * size comes straight from the canvas.
 */
export function screenRadius(shape, p, camera, width, height) {
  const base = 18 * Math.abs(p.scale === undefined ? 1 : p.scale);
  if (!camera) {
    // The flat path draws billboards at 0.18 of the frame.
    return Math.max(6, (base / 100) * Math.min(width, height) * 0.5);
  }
  const cam = toCameraSpace({ x: p.x, y: p.y, z: p.z || 0 }, camera);
  if (cam.z <= camera.near) return 0;
  const focal = (height / 2) / Math.tan((camera.fov / 2) * Math.PI / 180);
  return Math.max(4, (base / 2) * (focal / cam.z));
}

/**
 * The object under a point on screen.
 *
 * Front-most wins, which is the only answer that is never surprising: if
 * two things overlap, you meant the one you can see. Depth comes from the
 * camera-space z already computed for the projection, so this agrees with
 * what was actually painted rather than with a second, subtly different
 * ordering.
 *
 * `entries` are resolveFrame's, so picking sees exactly the transforms the
 * renderer drew — including composed parents.
 */
export function pickAt(entries, camera, width, height, x, y) {
  let best = null;
  for (const entry of entries) {
    const p = entry.p;
    if (!p || (p.opacity !== undefined && p.opacity <= 0.02)) continue;
    const world = { x: p.x, y: p.y, z: p.z || 0 };
    let sx;
    let sy;
    let depth = 0;
    if (camera) {
      const proj = projectPoint(world, camera, width, height);
      if (!proj.visible) continue;
      sx = proj.x; sy = proj.y;
      depth = toCameraSpace(world, camera).z;
    } else {
      sx = (world.x / 100) * width;
      sy = (world.y / 100) * height;
      // Without a camera the paint order is the list order, so a later
      // shape is in front. Negating the index reuses the same comparison.
      depth = -entries.indexOf(entry);
    }
    const r = screenRadius(entry.shape, p, camera, width, height);
    if (r <= 0) continue;
    const dist = Math.hypot(x - sx, y - sy);
    if (dist > r) continue;
    if (!best || depth < best.depth) best = { shape: entry.shape, depth, dist, x: sx, y: sy, r };
  }
  return best;
}

/**
 * The world-space movement a drag across the screen should produce.
 *
 * The object stays at its own depth and slides in the plane facing the
 * camera, which is what "drag it over there" means and what every tool
 * does. Two pieces:
 *
 *   - Pixels to world units at that depth. The perspective divide scaled
 *     the object down by focal/z on the way out, so undoing it means
 *     multiplying by z/focal. Using a fixed factor instead is the bug that
 *     makes distant objects crawl and near ones fly.
 *
 *   - Camera space back to world space. The screen's right and up
 *     directions are the camera's own axes, so the flat delta is turned by
 *     the camera's rotation before it is applied.
 */
export function dragToWorld(dx, dy, depthPoint, camera, width, height) {
  if (!camera) {
    // The flat path maps the canvas onto 0..100 per axis independently.
    return { x: (dx / width) * 100, y: (dy / height) * 100, z: 0 };
  }
  const cam = toCameraSpace(depthPoint, camera);
  const z = Math.max(camera.near + 0.001, cam.z);
  const focal = (height / 2) / Math.tan((camera.fov / 2) * Math.PI / 180);
  const k = z / focal;

  // Back from camera space to the world — which must be the exact inverse
  // of toCameraSpace, and that function is not rotatePoint with the signs
  // flipped. It applies -Z, then -Y, then -X, so undoing it means +X, then
  // +Y, then +Z, in that order. Using rotatePoint here instead is off by
  // over a hundred pixels once two camera axes are in play: the object
  // slides away from the pointer as you drag.
  return unrotatePoint({ x: dx * k, y: dy * k, z: 0 },
                       -camera.rotX, -camera.rotY, -camera.rotZ);
}

/**
 * The outline to draw around the selection.
 *
 * A mesh gets its real silhouette — the convex hull of its projected
 * vertices — because a circle around a long thin object points at
 * something that is mostly not there. Anything else gets a box, which is
 * honest about being an approximation.
 */
export function selectionOutline(shape, p, camera, width, height) {
  const mesh = camera ? meshFor(shape.type) : null;
  if (mesh && mesh.vertices.length) {
    const size = 18 * Math.abs(p.scale === undefined ? 1 : p.scale);
    const pts = [];
    for (const v of mesh.vertices) {
      const r = rotatePoint(v, p.rotX || 0, p.rotY || 0, p.rotation || 0);
      const world = {
        x: p.x + r.x * size, y: p.y + r.y * size, z: (p.z || 0) + r.z * size,
      };
      const proj = projectPoint(world, camera, width, height);
      if (proj.visible) pts.push([proj.x, proj.y]);
    }
    if (pts.length >= 3) return convexHull(pts);
  }
  const r = screenRadius(shape, p, camera, width, height);
  let cx;
  let cy;
  if (camera) {
    const proj = projectPoint({ x: p.x, y: p.y, z: p.z || 0 }, camera, width, height);
    if (!proj.visible) return [];
    cx = proj.x; cy = proj.y;
  } else {
    cx = (p.x / 100) * width; cy = (p.y / 100) * height;
  }
  return [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]];
}

/**
 * Andrew's monotone chain.
 *
 * Chosen over gift-wrapping because its cost does not depend on how many
 * points end up on the hull: a 40,000-vertex imported model with a
 * near-circular silhouette would make gift-wrapping quadratic, once per
 * frame, while the selection is live.
 */
export function convexHull(points) {
  if (points.length < 3) return points.slice();
  const pts = points.slice().sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  // Every point identical, or all collinear: the hull collapses and the
  // caller would draw nothing at all.
  return hull.length >= 3 ? hull : pts;
}
