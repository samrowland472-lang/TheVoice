// glTF 2.0 import.
//
// This is the leverage point for the whole animation side. Building a
// modeller is decades of work; reading the format every modeller already
// exports is a few hundred lines. It means someone can rig a character in
// Blender, export it, and have the agent animate it here — instead of the
// agent only ever having primitives to throw around.
//
// Scope is deliberate and stated rather than discovered: geometry,
// materials and the node hierarchy. Skins, morph targets and glTF's own
// animation channels are read far enough to be reported, not applied — a
// half-applied skin looks like a bug, whereas "this model has a skeleton
// we don't drive yet" is information. Textures are reduced to their base
// colour factor, because the renderer paints flat-shaded faces.
//
// No dependencies. A .glb is a container this file unpacks itself, and a
// .gltf is JSON whose buffers must be embedded as data URIs — an external
// .bin sits next to a file the browser's file picker never handed us, so
// that case is refused with a message that says what to re-export.

const MAGIC = 0x46546c67;        // 'glTF', little-endian
const CHUNK_JSON = 0x4e4f534a;   // 'JSON'
const CHUNK_BIN = 0x004e4942;    // 'BIN\0'

// Accessor component types, and how to read one.
const COMPONENT = {
  5120: { size: 1, get: (dv, o) => dv.getInt8(o) },
  5121: { size: 1, get: (dv, o) => dv.getUint8(o) },
  5122: { size: 2, get: (dv, o) => dv.getInt16(o, true) },
  5123: { size: 2, get: (dv, o) => dv.getUint16(o, true) },
  5125: { size: 4, get: (dv, o) => dv.getUint32(o, true) },
  5126: { size: 4, get: (dv, o) => dv.getFloat32(o, true) },
};

const COMPONENTS_PER = {
  SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16,
};

const TRIANGLES = 4;

/** Ceilings, so a hostile or merely enormous file cannot hang the tab. */
export const GLTF_LIMITS = {
  bytes: 64 * 1024 * 1024,
  vertices: 200000,
  faces: 200000,
  nodes: 4000,
};

export class GltfError extends Error {}

/**
 * Split a .glb container into its JSON and binary chunks.
 *
 * Every offset here is checked against the buffer's real length before it
 * is used. A truncated or mislabelled file is common — half-finished
 * downloads, wrong extension — and the difference between a clear message
 * and a RangeError from deep inside a DataView is the difference between
 * the user knowing what to do and filing a bug.
 */
export function parseGlb(arrayBuffer) {
  const dv = new DataView(arrayBuffer);
  if (dv.byteLength < 12) throw new GltfError('That file is too short to be a .glb model.');
  if (dv.getUint32(0, true) !== MAGIC) {
    throw new GltfError('That is not a .glb model — the file does not start with the glTF marker.');
  }
  const version = dv.getUint32(4, true);
  if (version !== 2) {
    throw new GltfError(`This reads glTF 2.0; that file is version ${version}. Re-export as glTF 2.0.`);
  }
  const declared = dv.getUint32(8, true);
  const total = Math.min(declared, dv.byteLength);

  let offset = 12;
  let json = null;
  let bin = null;
  while (offset + 8 <= total) {
    const length = dv.getUint32(offset, true);
    const type = dv.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + length > dv.byteLength) {
      throw new GltfError('That .glb is truncated — a chunk runs past the end of the file.');
    }
    if (type === CHUNK_JSON && json === null) {
      json = new TextDecoder().decode(new Uint8Array(arrayBuffer, start, length));
    } else if (type === CHUNK_BIN && bin === null) {
      bin = arrayBuffer.slice(start, start + length);
    }
    // Chunks are four-byte aligned; an unpadded length would otherwise
    // desynchronise every chunk after it.
    offset = start + length + ((4 - (length % 4)) % 4);
  }
  if (json === null) throw new GltfError('That .glb has no JSON chunk — the file looks corrupt.');

  let doc;
  try {
    doc = JSON.parse(json);
  } catch {
    throw new GltfError('The model description inside that .glb is not valid JSON.');
  }
  return { doc, bin };
}

