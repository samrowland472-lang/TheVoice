// The step from motion graphics to 3D.
//
// Everything so far has been 2D by construction: a keyframe holds x and y,
// rotation is a single number, and the renderer draws straight to a canvas
// in screen coordinates. That model cannot express depth no matter how good
// the easing is.
//
// This module adds the missing dimension as *maths*, not as a rendering
// library. A point gains z, rotation gains three axes, and a camera turns
// world coordinates into screen coordinates through a perspective
// projection. The existing 2D canvas draws the result, so depth, parallax,
// dollying and orbiting all work today with no dependencies — and when the
// renderer is later swapped for WebGL, it is a renderer swap against a model
// that is already three-dimensional, not a rewrite.
//
// Conventions, fixed here so nothing downstream has to guess: x runs right,
// y runs DOWN (matching the screen and the existing 2D shapes), and z runs
// away from the viewer. Angles are degrees, because that is what a person
// types into a properties panel.

const DEG = Math.PI / 180;

// The world is 100 units across and 100 tall, matching the 0-100 coordinates
// keyframes already use, with the frame centred on (50, 50).
export const WORLD_SPAN = 100;

/**
 * How far back a camera must sit for the 100-unit world to exactly fill the
 * frame.
 *
 * Derived rather than guessed: the projection scales by focal/distance where
 * focal = (height/2) / tan(fov/2). For the world's edge at 50 units to land
 * on the frame edge at height/2, focal/distance must equal height/100, which
 * reduces to 50 / tan(fov/2) — independent of the pixel size of the canvas,
 * which is why a scene looks the same whatever it is exported at.
 */
export function framingDistance(fov) {
  return (WORLD_SPAN / 2) / Math.tan((fov / 2) * DEG);
}

export function createCamera(fov = 55) {
  return {
    x: 50, y: 50, z: -framingDistance(fov),  // behind the world, looking along +z
    rotX: 0, rotY: 0, rotZ: 0,
    fov,                                      // vertical field of view, degrees
    near: 0.5,
  };
}

