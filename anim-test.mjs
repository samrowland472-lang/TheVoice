import { createScene, createShape, setKeyframe, removeKeyframe, sampleShape,
         audioLevelTrack, serializeScene, deserializeScene } from '../js/animation.js';
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
