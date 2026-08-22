// Object hierarchy.
//
// A scene used to be a flat list: every shape carried its own absolute
// position and nothing knew about anything else. That is a slideshow, not
// a scene. Parenting is the one feature that turns the list into a rig — a
// wheel parented to a car moves with the car, an arm to a torso, a whole
// group to one controller — and it is the prerequisite for an outliner, for
// imported models that arrive as a tree, and for animating anything with
// more than one moving part.
//
// The model is Blender's. A child stores a transform in its parent's frame,
// plus a bind offset captured when the parent was assigned so that
// parenting an object never teleports it. Blender calls that offset the
// parent inverse matrix; the same idea here, expressed as the same
// translate/rotate/scale channels everything else in this app uses.

import { rotatePoint } from './camera3d.js';

/** Depth limit. A hierarchy this deep is a mistake, not a rig. */
export const MAX_DEPTH = 12;

export const IDENTITY = {
  x: 0, y: 0, z: 0, scale: 1, rotation: 0, rotX: 0, rotY: 0, opacity: 1,
};

/**
 * Undo a rotation.
 *
 * rotatePoint turns about Z, then Y, then X. Undoing that means the exact
 * reverse: X first, then Y, then Z, each negated. Negating all three and
 * leaving the order alone — which is what the camera does, because its
 * rotation is *defined* in that order — is not the inverse and drifts as
 * soon as two axes are in play at once.
 */
