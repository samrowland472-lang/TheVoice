import { createScene, createShape, setKeyframe, removeKeyframe, sampleShape,
         audioLevelTrack, serializeScene, deserializeScene, renderFrame } from '../js/animation.js';
let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const near=(a,b,t=0.01)=>Math.abs(a-b)<t;

console.log('--- keyframes ---');
const s = createShape('circle', 0);
ok('starts with one keyframe', s.keyframes.length===1);
setKeyframe(s, 2, { x: 100, scale: 2 });
ok('added second', s.keyframes.length===2);
setKeyframe(s, 1, { x: 25 });
ok('inserted middle', s.keyframes.length===3);
ok('stays time-ordered', s.keyframes.every((k,i,a)=>i===0||a[i-1].time<=k.time),
   JSON.stringify(s.keyframes.map(k=>k.time)));
setKeyframe(s, 2, { x: 90 });
ok('same-time replaces not duplicates', s.keyframes.length===3 && s.keyframes.find(k=>k.time===2).x===90);

console.log('--- interpolation ---');
const lin = createShape('rect', 0);
lin.easing='linear';
setKeyframe(lin, 0, { x: 0 });
setKeyframe(lin, 10, { x: 100 });
ok('t=0 -> 0', near(sampleShape(lin,0).x, 0), sampleShape(lin,0).x);
ok('t=5 -> 50 (midpoint)', near(sampleShape(lin,5).x, 50), sampleShape(lin,5).x);
ok('t=10 -> 100', near(sampleShape(lin,10).x, 100), sampleShape(lin,10).x);
ok('before first clamps', near(sampleShape(lin,-5).x, 0));
ok('after last clamps', near(sampleShape(lin,99).x, 100));

