// The transform gizmo.
//
// Dragging an object around the camera plane is the easy half. The other
// half is turning it and sizing it, and doing that with sliders is the same
// translate-between-picture-and-number tax that free dragging removed.
//
// Three modes, the same three every 3D tool has: move, rotate, scale. Move
// and rotate get axis handles, because "turn it a bit" almost always means
// about one axis and free rotation makes a mess you cannot undo by eye.
//
// Scale is uniform, and that is a real limitation stated rather than
// hidden: a shape in this renderer carries one scale, not three, so an
// axis-constrained scale handle would be a control that cannot do what it
// looks like it does. One handle that grows and shrinks the whole object is
// honest about what the data model holds.

import { projectPoint, toCameraSpace, rotatePoint } from './camera3d.js';
import { unrotatePoint } from './scenegraph.js';

export const GIZMO_MODES = ['move', 'rotate', 'scale'];

// Red, green, blue for X, Y, Z — the convention every tool shares, and the
// one reason not to pick prettier colours.
export const AXES = [
  { id: 'x', vec: { x: 1, y: 0, z: 0 }, color: '#e4483d', label: 'X' },
  { id: 'y', vec: { x: 0, y: 1, z: 0 }, color: '#3fbf72', label: 'Y' },
  { id: 'z', vec: { x: 0, y: 0, z: 1 }, color: '#3fc6ff', label: 'Z' },
];

/** How big the gizmo is on screen, in pixels, whatever the depth. */
export const GIZMO_PIXELS = 64;

/** Click tolerance around a handle, in pixels. */
export const GIZMO_GRAB = 9;

/**
 * How far out along an arm the grabbable part begins, as a fraction.
 *
 * Arms radiate from the object's centre, so an arm grabbable along its
 * whole length puts three handles on top of the one place you click to
 * drag the object freely — and free dragging silently becomes impossible.
 * Leaving the inner quarter alone keeps the middle of the object the
 * object's.
 */
export const GIZMO_INNER = 0.28;

/**
 * The smallest gap, in pixels, between the object's centre and the start
 * of a grabbable arm.
 *
 * A fraction alone is not enough. An axis pointing nearly at the camera
 * projects to a short arm, and a quarter of a short arm is a few pixels —
 * so the arm's grabbable end lands right on the object's middle and steals
 * the free drag anyway. The gap has to be measured in pixels, because
 * pixels are what the pointer works in.
 */
export const GIZMO_INNER_PX = 15;

/** An arm shorter than this cannot be aimed at, so it is not offered. */
export const GIZMO_MIN_ARM = 26;

/**
 * World units that project to `pixels` at a point's depth.
 *
 * The gizmo has to be a constant size on screen — a handle that shrinks
 * into nothing as you push an object back is unusable exactly when you
 * need it. This is the same z/focal factor the drag maths uses, which is
 * why the two stay in step.
 */
export function worldPerPixel(point, camera, height) {
  if (!camera) return 100 / height;
  const cam = toCameraSpace(point, camera);
  const z = Math.max(camera.near + 0.001, cam.z);
  const focal = (height / 2) / Math.tan((camera.fov / 2) * Math.PI / 180);
  return z / focal;
}

const project2 = (p, camera, w, h) => {
  if (!camera) return { x: (p.x / 100) * w, y: (p.y / 100) * h, visible: true };
  return projectPoint(p, camera, w, h);
};

/**
 * The gizmo's handles, in screen space, ready to draw and to hit-test.
 *
 * A 2D scene has no depth, so only the axes that mean anything there are
 * produced: offering a Z handle that cannot move anything is worse than
 * offering nothing.
 */
