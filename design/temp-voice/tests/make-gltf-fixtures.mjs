// Build the glTF fixtures the import tests read.
//
// Written by hand rather than exported from a tool on purpose: every byte
// here is one the parser has to handle, and a fixture whose provenance is
// "some file someone had" cannot be edited to probe a specific case. These
// cover the shapes real exporters produce — indexed and un-indexed,
// interleaved and tightly packed, matrix and TRS nodes — plus the damaged
// files a parser has to refuse cleanly.
//
// Run: node tests/make-gltf-fixtures.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'fixtures', 'gltf');
fs.mkdirSync(OUT, { recursive: true });

const F32 = (nums) => Buffer.from(new Float32Array(nums).buffer);
const U16 = (nums) => Buffer.from(new Uint16Array(nums).buffer);

/** Pad to a four-byte boundary, the alignment GLB chunks require. */
function pad(buf, filler) {
  const extra = (4 - (buf.length % 4)) % 4;
  return extra ? Buffer.concat([buf, Buffer.alloc(extra, filler)]) : buf;
}

function glb(doc, binBuffer) {
  const json = pad(Buffer.from(JSON.stringify(doc), 'utf8'), 0x20); // spaces
  const bin = binBuffer ? pad(binBuffer, 0) : null;
  const chunks = [];
  const head = (length, type) => {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(length, 0);
    b.writeUInt32LE(type, 4);
    return b;
  };
  chunks.push(head(json.length, 0x4e4f534a), json);
  if (bin) chunks.push(head(bin.length, 0x004e4942), bin);
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + body.length, 8);
  return Buffer.concat([header, body]);
}

// A unit cube, Y-up and right-handed the way glTF defines it, wound
// counter-clockwise seen from outside.
const CUBE_POS = [
  -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // +z
  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,   // -z
];
const CUBE_IDX = [
  0, 1, 2,  0, 2, 3,     // +z
  4, 5, 6,  4, 6, 7,     // -z
  3, 2, 6,  3, 6, 5,     // +y
  0, 7, 1,  0, 4, 7,     // -y
  1, 7, 6,  1, 6, 2,     // +x
  0, 3, 5,  0, 5, 4,     // -x
];

function writeCubeGlb() {
  const pos = F32(CUBE_POS);
  const idx = pad(U16(CUBE_IDX), 0);
  const bin = Buffer.concat([pos, idx]);
  const doc = {
    asset: { version: '2.0', generator: 'the-voice test fixtures' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Cube', mesh: 0, translation: [0, 0, 0] }],
    meshes: [{ name: 'Cube', primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [{ name: 'Red', pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1] } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.length, target: 34962 },
      { buffer: 0, byteOffset: pos.length, byteLength: idx.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3',
        min: [-1, -1, -1], max: [1, 1, 1] },
      { bufferView: 1, componentType: 5123, count: CUBE_IDX.length, type: 'SCALAR' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'cube.glb'), glb(doc, bin));
}

/** Two meshes, two materials, a parent and a child — the hierarchy case. */
function writeHierarchyGlb() {
  const pos = F32(CUBE_POS);
  const idx = pad(U16(CUBE_IDX), 0);
  const bin = Buffer.concat([pos, idx]);
  const doc = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      { name: 'Torso', mesh: 0, translation: [0, 2, 0], children: [1] },
      { name: 'Arm', mesh: 1, translation: [1, 0, 0],
        // A quarter turn about Y, as a quaternion.
        rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2], scale: [0.5, 0.5, 0.5] },
    ],
    meshes: [
      { name: 'Torso', primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] },
      { name: 'Arm', primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 1 }] },
    ],
    materials: [
      { name: 'Blue', pbrMetallicRoughness: { baseColorFactor: [0, 0, 1, 1] } },
      { name: 'Green', pbrMetallicRoughness: { baseColorFactor: [0, 1, 0, 1] } },
    ],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.length },
      { buffer: 0, byteOffset: pos.length, byteLength: idx.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: CUBE_IDX.length, type: 'SCALAR' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'hierarchy.glb'), glb(doc, bin));
}

/**
 * Interleaved position + normal, the layout most exporters actually emit.
 * Read as tightly packed this produces shredded geometry rather than none,
 * which is the failure mode worth a fixture.
 */
