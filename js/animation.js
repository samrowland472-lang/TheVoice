// Keyframe animation engine.
//
// A scene is a list of shapes; each shape carries keyframes holding its
// properties at given times. Playback interpolates between the surrounding
// keyframes, so a few authored moments produce continuous motion.
//
// Everything renders to a canvas, which means a scene can be exported
// frame by frame — and can react to an audio track, which is what lets
// voice and animation drive each other.

import { resolveEasing } from './easing.js';
import { isMeshType, renderMesh, shadeColor, registerMesh, hasMesh } from './mesh3d.js';
import { samplePath, pathPolyline } from './path3d.js';
import { createLight, lightDirection, lightTint, sampleLight,
         setLightKeyframe, removeLightKeyframe } from './light3d.js';
import { rotatePoint } from './camera3d.js';
import { createCamera, projectPoint, depthSort, framingDistance,
         sampleCamera, setCameraKeyframe, removeCameraKeyframe } from './camera3d.js';
import { composeTransform, unrotatePoint, MAX_DEPTH } from './scenegraph.js';

export const SHAPE_TYPES = ['circle', 'rect', 'triangle', 'text', 'wave', 'image',
                            'cube', 'sphere', 'pyramid'];

// What a solid falls back to when the scene has no camera: its silhouette.
// A 2D render of a mesh scene should degrade to flat shapes, not vanish.
const MESH_FALLBACK = { cube: 'rect', sphere: 'circle', pyramid: 'triangle' };

// Decoded images, keyed by the shape's `src`.
//
// renderFrame is synchronous — it has to be, because it is called per frame
// from a rAF loop and during frame-by-frame export — but decoding an image
// is not. So decoding happens once at import time and the result is cached
// here; a frame drawn before the decode lands simply skips that shape
// rather than stalling the loop or drawing a blank.
const imageCache = new Map();

export function registerImage(src, img) {
  imageCache.set(src, img);
}

export function hasImage(src) {
  return imageCache.has(src);
}

/** The decoded image behind a shape's src, for renderers that texture it. */
export function getImage(src) {
  return imageCache.get(src) || null;
}

/** Re-decode any images a loaded scene refers to but this session lacks. */
export async function hydrateSceneImages(scene, decode) {
  if (!scene || !Array.isArray(scene.shapes)) return;
  const pending = new Set();
  for (const shape of scene.shapes) {
    if (shape.type === 'image' && shape.src && !imageCache.has(shape.src)) pending.add(shape.src);
  }
  await Promise.all([...pending].map(async (src) => {
    try {
      imageCache.set(src, await decode(src));
    } catch {
      /* a scene with one unreadable image should still open */
    }
  }));
}

let nextId = 1;