export function gizmoHandles(mode, world, camera, width, height) {
  const centre = { x: world.x, y: world.y, z: world.z || 0 };
  const c = project2(centre, camera, width, height);
  if (!c.visible) return [];
  const unit = worldPerPixel(centre, camera, height);
  const reach = GIZMO_PIXELS * unit;
  const axes = camera ? AXES : AXES.filter((a) => a.id !== 'z');

  if (mode === 'scale') {
    // One handle, offset up-right so it never sits under the pointer that
    // just selected the object. Only its outer part is grabbable, for the
    // same reason the arms leave their inner ends alone.
    const dx = GIZMO_PIXELS * 0.75;
    const dy = -GIZMO_PIXELS * 0.75;
    const inner = Math.max(GIZMO_INNER, GIZMO_INNER_PX / Math.hypot(dx, dy));
    return [{
      kind: 'scale', axis: null, color: '#f5b301',
      centre: [c.x, c.y],
      points: [[c.x + dx * inner, c.y + dy * inner], [c.x + dx, c.y + dy]],
    }];
  }

  const out = [];
  for (const axis of axes) {
    if (mode === 'rotate') {
      const ring = [];
      // A circle in the plane perpendicular to this axis. Two vectors
      // spanning that plane come from any direction not parallel to it.
      const [u, v] = basisFor(axis.vec);
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const p = {
          x: centre.x + (u.x * Math.cos(a) + v.x * Math.sin(a)) * reach,
          y: centre.y + (u.y * Math.cos(a) + v.y * Math.sin(a)) * reach,
          z: centre.z + (u.z * Math.cos(a) + v.z * Math.sin(a)) * reach,
        };
        const s = project2(p, camera, width, height);
        if (s.visible) ring.push([s.x, s.y]);
      }
      if (ring.length > 8) {
        out.push({ kind: 'rotate', axis: axis.id, color: axis.color,
                   centre: [c.x, c.y], points: ring, closed: true });
      }
      continue;
    }

    const tipWorld = {
      x: centre.x + axis.vec.x * reach,
      y: centre.y + axis.vec.y * reach,
      z: centre.z + axis.vec.z * reach,
    };
    const t = project2(tipWorld, camera, width, height);
    if (!t.visible) continue;
    // An axis pointing almost straight at the camera projects to a stub
    // you cannot aim at, and dragging it would divide by nearly zero.
    const armLength = Math.hypot(t.x - c.x, t.y - c.y);
    if (armLength < GIZMO_MIN_ARM) continue;
    const inner = Math.max(GIZMO_INNER, GIZMO_INNER_PX / armLength);
    const from = [c.x + (t.x - c.x) * inner, c.y + (t.y - c.y) * inner];
    out.push({ kind: 'move', axis: axis.id, color: axis.color,
               centre: [c.x, c.y], points: [from, [t.x, t.y]] });
  }
  return out;
}

/** Two unit vectors spanning the plane perpendicular to `n`. */
function basisFor(n) {
  // Cross with whichever world axis is least parallel to n, so the result
  // is never degenerate.
  const alt = Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const u = normalise(cross(n, alt));
  return [u, normalise(cross(n, u))];
}

const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

function normalise(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/** Distance from a point to a polyline, in screen space. */
export function distanceToPath(points, x, y, closed = false) {
  let best = Infinity;
  const n = points.length;
  if (!n) return best;
  if (n === 1) return Math.hypot(x - points[0][0], y - points[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % n];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), y - (ay + dy * t)));
  }
  return best;
}

/**
 * The handle under the cursor, if any.
 *
 * Nearest wins rather than first, so where a ring crosses another ring the
 * one you are actually pointing at is the one that responds.
 */
export function pickHandle(handles, x, y, tolerance = GIZMO_GRAB) {
  let best = null;
  for (const handle of handles) {
    const d = distanceToPath(handle.points, x, y, !!handle.closed);
    if (d > tolerance) continue;
    if (!best || d < best.distance) best = { handle, distance: d };
  }
  return best ? best.handle : null;
}

