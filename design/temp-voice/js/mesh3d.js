// Solid geometry.
//
// Billboards made the scene three-dimensional; this makes the *objects*
// three-dimensional. A mesh is vertices and faces; rendering is: transform
// to world space, cull the faces looking away, light the rest against a
// directional light, project, and paint far-to-near. All of it is
// arithmetic the 2D canvas can draw as filled polygons — no WebGL, no
// dependencies — and because the pipeline stages are plain functions, each
// is testable in Node without a browser.
//
// Meshes are unit-sized (roughly -0.5..0.5 per axis) and get scaled into
// world units at render time, so one cube definition serves every cube.

import { rotatePoint, toCameraSpace, project } from './camera3d.js';

export function cubeMesh() {
  const v = [];
  for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) v.push({ x, y, z });
  // Wound counter-clockwise seen from outside, which is what culling keys on.
  return {
    vertices: v,
    faces: [
      [0, 1, 3, 2], // -x
      [6, 7, 5, 4], // +x
      [0, 4, 5, 1], // -y (top: y runs down)
      [2, 3, 7, 6], // +y
      [0, 2, 6, 4], // -z (front)
      [1, 5, 7, 3], // +z (back)
    ],
  };
}

export function pyramidMesh() {
  const vertices = [
    { x: 0, y: -0.5, z: 0 },                 // apex (up: y runs down)
    { x: -0.5, y: 0.5, z: -0.5 },
    { x: 0.5, y: 0.5, z: -0.5 },
    { x: 0.5, y: 0.5, z: 0.5 },
    { x: -0.5, y: 0.5, z: 0.5 },
  ];
  return {
    vertices,
    faces: [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // sides
      [4, 3, 2, 1],                                // base
    ],
  };
}

/**
 * A latitude/longitude sphere.
 *
 * Coarse on purpose: at ten segments the silhouette reads as a sphere once
 * lit, and the faceting is a look, not a defect — flat-shaded low-poly is
 * the honest aesthetic of a painter-sorted renderer.
 */
export function sphereMesh(segments = 10, rings = 8) {
  const vertices = [];
  for (let r = 0; r <= rings; r++) {
    const phi = (r / rings) * Math.PI;
    for (let s = 0; s < segments; s++) {
      const theta = (s / segments) * Math.PI * 2;
      vertices.push({
        x: 0.5 * Math.sin(phi) * Math.cos(theta),
        y: -0.5 * Math.cos(phi),
        z: 0.5 * Math.sin(phi) * Math.sin(theta),
      });
    }
  }
  const faces = [];
  const at = (r, s) => r * segments + (s % segments);
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      // Wound to face outward — the reverse of the naive row order, which
      // reads inside-out; the winding test is what catches this, because a
      // wrong winding shows up visually only as a hole while orbiting. The
      // pole rows collapse to triangles on their own since the duplicated
      // pole vertices coincide.
      faces.push([at(r + 1, s), at(r + 1, s + 1), at(r, s + 1), at(r, s)]);
    }
  }
  return { vertices, faces };
}

/**
 * A cylinder: two capped ends and a ring of side quads.
 *
 * Side segments are wound so their normals point outward, and the caps are
 * wound in opposite directions to each other — the top seen from above and
 * the bottom seen from below are opposite windings in the same coordinate
 * frame, which is the detail that makes a cylinder look solid rather than
 * hollow from one end.
 */
export function cylinderMesh(segments = 16) {
  const vertices = [];
  for (const y of [-0.5, 0.5]) {
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      vertices.push({ x: Math.cos(a) * 0.5, y, z: Math.sin(a) * 0.5 });
    }
  }
  const topCentre = vertices.push({ x: 0, y: -0.5, z: 0 }) - 1;
  const bottomCentre = vertices.push({ x: 0, y: 0.5, z: 0 }) - 1;

  const faces = [];
  const top = (s) => s % segments;
  const bot = (s) => segments + (s % segments);
  for (let s = 0; s < segments; s++) {
    faces.push([bot(s), bot(s + 1), top(s + 1), top(s)]);
    faces.push([top(s), top(s + 1), topCentre]);
    faces.push([bot(s + 1), bot(s), bottomCentre]);
  }
  return { vertices, faces };
}

export const MESHES = {
  cube: cubeMesh(),
  pyramid: pyramidMesh(),
  sphere: sphereMesh(),
  cylinder: cylinderMesh(),
};


/**
 * Imported geometry, keyed by an id the shape's type carries.
 *
 * The built-in meshes are four fixed shapes; an imported model is any
 * number of arbitrary ones that arrive at runtime. Keeping them in a
 * separate registry rather than adding them to MESHES means the built-ins
 * stay a constant the tests can reason about, and a scene that refers to a
 * model this session has not loaded fails by drawing nothing rather than
 * by throwing mid-frame.
 */
const IMPORTED = new Map();

/** Prefix that marks a shape type as referring to imported geometry. */
export const MODEL_PREFIX = 'model:';

export function registerMesh(id, mesh) {
  if (!id || !mesh || !Array.isArray(mesh.vertices) || !Array.isArray(mesh.faces)) return null;
  const type = id.startsWith(MODEL_PREFIX) ? id : MODEL_PREFIX + id;
  IMPORTED.set(type, mesh);
  return type;
}

export function hasMesh(type) {
  return IMPORTED.has(type);
}

export function importedMeshTypes() {
  return [...IMPORTED.keys()];
}

export function clearImportedMeshes() {
  IMPORTED.clear();
}

