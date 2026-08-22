const { parseInstruction, verbFor, shapeFor, stem, intensityOf, phraseAction,
        labelIn, reactiveIn, ACTIONS, VERBS }
  = await import('../js/verbs.js');
const { direct } = await import('../js/director.js');
const { ballistic, shatter, orbitKeys, shakeKeys, seedFrom, GRAVITY }
  = await import('../js/physics.js');
const { sampleShape } = await import('../js/animation.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};

console.log('--- the reported bug: two objects, and the action happens ---');
{
  const s = direct('a sphere smashing into a cube');
  ok('a scene comes back', !!s);
  ok('BOTH objects are present',
     s.shapes.some(x => x.type === 'sphere') && s.shapes.some(x => x.type === 'cube'),
     [...new Set(s.shapes.map(x=>x.type))].join());
  ok('it is not a single static object', s.shapes.length > 2, String(s.shapes.length));
  ok('debris is created', s.shapes.length >= 10, String(s.shapes.length));
  ok('it turns 3D on for solids', s.needs3D === true);

  const sphere = s.shapes.find(x => x.type === 'sphere');
  const start = sampleShape(sphere, 0);
  const end = sampleShape(sphere, s.duration);
  ok('the aggressor actually travels', Math.abs(end.x - start.x) > 20,
     `${start.x.toFixed(0)} -> ${end.x.toFixed(0)}`);
  ok('and starts off to one side', start.x < 20, String(start.x));
}

console.log('--- the target is destroyed, and the debris is not there early ---');
{
  const s = direct('a sphere smashing into a cube');
  // The victim is the full-size cube: the fragments are the small ones.
  const cube = s.shapes.filter(x => x.type === 'cube')
    .sort((a, b) => b.keyframes[0].scale - a.keyframes[0].scale)[0];
  ok('the target is solid at the start', sampleShape(cube, 0).opacity > 0.9);
  ok('and gone by the end', sampleShape(cube, s.duration).opacity < 0.1,
     String(sampleShape(cube, s.duration).opacity));

  const debris = s.shapes.filter(x => x !== cube && x.type === 'cube');
  ok('there are fragments', debris.length >= 8, String(debris.length));
  ok('no fragment is visible before the impact',
     debris.every(d => sampleShape(d, 0.1).opacity < 0.01));
  ok('fragments are visible after it',
     debris.some(d => sampleShape(d, 2.2).opacity > 0.1));
  ok('fragments are small, not duplicates of the target',
     debris.every(d => Math.max(...d.keyframes.map(k => k.scale)) < 0.6),
     String(Math.max(...debris.flatMap(d => d.keyframes.map(k => k.scale)))));
  const at = debris.map(d => sampleShape(d, 2.5));
  const span = (k) => Math.max(...at.map(p => p[k])) - Math.min(...at.map(p => p[k]));
  ok('fragments end up spread over a wide area', span('x') > 30 && span('z') > 20,
     `x ${span('x').toFixed(0)}, z ${span('z').toFixed(0)}`);
  ok('no two fragments share a position',
     new Set(at.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)).size === debris.length);
  // Momentum is carried through: the sphere arrives from the left, so the
  // debris goes right on balance. A few pieces flying back is spall, and
  // real; demanding every single piece obey would be demanding an effect
  // rather than a simulation. What must not happen is even scatter, which
  // would mean the impact direction had been thrown away entirely.
  const forward = at.filter(p => p.x > 60).length;
  ok('debris is carried along the impact direction', forward >= at.length * 0.75,
     `${forward} of ${at.length} forward`);
  const meanX = at.reduce((n, p) => n + p.x, 0) / at.length;
  ok('and its centre of mass ends up past the target', meanX > 65,
     `mean x ${meanX.toFixed(0)}`);
  ok('and it spreads to both sides in depth',
     Math.min(...at.map(p => p.z)) < -5 && Math.max(...at.map(p => p.z)) > 5,
     `z ${Math.min(...at.map(p=>p.z)).toFixed(0)}..${Math.max(...at.map(p=>p.z)).toFixed(0)}`);
}

