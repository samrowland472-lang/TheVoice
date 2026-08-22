const { actOnScene, castActors, matchScore, sceneNames }
  = await import('../js/casting.js');
const { parseInstruction } = await import('../js/verbs.js');
const { createScene, createShape, sampleShape, worldTransforms }
  = await import('../js/animation.js');
const { setParent } = await import('../js/scenegraph.js');
const { registerMesh } = await import('../js/mesh3d.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log(`  PASS  ${n}`))
                                 : (fail++, console.log(`  FAIL  ${n} ${x}`)); };

let ids = 0;
const K = (over = {}) => ({
  time: 0, x: 50, y: 50, z: 0, scale: 1, rotation: 0, rotX: 0, rotY: 0,
  opacity: 1, color: '#3fc6ff', ...over,
});
function scene(...defs) {
  const sc = createScene();
  sc.shapes = defs.map(([label, type, over]) => {
    const s = createShape(type || 'cube');
    s.id = `s${++ids}`;
    s.label = label;
    s.keyframes = [K(over)];
    return s;
  });
  return sc;
}
const sampler = (sc) => ({
  world: (shape, t) => worldTransforms(sc, t).get(shape.id),
  local: (shape, t) => sampleShape(shape, t),
});
let mintN = 0;
const mint = () => `m${++mintN}`;
const cast = (sc, text, opts) =>
  castActors(sc, parseInstruction(text, { names: sceneNames(sc) }), opts || {});

console.log('--- the sentence names things that are already there ---');
{
  const sc = scene(['Dragon', 'cube'], ['Tower', 'cube'], ['Floor', 'rect']);
  const c = cast(sc, 'the dragon smashes into the tower');
  ok('the dragon is the subject', c.subject && c.subject.label === 'Dragon',
     c.subject ? c.subject.label : 'nothing');
  ok('the tower is the object', c.object && c.object.label === 'Tower',
     c.object ? c.object.label : 'nothing');
  ok('the floor is left out of it',
     c.subject.label !== 'Floor' && c.object.label !== 'Floor');
}

console.log('--- and never casts one object in both roles ---');
{
  const sc = scene(['Tower', 'cube']);
  const c = cast(sc, 'the tower smashes into the tower');
  ok('the subject is found', !!c.subject);
  ok('but not reused as its own victim',
     !c.object || c.object.id !== c.subject.id,
     c.object ? c.object.label : 'nothing');
}

console.log('--- a name beats a shape kind ---');
{
  // "Anvil" is a cube; "the anvil" must reach it rather than whichever
  // cube happens to come first.
  const sc = scene(['Crate', 'cube'], ['Anvil', 'cube']);
  const c = cast(sc, 'the anvil falls');
  ok('the named one wins', c.subject.label === 'Anvil', c.subject.label);
  ok('scored as a name, not as a kind', c.subjectScore >= 60, String(c.subjectScore));
}

console.log('--- a partial name still finds it ---');
{
  const sc = scene(['Dragon Body', 'cube'], ['Stone Tower', 'cube']);
  const c = cast(sc, 'the dragon hits the tower');
  ok('a word inside a label matches', c.subject.label === 'Dragon Body', c.subject.label);
  ok('and so does the other', c.object.label === 'Stone Tower', c.object.label);
}

console.log('--- the whole model, not one of its parts ---');
{
  const sc = scene(['Dragon', 'cube'], ['Dragon Wing', 'cube'], ['Tower', 'cube']);
  setParent(sc, sc.shapes[1].id, sc.shapes[0].id, sampler(sc), 0);
  const c = cast(sc, 'the dragon smashes the tower');
  ok('the root is cast, not the wing', c.subject.label === 'Dragon', c.subject.label);
}

console.log('--- nothing matching means nothing is cast ---');
{
  const sc = scene(['Dragon', 'cube']);
  const c = cast(sc, 'the aeroplane lands');
  // "aeroplane" is not a shape word, so the parser invents a sphere for
  // the subject; nothing in the scene answers to it.
  ok('no confident subject', c.subjectScore === 0, String(c.subjectScore));
  ok('and an empty scene casts nothing',
     castActors(createScene(), parseInstruction('the cube spins')).subject === null);
  ok('a scene with no names offers no vocabulary', sceneNames(createScene()).size === 0);
  ok('names come from the labels',
     sceneNames(scene(['Stone Tower', 'cube'])).has('tower'));
  ok('but not two-letter fragments',
     !sceneNames(scene(['Ax B', 'cube'])).has('ax'));
}

console.log('--- "it" means whatever is selected ---');
{
  const sc = scene(['Alpha', 'cube'], ['Beta', 'cube']);
  const c = cast(sc, 'spin it', { selectedIds: [sc.shapes[1].id] });
  ok('the selection is the subject', c.subject && c.subject.label === 'Beta',
     c.subject ? c.subject.label : 'nothing');
  const none = cast(sc, 'spin it', { selectedIds: [] });
  // With nothing selected, "it" resolves as the shape noun it is — a cube
  // — which the scene does have. That is a match, not a guess.
  ok('with nothing selected it falls back to the noun', !!none.subject);
}