/**
 * The world-space ray through a point on screen.
 *
 * Undoes the projection: a screen point is a direction in camera space,
 * which the inverse of the camera's rotation turns back into the world.
 * That inverse is not the rotation with its signs flipped — toCameraSpace
 * applies -Z, then -Y, then -X, so undoing it means +X, +Y, +Z in that
 * order.
 */
export function screenRay(sx, sy, camera, width, height) {
  const focal = (height / 2) / Math.tan((camera.fov / 2) * Math.PI / 180);
  const dir = unrotatePoint(
    { x: sx - width / 2, y: sy - height / 2, z: focal },
    -camera.rotX, -camera.rotY, -camera.rotZ,
  );
  const len = Math.hypot(dir.x, dir.y, dir.z) || 1;
  return {
    origin: { x: camera.x, y: camera.y, z: camera.z },
    dir: { x: dir.x / len, y: dir.y / len, z: dir.z / len },
  };
}

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/**
 * How far along its axis a handle has been dragged, in world units.
 *
 * The obvious construction — project the screen delta onto the axis's
 * screen direction — is only right for a drag small enough that
 * perspective stays linear. Along an axis with any depth to it the object
 * changes distance as it travels, so its screen speed changes with it, and
 * a fifty-pixel drag lands the object twenty pixels from the pointer.
 *
 * So do it exactly instead: the pointer is a ray through the world, the
 * handle is a line, and the answer is the point on the line closest to
 * that ray. That is what makes a handle track the cursor over a long drag
 * rather than only near where the drag began.
 *
 * Returns null when the axis lies along the view direction — the ray and
 * the line are then parallel and the closest point is anywhere at all.
 */
export function axisParameter(axisVec, centre, camera, width, height, sx, sy) {
  if (!camera) {
    // No perspective: the screen is the world, scaled per axis.
    const wx = (sx / width) * 100;
    const wy = (sy / height) * 100;
    const len2 = axisVec.x * axisVec.x + axisVec.y * axisVec.y;
    if (len2 < 1e-9) return null;
    return ((wx - centre.x) * axisVec.x + (wy - centre.y) * axisVec.y) / len2;
  }

  const ray = screenRay(sx, sy, camera, width, height);
  const p = { x: centre.x, y: centre.y, z: centre.z || 0 };
  const w0 = { x: p.x - ray.origin.x, y: p.y - ray.origin.y, z: p.z - ray.origin.z };
  const a = dot(axisVec, axisVec);
  const b = dot(axisVec, ray.dir);
  const c = 1;                       // ray.dir is a unit vector
  const d = dot(axisVec, w0);
  const e = dot(ray.dir, w0);
  const denom = a * c - b * b;
  // Parallel to the view: every point on the axis is equally close.
  if (Math.abs(denom) < 1e-7) return null;
  return (b * e - c * d) / denom;
}

/**
 * How far along a world axis a screen drag should move something.
 *
 * Kept as a delta between two pointer positions so a caller can apply it
 * against the transform the drag started from.
 */