export function createShape(type, atTime = 0) {
  return {
    id: `s${nextId++}`,
    type,
    label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${nextId - 1}`,
    text: type === 'text' ? 'THE VOICE' : '',
    // Straight lines by default: turning smoothing on is a deliberate
    // choice, and nothing already authored should change shape.
    smoothPath: false,
    // Extrusion depth for text, in world units. Meaningless without a
    // camera, so 2D scenes carry it inertly.
    extrude: type === 'text' ? 8 : 0,
    // Data URL for an imported image, so a saved scene stays self-contained
    // rather than pointing at a file the recipient does not have.
    src: '',
    // Whether this shape's scale is driven by the audio track's level.
    reactive: false,
    // The shape this one hangs from, by id. Null means it sits at the
    // root, which is where everything starts.
    parent: null,
    easing: 'ease',
    keyframes: [
      // z and the extra rotation axes are absent by default. A scene with no
      // camera renders through the original 2D path untouched; these only
      // come into play once 3D is switched on, so no existing scene shifts.
      { time: atTime, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#3fc6ff' },
    ],
  };
}

export function createScene() {
  return { duration: 5, fps: 30, background: '#0a0d0c', shapes: [] };
}

/** Insert or replace a keyframe at `time`, keeping the list time-ordered. */
export function setKeyframe(shape, time, props) {
  const existing = shape.keyframes.find((k) => Math.abs(k.time - time) < 0.001);
  if (existing) {
    Object.assign(existing, props);
    return existing;
  }
  const base = sampleShape(shape, time);
  // No `ease` here on purpose: a keyframe without one defers to the shape,
  // and only picks up a curve of its own once someone authors one.
  const kf = { ...base, ...props, time };
  shape.keyframes.push(kf);
  shape.keyframes.sort((a, b) => a.time - b.time);
  return kf;
}

export function removeKeyframe(shape, time) {
  if (shape.keyframes.length <= 1) return false; // a shape must keep one
  const i = shape.keyframes.findIndex((k) => Math.abs(k.time - time) < 0.001);
  if (i === -1) return false;
  shape.keyframes.splice(i, 1);
  return true;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/** Shape properties at an arbitrary time, interpolated between keyframes. */
export function sampleShape(shape, time) {
  const kfs = shape.keyframes;
  if (!kfs.length) return { x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#3fc6ff' };
  if (time <= kfs[0].time) return { ...kfs[0] };
  if (time >= kfs[kfs.length - 1].time) return { ...kfs[kfs.length - 1] };

  let i = 0;
  while (i < kfs.length - 1 && kfs[i + 1].time <= time) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const span = b.time - a.time;
  const raw = span > 0 ? (time - a.time) / span : 0;
  // Easing belongs to the segment, and a segment is identified by the
  // keyframe it leaves from — so `a.ease` governs a→b. A shape-wide
  // `easing` is the fallback, which is what old scenes carry.
  const t = resolveEasing(a.ease, shape.easing || 'ease')(raw);

  // A smoothed shape takes its position from a spline through every
  // keyframe rather than the straight line between two. Easing still
  // controls pacing along that route — the two are independent, which is
  // why a beautifully eased move can still look mechanical.
  let pos = null;
  if (shape.smoothPath && kfs.length > 2) {
    pos = samplePath(
      kfs.map((k) => ({ x: k.x, y: k.y, z: k.z || 0 })),
      i, t, typeof shape.pathTension === 'number' ? shape.pathTension : 1,
    );
  }

  return {
    time,
    x: pos ? pos.x : lerp(a.x, b.x, t),
    y: pos ? pos.y : lerp(a.y, b.y, t),
    z: pos ? pos.z : lerp(a.z || 0, b.z || 0, t),
    scale: lerp(a.scale, b.scale, t),
    rotation: lerp(a.rotation, b.rotation, t),
    rotX: lerp(a.rotX || 0, b.rotX || 0, t),
    rotY: lerp(a.rotY || 0, b.rotY || 0, t),
    opacity: lerp(a.opacity, b.opacity, t),
    color: lerpColor(a.color, b.color, t),
  };
}

/** Give a scene a camera, turning on the 3D path. */
export function enable3D(scene, fov = 55) {
  if (!scene.camera) scene.camera = createCamera(fov);
  // The light arrives with the camera: solids need something to be lit by,
  // and a scene owning its light is what makes the light authorable.
  if (!scene.light) scene.light = createLight();
  return scene;
}

export function disable3D(scene) {
  delete scene.camera;
  return scene;
}

export function is3D(scene) {
  return !!(scene && scene.camera);
}

/**
 * Draw one frame. `audioLevel` (0..1) scales any shape marked reactive,
 * which is how a voice track visibly drives the animation.
 */
export function renderFrame(ctx, scene, time, width, height, audioLevel = 0) {
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, width, height);

  // A scene without a camera renders exactly as it always has. Perspective
  // maps x and y through one uniform scale, while the 2D path stretches each
  // to its own axis, so the two cannot agree on a non-square canvas — which
  // means switching a scene to 3D would otherwise silently reflow it. Keeping
  // both paths lets 3D be something a scene opts into.
  const { camera, light: sceneLight, order } = resolveFrame(scene, time);

  for (const entry of order) {
    const shape = entry.shape;
    const p = entry.p;
    if (p.opacity <= 0.001) continue;

    // Solids take their own path: the mesh pipeline transforms, culls,
    // lights and projects per face, so the billboard translate/rotate
    // machinery below does not apply to them.
    if (camera && isMeshType(shape.type)) {
      const boost = shape.reactive ? 1 + audioLevel * 1.2 : 1;
      // 18 world units matches the billboard size at z=0: the world is 100
      // units tall, and billboards draw at 0.18 of the frame.
      const meshSize = Math.max(0, 18 * p.scale * boost);
      if (meshSize <= 0) continue;
      const faces = renderMesh(shape.type, {
        x: p.x, y: p.y, z: p.z || 0,
        size: meshSize,
        rotX: p.rotX || 0, rotY: p.rotY || 0, rotZ: p.rotation || 0,
        color: p.color,
      }, camera, width, height, sceneLight);
      if (!faces.length) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
      for (const face of faces) {
        ctx.beginPath();
        ctx.moveTo(face.points[0][0], face.points[0][1]);
        for (let i = 1; i < face.points.length; i++) ctx.lineTo(face.points[i][0], face.points[i][1]);
        ctx.closePath();
        ctx.fillStyle = face.color;
        ctx.fill();
        // Antialiasing leaves hairline gaps between adjacent filled faces;
        // a one-pixel stroke in the face's own colour closes them.
        ctx.strokeStyle = face.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }

    let cx;
    let cy;
    let depthScale = 1;

    if (camera && shape.type === 'text' && (shape.extrude || 0) > 0) {
      const slices = textSlices(p, shape.extrude, camera, width, height);
      if (!slices.length) continue;
      const norm = framingDistance(camera.fov) / ((height / 2) / Math.tan((camera.fov / 2) * Math.PI / 180));
      const boost = shape.reactive ? 1 + audioLevel * 1.2 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const slice of slices) {
        const size = Math.min(width, height) * 0.18 * p.scale * boost * slice.scale * norm;
        if (size <= 0.5) continue;
        ctx.save();
        ctx.translate(slice.x, slice.y);
        if (p.rotX || p.rotY) {
          const fx = Math.cos((p.rotY || 0) * Math.PI / 180);
          const fy = Math.cos((p.rotX || 0) * Math.PI / 180);
          ctx.scale(Math.max(0.001, Math.abs(fx)), Math.max(0.001, Math.abs(fy)));
        }
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `700 ${size * 0.5}px 'Chakra Petch', sans-serif`;
        ctx.fillStyle = slice.front ? p.color : shadeColor(p.color, slice.shade);
        ctx.fillText(shape.text || '', 0, 0);
        ctx.restore();
      }
      ctx.restore();
      continue;
    }

    if (camera) {
      const projected = projectPoint({ x: p.x, y: p.y, z: p.z || 0 }, camera, width, height);
      // Behind the camera: drawing it anyway would flip it through the
      // origin and show it upside down in front of the viewer.
      if (!projected.visible) continue;
      cx = projected.x;
      cy = projected.y;
      // The projection's scale is normalised against the framing distance so
      // that a shape at z=0 is exactly the size the 2D path would draw it.
      depthScale = projected.scale * (framingDistance(camera.fov) / ((height / 2) / Math.tan((camera.fov / 2) * Math.PI / 180)));
    } else {
      cx = (p.x / 100) * width;
      cy = (p.y / 100) * height;
    }
    const reactBoost = shape.reactive ? 1 + audioLevel * 1.2 : 1;
    // An overshooting curve can carry scale below zero. Canvas throws on a
    // negative arc radius, so clamp here: a shape that overshoots past
    // nothing vanishes for those frames rather than taking the whole render
    // loop down with it.
    const size = Math.max(0, Math.min(width, height) * 0.18 * p.scale * reactBoost * depthScale);
    if (size <= 0) continue;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
    ctx.translate(cx, cy);
    // Tilting a flat shape away from the viewer foreshortens it. This is a
    // billboard, not a mesh — the shape stays a flat card facing the camera
    // and is squashed along each axis — which is the honest 2.5D result and
    // exactly what a WebGL mesh renderer would later replace.
    if (camera && (p.rotX || p.rotY)) {
      const fx = Math.cos((p.rotY || 0) * Math.PI / 180);
      const fy = Math.cos((p.rotX || 0) * Math.PI / 180);
      ctx.scale(Math.max(0.001, Math.abs(fx)), Math.max(0.001, Math.abs(fy)));
    }
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    const kind = !camera && MESH_FALLBACK[shape.type] ? MESH_FALLBACK[shape.type] : shape.type;
    switch (kind) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'rect':
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'text':
        ctx.font = `700 ${size * 0.5}px 'Chakra Petch', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape.text || '', 0, 0);
        break;
      case 'image': {
        const img = imageCache.get(shape.src);
        // Not decoded yet, or the source was unreadable: skip this shape
        // rather than painting a placeholder into an export.
        if (!img || !img.width) break;
        // Fit inside the shape's box while keeping the image's own aspect
        // ratio — stretching someone's logo to a square is never wanted.
        const box = size * 1.6;
        const ratio = img.width / img.height;
        const w = ratio >= 1 ? box : box * ratio;
        const h = ratio >= 1 ? box / ratio : box;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        break;
      }
      case 'wave': {
        ctx.lineWidth = Math.max(1, size * 0.05);
        ctx.beginPath();
        const w = size * 2;
        for (let x = -w / 2; x <= w / 2; x += 3) {
          const phase = (x / w) * Math.PI * 4 + time * 4;
          const y = Math.sin(phase) * size * 0.25 * (1 + audioLevel * 2);
          if (x === -w / 2) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }
}

/** Per-frame audio levels, so an export can react without playing anything. */
export function audioLevelTrack(channelData, sampleRate, fps, duration) {
  const frames = Math.ceil(duration * fps);
  const track = new Float32Array(frames);
  const per = Math.floor(sampleRate / fps);
  for (let f = 0; f < frames; f++) {
    const start = f * per;
    let sum = 0;
    let n = 0;
    for (let i = start; i < start + per && i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
      n++;
    }
    track[f] = n ? Math.min(1, Math.sqrt(sum / n) * 3) : 0;
  }
  return track;
}

/**
 * Put a scene's imported geometry back into the mesh registry.
 *
 * Idempotent: re-opening a scene, or opening two that share a model, must
 * not re-upload or duplicate anything.
 */
export function hydrateSceneModels(scene) {
  if (!scene || !scene.models || typeof scene.models !== 'object') return 0;
  let added = 0;
  for (const [type, mesh] of Object.entries(scene.models)) {
    if (hasMesh(type)) continue;
    if (registerMesh(type, mesh)) added++;
  }
  return added;
}

/** Record a mesh on the scene so it survives being saved and reopened. */
export function attachSceneModel(scene, type, mesh) {
  if (!scene || !type || !mesh) return false;
  if (!scene.models) scene.models = {};
  scene.models[type] = {
    vertices: mesh.vertices,
    faces: mesh.faces,
    ...(mesh.faceColours ? { faceColours: mesh.faceColours } : {}),
  };
  return true;
}

/**
 * Drop geometry no shape refers to any more.
 *
 * Without this, importing a model and deleting it leaves its vertices in
 * every save of that scene forever — which for a real model is megabytes
 * of a file whose visible content is empty.
 */
export function pruneSceneModels(scene) {
  if (!scene || !scene.models) return 0;
  const used = new Set(scene.shapes.map((s) => s.type));
  let removed = 0;
  for (const type of Object.keys(scene.models)) {
    if (!used.has(type)) { delete scene.models[type]; removed++; }
  }
  return removed;
}

export function serializeScene(scene) {
  pruneSceneModels(scene);
  return JSON.stringify(scene, null, 2);
}

export function deserializeScene(json) {
  const scene = typeof json === 'string' ? JSON.parse(json) : json;
  if (!scene || !Array.isArray(scene.shapes)) throw new Error('That file is not a valid scene.');
  for (const s of scene.shapes) {
    if (!Array.isArray(s.keyframes) || !s.keyframes.length) {
      throw new Error('Scene contains a shape with no keyframes.');
    }
  }
  // Imported geometry travels inside the scene, the same way an imported
  // image does: a scene someone is sent has to open on their machine, and
  // a mesh registry that only exists in the session that did the import
  // would leave every model missing.
  hydrateSceneModels(scene);
  // Keep ids unique against anything already created this session.
  for (const s of scene.shapes) {
    const n = parseInt(String(s.id).replace(/\D/g, ''), 10);
    if (Number.isFinite(n) && n >= nextId) nextId = n + 1;
  }
  return scene;
}



/**
 * Everything a renderer needs for one frame, resolved once.
 *
 * The canvas renderer and the WebGL renderer both consume this, which is
 * what guarantees they cannot disagree about sampling: the animated camera,
 * the animated light and every shape's interpolated properties come from
 * one place. A renderer differs only in how it puts pixels down.
 */
/**
 * Every shape's world transform at `time`, with parents composed.
 *
 * Resolved iteratively rather than recursively, cheapest-first: a scene
 * with no parents does one pass and allocates nothing extra, which is the
 * common case and must stay free. A shape whose parent is missing or
 * circular falls back to its own transform — an object in the wrong place
 * is recoverable, a frame that never draws is not.
 */
export function worldTransforms(scene, time) {
  const shapes = (scene && scene.shapes) || [];
  const local = new Map();
  let anyParent = false;
  for (const shape of shapes) {
    local.set(shape.id, sampleShape(shape, time));
    if (shape.parent) anyParent = true;
  }
  if (!anyParent) return local;

  const byId = new Map(shapes.map((s) => [s.id, s]));
  const world = new Map();

  const resolve = (shape, depth) => {
    if (world.has(shape.id)) return world.get(shape.id);
    const own = local.get(shape.id);
    const parent = shape.parent ? byId.get(shape.parent) : null;
    if (!parent || depth >= MAX_DEPTH) {
      world.set(shape.id, own);
      return own;
    }
    // Claim the slot before recursing: a cycle then resolves to the
    // shape's own transform instead of overflowing the stack.
    world.set(shape.id, own);
    const pw = resolve(parent, depth + 1);
    // The bind offset is what stops a shape jumping when it was parented.
    // It lives in the parent's frame, between the parent and the child, so
    // the child's own rotation does not swing it around.
    const base = shape.bind ? composeTransform(pw, shape.bind) : pw;
    const out = { ...own, ...composeTransform(base, own) };
    world.set(shape.id, out);
    return out;
  };

  for (const shape of shapes) resolve(shape, 0);
  return world;
}

/**
 * A world-space movement expressed in the channels a shape actually owns.
 *
 * Dragging an object across the viewport is a world-space request, but the
 * keyframes of a parented object hold a *local* transform. Writing the
 * world delta straight into them moves the object by the parent's scale
 * and in the parent's rotated direction — so a child of something turned
 * ninety degrees travels sideways when you drag it up.
 */
export function localDelta(scene, shape, time, delta) {
  if (!shape || !shape.parent) return delta;
  const world = worldTransforms(scene, time);
  const pw = world.get(shape.parent);
  if (!pw) return delta;
  // The frame the child's own channels are measured in: the parent's world
  // transform with the bind offset already applied.
  const base = shape.bind ? composeTransform(pw, shape.bind) : pw;
  const un = unrotatePoint(delta, base.rotX || 0, base.rotY || 0, base.rotation || 0);
  const s = base.scale || 1;
  return { x: un.x / s, y: un.y / s, z: un.z / s };
}

export function resolveFrame(scene, time) {
  // The camera may itself be animated. Resolving it per frame costs nothing
  // when there are no camera keyframes, which is the common case.
  const camera = scene.camera
    ? sampleCamera(resolveCameraKeys(scene), time, scene.camera)
    : null;

  // The light samples through its keyframes exactly as the camera does.
  // Everything derived from it — direction vector, tint — is computed once
  // per frame rather than once per face.
  let light = null;
  if (camera) {
    const base = scene.light || createLight();
    const lit = sampleLight(resolveLightKeys(scene), time, base);
    light = {
      dir: lightDirection(lit),
      ambient: Math.max(0, Math.min(0.9, lit.ambient)),
      tint: lightTint(lit.warmth),
    };
  }

  // Hierarchy is resolved here, once, rather than in each renderer: every
  // renderer and the exporter all consume this function, so composing
  // parents at this point is what makes a rig work everywhere at once.
  const world = worldTransforms(scene, time);

  // Far-to-near, for renderers without a depth buffer — and for the
  // transparent pass of the one with.
  const order = camera
    ? depthSort(scene.shapes.map((shape) => {
        const p = world.get(shape.id) || sampleShape(shape, time);
        return { shape, p, x: p.x, y: p.y, z: p.z || 0 };
      }), camera)
    : scene.shapes.map((shape) => ({
        shape, p: world.get(shape.id) || sampleShape(shape, time),
      }));

  return { camera, light, order };
}

/**
 * Where each slice of an extruded text lands on screen.
 *
 * Extrusion by stacking: the glyph face is drawn repeatedly from the back
 * of the solid to the front, each copy projected through the camera at its
 * own depth. Because every slice is genuinely at a different z, parallax,
 * foreshortening and dolly moves all behave — this is a discrete extrusion,
 * not a drop shadow.
 *
 * The extrusion axis is the shape's local z, rotated by its tilt and turn,
 * so a turned title extrudes sideways across the screen the way a solid
 * would. Pure geometry, no canvas — which is what makes it testable.
 */
export function textSlices(p, extrude, camera, width, height) {
  const depth = Math.max(0, Math.min(60, extrude || 0));
  // Enough slices that the flank reads as a surface, few enough that a
  // dozen titles still render every frame.
  const count = depth <= 0 ? 1 : Math.max(4, Math.min(16, Math.round(depth)));
  const axis = rotatePoint({ x: 0, y: 0, z: 1 }, p.rotX || 0, p.rotY || 0, 0);

  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = count === 1 ? 0 : (i / (count - 1)) * depth;
    const wx = p.x + axis.x * t;
    const wy = p.y + axis.y * t;
    const wz = (p.z || 0) + axis.z * t;
    const projected = projectPoint({ x: wx, y: wy, z: wz }, camera, width, height);
    if (!projected.visible) continue;
    out.push({
      x: projected.x,
      y: projected.y,
      wx, wy, wz,
      scale: projected.scale,
      depth: projected.depth,
      front: i === 0,
      // The flank darkens toward the back, which is what separates the
      // side surface from the face without a real per-pixel light.
      shade: i === 0 ? 1 : 0.55 - 0.25 * (count === 1 ? 0 : i / (count - 1)),
    });
  }
  return out;
}

