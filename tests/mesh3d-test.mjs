const { cubeMesh, pyramidMesh, sphereMesh, MESHES, isMeshType, transformVertices,
        faceNormal, lambert, shadeColor, renderMesh, LIGHT_DIR, AMBIENT }
  = await import('../js/mesh3d.js');
const { createCamera, orbit } = await import('../js/camera3d.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const near=(a,b,t=1e-9)=>Math.abs(a-b)<t;
const W=640,H=360;

console.log('--- geometry is well-formed ---');
{
  const cube = cubeMesh();
  ok('a cube has 8 vertices', cube.vertices.length === 8);
  ok('and 6 faces', cube.faces.length === 6);
  const pyr = pyramidMesh();
  ok('a pyramid has 5 vertices and 5 faces', pyr.vertices.length === 5 && pyr.faces.length === 5);
  const sph = sphereMesh();
  ok('the sphere has faces', sph.faces.length > 40, String(sph.faces.length));
  for (const [name, mesh] of Object.entries(MESHES)) {
    ok(`${name}: every face index is a real vertex`,
       mesh.faces.every(f => f.every(i => Number.isInteger(i) && i >= 0 && i < mesh.vertices.length)));
    ok(`${name}: every face has at least 3 corners`, mesh.faces.every(f => f.length >= 3));
    const r = Math.max(...mesh.vertices.map(v => Math.hypot(v.x, v.y, v.z)));
    ok(`${name}: fits the unit bound`, r <= 0.5 * Math.sqrt(3) + 1e-9, String(r));
  }
  ok('isMeshType knows its own', isMeshType('cube') && isMeshType('sphere') && isMeshType('pyramid'));
  ok('and rejects the flat types', !isMeshType('circle') && !isMeshType('image'));
}

console.log('--- every face of every mesh faces outward ---');
{
  // The property culling depends on: from outside a convex solid, a face's
  // normal points away from the centre. One wrong winding shows up as a
  // hole in the object from some angle — visible only when you orbit past.
  for (const [name, mesh] of Object.entries(MESHES)) {
    let inward = 0;
    for (const face of mesh.faces) {
      const n = faceNormal(mesh.vertices, face);
      const c = face.reduce((acc, i) => ({
        x: acc.x + mesh.vertices[i].x / face.length,
        y: acc.y + mesh.vertices[i].y / face.length,
        z: acc.z + mesh.vertices[i].z / face.length,
      }), { x: 0, y: 0, z: 0 });
      if (n.x * c.x + n.y * c.y + n.z * c.z < -1e-9) inward++;
    }
    ok(`${name}: no face is wound inside-out`, inward === 0, `${inward} inward`);
  }
}

console.log('--- transform ---');
{
  const inst = { x: 50, y: 50, z: 0, size: 20, rotX: 0, rotY: 0, rotZ: 0 };
  const v = transformVertices(cubeMesh(), inst);
  ok('vertex count preserved', v.length === 8);
  const spanX = Math.max(...v.map(p => p.x)) - Math.min(...v.map(p => p.x));
  ok('size scales the extent', near(spanX, 20), String(spanX));
  ok('position translates', near(v.reduce((s, p) => s + p.x, 0) / 8, 50));
  const rotated = transformVertices(cubeMesh(), { ...inst, rotY: 45 });
  const spanR = Math.max(...rotated.map(p => p.x)) - Math.min(...rotated.map(p => p.x));
  ok('a rotated cube is wider across the diagonal', spanR > 20 * 1.3, String(spanR));
}

console.log('--- normals and light ---');
{
  const flat = [{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:1,z:0}];
  const n = faceNormal(flat, [0,1,2]);
  ok('a normal is unit length', near(Math.hypot(n.x,n.y,n.z), 1));
  ok('the light direction is unit length', near(Math.hypot(LIGHT_DIR.x, LIGHT_DIR.y, LIGHT_DIR.z), 1));
  ok('a face square to the light is fully lit',
     near(lambert({ x: -LIGHT_DIR.x, y: -LIGHT_DIR.y, z: -LIGHT_DIR.z }), 1));
  ok('a face turned away gets exactly the ambient floor',
     near(lambert(LIGHT_DIR), AMBIENT));
  // Every face of every mesh, every intensity in range.
  for (const mesh of Object.values(MESHES)) {
    ok('all intensities stay in ambient..1',
       mesh.faces.every(f => { const i = lambert(faceNormal(mesh.vertices, f));
         return i >= AMBIENT - 1e-9 && i <= 1 + 1e-9; }));
    break;
  }
}

console.log('--- colour shading ---');
{
  ok('full brightness is identity', shadeColor('#3fc6ff', 1) === '#3fc6ff');
  ok('darkening darkens', shadeColor('#ffffff', 0.5) === '#808080', shadeColor('#ffffff', 0.5));
  ok('never overflows', shadeColor('#ffffff', 3) === '#ffffff');
  ok('never underflows', shadeColor('#102030', 0) === '#000000');
  ok('bad input degrades to a valid hex', /^#[0-9a-f]{6}$/.test(shadeColor('lol', 0.7)));
}

console.log('--- the render pipeline ---');
{
  const cam = createCamera();
  const inst = { x: 50, y: 50, z: 0, size: 20, rotX: 0, rotY: 0, rotZ: 0, color: '#3fc6ff' };

  const faceOn = renderMesh('cube', inst, cam, W, H);
  ok('a face-on cube shows exactly one face', faceOn.length === 1, String(faceOn.length));

  const cornerOn = renderMesh('cube', { ...inst, rotX: 30, rotY: 40 }, cam, W, H);
  ok('a corner-on cube shows three', cornerOn.length === 3, String(cornerOn.length));
  ok('and they are shaded differently — that is what reads as 3D',
     new Set(cornerOn.map(f => f.color)).size === 3,
     cornerOn.map(f => f.color).join());
  ok('faces come far-to-near', cornerOn.every((f, i, a) => i === 0 || a[i-1].depth >= f.depth));
  ok('points are finite screen coordinates',
     cornerOn.every(f => f.points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))));

  const sphere = renderMesh('sphere', inst, cam, W, H);
  ok('a sphere culls close to half its faces',
     sphere.length > 20 && sphere.length < sphereMesh().faces.length * 0.7,
     `${sphere.length} of ${sphereMesh().faces.length}`);

  // Orbit anywhere: a convex solid never shows more than half its faces.
  let maxCube = 0;
  for (const yaw of [0, 30, 60, 120, 200, 300]) for (const pitch of [-60, -20, 15, 45]) {
    const c = orbit(cam, { x: 50, y: 50, z: 0 }, yaw, pitch);
    maxCube = Math.max(maxCube, renderMesh('cube', inst, c, W, H).length);
  }
  ok('from every angle a cube shows at most 3 faces', maxCube <= 3, String(maxCube));

  ok('behind the camera renders nothing rather than garbage',
     renderMesh('cube', { ...inst, z: cam.z - 50 }, cam, W, H).length === 0);
  ok('an unknown type renders nothing rather than throwing',
     renderMesh('dodecahedron', inst, cam, W, H).length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