function writeInterleavedGlb() {
  const rows = [];
  const normals = [[0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const tri = [[-1, -1, 0], [1, -1, 0], [0, 1, 0]];
  for (let i = 0; i < 3; i++) rows.push(...tri[i], ...normals[i]);
  const bin = F32(rows);
  const doc = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Tri', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 } }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bin.length, byteStride: 24 }],
    accessors: [
      { bufferView: 0, byteOffset: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 0, byteOffset: 12, componentType: 5126, count: 3, type: 'VEC3' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'interleaved.glb'), glb(doc, bin));
}

/** A node given as a 4x4 matrix rather than translation/rotation/scale. */
function writeMatrixGlb() {
  const pos = F32(CUBE_POS);
  const idx = pad(U16(CUBE_IDX), 0);
  const bin = Buffer.concat([pos, idx]);
  // Column-major: scale 2, translated to (3, 4, 5).
  const doc = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Matrixed', mesh: 0,
      matrix: [2, 0, 0, 0,  0, 2, 0, 0,  0, 0, 2, 0,  3, 4, 5, 1] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.length },
      { buffer: 0, byteOffset: pos.length, byteLength: idx.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: CUBE_IDX.length, type: 'SCALAR' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'matrix.glb'), glb(doc, bin));
}

/** A .gltf whose buffer is a base64 data URI — the "embedded" export. */
function writeEmbeddedGltf() {
  const pos = F32(CUBE_POS);
  const idx = pad(U16(CUBE_IDX), 0);
  const bin = Buffer.concat([pos, idx]);
  const doc = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'Embedded', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: bin.length,
      uri: `data:application/octet-stream;base64,${bin.toString('base64')}` }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.length },
      { buffer: 0, byteOffset: pos.length, byteLength: idx.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: CUBE_IDX.length, type: 'SCALAR' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'embedded.gltf'), JSON.stringify(doc));
}

/** A .gltf pointing at a sidecar .bin the picker never handed us. */
function writeExternalGltf() {
  const doc = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'External', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: 256, uri: 'scene.bin' }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 96 },
      { buffer: 0, byteOffset: 96, byteLength: 72 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'external.gltf'), JSON.stringify(doc));
}

/** Damaged and hostile files: each must be refused with a readable reason. */
function writeBadFiles() {
  fs.writeFileSync(path.join(OUT, 'not-a-model.glb'), Buffer.from('this is a text file, sorry'));
  fs.writeFileSync(path.join(OUT, 'empty.glb'), Buffer.alloc(0));

  const good = fs.readFileSync(path.join(OUT, 'cube.glb'));
  fs.writeFileSync(path.join(OUT, 'truncated.glb'), good.subarray(0, good.length - 40));

  // Right magic, wrong version.
  const v1 = Buffer.from(good);
  v1.writeUInt32LE(1, 4);
  fs.writeFileSync(path.join(OUT, 'version1.glb'), v1);

  // An accessor claiming far more elements than the buffer holds — the
  // out-of-bounds read that must be a message rather than a RangeError.
  const pos = F32(CUBE_POS);
  const doc = {
    asset: { version: '2.0' },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: pos.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 100000, type: 'VEC3' }],
  };
  fs.writeFileSync(path.join(OUT, 'overrun.glb'), glb(doc, pos));

  // Valid glTF, but every primitive is a line strip: nothing to draw.
  const doc2 = {
    asset: { version: '2.0' },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ mode: 3, attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: pos.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: pos.length }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' }],
  };
  fs.writeFileSync(path.join(OUT, 'lines-only.glb'), glb(doc2, pos));

  // A node graph that points back at itself.
  const cube = F32(CUBE_POS);
  const cidx = pad(U16(CUBE_IDX), 0);
  const cbin = Buffer.concat([cube, cidx]);
  const doc3 = {
    asset: { version: '2.0' },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [
      { name: 'A', mesh: 0, children: [1] },
      { name: 'B', mesh: 0, children: [0] },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    buffers: [{ byteLength: cbin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: cube.length },
      { buffer: 0, byteOffset: cube.length, byteLength: cidx.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: CUBE_IDX.length, type: 'SCALAR' },
    ],
  };
  fs.writeFileSync(path.join(OUT, 'cyclic.glb'), glb(doc3, cbin));
}

writeCubeGlb();
writeHierarchyGlb();
writeInterleavedGlb();
writeMatrixGlb();
writeEmbeddedGltf();
writeExternalGltf();
writeBadFiles();
console.log(`glTF fixtures written to ${OUT}`);
for (const f of fs.readdirSync(OUT).sort()) {
  console.log(`  ${f.padEnd(20)} ${fs.statSync(path.join(OUT, f)).size} bytes`);
}