/** Rotate a point about the origin, in Z→Y→X order. */
export function rotatePoint(p, rotX, rotY, rotZ) {
  let { x, y, z } = p;

  if (rotZ) {
    const c = Math.cos(rotZ * DEG), s = Math.sin(rotZ * DEG);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  if (rotY) {
    const c = Math.cos(rotY * DEG), s = Math.sin(rotY * DEG);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (rotX) {
    const c = Math.cos(rotX * DEG), s = Math.sin(rotX * DEG);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  return { x, y, z };
}

/**
 * World space to camera space.
 *
 * Translate so the camera sits at the origin, then apply the camera's
 * rotation inverted — turning the camera right must move the world left.
 */
export function toCameraSpace(point, camera) {
  const rel = { x: point.x - camera.x, y: point.y - camera.y, z: point.z - camera.z };
  return rotatePoint(rel, -camera.rotX, -camera.rotY, -camera.rotZ);
}

/**
 * Camera space to the screen.
 *
 * `visible` is false for anything at or behind the near plane. Projecting
 * those anyway is the classic 3D bug: dividing by a negative z flips the
 * point through the origin, so an object behind the camera appears upside
 * down in front of it.
 */
export function project(point, camera, width, height) {
  const focal = (height / 2) / Math.tan((camera.fov / 2) * DEG);
  if (point.z <= camera.near) {
    return { x: 0, y: 0, scale: 0, depth: point.z, visible: false };
  }
  const scale = focal / point.z;
  return {
    x: width / 2 + point.x * scale,
    y: height / 2 + point.y * scale,
    scale,
    depth: point.z,
    visible: true,
  };
}

/** World point straight to the screen, in the units the renderer wants. */
export function projectPoint(point, camera, width, height) {
  return project(toCameraSpace(point, camera), camera, width, height);
}

/**
 * Order shapes far-to-near.
 *
 * With no depth buffer, the only way a 2D canvas can render depth correctly
 * is to draw the furthest thing first — the painter's algorithm. Sorting is
 * by camera-space z rather than world z, since what counts is distance from
 * the viewer, not position in the world.
 */
export function depthSort(items, camera) {
  return items
    .map((item, i) => ({
      item,
      i,
      depth: toCameraSpace({ x: item.x, y: item.y, z: item.z || 0 }, camera).z,
    }))
    // The index tiebreak keeps shapes at identical depth in their authored
    // order, so a scene does not flicker as two coplanar shapes swap places
    // between frames.
    .sort((a, b) => (b.depth - a.depth) || (a.i - b.i))
    .map((entry) => entry.item);
}

/**
 * Orbit the camera around a target.
 *
 * The pitch is clamped just short of vertical: at exactly ±90° the camera's
 * up vector becomes parallel to the axis it turns about and the view rolls
 * unpredictably — gimbal lock, which reads to a user as the scene suddenly
 * spinning on its own.
 */
export function orbit(camera, target, deltaYaw, deltaPitch) {
  const dx = camera.x - target.x;
  const dy = camera.y - target.y;
  const dz = camera.z - target.z;
  const radius = Math.hypot(dx, dy, dz) || 1;

  const yaw = Math.atan2(dx, dz) / DEG + deltaYaw;
  const currentPitch = Math.asin(Math.min(1, Math.max(-1, -dy / radius))) / DEG;
  const pitch = Math.min(89, Math.max(-89, currentPitch + deltaPitch));

  const cp = Math.cos(pitch * DEG);

  // The angles are derived, not guessed. toCameraSpace un-rotates by Y and
  // then X, so for the target to land on the view axis the yaw must be
  // turned to face back along the offset (hence +180) and the pitch must be
  // inverted. Getting either sign wrong puts the subject behind the camera,
  // where it vanishes rather than appearing wrong — which is why this is
  // pinned by a test that projects the target and checks it lands dead
  // centre.
  return {
    ...camera,
    x: target.x + radius * cp * Math.sin(yaw * DEG),
    y: target.y - radius * Math.sin(pitch * DEG),
    z: target.z + radius * cp * Math.cos(yaw * DEG),
    rotY: yaw + 180,
    rotX: -pitch,
    rotZ: 0,
  };
}

/** Move the camera along its own view direction. */
export function dolly(camera, distance) {
  const forward = rotatePoint({ x: 0, y: 0, z: 1 }, camera.rotX, camera.rotY, camera.rotZ);
  return {
    ...camera,
    x: camera.x + forward.x * distance,
    y: camera.y + forward.y * distance,
    z: camera.z + forward.z * distance,
  };
}

/** How far a camera sits from a point, for framing and for depth cueing. */
export function distanceTo(camera, point) {
  return Math.hypot(camera.x - point.x, camera.y - point.y, camera.z - (point.z || 0));
}

export const CAMERA_PRESETS = {
  front: { rotX: 0, rotY: 0, rotZ: 0 },
  threeQuarter: { rotX: -12, rotY: 28, rotZ: 0 },
  top: { rotX: -70, rotY: 0, rotZ: 0 },
  low: { rotX: 22, rotY: -18, rotZ: 0 },
};

// --- Animating the camera -----------------------------------------------
//
// A fixed viewpoint is what makes 3D read as "flat shapes at angles". The
// camera moving is what makes it read as space, so the camera gets
// keyframes of its own.

/** Fold an angle into -180..180 without changing where it points. */
export function normalizeAngle(deg) {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

/**
 * Interpolate two angles the short way round.
 *
 * Lerping 170° to -170° numerically sweeps 340° backwards through zero,
 * when those two angles are 20° apart. On a camera that is not a subtle
 * artefact: the view whips most of the way around the scene and back for
 * what should be a small correction.
 */
export function lerpAngle(a, b, t) {
  const delta = normalizeAngle(normalizeAngle(b) - normalizeAngle(a));
  return normalizeAngle(a) + delta * t;
}

/**
 * The camera at a moment in time.
 *
 * `keyframes` may be empty or absent, in which case the static camera is
 * used unchanged — so adding this costs nothing to a scene that does not
 * move its camera.
 */
export function sampleCamera(keyframes, time, fallback) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) return fallback;
  if (keyframes.length === 1) return { ...fallback, ...keyframes[0] };

  const sorted = keyframes;
  if (time <= sorted[0].time) return { ...fallback, ...sorted[0] };
  const last = sorted[sorted.length - 1];
  if (time >= last.time) return { ...fallback, ...last };

  let i = 0;
  while (i < sorted.length - 1 && sorted[i + 1].time <= time) i++;
  const a = sorted[i];
  const b = sorted[i + 1];
  const span = b.time - a.time;
  const raw = span > 0 ? (time - a.time) / span : 0;
  const t = typeof a.easeFn === 'function' ? a.easeFn(raw) : raw;

  const num = (key, fb) => {
    const av = a[key] === undefined ? fb : a[key];
    const bv = b[key] === undefined ? fb : b[key];
    return av + (bv - av) * t;
  };
  const ang = (key) => lerpAngle(
    a[key] === undefined ? (fallback[key] || 0) : a[key],
    b[key] === undefined ? (fallback[key] || 0) : b[key],
    t,
  );

  return {
    ...fallback,
    x: num('x', fallback.x),
    y: num('y', fallback.y),
    z: num('z', fallback.z),
    rotX: ang('rotX'),
    rotY: ang('rotY'),
    rotZ: ang('rotZ'),
    fov: num('fov', fallback.fov),
  };
}

/** Insert or replace a camera keyframe, keeping the list time-ordered. */
export function setCameraKeyframe(keyframes, time, camera, ease = 'ease') {
  const list = Array.isArray(keyframes) ? keyframes : [];
  const existing = list.find((k) => Math.abs(k.time - time) < 0.001);
  const values = {
    time,
    x: camera.x, y: camera.y, z: camera.z,
    rotX: camera.rotX, rotY: camera.rotY, rotZ: camera.rotZ,
    fov: camera.fov,
    ease,
  };
  if (existing) {
    Object.assign(existing, values);
    return list;
  }
  list.push(values);
  list.sort((a, b) => a.time - b.time);
  return list;
}

export function removeCameraKeyframe(keyframes, time) {
  if (!Array.isArray(keyframes)) return [];
  const i = keyframes.findIndex((k) => Math.abs(k.time - time) < 0.001);
  if (i === -1) return keyframes;
  keyframes.splice(i, 1);
  return keyframes;
}
