const { pickAt, dragToWorld, screenRadius, selectionOutline, convexHull }
  = await import('../js/picking.js');
const { createCamera, projectPoint, toCameraSpace, framingDistance }
  = await import('../js/camera3d.js');
const { createScene, createShape, resolveFrame, enable3D, sampleShape }
  = await import('../js/animation.js');
const { registerMesh } = await import('../js/mesh3d.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                 : (fail++, console.log(`  FAIL  ${n} ${x}`)); };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

const W = 640, H = 360;
const K = (over = {}) => ({
  time: 0, x: 50, y: 50, z: 0, scale: 1, rotation: 0, rotX: 0, rotY: 0,
  opacity: 1, color: '#3fc6ff', ...over,
});
function scene3d(...defs) {
  const sc = createScene();
  enable3D(sc);
  sc.shapes = defs.map(([id, over, type]) => {
    const s = createShape(type || 'cube');
    s.id = id;
    s.label = id;
    s.keyframes = [K(over)];
    return s;
  });
  return sc;
}
const frameOf = (sc) => resolveFrame(sc, 0);
const pick = (sc, x, y) => {
  const f = frameOf(sc);
  return pickAt(f.order, f.camera, W, H, x, y);
};
const screenOf = (sc, id) => {
  const f = frameOf(sc);
  const e = f.order.find((o) => o.shape.id === id);
  return projectPoint({ x: e.p.x, y: e.p.y, z: e.p.z || 0 }, f.camera, W, H);
};

console.log('--- clicking on a thing picks that thing ---');
{
  const sc = scene3d(['a', { x: 30 }], ['b', { x: 70 }]);
  const a = screenOf(sc, 'a');
  const b = screenOf(sc, 'b');
  ok('the two objects are at different places on screen', Math.abs(a.x - b.x) > 40,
     `${a.x.toFixed(0)} vs ${b.x.toFixed(0)}`);
  ok('clicking the left one picks it', (pick(sc, a.x, a.y) || {}).shape?.id === 'a');
  ok('clicking the right one picks it', (pick(sc, b.x, b.y) || {}).shape?.id === 'b');
  ok('clicking the corner picks nothing', pick(sc, 2, 2) === null);
  ok('clicking outside the canvas picks nothing', pick(sc, -50, -50) === null);
}

console.log('--- overlapping objects: the one you can see wins ---');
{
  // Same screen position, different depths. Picking must agree with what
  // was painted, or you select something hidden behind what you clicked.
  const sc = scene3d(['far', { z: 60 }], ['near', { z: -20 }]);
  const p = screenOf(sc, 'near');
  const hit = pick(sc, p.x, p.y);
  ok('the nearer object is picked', hit && hit.shape.id === 'near',
     hit ? hit.shape.id : 'nothing');

  // And the same when the list order is reversed, so the answer comes from
  // depth rather than from which happened to be first.
  sc.shapes.reverse();
  const again = pick(sc, p.x, p.y);
  ok('and still when the list order is reversed', again && again.shape.id === 'near',
     again ? again.shape.id : 'nothing');
}

console.log('--- invisible things are not clickable ---');
{
  const sc = scene3d(['ghost', { opacity: 0 }], ['solid', { x: 20 }]);
  const p = screenOf(sc, 'ghost');
  ok('a fully transparent object is skipped', (pick(sc, p.x, p.y) || {}).shape?.id !== 'ghost');
  const faded = scene3d(['faint', { opacity: 0.3 }]);
  const q = screenOf(faded, 'faint');
  ok('but a merely faint one is still pickable',
     (pick(faded, q.x, q.y) || {}).shape?.id === 'faint');
}

console.log('--- an object behind the camera is not clickable ---');
{
  const sc = scene3d(['behind', { z: -10000 }]);
  let threw = null;
  let hit;
  try { hit = pick(sc, W / 2, H / 2); } catch (e) { threw = e; }
  ok('picking does not throw', threw === null, threw && threw.message);
  ok('and finds nothing', !hit || hit.shape.id !== 'behind');
}

console.log('--- how big a thing looks depends on how far away it is ---');
{
  const camera = createCamera();
  const nearR = screenRadius({}, { x: 50, y: 50, z: -30, scale: 1 }, camera, W, H);
  const farR = screenRadius({}, { x: 50, y: 50, z: 120, scale: 1 }, camera, W, H);
  ok('a nearer object has a bigger hit area', nearR > farR * 1.3,
     `${nearR.toFixed(1)} vs ${farR.toFixed(1)}`);
  ok('a bigger object has a bigger hit area',
     screenRadius({}, { x: 50, y: 50, z: 0, scale: 2 }, camera, W, H)
     > screenRadius({}, { x: 50, y: 50, z: 0, scale: 1 }, camera, W, H));
  ok('a zero-scale object still has a clickable minimum',
     screenRadius({}, { x: 50, y: 50, z: 0, scale: 0 }, camera, W, H) > 0);
  ok('a negative scale is not a negative radius',
     screenRadius({}, { x: 50, y: 50, z: 0, scale: -2 }, camera, W, H) > 0);
}

console.log('--- dragging moves things the distance you dragged ---');
{
  // The real test of the drag maths: move an object by a screen delta, then
  // re-project it. It must land where the pointer went, whatever the depth
  // or the camera's orientation. A fixed pixels-to-world factor passes at
  // one depth and drifts everywhere else.
  const camera = createCamera();
  let worst = 0;
  for (const z of [-40, 0, 50, 150]) {
    for (const [dx, dy] of [[60, 0], [0, -45], [-80, 33]]) {
      const start = { x: 50, y: 50, z };
      const before = projectPoint(start, camera, W, H);
      const d = dragToWorld(dx, dy, start, camera, W, H);
      const after = projectPoint(
        { x: start.x + d.x, y: start.y + d.y, z: start.z + d.z }, camera, W, H);
      worst = Math.max(worst, Math.abs((after.x - before.x) - dx),
                       Math.abs((after.y - before.y) - dy));
    }
  }
  ok('the object lands under the pointer at every depth', worst < 0.01,
     `worst error ${worst.toFixed(4)}px`);
}

console.log('--- and still does when the camera is turned ---');
{
  let worst = 0;
  for (const rotY of [0, 35, -80, 170]) {
    for (const rotX of [0, 25, -40]) {
      const camera = { ...createCamera(), rotX, rotY,
                       x: 50, y: 50, z: -framingDistance(50) };
      const start = { x: 50, y: 50, z: 0 };
      const before = projectPoint(start, camera, W, H);
      if (!before.visible) continue;
      const d = dragToWorld(70, -30, start, camera, W, H);
      const after = projectPoint(
        { x: start.x + d.x, y: start.y + d.y, z: start.z + d.z }, camera, W, H);
      worst = Math.max(worst, Math.abs((after.x - before.x) - 70),
                       Math.abs((after.y - before.y) + 30));
    }
  }
  ok('a turned camera still drags along the screen', worst < 0.01,
     `worst error ${worst.toFixed(4)}px`);
}

console.log('--- a flat scene drags in its own units ---');
{
  const d = dragToWorld(W / 2, H / 4, { x: 50, y: 50, z: 0 }, null, W, H);
  ok('half the canvas across is fifty units', near(d.x, 50), String(d.x));
  ok('a quarter down is twenty-five', near(d.y, 25), String(d.y));
  ok('and depth does not move', d.z === 0);
}

console.log('--- a drag near the camera does not explode ---');
{
  const camera = createCamera();
  const d = dragToWorld(10, 10, { x: 50, y: 50, z: camera.z + camera.near }, camera, W, H);
  ok('it produces finite numbers', Number.isFinite(d.x + d.y + d.z), JSON.stringify(d));
}

console.log('--- the selection outline follows the shape ---');
{
  // Face-on, a cube's silhouette really is a square, so the interesting
  // case is a turned one: six points, which no bounding box would give.
  const sc = scene3d(['c', { x: 50, rotY: 32, rotX: 21 }]);
  const f = frameOf(sc);
  const hull = selectionOutline(sc.shapes[0], f.order[0].p, f.camera, W, H);
  ok('a turned cube outlines as a hexagon, not a box', hull.length === 6,
     `${hull.length} points`);
  ok('every point is on screen-ish',
     hull.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));

  // Scaling the object up must grow the outline; a hull that ignored the
  // transform would be the giveaway.
  const big = scene3d(['c', { scale: 3 }]);
  const bf = frameOf(big);
  const bigHull = selectionOutline(big.shapes[0], bf.order[0].p, bf.camera, W, H);
  const span = (h) => Math.max(...h.map((p) => p[0])) - Math.min(...h.map((p) => p[0]));
  ok('a bigger object gets a bigger outline', span(bigHull) > span(hull) * 2,
     `${span(hull).toFixed(0)} -> ${span(bigHull).toFixed(0)}`);

  const flat = createScene();
  const s2 = createShape('circle');
  s2.keyframes = [K()];
  flat.shapes = [s2];
  const ff = resolveFrame(flat, 0);
  const box = selectionOutline(s2, ff.order[0].p, ff.camera, W, H);
  ok('a 2D shape gets a box', box.length === 4, String(box.length));
}