export function axisMoveAmount(axisVec, centre, camera, width, height, from, to) {
  const t0 = axisParameter(axisVec, centre, camera, width, height, from.x, from.y);
  const t1 = axisParameter(axisVec, centre, camera, width, height, to.x, to.y);
  if (t0 === null || t1 === null) return 0;
  const amount = t1 - t0;
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * How far to turn an object, in degrees, for a drag around its centre.
 *
 * The angle the pointer sweeps around the gizmo's centre is the angle the
 * object turns. The subtlety is the sign, and it is not something to
 * reason out: it depends on which way the axis faces the camera, on the
 * handedness of each rotation in rotatePoint — the Y rotation there is
 * left-handed relative to the other two — and on the screen's y running
 * downward. Three conventions, any one of which flips it.
 *
 * So measure it instead. Turn a probe point on the ring by one degree the
 * way the renderer actually would, project it, and see which way it went.
 * Whatever the conventions are, the object then turns with the pointer
 * rather than against it — which is the thing that feels broken long
 * before anyone works out why.
 */
export function rotationForDrag(axisId, centre, camera, width, height, from, to) {
  const c = project2(centre, camera, width, height);
  if (!c.visible) return 0;
  const a0 = Math.atan2(from.y - c.y, from.x - c.x);
  const a1 = Math.atan2(to.y - c.y, to.x - c.x);
  let delta = a1 - a0;
  // Shortest way round: a drag across the ±180 seam is a small turn, not a
  // full revolution backwards.
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  const sign = rotationSign(axisId, centre, camera, width, height);
  if (sign === 0) return 0;
  return sign * delta * (180 / Math.PI);
}

/**
 * Which way one positive degree about an axis reads on screen: +1 if it
 * increases the screen angle, -1 if it decreases it, 0 if the ring is so
 * edge-on that the question has no answer.
 */
export function rotationSign(axisId, centre, camera, width, height) {
  const axis = AXES.find((a) => a.id === axisId);
  if (!axis) return 0;
  const c = project2(centre, camera, width, height);
  if (!c.visible) return 0;
  const reach = GIZMO_PIXELS * worldPerPixel(
    { x: centre.x, y: centre.y, z: centre.z || 0 }, camera, height);

  // Two probes a quarter turn apart, so a ring seen edge-on — where one
  // probe barely moves — still gets an answer from the other.
  const [u, v] = basisFor(axis.vec);
  let best = 0;
  let bestTravel = 0;
  for (const base of [u, v]) {
    const off = { x: base.x * reach, y: base.y * reach, z: base.z * reach };
    const turned = turnAbout(off, axisId, 1);
    const p0 = project2({ x: centre.x + off.x, y: centre.y + off.y,
                          z: (centre.z || 0) + off.z }, camera, width, height);
    const p1 = project2({ x: centre.x + turned.x, y: centre.y + turned.y,
                          z: (centre.z || 0) + turned.z }, camera, width, height);
    if (!p0.visible || !p1.visible) continue;
    const r = Math.hypot(p0.x - c.x, p0.y - c.y);
    if (r < 4) continue;
    let moved = Math.atan2(p1.y - c.y, p1.x - c.x) - Math.atan2(p0.y - c.y, p0.x - c.x);
    while (moved > Math.PI) moved -= Math.PI * 2;
    while (moved < -Math.PI) moved += Math.PI * 2;
    // Weight by how far the probe actually travelled on screen: the probe
    // nearer the ring's visible edge is the one that answers reliably.
    const travel = Math.abs(moved) * r;
    if (travel > bestTravel) { bestTravel = travel; best = moved >= 0 ? 1 : -1; }
  }
  return best;
}

/** Turn a local offset about one axis, exactly as the renderer would. */
export function turnAbout(offset, axisId, degrees) {
  return rotatePoint(offset,
    axisId === 'x' ? degrees : 0,
    axisId === 'y' ? degrees : 0,
    axisId === 'z' ? degrees : 0);
}

/**
 * The factor a scale drag asks for.
 *
 * Distance from the centre, relative to where the drag started. Clamped so
 * a drag that passes through the centre cannot collapse an object to
 * nothing or invert it — a negative scale turns geometry inside out, and
 * there is no way to see that you have done it.
 */
export function scaleForDrag(centre2d, from, to, { min = 0.05, max = 20 } = {}) {
  const d0 = Math.hypot(from.x - centre2d[0], from.y - centre2d[1]);
  const d1 = Math.hypot(to.x - centre2d[0], to.y - centre2d[1]);
  if (d0 < 4) return 1;   // started on the centre: no meaningful ratio
  return Math.max(min, Math.min(max, d1 / d0));
}

/** Which channel an axis writes to, given how this renderer stores angles. */
export const AXIS_ROTATION_CHANNEL = { x: 'rotX', y: 'rotY', z: 'rotation' };