console.log('--- gravity is real, not decoration ---');
{
  const keys = ballistic({
    from: { x: 50, y: 20, z: 0 }, velocity: { x: 0, y: 0, z: 0 },
    startTime: 0, endTime: 2, colour: '#fff', fadeOut: false,
  });
  const shape = { keyframes: keys, easing: 'linear' };
  const y0 = sampleShape(shape, 0).y;
  const y1 = sampleShape(shape, 1).y;
  const y2 = sampleShape(shape, 2).y;
  ok('it falls', y1 > y0 && y2 > y1, `${y0} ${y1} ${y2}`);
  // Falling accelerates: the second second covers more than the first.
  ok('and accelerates rather than drifting', (y2 - y1) > (y1 - y0) * 1.5,
     `${(y1-y0).toFixed(1)} then ${(y2-y1).toFixed(1)}`);

  // Drag is what keeps debris in frame, but the maths must still be right:
  // with drag removed the model has to reduce to the schoolbook formula,
  // or the arcs are merely plausible rather than correct.
  const free = ballistic({
    from: { x: 50, y: 20, z: 0 }, velocity: { x: 0, y: 0, z: 0 },
    startTime: 0, endTime: 2, colour: '#fff', fadeOut: false, drag: 1e-5,
  });
  const freeShape = { keyframes: free, easing: 'linear' };
  const drop = sampleShape(freeShape, 2).y - sampleShape(freeShape, 0).y;
  ok('with drag removed it is exactly 0.5·g·t²',
     Math.abs(drop - 0.5 * GRAVITY * 4) < 0.05, `${drop.toFixed(2)} vs ${(0.5*GRAVITY*4).toFixed(2)}`);
  ok('and drag makes a real difference', Math.abs(drop - (y2 - y0)) > 20,
     `${(y2-y0).toFixed(0)} with drag vs ${drop.toFixed(0)} without`);
}

console.log('--- the same words always give the same scene ---');
{
  // Otherwise undo, reload and re-running a prompt would each silently
  // produce a different animation.
  const a = direct('a cube exploding violently');
  const b = direct('a cube exploding violently');
  ok('deterministic', JSON.stringify(a.shapes.map(s => s.keyframes))
                   === JSON.stringify(b.shapes.map(s => s.keyframes)));
  const c = direct('a sphere exploding violently');
  ok('but different words give a different scene',
     JSON.stringify(a.shapes.map(s => s.type)) !== JSON.stringify(c.shapes.map(s => s.type)));
}

console.log('--- "going crazy" ---');
{
  const s = direct('a cube going crazy');
  ok('it is understood', !!s);
  const cube = s.shapes[0];
  ok('it moves a lot', cube.keyframes.length > 20, String(cube.keyframes.length));
  const xs = [];
  for (let t = 0; t < s.duration; t += 0.1) xs.push(sampleShape(cube, t).x);
  const range = Math.max(...xs) - Math.min(...xs);
  ok('and erratically, over a real range', range > 4, String(range.toFixed(1)));
  // Not a sine wave: successive displacements should not be smooth.
  let reversals = 0;
  for (let i = 2; i < xs.length; i++) {
    if (Math.sign(xs[i] - xs[i-1]) !== Math.sign(xs[i-1] - xs[i-2])) reversals++;
  }
  ok('it is irregular, not a tidy wobble', reversals > xs.length * 0.25,
     `${reversals} reversals in ${xs.length}`);
}

console.log('--- an implied target ---');
{
  const s = direct('a cylinder obliterating something');
  ok('it is understood', !!s);
  ok('the cylinder is there', s.shapes.some(x => x.type === 'cylinder'));
  ok('and something to obliterate was invented', s.shapes.some(x => x.type === 'cube'));
  ok('with debris', s.shapes.length > 5, String(s.shapes.length));
}

console.log('--- orbits ---');
{
  const s = direct('three red spheres orbiting a gold cube');
  ok('four objects: one centre, three orbiting', s.shapes.length === 4, String(s.shapes.length));
  const orbiters = s.shapes.filter(x => x.type === 'sphere');
  ok('three orbiters', orbiters.length === 3);
  ok('they are red', orbiters.every(o => o.keyframes[0].color === '#e4483d'),
     orbiters[0].keyframes[0].color);
  ok('the centre is gold', s.shapes.find(x => x.type === 'cube').keyframes[0].color === '#e8c14a');
  // Each orbiter should be at a different place at any instant.
  const at1 = orbiters.map(o => sampleShape(o, 1).x.toFixed(1));
  ok('they are spread around the orbit, not stacked', new Set(at1).size === 3, at1.join());
  const o = orbiters[0];
  const dists = [];
  for (let t = 0; t <= s.duration; t += 0.25) {
    const p = sampleShape(o, t);
    dists.push(Math.hypot(p.x - 50, p.z));
  }
  ok('the orbit keeps its radius', Math.max(...dists) - Math.min(...dists) < 6,
     `${Math.min(...dists).toFixed(1)}..${Math.max(...dists).toFixed(1)}`);
}

console.log('--- intensity changes the result ---');
{
  const calm = direct('a cube exploding gently');
  const wild = direct('a cube exploding violently');
  const spread = (s) => {
    const xs = s.shapes.map(sh => sampleShape(sh, s.duration).x);
    return Math.max(...xs) - Math.min(...xs);
  };
  ok('violent throws debris further', spread(wild) > spread(calm) * 1.3,
     `${spread(calm).toFixed(0)} vs ${spread(wild).toFixed(0)}`);
  ok('and makes more of it', wild.shapes.length > calm.shapes.length,
     `${calm.shapes.length} vs ${wild.shapes.length}`);
}