console.log('--- color interpolation ---');
const c = createShape('circle',0); c.easing='linear';
setKeyframe(c, 0, { color: '#000000' });
setKeyframe(c, 10, { color: '#ffffff' });
const mid = sampleShape(c,5).color;
ok(`midpoint grey (got ${mid})`, /^#7f7f7f|#808080$/.test(mid), mid);
ok('endpoint exact', sampleShape(c,10).color==='#ffffff');

console.log('--- easing changes the curve but not endpoints ---');
const e = createShape('circle',0); e.easing='easeIn';
setKeyframe(e,0,{x:0}); setKeyframe(e,10,{x:100});
const em = sampleShape(e,5).x;
ok(`easeIn midpoint below linear (got ${em.toFixed(1)})`, em < 49);
ok('easeIn endpoints exact', near(sampleShape(e,0).x,0) && near(sampleShape(e,10).x,100));

console.log('--- keyframe removal ---');
ok('removes', removeKeyframe(s,1)===true && s.keyframes.length===2);
const solo = createShape('circle',0);
ok('refuses to remove the last one', removeKeyframe(solo,0)===false && solo.keyframes.length===1);

console.log('--- audio level track ---');
const SR=44100, dur=2, fps=30;
const loud=new Float32Array(SR*dur).fill(0.5);
const t1=audioLevelTrack(loud,SR,fps,dur);
ok(`frame count = ceil(dur*fps) (got ${t1.length})`, t1.length===60);
ok('loud -> high level', t1[10]>0.5, String(t1[10]));
const quiet=new Float32Array(SR*dur);
ok('silence -> 0', audioLevelTrack(quiet,SR,fps,dur)[10]===0);
ok('clamped to 1', t1.every(v=>v<=1));

console.log('--- serialize round-trip ---');
const scene=createScene();
scene.shapes.push(createShape('circle',0), createShape('text',0));
setKeyframe(scene.shapes[0], 3, { x: 80, color:'#ff6a4d' });
const back=deserializeScene(serializeScene(scene));
ok('shape count survives', back.shapes.length===2);
ok('keyframes survive', back.shapes[0].keyframes.length===2);
ok('values survive', back.shapes[0].keyframes[1].color==='#ff6a4d');
ok('sampling works after round-trip', near(sampleShape(back.shapes[0],3).x, 80));

console.log('--- rejects bad input ---');
let threw=false; try{ deserializeScene('{"nope":1}'); }catch{ threw=true; }
ok('rejects non-scene', threw);
threw=false; try{ deserializeScene(JSON.stringify({shapes:[{id:'x',keyframes:[]}]})); }catch{ threw=true; }
ok('rejects shape with no keyframes', threw);


console.log('--- per-keyframe easing (the segment owns its curve) ---');
{
  const { resolveEasing } = await import('../js/easing.js');
  const shape = createShape('circle', 0);
  shape.keyframes[0].ease = 'linear';
  setKeyframe(shape, 1, { x: 100, ease: 'hold' });
  setKeyframe(shape, 2, { x: 0 });

  // 0→1 is linear: halfway through, x is halfway.
  ok('a linear segment interpolates evenly',
     Math.abs(sampleShape(shape, 0.5).x - 75) < 0.001, String(sampleShape(shape, 0.5).x));
  // 1→2 is a hold: x stays at 100 until the next key.
  ok('a hold segment does not move', Math.abs(sampleShape(shape, 1.5).x - 100) < 0.001,
     String(sampleShape(shape, 1.5).x));
  ok('and cuts at the next keyframe', Math.abs(sampleShape(shape, 2).x - 0) < 0.001);
  ok('two segments of one shape can differ',
     sampleShape(shape, 0.5).x !== sampleShape(shape, 1.5).x);
}

console.log('--- custom bezier control points on a keyframe ---');
{
  const shape = createShape('rect', 0);
  // createShape starts a shape centred at x=50, so pin the start explicitly.
  shape.keyframes[0].x = 0;
  shape.keyframes[0].ease = [0.9, 0, 1, 0.1]; // very slow start
  setKeyframe(shape, 1, { x: 100 });
  const early = sampleShape(shape, 0.25).x;
  ok('a slow-start curve lags well behind linear', early < 12, String(early));
  // Both handles are pulled to the right, so this curve stays low and then
  // snaps home — it is still well behind linear at 90% of the way through.
  const late = sampleShape(shape, 0.9).x;
  ok('it is still behind near the end', late < 40 && late > early, String(late));
  ok('but lands exactly on target', Math.abs(sampleShape(shape, 1).x - 100) < 1e-9);
  let mono = true, prev = -Infinity;
  for (let i = 0; i <= 100; i++) {
    const v = sampleShape(shape, i / 100).x;
    if (v < prev - 1e-9) mono = false;
    prev = v;
  }
  ok('and never moves backwards on the way', mono);
}

console.log('--- overshoot reaches the rendered value ---');
{
  const shape = createShape('circle', 0);
  shape.keyframes[0].ease = 'backOut';
  setKeyframe(shape, 1, { x: 100 });
  let maxX = 0;
  for (let i = 0; i <= 100; i++) maxX = Math.max(maxX, sampleShape(shape, i / 100).x);
  ok('the value carries past its target', maxX > 100.5, String(maxX));
  ok('and lands exactly on it', Math.abs(sampleShape(shape, 1).x - 100) < 1e-9);
}

console.log('--- old scenes keep working ---');
{
  // A scene authored before per-keyframe easing has no `ease` on keyframes,
  // only the shape-wide `easing`.
  const legacy = { id: 'x', type: 'circle', label: 'L', text: '', reactive: false,
    easing: 'linear', keyframes: [
      { time: 0, x: 0, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#fff' },
      { time: 1, x: 100, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#fff' },
    ] };
  ok('shape-wide easing is still honoured',
     Math.abs(sampleShape(legacy, 0.5).x - 50) < 0.001, String(sampleShape(legacy, 0.5).x));
  legacy.easing = 'easeIn';
  ok('and a different shape-wide value changes the result',
     sampleShape(legacy, 0.5).x < 45, String(sampleShape(legacy, 0.5).x));
  legacy.easing = 'nonsense-removed-in-a-later-version';
  ok('an unknown easing name degrades instead of throwing',
     Number.isFinite(sampleShape(legacy, 0.5).x), String(sampleShape(legacy, 0.5).x));
}

console.log('--- a negative scale cannot crash the renderer ---');
{
  const shape = createShape('circle', 0);
  shape.keyframes[0].ease = 'anticipate'; // pulls back, then overshoots
  // Shrinking all the way to zero: the overshoot at the end then carries
  // scale past zero and negative, which is the case renderFrame must survive.
  setKeyframe(shape, 1, { scale: 0 });
  const scene = { duration: 1, fps: 30, background: '#000', shapes: [shape] };
  let minScale = 1;
  for (let i = 0; i <= 100; i++) minScale = Math.min(minScale, sampleShape(shape, i / 100).scale);
  ok('anticipate really does drive scale negative', minScale < 0, String(minScale));

  // A stub context recording that no negative radius ever reaches arc().
  let negativeRadius = false;
  const ctx = new Proxy({}, {
    get: (_, k) => {
      if (k === 'arc') return (x, y, r) => { if (r < 0) negativeRadius = true; };
      if (k === 'canvas') return { width: 100, height: 100 };
      return () => {};
    },
    set: () => true,
  });
  for (let i = 0; i <= 100; i++) renderFrame(ctx, scene, i / 100, 640, 360, 0);
  ok('no frame asks for a negative radius', !negativeRadius);
}


console.log('--- extruded text slices ---');
{
  const { textSlices } = await import('../js/animation.js');
  const { createCamera } = await import('../js/camera3d.js');
  const cam = createCamera();
  const p0 = { x: 50, y: 50, z: 0, rotX: 0, rotY: 0 };

  const flat = textSlices(p0, 0, cam, 640, 360);
  ok('zero depth is a single slice', flat.length === 1 && flat[0].front);

  const deep = textSlices(p0, 12, cam, 640, 360);
  ok('depth yields a stack', deep.length >= 4, String(deep.length));
  ok('the front slice comes last, so it paints on top', deep[deep.length - 1].front);
  ok('slices are ordered back to front',
     deep.every((s, i, a) => i === 0 || a[i - 1].depth >= s.depth));
  ok('facing the camera head-on, deeper slices are smaller',
     deep[0].scale < deep[deep.length - 1].scale,
     `${deep[0].scale.toFixed(4)} .. ${deep[deep.length - 1].scale.toFixed(4)}`);
  ok('the flank darkens toward the back',
     deep[0].shade < deep[deep.length - 2].shade,
     `${deep[0].shade.toFixed(2)} .. ${deep[deep.length - 2].shade.toFixed(2)}`);
  ok('the front face is full brightness', deep[deep.length - 1].shade === 1);

  const turned = textSlices({ ...p0, rotY: 50 }, 12, cam, 640, 360);
  ok('turning the title spreads the slices across the screen',
     Math.abs(turned[0].x - turned[turned.length - 1].x) > 5,
     `${turned[0].x.toFixed(1)} .. ${turned[turned.length - 1].x.toFixed(1)}`);
  const straight = textSlices(p0, 12, cam, 640, 360);
  ok('head-on the slices stack in place',
     Math.abs(straight[0].x - straight[straight.length - 1].x) < 0.5);

  ok('a title behind the camera renders nothing',
     textSlices({ ...p0, z: cam.z - 40 }, 12, cam, 640, 360).length === 0);
  ok('absurd depth is clamped', textSlices(p0, 500, cam, 640, 360).length <= 16);
  ok('every coordinate is finite', deep.every(s =>
     Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)));
}

console.log('--- createShape carries extrusion for text only ---');
{
  ok('text defaults to a visible depth', createShape('text').extrude === 8);
  ok('a circle carries none', createShape('circle').extrude === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