/** Decode a base64 data URI to an ArrayBuffer. */
function decodeDataUri(uri) {
  const comma = uri.indexOf(',');
  if (comma === -1) return null;
  const meta = uri.slice(0, comma);
  const body = uri.slice(comma + 1);
  if (!/;base64$/i.test(meta)) {
    // A plain-text data URI is legal but nobody exports one; treating it as
    // bytes would silently produce garbage geometry.
    return null;
  }
  const binary = atob(body);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

/** Resolve every buffer the document refers to, or say why it cannot. */
function resolveBuffers(doc, bin) {
  return (doc.buffers || []).map((buffer, i) => {
    if (buffer.uri === undefined) {
      // The GLB binary chunk. Only buffer 0 may omit its uri.
      if (i !== 0 || !bin) {
        throw new GltfError('This model refers to binary data the file does not contain.');
      }
      return bin;
    }
    if (/^data:/i.test(buffer.uri)) {
      const decoded = decodeDataUri(buffer.uri);
      if (!decoded) throw new GltfError('This model embeds its data in a form we cannot read.');
      return decoded;
    }
    throw new GltfError(
      `This model keeps its geometry in a separate file (${buffer.uri}) that the browser was not given. `
      + 'Re-export it as a single .glb, or as .gltf with "embedded" buffers.',
    );
  });
}

/**
 * Read one accessor into a flat array of numbers.
 *
 * byteStride is the part everyone forgets: an interleaved buffer packs
 * position, normal and uv into one run, so reading it as tightly packed
 * gives geometry that looks shredded rather than empty — which is much
 * harder to recognise as a bug.
 */
export function readAccessor(doc, buffers, index) {
  const accessor = (doc.accessors || [])[index];
  if (!accessor) return null;
  const per = COMPONENTS_PER[accessor.type];
  const comp = COMPONENT[accessor.componentType];
  if (!per || !comp) return null;
  const count = accessor.count || 0;
  const out = new Array(count * per);

  // An accessor with no bufferView is defined as all zeroes.
  if (accessor.bufferView === undefined) return out.fill(0);

  const view = (doc.bufferViews || [])[accessor.bufferView];
  if (!view) return null;
  const buffer = buffers[view.buffer || 0];
  if (!buffer) return null;

  const elementSize = comp.size * per;
  const stride = view.byteStride || elementSize;
  const base = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const dv = new DataView(buffer);

  for (let i = 0; i < count; i++) {
    const at = base + i * stride;
    if (at + elementSize > dv.byteLength) {
      throw new GltfError('This model points at data past the end of its buffer — the file is damaged.');
    }
    for (let c = 0; c < per; c++) out[i * per + c] = comp.get(dv, at + c * comp.size);
  }
  return out;
}

const clamp01 = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 1));

/** A base colour factor as a hex string the renderer can shade. */
export function materialColour(material) {
  const pbr = (material && material.pbrMetallicRoughness) || {};
  const f = pbr.baseColorFactor;
  if (!Array.isArray(f) || f.length < 3) return '#b9c2bd';
  const to = (n) => Math.round(clamp01(n) * 255).toString(16).padStart(2, '0');
  return `#${to(f[0])}${to(f[1])}${to(f[2])}`;
}

/**
 * glTF is Y-up and right-handed with +Z toward the viewer. This renderer
 * has Y running down the screen and looks along +Z.
 *
 * Negating both Y and Z is two reflections, which is a rotation — so face
 * winding, and therefore backface culling, survives untouched. Negating
 * only one would mirror every model and turn every surface inside out,
 * which shows up as a model with holes rather than as an obvious flip.
 */
export function toSceneSpace(x, y, z) {
  return { x, y: -y, z: -z };
}

/**
 * Quaternion to the Euler angles this renderer uses, in degrees.
 *
 * rotatePoint applies Z, then Y, then X, so the angles are extracted in
 * that convention. Gimbal lock at |pitch| = 90 degrees is handled
 * explicitly: the general formula divides by zero there and yields NaN,
 * which propagates through every vertex and makes the model vanish.
 */
export function quaternionToEuler(q) {
  const [x, y, z, w] = q;
  const sinY = 2 * (w * y - z * x);
  const DEG = 180 / Math.PI;
  if (Math.abs(sinY) >= 0.999999) {
    const sign = sinY > 0 ? 1 : -1;
    return {
      rotX: DEG * Math.atan2(-2 * (y * z - w * x), 1 - 2 * (x * x + y * y)),
      rotY: sign * 90,
      rotZ: 0,
    };
  }
  return {
    rotX: DEG * Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
    rotY: DEG * Math.asin(sinY),
    rotZ: DEG * Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)),
  };
}

/** A node's local transform, from either its matrix or its T/R/S. */
export function nodeTransform(node) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) {
    return decomposeMatrix(node.matrix);
  }
  const t = node.translation || [0, 0, 0];
  const s = node.scale || [1, 1, 1];
  const r = node.rotation || [0, 0, 0, 1];
  const pos = toSceneSpace(t[0], t[1], t[2]);
  const euler = quaternionToEuler(r);
  return {
    ...pos,
    // The same two axis flips applied to the position apply to the turns
    // about them, which for a Y-down, Z-away frame negates the X rotation
    // and leaves the others.
    rotX: -euler.rotX,
    rotY: euler.rotY,
    rotation: euler.rotZ,
    // One uniform scale, because the renderer scales a mesh by a single
    // size. A non-uniform node is squashed to its average rather than
    // silently rendering at the wrong proportions on one axis.
    scale: (Math.abs(s[0]) + Math.abs(s[1]) + Math.abs(s[2])) / 3,
  };
}