console.log('--- the violent verbs are genuinely different effects ---');
{
  // The complaint that prompted this: smash, obliterate and blow up were
  // one effect under three names. Each must now produce distinct physics.
  const measure = (phrase) => {
    const s = direct(phrase);
    const debris = s.shapes.slice(2);
    const at = debris.map(x => sampleShape(x, s.duration * 0.75));
    return {
      objects: s.shapes.length,
      debris: debris.length,
      spread: at.length ? Math.max(...at.map(p => p.x)) - Math.min(...at.map(p => p.x)) : 0,
      meanY: at.length ? at.reduce((n, p) => n + p.y, 0) / at.length : 0,
      size: at.length ? at.reduce((n, p) => n + p.scale, 0) / at.length : 0,
    };
  };
  const smash = measure('a sphere smashing into a cube');
  const oblit = measure('a sphere obliterating a cube');
  const crush = measure('a sphere crushing a cube');
  const boom  = measure('a cube blowing up');
  const shard = measure('a cube shattering');
  const vapor = measure('a cube vaporising');

  ok('obliterate throws further than smash', oblit.spread > smash.spread * 1.5,
     `${smash.spread.toFixed(0)} vs ${oblit.spread.toFixed(0)}`);
  ok('obliterate leaves smaller pieces than smash', oblit.size < smash.size * 0.6,
     `${smash.size.toFixed(3)} vs ${oblit.size.toFixed(3)}`);
  ok('obliterate makes more pieces than smash', oblit.debris > smash.debris,
     `${smash.debris} vs ${oblit.debris}`);

  ok('crush does not fragment at all', crush.debris === 0, String(crush.debris));
  ok('crush leaves the target squashed, not gone', crush.objects === 2, String(crush.objects));

  ok('shatter drops its shards rather than throwing them',
     shard.meanY > smash.meanY && shard.spread < smash.spread,
     `shatter y ${shard.meanY.toFixed(0)} spread ${shard.spread.toFixed(0)} vs smash ${smash.meanY.toFixed(0)}/${smash.spread.toFixed(0)}`);

  // 50 is the centre of the frame and y runs down, so "rising" means a
  // smaller number. Vaporised matter must end up above where it started
  // while shattered shards end up below.
  ok('vaporise rises while the others fall',
     vapor.meanY < 40 && shard.meanY > 60,
     `vaporise ${vapor.meanY.toFixed(0)}, shatter ${shard.meanY.toFixed(0)}`);
  ok('and leaves the smallest traces of all',
     vapor.size < shard.size && vapor.size < smash.size, vapor.size.toFixed(3));

  ok('blowing up radiates rather than following an impact',
     boom.spread > shard.spread, `${shard.spread.toFixed(0)} vs ${boom.spread.toFixed(0)}`);

  // Every family must actually differ from every other.
  const sigs = [smash, oblit, crush, boom, shard, vapor]
    .map(m => `${m.debris}|${m.spread.toFixed(0)}|${m.size.toFixed(2)}`);
  ok('all six families produce distinct results', new Set(sigs).size === 6,
     sigs.join('  '));
}

console.log('--- vocabulary reach ---');
{
  const families = {
    smash: ['smashes', 'slamming', 'demolished', 'wrecking', 'battered'],
    obliterate: ['obliterating', 'annihilates', 'destroyed', 'pulverising', 'decimated'],
    crush: ['crushes', 'flattening', 'squashed', 'stomping'],
    vaporise: ['vaporising', 'atomises', 'disintegrated', 'evaporating'],
    collide: ['hits', 'striking', 'collided', 'ramming', 'bumps'],
    explode: ['explodes', 'bursting', 'detonated', 'erupting'],
    shatter: ['shatters', 'fracturing', 'crumbled', 'cracking'],
    orbit: ['orbits', 'circling', 'revolves', 'encircling'],
    spin: ['spins', 'rotating', 'twirled'],
    tumble: ['tumbles', 'rolling', 'somersaulting'],
    shake: ['shakes', 'vibrating', 'juddered', 'wobbling', 'rattling'],
    scatter: ['scatters', 'dispersing', 'spread'],
    gather: ['gathers', 'converging', 'assembled', 'swarming'],
    pulse: ['pulses', 'throbbing', 'breathing'],
    fall: ['falls', 'dropping', 'plummeted'],
    rise: ['rises', 'ascending', 'soaring'],
  };
  let wrong = [];
  for (const [action, words] of Object.entries(families)) {
    for (const w of words) if (verbFor(w) !== action) wrong.push(`${w}->${verbFor(w)} (want ${action})`);
  }
  ok(`inflections resolve across ${Object.values(families).flat().length} verbs`,
     wrong.length === 0, wrong.slice(0, 4).join('; '));
  ok('the vocabulary is genuinely large', Object.keys(VERBS).length > 150,
     `${Object.keys(VERBS).length} stems`);
  ok('unknown words are refused, not guessed', verbFor('photosynthesises') === null);
}

