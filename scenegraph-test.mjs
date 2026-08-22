const { composeTransform, relativeTransform, parentSlot, unrotatePoint,
        treeOrder, setParent, wouldCycle, childrenOf, ancestorsOf, depthOf,
        parentOf, MAX_DEPTH } = await import('../js/scenegraph.js');
const { rotatePoint } = await import('../js/camera3d.js');
const { createScene, createShape, worldTransforms, resolveFrame, sampleShape }
  = await import('../js/animation.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                 : (fail++, console.log(`  FAIL  ${n} ${x}`)); };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

const K = (time, over = {}) => ({
  time, x: 50, y: 50, z: 0, scale: 1, rotation: 0, rotX: 0, rotY: 0,
  opacity: 1, color: '#3fc6ff', ...over,
});
function scene(...defs) {
  const sc = createScene();
  sc.shapes = defs.map(([id, kfs, parent]) => {
    const s = createShape('cube');
    s.id = id;
    s.label = id.toUpperCase();
    s.keyframes = kfs;
    if (parent) s.parent = parent;
    return s;
  });
  return sc;
}
// The readings setParent binds against: both must interpolate exactly the
// way playback does.
const worldAt = (sc) => ({
  world: (shape, t) => worldTransforms(sc, t).get(shape.id),
  local: (shape, t) => sampleShape(shape, t),
});

console.log('--- undoing a rotation is not the same as negating it ---');
{
  // rotatePoint turns Z, then Y, then X. The true inverse reverses the
  // order as well as the signs; negating in place drifts once two axes are
  // in play, which is the classic version of this bug.
  let worst = 0;
  for (const rx of [0, 23, -67, 90]) {
    for (const ry of [0, 41, -12, 180]) {
      for (const rz of [0, 15, -95, 270]) {
        const p = { x: 3, y: -7, z: 11 };
        const back = unrotatePoint(rotatePoint(p, rx, ry, rz), rx, ry, rz);
        worst = Math.max(worst, Math.abs(back.x - p.x),
                         Math.abs(back.y - p.y), Math.abs(back.z - p.z));
      }
    }
  }
  ok('it round-trips through 64 orientations', worst < 1e-9, `worst ${worst}`);

  // And prove the naive version really is wrong, so this test is guarding
  // something rather than restating the implementation.
  let naiveWorst = 0;
  for (const [rx, ry, rz] of [[40, 50, 60], [23, -67, 41], [90, 45, 30]]) {
    const p = { x: 3, y: -7, z: 11 };
    const n = rotatePoint(rotatePoint(p, rx, ry, rz), -rx, -ry, -rz);
    naiveWorst = Math.max(naiveWorst, Math.abs(n.x - p.x),
                          Math.abs(n.y - p.y), Math.abs(n.z - p.z));
  }
  ok('negating in place does not round-trip', naiveWorst > 0.1,
     `worst drift ${naiveWorst.toFixed(3)} units`);
}

console.log('--- compose and its two inverses agree ---');
{
  const parent = { x: 20, y: -5, z: 8, scale: 2, rotation: 30, rotX: 15, rotY: -40, opacity: 0.8 };
  const local = { x: 7, y: 3, z: -2, scale: 0.5, rotation: -10, rotX: 5, rotY: 12, opacity: 0.5 };
  const world = composeTransform(parent, local);

  const backLocal = relativeTransform(parent, world);
  ok('relativeTransform recovers the child',
     ['x','y','z','scale','rotation','rotX','rotY','opacity']
       .every((k) => near(backLocal[k], local[k], 1e-9)),
     JSON.stringify(backLocal));

  const backParent = parentSlot(local, world);
  ok('parentSlot recovers the parent',
     ['x','y','z','scale','rotation','rotX','rotY','opacity']
       .every((k) => near(backParent[k], parent[k], 1e-9)),
     JSON.stringify(backParent));

  ok('an identity parent changes nothing',
     near(composeTransform({ x: 0, y: 0, z: 0, scale: 1, rotation: 0, rotX: 0, rotY: 0, opacity: 1 },
                           local).x, local.x));
  ok('scale multiplies', near(composeTransform(parent, local).scale, 1));
  ok('opacity multiplies', near(world.opacity, 0.4));
}

console.log('--- a flat scene is untouched ---');
{
  const sc = scene(['a', [K(0)]], ['b', [K(0, { x: 80 })]]);
  const w = worldTransforms(sc, 0);
  ok('positions are the shapes own', w.get('a').x === 50 && w.get('b').x === 80);
  ok('the outliner is the plain list',
     treeOrder(sc).map((r) => r.shape.id).join() === 'a,b');
  ok('every row is at the root', treeOrder(sc).every((r) => r.depth === 0));
  ok('nothing has a parent', sc.shapes.every((s) => !s.parent));
}

console.log('--- parenting never moves anything ---');
{
  const sc = scene(['car', [K(0, { x: 50 }), K(5, { x: 80 })]],
                   ['wheel', [K(0, { x: 60 })]]);
  const at = worldAt(sc);
  ok('the edit is accepted', setParent(sc, 'wheel', 'car', at, 0) === true);
  ok('the wheel stays exactly where it was', near(at.world(sc.shapes[1], 0).x, 60, 1e-9),
     String(at.world(sc.shapes[1], 0).x));
  ok('and now moves with the car', near(at.world(sc.shapes[1], 5).x, 90, 1e-9),
     String(at.world(sc.shapes[1], 5).x));
  ok('the car is unaffected', near(at.world(sc.shapes[0], 5).x, 80));
}

console.log('--- binding at a moment other than zero ---');
{
  const sc = scene(['p', [K(0, { x: 0 }), K(4, { x: 40 })]],
                   ['c', [K(0, { x: 10 }), K(4, { x: 30 })]]);
  const at = worldAt(sc);
  const before = at.world(sc.shapes[1], 2).x;
  setParent(sc, 'c', 'p', at, 2);
  ok('the child is still where it was at the binding time',
     near(at.world(sc.shapes[1], 2).x, before, 1e-9), `${before} -> ${at.world(sc.shapes[1], 2).x}`);
}

console.log('--- a parent turning carries its children round ---');
{
  const sc = scene(['hub', [K(0, { x: 50, rotation: 0 }), K(5, { x: 50, rotation: 90 })]],
                   ['arm', [K(0, { x: 70, y: 50 })]]);
  const at = worldAt(sc);
  setParent(sc, 'arm', 'hub', at, 0);
  const turned = at.world(sc.shapes[1], 5);
  ok('a quarter turn swings the arm through 90 degrees',
     near(turned.x, 50, 1e-9) && near(turned.y, 70, 1e-9),
     `${turned.x.toFixed(3)}, ${turned.y.toFixed(3)}`);
  ok('and the arm inherits the rotation', near(turned.rotation, 90));
}

console.log('--- a child spinning does not orbit its bind point ---');
{
  // The bind offset has to live in the parent's frame. In the child's own
  // frame it turns with the child, and a shape asked to spin on the spot
  // swings around a point twenty units away instead.
  const sc = scene(['p', [K(0, { x: 50 })]],
                   ['c', [K(0, { x: 70, rotation: 0 }), K(5, { x: 70, rotation: 180 })]]);
  const at = worldAt(sc);
  setParent(sc, 'c', 'p', at, 0);
  ok('it stays put through half a turn',
     near(at.world(sc.shapes[1], 0).x, 70, 1e-9) && near(at.world(sc.shapes[1], 5).x, 70, 1e-9),
     `${at.world(sc.shapes[1], 0).x} -> ${at.world(sc.shapes[1], 5).x}`);
  ok('while its rotation still changes', at.world(sc.shapes[1], 5).rotation === 180);
}

console.log('--- scale and opacity descend ---');
{
  const sc = scene(['p', [K(0, { scale: 1, opacity: 1 }), K(4, { scale: 2, opacity: 0.5 })]],
                   ['c', [K(0, { x: 50, scale: 0.5, opacity: 0.8 })]]);
  const at = worldAt(sc);
  setParent(sc, 'c', 'p', at, 0);
  ok('scale multiplies down the chain', near(at.world(sc.shapes[1], 4).scale, 1, 1e-9),
     String(at.world(sc.shapes[1], 4).scale));
  ok('a faded parent fades its children', near(at.world(sc.shapes[1], 4).opacity, 0.4, 1e-9),
     String(at.world(sc.shapes[1], 4).opacity));
}

console.log('--- loops are refused at the edit, not survived per frame ---');
{
  const sc = scene(['a', [K(0)]], ['b', [K(0)]], ['c', [K(0)]]);
  const at = worldAt(sc);
  setParent(sc, 'b', 'a', at, 0);
  setParent(sc, 'c', 'b', at, 0);
  ok('a shape cannot parent to itself', wouldCycle(sc, 'a', 'a'));
  ok('nor to its own child', wouldCycle(sc, 'a', 'b'));
  ok('nor to its grandchild', wouldCycle(sc, 'a', 'c'));
  ok('a sibling is fine', wouldCycle(sc, 'c', 'a') === false);
  ok('setParent refuses the loop', setParent(sc, 'a', 'c', at, 0) === false);
  ok('and the scene is unchanged', !sc.shapes[0].parent);
  ok('an unknown parent is refused', setParent(sc, 'a', 'nope', at, 0) === false);
  ok('an unknown child is refused', setParent(sc, 'nope', 'a', at, 0) === false);
}

console.log('--- a scene that already contains a loop still draws ---');
{
  // Hand-built, the way a corrupted or hand-edited file would arrive. It
  // must not overflow the stack: a wrongly-placed object is recoverable, a
  // frame that never renders is not.
  const sc = scene(['a', [K(0)], 'b'], ['b', [K(0)], 'a']);
  let threw = null;
  try { worldTransforms(sc, 0); } catch (e) { threw = e; }
  ok('resolving does not throw', threw === null, threw && threw.message);
  ok('every shape still gets a transform', worldTransforms(sc, 0).size === 2);
  ok('the outliner still lists both', treeOrder(sc).length === 2);
  let frameThrew = null;
  try { resolveFrame(sc, 0); } catch (e) { frameThrew = e; }
  ok('and a frame still resolves', frameThrew === null, frameThrew && frameThrew.message);
}

console.log('--- unparenting leaves an object where it was left ---');
{
  const sc = scene(['p', [K(0, { x: 50 }), K(5, { x: 90 })]],
                   ['c', [K(0, { x: 60 })]]);
  const at = worldAt(sc);
  setParent(sc, 'c', 'p', at, 0);
  const carried = at.world(sc.shapes[1], 5).x;
  ok('the child was carried to 100', near(carried, 100, 1e-9), String(carried));
  setParent(sc, 'c', null, at, 5);
  ok('unparenting keeps it at 100', near(at.world(sc.shapes[1], 5).x, carried, 1e-9),
     String(at.world(sc.shapes[1], 5).x));
  ok('and it has no parent now', !sc.shapes[1].parent);
  ok('nor a stale bind offset', sc.shapes[1].bind === undefined);
}

console.log('--- the outliner reads as a tree ---');
{
  const sc = scene(['root', [K(0)]], ['kid', [K(0)]], ['grandkid', [K(0)]], ['other', [K(0)]]);
  const at = worldAt(sc);
  setParent(sc, 'kid', 'root', at, 0);
  setParent(sc, 'grandkid', 'kid', at, 0);
  const rows = treeOrder(sc);
  ok('parents come before their children',
     rows.map((r) => r.shape.id).join() === 'root,kid,grandkid,other',
     rows.map((r) => r.shape.id).join());
  ok('depth counts the nesting',
     rows.map((r) => r.depth).join() === '0,1,2,0', rows.map((r) => r.depth).join());
  ok('every shape appears exactly once',
     new Set(rows.map((r) => r.shape.id)).size === sc.shapes.length);
  ok('childrenOf finds direct children only',
     childrenOf(sc, 'root').map((s) => s.id).join() === 'kid');
  ok('ancestorsOf runs root-first',
     ancestorsOf(sc, 'grandkid').map((s) => s.id).join() === 'root,kid');
  ok('depthOf agrees with the rows', depthOf(sc, 'grandkid') === 2);
  ok('parentOf resolves the shape', parentOf(sc, 'kid').id === 'root');
  ok('a root has no parent', parentOf(sc, 'root') === null);
}

console.log('--- an orphan is shown, not swallowed ---');
{
  const sc = scene(['a', [K(0)]], ['lost', [K(0)], 'deleted-parent']);
  ok('it still appears in the outliner', treeOrder(sc).length === 2);
  ok('at the root', treeOrder(sc).find((r) => r.shape.id === 'lost').depth === 0);
  ok('and still renders at its own transform',
     worldTransforms(sc, 0).get('lost').x === 50);
}

console.log('--- the hierarchy has a floor ---');
{
  const sc = createScene();
  sc.shapes = [];
  for (let i = 0; i < MAX_DEPTH + 4; i++) {
    const s = createShape('cube');
    s.id = `n${i}`;
    s.keyframes = [K(0)];
    sc.shapes.push(s);
  }
  const at = worldAt(sc);
  let accepted = 0;
  for (let i = 1; i < sc.shapes.length; i++) {
    if (setParent(sc, `n${i}`, `n${i - 1}`, at, 0)) accepted++;
  }
  ok('nesting stops at the limit', accepted < sc.shapes.length - 1,
     `${accepted} of ${sc.shapes.length - 1} accepted`);
  ok('and resolving the chain terminates', worldTransforms(sc, 0).size === sc.shapes.length);
}

console.log('--- new shapes declare the field so scenes round-trip ---');
{
  ok('createShape carries parent', 'parent' in createShape('cube'));
  ok('and it starts at the root', createShape('cube').parent === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