/**
 * Pull translation, rotation and scale out of a column-major 4x4.
 *
 * Only the parts this renderer can express are recovered: shear and
 * non-uniform scale are folded into one average, which is honest about the
 * renderer's limits rather than pretending to a fidelity it does not have.
 */
export function decomposeMatrix(m) {
  const len = (a, b, c) => Math.hypot(m[a], m[b], m[c]);
  const sx = len(0, 1, 2), sy = len(4, 5, 6), sz = len(8, 9, 10);
  const scale = (sx + sy + sz) / 3;
  const nx = sx || 1, ny = sy || 1, nz = sz || 1;
  // Rotation matrix, columns normalised.
  const r = [m[0]/nx, m[1]/nx, m[2]/nx, m[4]/ny, m[5]/ny, m[6]/ny, m[8]/nz, m[9]/nz, m[10]/nz];
  const DEG = 180 / Math.PI;
  const sinY = -r[2];
  let rotX, rotY, rotZ;
  if (Math.abs(sinY) >= 0.999999) {
    rotY = (sinY > 0 ? 1 : -1) * 90;
    rotX = DEG * Math.atan2(-r[7], r[4]);
    rotZ = 0;
  } else {
    rotY = DEG * Math.asin(sinY);
    rotX = DEG * Math.atan2(r[5], r[8]);
    rotZ = DEG * Math.atan2(r[1], r[0]);
  }
  const pos = toSceneSpace(m[12], m[13], m[14]);
  return { ...pos, rotX: -rotX, rotY, rotation: rotZ, scale };
}

/**
 * Convert one glTF mesh into the renderer's vertices-and-faces form.
 *
 * Every primitive of the mesh is merged into one geometry, carrying a
 * per-face colour so a model whose parts use different materials does not
 * come out one flat colour. Non-triangle primitives are skipped rather
 * than guessed at.
 */