/**
 * Camera keyframes with their easing functions resolved.
 *
 * The easing is stored as a name or control points, like every other
 * keyframe, but sampleCamera lives in the maths module and must not depend
 * on the easing registry — so the function is attached here, at the seam.
 */
function resolveCameraKeys(scene) {
  const keys = scene.cameraKeyframes;
  if (!Array.isArray(keys) || !keys.length) return null;
  for (const k of keys) k.easeFn = resolveEasing(k.ease, 'ease');
  return keys;
}

/** Record the camera's current position at `time`. */
export function setCameraKey(scene, time, ease = 'ease') {
  if (!scene.camera) return null;
  scene.cameraKeyframes = setCameraKeyframe(scene.cameraKeyframes, time, scene.camera, ease);
  return scene.cameraKeyframes;
}

export function removeCameraKey(scene, time) {
  scene.cameraKeyframes = removeCameraKeyframe(scene.cameraKeyframes, time);
  return scene.cameraKeyframes;
}

/**
 * The camera as it is at `time`, including any animation.
 *
 * The editor overlay must use this rather than scene.camera: with camera
 * keyframes the two differ, and guides drawn from the static camera would
 * drift away from the shapes they are meant to annotate.
 */
export function cameraAt(scene, time) {
  if (!scene || !scene.camera) return null;
  return sampleCamera(resolveCameraKeys(scene), time, scene.camera);
}