export function unrotatePoint(p, rotX, rotY, rotZ) {
  let { x, y, z } = p;
  z = z || 0;
  if (rotX) {
    const a = -rotX * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (rotY) {
    const a = -rotY * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (rotZ) {
    const a = -rotZ * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return { x, y, z };
}

/**
 * Place a child transform inside its parent's frame.
 *
 * The child's offset is scaled by the parent's scale and turned by the
 * parent's rotation, then added to the parent's position — the ordinary
 * translate-rotate-scale composition. Rotations compose by adding channels
 * rather than by multiplying matrices: that is not strictly correct for
 * arbitrary orientations, but it is what channel-based parenting gives you
 * in every animation tool, and it keeps a rotation curve readable and
 * editable per axis, which matters more here than exactness under
 * simultaneous three-axis spin.
 */
export function composeTransform(parent, local) {
  const s = parent.scale === undefined ? 1 : parent.scale;
  const off = rotatePoint(
    { x: (local.x || 0) * s, y: (local.y || 0) * s, z: (local.z || 0) * s },
    parent.rotX || 0, parent.rotY || 0, parent.rotation || 0,
  );
  return {
    x: (parent.x || 0) + off.x,
    y: (parent.y || 0) + off.y,
    z: (parent.z || 0) + off.z,
    scale: s * (local.scale === undefined ? 1 : local.scale),
    rotation: (parent.rotation || 0) + (local.rotation || 0),
    rotX: (parent.rotX || 0) + (local.rotX || 0),
    rotY: (parent.rotY || 0) + (local.rotY || 0),
    opacity: (parent.opacity === undefined ? 1 : parent.opacity)
           * (local.opacity === undefined ? 1 : local.opacity),
  };
}

/**
 * The exact inverse of composeTransform: given a parent and a world
 * transform, the local transform that reproduces it.
 *
 * This is what makes "keep transform on parent" possible — the thing that
 * stops an object jumping across the frame the moment you parent it.
 */
export function relativeTransform(parent, world) {
  const ps = parent.scale === undefined || parent.scale === 0 ? 1 : parent.scale;
  const d = {
    x: (world.x || 0) - (parent.x || 0),
    y: (world.y || 0) - (parent.y || 0),
    z: (world.z || 0) - (parent.z || 0),
  };
  const un = unrotatePoint(d, parent.rotX || 0, parent.rotY || 0, parent.rotation || 0);
  return {
    x: un.x / ps,
    y: un.y / ps,
    z: un.z / ps,
    scale: (world.scale === undefined ? 1 : world.scale) / ps,
    rotation: (world.rotation || 0) - (parent.rotation || 0),
    rotX: (world.rotX || 0) - (parent.rotX || 0),
    rotY: (world.rotY || 0) - (parent.rotY || 0),
    opacity: (world.opacity === undefined ? 1 : world.opacity)
           / (parent.opacity === undefined || parent.opacity === 0 ? 1 : parent.opacity),
  };
}

/**
 * The parent transform P for which composeTransform(P, local) === world.
 *
 * relativeTransform solves the child slot; this solves the other one. It is
 * what lets a bind offset be expressed in the parent's frame — which is
 * where it has to live. Expressed in the child's frame instead, the offset
 * turns with the child, so a parented object that spins would swing around
 * its own bind point rather than spinning on the spot.
 */
export function parentSlot(local, world) {
  const ls = local.scale === undefined || local.scale === 0 ? 1 : local.scale;
  const scale = (world.scale === undefined ? 1 : world.scale) / ls;
  const rotation = (world.rotation || 0) - (local.rotation || 0);
  const rotX = (world.rotX || 0) - (local.rotX || 0);
  const rotY = (world.rotY || 0) - (local.rotY || 0);
  const off = rotatePoint(
    { x: (local.x || 0) * scale, y: (local.y || 0) * scale, z: (local.z || 0) * scale },
    rotX, rotY, rotation,
  );
  const lo = local.opacity === undefined || local.opacity === 0 ? 1 : local.opacity;
  return {
    x: (world.x || 0) - off.x,
    y: (world.y || 0) - off.y,
    z: (world.z || 0) - off.z,
    scale, rotation, rotX, rotY,
    opacity: (world.opacity === undefined ? 1 : world.opacity) / lo,
  };
}

const byId = (scene) => {
  const map = new Map();
  for (const s of (scene && scene.shapes) || []) map.set(s.id, s);
  return map;
};

/** The shape a shape hangs from, or null. */
export function parentOf(scene, id) {
  const map = byId(scene);
  const shape = map.get(id);
  if (!shape || !shape.parent) return null;
  return map.get(shape.parent) || null;
}

/** Direct children, in scene order. */
export function childrenOf(scene, id) {
  return ((scene && scene.shapes) || []).filter((s) => (s.parent || null) === (id || null));
}

/** Root-first chain of ancestors above a shape. */
export function ancestorsOf(scene, id) {
  const map = byId(scene);
  const chain = [];
  let cur = map.get(id);
  const seen = new Set();
  while (cur && cur.parent && !seen.has(cur.parent)) {
    seen.add(cur.parent);
    cur = map.get(cur.parent);
    if (!cur) break;
    chain.unshift(cur);
    if (chain.length > MAX_DEPTH) break;
  }
  return chain;
}

/**
 * Would parenting `childId` to `parentId` make a loop?
 *
 * A cycle in a scene graph is not a visual glitch — it is an infinite
 * recursion the first time a frame is drawn, so it has to be refused at the
 * point of the edit rather than defended against per frame.
 */
export function wouldCycle(scene, childId, parentId) {
  if (!parentId) return false;
  if (childId === parentId) return true;
  const map = byId(scene);
  let cur = map.get(parentId);
  const seen = new Set();
  while (cur) {
    if (cur.id === childId) return true;
    if (seen.has(cur.id)) return true; // an existing loop is still a loop
    seen.add(cur.id);
    cur = cur.parent ? map.get(cur.parent) : null;
  }
  return false;
}

/** How deep a shape sits. A root is 0. */
export function depthOf(scene, id) {
  return ancestorsOf(scene, id).length;
}

/**
 * The scene flattened for display: parents immediately followed by their
 * children, each tagged with its depth. This is the outliner's row order.
 *
 * Orphans — shapes naming a parent that no longer exists — are listed at
 * the root rather than dropped, because losing an object from the panel is
 * worse than showing it in the wrong place.
 */
export function treeOrder(scene) {
  const shapes = (scene && scene.shapes) || [];
  const ids = new Set(shapes.map((s) => s.id));
  const out = [];
  const seen = new Set();

  const walk = (parentId, depth) => {
    if (depth > MAX_DEPTH) return;
    for (const s of shapes) {
      const p = s.parent && ids.has(s.parent) ? s.parent : null;
      if (p !== parentId || seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ shape: s, depth });
      walk(s.id, depth + 1);
    }
  };
  walk(null, 0);

  // Anything a cycle kept out of the walk still belongs in the panel.
  for (const s of shapes) if (!seen.has(s.id)) out.push({ shape: s, depth: 0 });
  return out;
}

/**
 * Attach a shape to a parent, keeping it exactly where it is.
 *
 * `sample` supplies the two readings the bind offset needs: `world(shape,
 * time)` for where a shape actually appears, and `local(shape, time)` for
 * the shape's own channels. Both must interpolate between keyframes the
 * way playback does — a stepped reading binds against the previous
 * keyframe's value and the object jumps by exactly the distance it had
 * travelled since. Pass null to skip keep-transform entirely.
 *
 * Returns false when the edit was refused, so a caller can say why rather
 * than silently doing nothing.
 */
export function setParent(scene, childId, parentId, sample = null, time = 0) {
  const map = byId(scene);
  const child = map.get(childId);
  if (!child) return false;
  const next = parentId || null;
  if (next && !map.has(next)) return false;
  if (wouldCycle(scene, childId, next)) return false;
  if (next && depthOf(scene, next) + 1 > MAX_DEPTH) return false;

  // Measure before mutating. Sampling the child's world transform after
  // assigning the parent measures the jump instead of preventing it.
  const childWorld = sample ? sample.world(child, time) : null;
  const childLocal = sample ? { ...IDENTITY, ...sample.local(child, time) } : null;
  const parentWorld = sample && next ? sample.world(map.get(next), time) : null;

  if (!next) {
    // Unparenting bakes the world transform back into the shape's own
    // channels, so an object that has been moved by its parent for three
    // seconds stays where it was left.
    if (childWorld) bakeWorld(child, childWorld, childLocal);
    child.parent = null;
    delete child.bind;
    return true;
  }

  child.parent = next;
  delete child.bind;
  if (childWorld && parentWorld) {
    // The child's own keyframes are its local transform now. The bind is
    // the fixed offset, in the parent's frame, that lands that local
    // transform exactly where the shape already was.
    const slot = parentSlot(childLocal, childWorld);
    child.bind = relativeTransform(parentWorld, slot);
  }
  return true;
}

/** Write a world transform into a shape's keyframes as absolute values. */
function bakeWorld(shape, world, local) {
  const dx = (world.x || 0) - (local.x || 0);
  const dy = (world.y || 0) - (local.y || 0);
  const dz = (world.z || 0) - (local.z || 0);
  for (const k of shape.keyframes || []) {
    k.x = (k.x || 0) + dx;
    k.y = (k.y || 0) + dy;
    if (k.z !== undefined || dz) k.z = (k.z || 0) + dz;
  }
}