console.log('--- an imported model is reachable by a solid noun ---');
{
  const type = registerMesh('casttest', {
    vertices: [{ x: -0.5, y: 0, z: 0 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0.5, z: 0 }],
    faces: [[0, 1, 2]],
  });
  const sc = scene(['Imported Thing', type]);
  const c = cast(sc, 'the cube spins');
  ok('a model answers a solid noun weakly', !!c.subject, 'nothing');
  ok('but scores low enough that a real cube would beat it',
     c.subjectScore < 25, String(c.subjectScore));
}

console.log('--- staging onto existing objects ---');
{
  const sc = scene(['Ball', 'sphere', { x: 15, y: 40 }], ['Wall', 'cube', { x: 75, y: 55 }]);
  const before = sc.shapes.length;
  const result = actOnScene(sc, 'the ball smashes into the wall', { mintId: mint });
  ok('it acted', !!result);
  ok('on the objects that were there', result.cast.subject.label === 'Ball'
     && result.cast.object.label === 'Wall');
  ok('debris was added', result.added > 0, String(result.added));
  ok('the originals are still present',
     sc.shapes.filter((s) => s.label === 'Ball' || s.label === 'Wall').length === 2);
  ok('more shapes than before', sc.shapes.length > before);

  const ball = sc.shapes.find((s) => s.label === 'Ball');
  ok('the ball starts where it stood', Math.abs(ball.keyframes[0].x - 15) < 0.01,
     String(ball.keyframes[0].x));
  ok('and travels toward the wall',
     sampleShape(ball, sc.duration * 0.5).x > 15 + 10,
     String(sampleShape(ball, sc.duration * 0.5).x));

  const wall = sc.shapes.find((s) => s.label === 'Wall');
  ok('the wall is intact at the start', sampleShape(wall, 0).opacity === 1);
  ok('and gone by the end', sampleShape(wall, sc.duration).opacity < 0.01,
     String(sampleShape(wall, sc.duration).opacity));

  // Debris must come from where the wall was, not from the middle.
  const debris = sc.shapes.filter((s) => /^Debris/.test(s.label));
  ok('debris starts at the wall',
     debris.every((d) => Math.abs(d.keyframes[0].x - 75) < 0.01),
     debris.length ? String(debris[0].keyframes[0].x) : 'none');
  ok('and is invisible before the impact',
     debris.every((d) => sampleShape(d, 0).opacity === 0));
  ok('but visible after it',
     debris.some((d) => sampleShape(d, sc.duration * 0.75).opacity > 0.1));
  ok('every generated keyframe is an ordinary one',
     debris.every((d) => d.keyframes.every((k) =>
       Number.isFinite(k.time) && Number.isFinite(k.x) && Number.isFinite(k.scale)
       && typeof k.color === 'string')));
}

console.log('--- debris inherits the victim, not a default ---');
{
  const sc = scene(['Ball', 'sphere', { x: 20 }],
                   ['Tower', 'cube', { x: 70, color: '#e4483d' }]);
  actOnScene(sc, 'the ball obliterates the tower', { mintId: mint });
  const debris = sc.shapes.filter((s) => /^Debris/.test(s.label));
  ok('breaking a red tower makes red rubble',
     debris.length > 0 && debris.every((d) => d.keyframes.at(-1).color === '#e4483d'),
     debris.length ? debris[0].keyframes.at(-1).color : 'no debris');
}

console.log('--- an intact target is knocked back, not destroyed ---');
{
  const sc = scene(['Ball', 'sphere', { x: 20 }], ['Crate', 'cube', { x: 70 }]);
  const before = sc.shapes.length;
  actOnScene(sc, 'the ball collides with the crate', { mintId: mint });
  ok('nothing was added', sc.shapes.length === before, String(sc.shapes.length));
  const crate = sc.shapes.find((s) => s.label === 'Crate');
  ok('the crate is still visible at the end',
     sampleShape(crate, sc.duration).opacity > 0.5);
  ok('but it has been moved', Math.abs(sampleShape(crate, sc.duration).x - 70) > 3,
     String(sampleShape(crate, sc.duration).x));
}

console.log('--- crushing flattens rather than scattering ---');
{
  const sc = scene(['Press', 'cube', { x: 20 }], ['Can', 'cylinder', { x: 70 }]);
  const before = sc.shapes.length;
  actOnScene(sc, 'the press crushes the can', { mintId: mint });
  ok('no debris', sc.shapes.length === before, String(sc.shapes.length));
  const can = sc.shapes.find((s) => s.label === 'Can');
  ok('the can is squashed', sampleShape(can, sc.duration).scale < 0.6,
     String(sampleShape(can, sc.duration).scale));
  ok('and still visible', sampleShape(can, sc.duration).opacity > 0.5);
}