export function cameraKeys(scene) {
  return Array.isArray(scene && scene.cameraKeyframes) ? scene.cameraKeyframes : [];
}

function resolveLightKeys(scene) {
  const keys = scene.lightKeyframes;
  if (!Array.isArray(keys) || !keys.length) return null;
  for (const k of keys) k.easeFn = resolveEasing(k.ease, 'ease');
  return keys;
}

/** Record the light's current settings at `time`. */
export function setLightKey(scene, time, ease = 'ease') {
  if (!scene.light) return null;
  scene.lightKeyframes = setLightKeyframe(scene.lightKeyframes, time, scene.light, ease);
  return scene.lightKeyframes;
}

export function removeLightKey(scene, time) {
  scene.lightKeyframes = removeLightKeyframe(scene.lightKeyframes, time);
  return scene.lightKeyframes;
}

export function lightKeys(scene) {
  return Array.isArray(scene && scene.lightKeyframes) ? scene.lightKeyframes : [];
}

/**
 * The route a shape takes, as screen points, for drawing it in the editor.
 *
 * A path you cannot see is a path you cannot correct, so the editor draws
 * it — and draws the straight-line route too when smoothing is off, since
 * seeing the difference is how someone decides they want it.
 */
export function shapePathScreen(shape, camera, width, height) {
  const kfs = shape.keyframes;
  if (!kfs || kfs.length < 2) return [];
  const points = kfs.map((k) => ({ x: k.x, y: k.y, z: k.z || 0 }));
  const world = shape.smoothPath
    ? pathPolyline(points, 12, typeof shape.pathTension === 'number' ? shape.pathTension : 1)
    : points;

  const out = [];
  for (const w of world) {
    if (camera) {
      const p = projectPoint(w, camera, width, height);
      if (p.visible) out.push([p.x, p.y]);
    } else {
      out.push([(w.x / 100) * width, (w.y / 100) * height]);
    }
  }
  return out;
}
