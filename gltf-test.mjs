import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { readModel, parseGlb, readAccessor, flattenModel, normaliseMesh,
        materialColour, quaternionToEuler, decomposeMatrix, toSceneSpace,
        GltfError, GLTF_LIMITS } = await import('../js/gltf.js');
const { faceNormal } = await import('../js/mesh3d.js');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, 'fixtures', 'gltf');

if (!fs.existsSync(path.join(DIR, 'cube.glb'))) {
  console.log('  FAIL  fixtures are missing — run `node tests/make-gltf-fixtures.mjs`');
  console.log('\n0 passed, 1 failed');
  process.exit(1);
}

// atob is a browser global the parser uses for embedded data URIs.
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
}

const load = (name) => {
  const b = fs.readFileSync(path.join(DIR, name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                 : (fail++, console.log(`  FAIL  ${n} ${x}`)); };
const near = (a, b, tol = 1e-4) => Math.abs(a - b) <= tol;
const refuses = (name) => {
  try { readModel(load(name)); return null; } catch (e) { return e; }
};

console.log('--- a plain .glb reads ---');
{
  const m = readModel(load('cube.glb'), { name: 'cube' });
  ok('one mesh', m.meshes.length === 1, String(m.meshes.length));
  ok('eight vertices', m.meshes[0].vertices.length === 8, String(m.meshes[0].vertices.length));
  ok('twelve triangles', m.meshes[0].faces.length === 12, String(m.meshes[0].faces.length));
  ok('every face is a triangle', m.meshes[0].faces.every((f) => f.length === 3));
  ok('every index is in range',
     m.meshes[0].faces.every((f) => f.every((i) => i >= 0 && i < m.meshes[0].vertices.length)));
  ok('the material colour comes through', m.meshes[0].faceColours[0] === '#ff0000',
     m.meshes[0].faceColours[0]);
  ok('one node', m.nodes.length === 1);
  ok('which is the root', m.roots.join() === '0');
  ok('and it draws the mesh', m.nodes[0].mesh === 0);
  ok('the node is named', m.nodes[0].name === 'Cube', m.nodes[0].name);
  ok('nothing was truncated', m.notes.truncated === false);
  ok('no skeleton reported', m.notes.skinned === false);
}

console.log('--- geometry lands in this renderer, not glTF’s ---');
{
  const m = readModel(load('cube.glb'));
  const mesh = m.meshes[0];
  ok('it is normalised into the unit box',
     mesh.vertices.every((v) => Math.abs(v.x) <= 0.5001 && Math.abs(v.y) <= 0.5001
                                && Math.abs(v.z) <= 0.5001),
     JSON.stringify(mesh.vertices[0]));
  ok('and centred on the origin',
     near(mesh.vertices.reduce((s, v) => s + v.x, 0) / mesh.vertices.length, 0, 1e-6));
  ok('the original size is reported', near(mesh.unitScale, 2), String(mesh.unitScale));

  // Y and Z both flip, which is a rotation rather than a mirror — so the
  // winding, and with it backface culling, has to survive. A cube's face
  // normals must all point away from its centre.
  const outward = mesh.faces.every((f) => {
    const n = faceNormal(mesh.vertices, f);
    const c = f.reduce((acc, i) => ({
      x: acc.x + mesh.vertices[i].x / f.length,
      y: acc.y + mesh.vertices[i].y / f.length,
      z: acc.z + mesh.vertices[i].z / f.length,
    }), { x: 0, y: 0, z: 0 });
    return n.x * c.x + n.y * c.y + n.z * c.z > 0;
  });
  ok('every face still winds outward after the axis flip', outward);
  ok('toSceneSpace flips exactly two axes',
     JSON.stringify(toSceneSpace(1, 2, 3)) === JSON.stringify({ x: 1, y: -2, z: -3 }));
}

console.log('--- the node tree becomes a hierarchy ---');
{
  const m = readModel(load('hierarchy.glb'));
  ok('two nodes', m.nodes.length === 2);
  ok('one root', m.roots.length === 1 && m.roots[0] === 0);
  const flat = flattenModel(m);
  ok('flattened parent-first', flat.map((n) => n.name).join() === 'Torso,Arm',
     flat.map((n) => n.name).join());
  ok('the root has no parent', flat[0].parent === null);
  ok('and the arm names it', flat[1].parent === 0);
  ok('the torso is above the origin in glTF, below it here',
     near(flat[0].transform.y, -2), String(flat[0].transform.y));
  ok('the arm inherits a quarter turn', near(flat[1].transform.rotY, 90, 0.01),
     String(flat[1].transform.rotY));
  ok('and its own scale', near(flat[1].transform.scale, 0.5));
  ok('two materials come through separately',
     m.meshes[0].faceColours[0] !== m.meshes[1].faceColours[0],
     `${m.meshes[0].faceColours[0]} / ${m.meshes[1].faceColours[0]}`);
  ok('blue', m.meshes[0].faceColours[0] === '#0000ff', m.meshes[0].faceColours[0]);
  ok('and green', m.meshes[1].faceColours[0] === '#00ff00', m.meshes[1].faceColours[0]);
}

console.log('--- interleaved buffers are read with their stride ---');
{
  // Position and normal share one run at 24 bytes per vertex. Ignoring
  // byteStride reads normals as positions and produces shredded geometry —
  // which is much harder to spot than producing nothing.
  const m = readModel(load('interleaved.glb'));
  const v = m.meshes[0].vertices;
  ok('three vertices', v.length === 3, String(v.length));
  ok('one triangle', m.meshes[0].faces.length === 1);
  // The source triangle is 2 wide and 2 tall, so normalised it spans 1.
  const xs = v.map((p) => p.x);
  ok('the triangle has its real width', near(Math.max(...xs) - Math.min(...xs), 1),
     String(Math.max(...xs) - Math.min(...xs)));
  ok('and is not flattened onto the normals',
     new Set(v.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size === 3,
     JSON.stringify(v));
}

console.log('--- un-indexed geometry still works ---');
{
  // The interleaved fixture has no indices accessor; consecutive triples
  // are the triangle. An exporter that omits indices is common enough that
  // treating "no indices" as "no geometry" loses whole models.
  const m = readModel(load('interleaved.glb'));
  ok('a primitive with no indices produces faces', m.meshes[0].faces.length === 1);
  ok('from consecutive vertices', m.meshes[0].faces[0].join() === '0,1,2');
}

console.log('--- a node given as a matrix ---');
{
  const m = readModel(load('matrix.glb'));
  const t = m.nodes[0].transform;
  ok('translation is recovered and flipped', near(t.x, 3) && near(t.y, -4) && near(t.z, -5),
     JSON.stringify(t));
  ok('uniform scale is recovered', near(t.scale, 2), String(t.scale));
  ok('with no rotation', near(t.rotation, 0) && near(t.rotX, 0) && near(t.rotY, 0));
}

console.log('--- quaternions, including the pole ---');
{
  ok('identity is no rotation',
     ['rotX', 'rotY', 'rotZ'].every((k) => near(quaternionToEuler([0, 0, 0, 1])[k], 0)));
  ok('a quarter turn about Y', near(quaternionToEuler([0, Math.SQRT1_2, 0, Math.SQRT1_2]).rotY, 90));
  ok('a quarter turn about Z', near(quaternionToEuler([0, 0, Math.SQRT1_2, Math.SQRT1_2]).rotZ, 90));
  // Gimbal lock: the general formula divides by zero here and yields NaN,
  // which propagates through every vertex and makes the model vanish.
  const locked = quaternionToEuler([0.5, 0.5, -0.5, 0.5]);
  ok('at the pole it produces numbers, not NaN',
     Number.isFinite(locked.rotX) && Number.isFinite(locked.rotY) && Number.isFinite(locked.rotZ),
     JSON.stringify(locked));
  ok('and pins the pitch at ninety degrees', Math.abs(Math.abs(locked.rotY) - 90) < 0.01,
     String(locked.rotY));
  let worst = 0;
  for (let i = 0; i < 200; i++) {
    const q = [Math.sin(i), Math.cos(i * 1.7), Math.sin(i * 0.3), Math.cos(i * 2.1)];
    const n = Math.hypot(...q);
    const e = quaternionToEuler(q.map((v) => v / n));
    if (!Number.isFinite(e.rotX + e.rotY + e.rotZ)) worst = i + 1;
  }
  ok('200 random orientations all produce finite angles', worst === 0, `failed at ${worst}`);
}

console.log('--- matrices are decomposed without shear or NaN ---');
{
  const identity = decomposeMatrix([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  ok('identity is the identity', near(identity.scale, 1) && near(identity.x, 0));
  const zero = decomposeMatrix([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1]);
  ok('a degenerate matrix does not divide by zero',
     Object.values(zero).every((v) => Number.isFinite(v)), JSON.stringify(zero));
}

console.log('--- material colours ---');
{
  ok('a base colour becomes hex',
     materialColour({ pbrMetallicRoughness: { baseColorFactor: [1, 0.5, 0, 1] } }) === '#ff8000',
     materialColour({ pbrMetallicRoughness: { baseColorFactor: [1, 0.5, 0, 1] } }));
  ok('a missing material falls back', /^#[0-9a-f]{6}$/.test(materialColour(undefined)));
  ok('out-of-range factors are clamped, not wrapped',
     materialColour({ pbrMetallicRoughness: { baseColorFactor: [5, -3, 0.5, 1] } }) === '#ff0080',
     materialColour({ pbrMetallicRoughness: { baseColorFactor: [5, -3, 0.5, 1] } }));
  ok('a non-array factor is refused',
     /^#[0-9a-f]{6}$/.test(materialColour({ pbrMetallicRoughness: { baseColorFactor: 'red' } })));
}

console.log('--- a .gltf with its buffer embedded ---');
{
  const m = readModel(load('embedded.gltf'), { name: 'embedded' });
  ok('it reads', m.meshes[0].faces.length === 12, String(m.meshes[0].faces.length));
  ok('and matches the .glb of the same model',
     m.meshes[0].vertices.length === readModel(load('cube.glb')).meshes[0].vertices.length);
}

console.log('--- damaged and unsupported files are refused, clearly ---');
{
  const cases = [
    ['empty.glb', /empty/i],
    ['not-a-model.glb', /neither a \.glb|not a \.glb|glTF marker/i],
    ['truncated.glb', /truncat|past the end/i],
    ['version1.glb', /2\.0|version/i],
    ['overrun.glb', /past the end|damaged/i],
    ['lines-only.glb', /no triangle geometry/i],
    ['external.gltf', /separate file|\.glb|embedded/i],
  ];
  for (const [file, pattern] of cases) {
    const e = refuses(file);
    ok(`${file} is refused`, e instanceof GltfError, e ? e.constructor.name : 'no error thrown');
    ok(`${file} says why`, !!e && pattern.test(e.message), e ? e.message : '');
  }
  ok('every refusal is a sentence a person can act on',
     cases.every(([f]) => {
       const e = refuses(f);
       return e && e.message.length > 20 && /[.!]$/.test(e.message);
     }));
}

console.log('--- a cyclic node graph terminates ---');
{
  // Two nodes each claiming the other as a child. Walking that naively
  // recurses until the stack gives out.
  let threw = null;
  let m = null;
  try { m = readModel(load('cyclic.glb')); } catch (e) { threw = e; }
  ok('the file still reads', threw === null, threw && threw.message);
  const flat = flattenModel(m);
  ok('flattening terminates', flat.length <= m.nodes.length, String(flat.length));
  ok('and visits each node once',
     new Set(flat.map((n) => n.index)).size === flat.length);
}

console.log('--- the limits are real ---');
{
  const huge = new ArrayBuffer(GLTF_LIMITS.bytes + 1);
  let e = null;
  try { readModel(huge); } catch (err) { e = err; }
  ok('an oversized file is refused before it is parsed', e instanceof GltfError, String(e));
  ok('and the message names the limit', /MB/.test(e.message), e.message);
  ok('the vertex ceiling is finite', GLTF_LIMITS.vertices > 0 && GLTF_LIMITS.vertices < 1e7);
}

console.log('--- normalising degenerate geometry ---');
{
  const flat = normaliseMesh({ vertices: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], faces: [] });
  ok('a flat plane does not divide by zero',
     flat.vertices.every((v) => Number.isFinite(v.x + v.y + v.z)), JSON.stringify(flat.vertices));
  const single = normaliseMesh({ vertices: [{ x: 5, y: 5, z: 5 }], faces: [] });
  ok('a single point collapses to the origin',
     near(single.vertices[0].x, 0) && near(single.vertices[0].y, 0), JSON.stringify(single.vertices));
  ok('and reports a usable scale', single.unitScale === 1);
  const none = normaliseMesh({ vertices: [], faces: [] });
  ok('an empty mesh is left alone', none.vertices.length === 0 && none.unitScale === 1);
}

console.log('--- the container parser on its own ---');
{
  const { doc, bin } = parseGlb(load('cube.glb'));
  ok('the JSON chunk comes back', doc.asset.version === '2.0');
  ok('and the binary chunk', bin instanceof ArrayBuffer && bin.byteLength > 0);
  ok('accessors read from it',
     readAccessor(doc, [bin], 0).length === 24,
     String(readAccessor(doc, [bin], 0).length));
  ok('an accessor index out of range returns null', readAccessor(doc, [bin], 99) === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