console.log('--- particle verbs mean something the single word does not ---');
{
  ok('"zooms in" is a change of size, not travel', phraseAction('a square that zooms in') === 'grow');
  ok('"zooms out" is its opposite', phraseAction('the cube zooms out') === 'shrink');
  ok('"fade out" is not "fade"', phraseAction('a circle fading out') === 'fadeOut');
  ok('"fade in" still enters', phraseAction('a title that fades in') === 'fadeIn');
  ok('"blow up" reaches the explosion family', phraseAction('a cube blowing up') === 'explode');
  ok('a sentence with no particle verb is left alone', phraseAction('a sphere smashing a cube') === null);
  ok('the phrase beats the bare word',
     parseInstruction('a square that zooms in').action === 'grow',
     parseInstruction('a square that zooms in').action);
  ok('and the subject survives the phrase',
     parseInstruction('a square that zooms in').subject.type === 'rect');

  const zoom = direct('a square that zooms in');
  const first = zoom.shapes[0].keyframes[0];
  const last = zoom.shapes[0].keyframes.at(-1);
  ok('zooming in starts small', first.scale < 0.5, String(first.scale));
  ok('and settles at natural size', Math.abs(last.scale - 1) < 0.01, String(last.scale));
  ok('an emphatic zoom overshoots',
     direct('a square zooming in violently').shapes[0].keyframes.at(-1).scale > 1.1);
}

console.log('--- words on screen come from the sentence ---');
{
  ok('quotes win', labelIn('a title saying "HELLO WORLD"') === 'HELLO WORLD');
  ok('curly quotes too', labelIn('a title saying \u201cHELLO\u201d') === 'HELLO');
  ok('"saying" without quotes', labelIn('text saying brand new') === 'brand new');
  ok('a trailing duration is not part of the label',
     labelIn('text saying brand new for 5 seconds') === 'brand new',
     labelIn('text saying brand new for 5 seconds'));
  ok('no label when none was given', labelIn('a cube spinning') === '');
  ok('the label reaches the shape',
     direct('a title saying "HELLO WORLD"').shapes[0].text === 'HELLO WORLD',
     direct('a title saying "HELLO WORLD"').shapes[0].text);
  ok('a text shape still says something without one',
     direct('a title that fades in').shapes[0].text.length > 0);
}

console.log('--- audio reactivity is asked for, not assumed ---');
{
  ok('music', reactiveIn('circles pulsing to the music') === true);
  ok('the beat', reactiveIn('cubes bouncing on the beat') === true);
  ok('silence', reactiveIn('circles pulsing') === false);
  ok('it reaches every shape',
     direct('circles pulsing to the music').shapes.every((s) => s.reactive));
  ok('and is off otherwise',
     direct('circles pulsing').shapes.every((s) => !s.reactive));
}

console.log('--- a crowd does not move as one block ---');
{
  const g = direct('five circles fading in');
  ok('five of them', g.shapes.length === 5, String(g.shapes.length));
  const starts = g.shapes.map((s) => s.keyframes[0].time);
  ok('each starts at its own moment', new Set(starts).size === 5, starts.join());
  ok('the first still starts at zero', starts[0] === 0);
  ok('they all still finish inside the scene',
     g.shapes.every((s) => s.keyframes.at(-1).time <= g.duration + 1e-6),
     g.shapes.map((s) => s.keyframes.at(-1).time.toFixed(2)).join());
  ok('one object is not staggered',
     direct('a circle fading in').shapes[0].keyframes[0].time === 0);
}

console.log('--- spin turns on an axis you can see ---');
{
  const flat = direct('a circle spinning').shapes[0];
  ok('a flat shape turns in the picture plane',
     sampleShape(flat, 0).rotation !== sampleShape(flat, 4).rotation,
     `${sampleShape(flat, 0).rotation} -> ${sampleShape(flat, 4).rotation}`);
  const solid = direct('a cube spinning').shapes[0];
  ok('a solid turns about its own vertical',
     sampleShape(solid, 0).rotY !== sampleShape(solid, 4).rotY,
     `${sampleShape(solid, 0).rotY} -> ${sampleShape(solid, 4).rotY}`);
  ok('and a solid does not also spin flat',
     sampleShape(solid, 4).rotation === 0);
}

console.log('--- it declines rather than inventing ---');
{
  ok('empty', direct('') === null);
  ok('a question about nothing physical', direct('what is the weather like') === null);
  ok('undefined does not throw', direct(undefined) === null);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