function convertMesh(doc, buffers, mesh, budget) {
  const vertices = [];
  const faces = [];
  const faceColours = [];
  let skipped = 0;

  for (const prim of mesh.primitives || []) {
    const mode = prim.mode === undefined ? TRIANGLES : prim.mode;
    if (mode !== TRIANGLES) { skipped++; continue; }
    const posIndex = prim.attributes && prim.attributes.POSITION;
    if (posIndex === undefined) { skipped++; continue; }

    const pos = readAccessor(doc, buffers, posIndex);
    if (!pos || pos.length < 9) { skipped++; continue; }

    const offset = vertices.length;
    const vertexCount = Math.floor(pos.length / 3);
    if (budget.vertices + vertexCount > GLTF_LIMITS.vertices) {
      budget.truncated = true;
      break;
    }
    budget.vertices += vertexCount;
    for (let i = 0; i < vertexCount; i++) {
      vertices.push(toSceneSpace(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
    }

    const colour = materialColour((doc.materials || [])[prim.material]);
    let indices = prim.indices === undefined ? null : readAccessor(doc, buffers, prim.indices);
    if (!indices) {
      // Un-indexed geometry: consecutive triples.
      indices = [];
      for (let i = 0; i < vertexCount; i++) indices.push(i);
    }
    for (let i = 0; i + 2 < indices.length; i += 3) {
      if (budget.faces >= GLTF_LIMITS.faces) { budget.truncated = true; break; }
      const a = indices[i] + offset, b = indices[i + 1] + offset, c = indices[i + 2] + offset;
      if (a >= vertices.length || b >= vertices.length || c >= vertices.length) continue;
      // A degenerate triangle has no normal, so it cannot be culled or lit;
      // dropping it here keeps faceNormal from dividing by zero later.
      if (a === b || b === c || a === c) continue;
      faces.push([a, b, c]);
      faceColours.push(colour);
      budget.faces++;
    }
  }

  return { vertices, faces, faceColours, skipped };
}

/**
 * Scale and centre a geometry into the unit box every built-in mesh lives
 * in, and report the factor so the caller can size the instance to match
 * the model's real proportions.
 */
export function normaliseMesh(mesh) {
  if (!mesh.vertices.length) return { ...mesh, unitScale: 1, centre: { x: 0, y: 0, z: 0 } };
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const v of mesh.vertices) {
    if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
    if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  // A flat plane has zero span on one axis and a degenerate model has zero
  // on all three; dividing by that would send every vertex to infinity.
  const k = span > 1e-9 ? 1 / span : 1;
  return {
    ...mesh,
    vertices: mesh.vertices.map((v) => ({
      x: (v.x - cx) * k, y: (v.y - cy) * k, z: (v.z - cz) * k,
    })),
    unitScale: span > 1e-9 ? span : 1,
    centre: { x: cx, y: cy, z: cz },
  };
}

/**
 * Read a whole model.
 *
 * Returns the node tree with each node's local transform and the mesh it
 * draws, plus the meshes themselves. The tree maps directly onto the
 * scene's own hierarchy — which is the reason parenting had to exist
 * before this could.
 */
export function readModel(arrayBuffer, { name = 'model' } = {}) {
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new GltfError('That file is empty — there is nothing to import.');
  }
  if (arrayBuffer.byteLength > GLTF_LIMITS.bytes) {
    throw new GltfError(
      `That model is ${Math.round(arrayBuffer.byteLength / 1048576)}MB; the limit is `
      + `${Math.round(GLTF_LIMITS.bytes / 1048576)}MB. Decimate it before exporting.`,
    );
  }

  let doc, bin = null;
  const head = new Uint8Array(arrayBuffer, 0, Math.min(4, arrayBuffer.byteLength));
  const isGlb = head.length === 4 && new DataView(arrayBuffer).getUint32(0, true) === MAGIC;
  if (isGlb) {
    ({ doc, bin } = parseGlb(arrayBuffer));
  } else {
    try {
      doc = JSON.parse(new TextDecoder().decode(arrayBuffer));
    } catch {
      throw new GltfError('That file is neither a .glb nor readable glTF JSON.');
    }
  }
  if (!doc || typeof doc !== 'object') throw new GltfError('That model description is empty.');
  if (doc.asset && doc.asset.version && !String(doc.asset.version).startsWith('2')) {
    throw new GltfError(
      `This reads glTF 2.0; that file declares ${doc.asset.version}. Re-export as glTF 2.0.`,
    );
  }

  const buffers = resolveBuffers(doc, bin);
  const budget = { vertices: 0, faces: 0, truncated: false };

  const meshes = (doc.meshes || []).map((m, i) => {
    const built = convertMesh(doc, buffers, m, budget);
    return { name: m.name || `${name} part ${i + 1}`, ...normaliseMesh(built) };
  });

  const rawNodes = (doc.nodes || []).slice(0, GLTF_LIMITS.nodes);
  const nodes = rawNodes.map((n, i) => ({
    index: i,
    name: n.name || `Node ${i + 1}`,
    mesh: n.mesh === undefined ? null : n.mesh,
    children: (n.children || []).filter((c) => c >= 0 && c < rawNodes.length),
    transform: nodeTransform(n),
    skinned: n.skin !== undefined,
  }));

  // Roots: everything nothing else claims as a child. A file with a cycle
  // in its node graph would otherwise produce a tree with no entry point.
  const claimed = new Set();
  for (const n of nodes) for (const c of n.children) claimed.add(c);
  const scene = (doc.scenes || [])[doc.scene || 0];
  let roots = scene && Array.isArray(scene.nodes)
    ? scene.nodes.filter((i) => i >= 0 && i < nodes.length)
    : [];
  if (!roots.length) roots = nodes.map((n) => n.index).filter((i) => !claimed.has(i));

  if (!meshes.some((m) => m.faces.length)) {
    throw new GltfError('That model has no triangle geometry we can draw.');
  }

  return {
    name,
    nodes,
    roots,
    meshes,
    // Reported, not applied — see the note at the top of this file.
    notes: {
      truncated: budget.truncated,
      vertices: budget.vertices,
      faces: budget.faces,
      skinned: nodes.some((n) => n.skinned),
      hasAnimations: Array.isArray(doc.animations) && doc.animations.length > 0,
      hasTextures: Array.isArray(doc.images) && doc.images.length > 0,
    },
  };
}

/**
 * Flatten a model's node tree into the shapes a scene would hold.
 *
 * Each entry names its parent by index, so the caller can create shapes and
 * then parent them with the scene graph's own rules rather than this
 * module knowing anything about scenes.
 */
export function flattenModel(model) {
  const out = [];
  const seen = new Set();
  const walk = (index, parent, depth) => {
    if (seen.has(index) || depth > 32) return;
    seen.add(index);
    const node = model.nodes[index];
    if (!node) return;
    out.push({
      index,
      parent,
      name: node.name,
      mesh: node.mesh,
      transform: node.transform,
      skinned: node.skinned,
    });
    for (const child of node.children) walk(child, index, depth + 1);
  };
  for (const root of model.roots) walk(root, null, 0);
  return out;
}