console.log('--- an imported model outlines its own shape ---');
{
  // A long thin model: a circle around it would point mostly at empty
  // space, which is the reason the hull exists.
  const type = registerMesh('picktest', {
    vertices: [
      { x: -0.5, y: -0.05, z: 0 }, { x: 0.5, y: -0.05, z: 0 },
      { x: 0.5, y: 0.05, z: 0 }, { x: -0.5, y: 0.05, z: 0 },
    ],
    faces: [[0, 1, 2], [0, 2, 3]],
  });
  const sc = scene3d(['m', { x: 50 }, type]);
  const f = frameOf(sc);
  const hull = selectionOutline(sc.shapes[0], f.order[0].p, f.camera, W, H);
  const wide = Math.max(...hull.map((p) => p[0])) - Math.min(...hull.map((p) => p[0]));
  const tall = Math.max(...hull.map((p) => p[1])) - Math.min(...hull.map((p) => p[1]));
  ok('the outline is as wide and thin as the model', wide > tall * 4,
     `${wide.toFixed(0)} x ${tall.toFixed(0)}`);
}

console.log('--- the hull itself ---');
{
  const square = convexHull([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5]]);
  ok('an interior point is dropped', square.length === 4, String(square.length));
  ok('the corners survive',
     [[0, 0], [10, 0], [10, 10], [0, 10]]
       .every(([x, y]) => square.some((p) => p[0] === x && p[1] === y)));
  ok('two points come back as they are', convexHull([[0, 0], [1, 1]]).length === 2);
  ok('one point does not throw', convexHull([[3, 3]]).length === 1);
  ok('no points does not throw', convexHull([]).length === 0);
  const collinear = convexHull([[0, 0], [1, 1], [2, 2], [3, 3]]);
  ok('collinear points do not collapse to nothing', collinear.length >= 2,
     String(collinear.length));
  const dupes = convexHull([[5, 5], [5, 5], [5, 5], [5, 5]]);
  ok('identical points do not collapse to nothing', dupes.length >= 1, String(dupes.length));

  // Cost, not just correctness: gift-wrapping on a near-circular silhouette
  // is quadratic, and an imported model has tens of thousands of vertices.
  const ring = [];
  for (let i = 0; i < 20000; i++) {
    const a = (i / 20000) * Math.PI * 2;
    ring.push([Math.cos(a) * 500, Math.sin(a) * 500]);
  }
  const started = Date.now();
  const hull = convexHull(ring);
  const took = Date.now() - started;
  ok('20,000 points on a circle hull quickly', took < 400, `${took}ms`);
  ok('and every one is on the hull', hull.length > 19000, String(hull.length));
}

console.log('--- picking sees composed parents ---');
{
  const { setParent } = await import('../js/scenegraph.js');
  const { worldTransforms } = await import('../js/animation.js');
  const sc = scene3d(['parent', { x: 20 }], ['child', { x: 50 }]);
  const sampler = {
    world: (shape, t) => worldTransforms(sc, t).get(shape.id),
    local: (shape, t) => sampleShape(shape, t),
  };
  setParent(sc, 'child', 'parent', sampler, 0);
  // Move the parent; the child's clickable position must move with it.
  const before = screenOf(sc, 'child');
  sc.shapes[0].keyframes[0].x = 80;
  const after = screenOf(sc, 'child');
  ok('the child moved on screen with its parent', Math.abs(after.x - before.x) > 20,
     `${before.x.toFixed(0)} -> ${after.x.toFixed(0)}`);
  const hit = pick(sc, after.x, after.y);
  ok('and is clickable where it now appears', hit && hit.shape.id === 'child',
     hit ? hit.shape.id : 'nothing');
  ok('clicking where it used to be no longer hits it',
     (pick(sc, before.x, before.y) || {}).shape?.id !== 'child');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