/** The geometry behind a shape type, built-in or imported. */
export function meshFor(type) {
  if (Object.prototype.hasOwnProperty.call(MESHES, type)) return MESHES[type];
  return IMPORTED.get(type) || null;
}

export function isMeshType(type) {
  return Object.prototype.hasOwnProperty.call(MESHES, type) || IMPORTED.has(type);
}

/** Local unit mesh -> world-space vertices for one shape instance. */
export function transformVertices(mesh, { x, y, z = 0, size, rotX = 0, rotY = 0, rotZ = 0 }) {
  return mesh.vertices.map((v) => {
    const r = rotatePoint(v, rotX, rotY, rotZ);
    return { x: x + r.x * size, y: y + r.y * size, z: z + r.z * size };
  });
}

/** Unit normal of a face from its first three world-space vertices. */
export function faceNormal(verts, face) {
  const a = verts[face[0]];
  const b = verts[face[1]];
  const c = verts[face[2]];
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const w = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = {
    x: u.y * w.z - u.z * w.y,
    y: u.z * w.x - u.x * w.z,
    z: u.x * w.y - u.y * w.x,
  };
  const len = Math.hypot(n.x, n.y, n.z) || 1;
  return { x: n.x / len, y: n.y / len, z: n.z / len };
}

// One directional light, fixed in world space. The vector is the direction
// the light TRAVELS: rightward, downward (y runs down, so downward is
// positive) and into the scene — a key light at the viewer's upper left,
// the way a portrait is lit. Getting the z sign wrong lights the backs of
// objects while the camera looks at their fronts, leaving every visible
// face clamped to the ambient floor. Components are deliberately unequal so
// no two faces of a tilted cube land on the same intensity and merge.
const L = { x: 0.5, y: 0.62, z: 0.6 };
const LLEN = Math.hypot(L.x, L.y, L.z);
export const LIGHT_DIR = { x: L.x / LLEN, y: L.y / LLEN, z: L.z / LLEN };

// Ambient keeps unlit faces readable instead of black — a scene tool, not a
// physical renderer, wants no face to vanish into the background.
export const AMBIENT = 0.35;

/** Lambert: how lit a face with this normal is, in ambient..1. */
export function lambert(normal, dir = LIGHT_DIR, ambient = AMBIENT) {
  const facing = -(normal.x * dir.x + normal.y * dir.y + normal.z * dir.z);
  return ambient + (1 - ambient) * Math.max(0, facing);
}

/** Scale a hex colour per channel, staying a valid hex. */
export function shadeChannels(hex, kr, kg, kb) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex));
  const n = m ? parseInt(m[1], 16) : 0x3fc6ff;
  const ch = (shift, k) => {
    const v = Math.round(((n >> shift) & 0xff) * k);
    return Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0');
  };
  return `#${ch(16, kr)}${ch(8, kg)}${ch(0, kb)}`;
}

/** Scale a hex colour's brightness uniformly, staying a valid hex. */
export function shadeColor(hex, k) {
  return shadeChannels(hex, k, k, k);
}

/**
 * The full pipeline for one mesh instance: world transform, camera space,
 * near-plane rejection, backface cull, lighting, projection, depth order.
 *
 * Returns drawable faces, each `{ points: [[px,py]...], color, depth }`,
 * sorted far-to-near and ready for a canvas path. Pure — no canvas here —
 * which is what makes the geometry testable in Node.
 */
export function renderMesh(type, instance, camera, width, height, light = null) {
  const mesh = meshFor(type);
  if (!mesh) return [];

  // The light is resolved once per mesh, not per face; omitting it keeps
  // the built-in key light, so everything that predates scene lighting
  // renders unchanged.
  const dir = light && light.dir ? light.dir : LIGHT_DIR;
  const ambient = light && Number.isFinite(light.ambient) ? light.ambient : AMBIENT;
  const tint = light && light.tint ? light.tint : { r: 1, g: 1, b: 1 };

  const world = transformVertices(mesh, instance);
  const cam = world.map((v) => toCameraSpace(v, camera));

  // An imported model carries its materials per face, so a body and its
  // trim do not come out one flat colour. A built-in mesh has none and
  // takes the instance's colour throughout, exactly as before.
  const faceColours = mesh.faceColours;

  const out = [];
  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const face = mesh.faces[fi];
    // Any vertex at or behind the near plane would project flipped through
    // the origin; dropping the face is the safe form of clipping at this
    // scale.
    if (face.some((i) => cam[i].z <= camera.near)) continue;

    // Backface cull in camera space. The camera looks along +z from the
    // origin, so a face is visible when its normal points back toward the
    // origin: normal · anyVertex < 0.
    const n = faceNormal(cam, face);
    const v0 = cam[face[0]];
    if (n.x * v0.x + n.y * v0.y + n.z * v0.z >= 0) continue;

    const worldNormal = faceNormal(world, face);
    const points = face.map((i) => {
      const p = project(cam[i], camera, width, height);
      return [p.x, p.y];
    });
    const depth = face.reduce((sum, i) => sum + cam[i].z, 0) / face.length;

    const lit = lambert(worldNormal, dir, ambient);
    const base = (faceColours && faceColours[fi]) || instance.color;
    out.push({
      points,
      color: shadeChannels(base, lit * tint.r, lit * tint.g, lit * tint.b),
      depth,
    });
  }

  // Painter order within the mesh: the far faces first, so near ones cover
  // them. Faces of one convex solid never interleave wrongly under this.
  out.sort((a, b) => b.depth - a.depth);
  return out;
}