console.log('--- a single-object verb performs where the object stands ---');
{
  const sc = scene(['Turntable', 'cylinder', { x: 22, y: 70 }]);
  actOnScene(sc, 'the turntable spins', { mintId: mint });
  const t = sc.shapes[0];
  ok('it did not move to the middle of the stage',
     Math.abs(t.keyframes[0].x - 22) < 0.01 && Math.abs(t.keyframes[0].y - 70) < 0.01,
     `${t.keyframes[0].x}, ${t.keyframes[0].y}`);
  ok('and it turns', sampleShape(t, sc.duration).rotY !== sampleShape(t, 0).rotY);
  ok('while staying put', Math.abs(sampleShape(t, sc.duration).x - 22) < 0.01);
}

console.log('--- a scale is preserved rather than reset ---');
{
  const sc = scene(['Boulder', 'sphere', { x: 30, scale: 2.5 }]);
  actOnScene(sc, 'the boulder bounces', { mintId: mint });
  ok('it is still the size it was',
     Math.abs(sampleShape(sc.shapes[0], 0).scale - 2.5) < 0.01,
     String(sampleShape(sc.shapes[0], 0).scale));
}

console.log('--- it declines rather than inventing ---');
{
  const sc = scene(['Dragon', 'cube']);
  ok('a verb needing a victim with no victim present is refused',
     actOnScene(scene(['Ball', 'sphere']), 'the ball smashes into the tower',
                { mintId: mint }) === null);
  ok('an empty scene is refused',
     actOnScene(createScene(), 'the cube spins', { mintId: mint }) === null);
  ok('an unparseable sentence is refused',
     actOnScene(sc, 'what is the weather like', { mintId: mint }) === null);
  ok('empty input is refused', actOnScene(sc, '', { mintId: mint }) === null);
  ok('undefined does not throw', actOnScene(sc, undefined, { mintId: mint }) === null);
}

console.log('--- other objects in the scene are left alone ---');
{
  const sc = scene(['Ball', 'sphere', { x: 20 }], ['Wall', 'cube', { x: 70 }],
                   ['Backdrop', 'rect', { x: 50, y: 50 }]);
  const backdropBefore = JSON.stringify(sc.shapes[2].keyframes);
  actOnScene(sc, 'the ball smashes into the wall', { mintId: mint });
  ok('the backdrop is untouched',
     JSON.stringify(sc.shapes[2].keyframes) === backdropBefore);
}

console.log('--- the scene grows to fit the action ---');
{
  const sc = scene(['Ball', 'sphere', { x: 20 }], ['Wall', 'cube', { x: 70 }]);
  sc.duration = 2;
  actOnScene(sc, 'the ball smashes into the wall for 9 seconds', { mintId: mint });
  ok('a longer request extends the scene', sc.duration === 9, String(sc.duration));
  const sc2 = scene(['Ball', 'sphere', { x: 20 }], ['Wall', 'cube', { x: 70 }]);
  sc2.duration = 12;
  actOnScene(sc2, 'the ball smashes into the wall', { mintId: mint });
  ok('and a shorter one does not shorten it', sc2.duration === 12, String(sc2.duration));
  ok('every keyframe lands inside the scene',
     sc2.shapes.every((s) => s.keyframes.every((k) => k.time <= sc2.duration + 1e-6)));
}

console.log('--- casting sees parented objects where they really are ---');
{
  const sc = scene(['Cart', 'cube', { x: 20 }], ['Barrel', 'cube', { x: 5 }],
                   ['Wall', 'cube', { x: 80 }]);
  // Parented without keep-transform, so the barrel's world position really
  // is its parent's plus its own — 25, not the 5 in its keyframe.
  setParent(sc, sc.shapes[1].id, sc.shapes[0].id, null, 0);
  actOnScene(sc, 'the barrel smashes into the wall', { mintId: mint });
  const barrel = sc.shapes.find((s) => s.label === 'Barrel');
  const worldX = (t) => worldTransforms(sc, t).get(barrel.id).x;

  // Staging works in world space — the barrel is aimed at where the wall
  // actually appears — but a child's keyframes hold a local transform. The
  // written value stays local; what has to be right is where it ends up.
  ok('it starts from where it appears', Math.abs(worldX(0) - 25) < 0.01,
     String(worldX(0)));
  ok('and the keyframe itself is still in the child\u2019s own frame',
     Math.abs(barrel.keyframes[0].x - 5) < 0.01, String(barrel.keyframes[0].x));
  ok('it travels toward the wall', worldX(sc.duration * 0.5) > 40,
     String(worldX(sc.duration * 0.5)));
  ok('and reaches it', Math.abs(worldX(sc.duration * 0.62) - 80) < 12,
     String(worldX(sc.duration * 0.62)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
