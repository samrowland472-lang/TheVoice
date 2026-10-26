const store = new Map();
globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k,v) => store.set(k,String(v)), removeItem: k => store.delete(k) };

const { parseLocalCommand, validateAgentScene, extractMotions, COLOR_WORDS,
        getAgentEndpoint, setAgentEndpoint, defaultEndpointFor, isAgentConfigured,
        MAX_SHAPES, MAX_DURATION } = await import('../js/agent.js');
const { sampleShape } = await import('../js/animation.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};

console.log('--- the colour table is sound ---');
ok('every colour is a valid hex',
   Object.values(COLOR_WORDS).every(v => /^#[0-9a-f]{6}$/i.test(v)));
ok('colours are distinct enough to be useful',
   new Set(Object.values(COLOR_WORDS)).size >= 18,
   String(new Set(Object.values(COLOR_WORDS)).size));

console.log('--- plain requests build something ---');
{
  const s = parseLocalCommand('three blue circles that fade in');
  ok('a scene comes back', !!s);
  ok('three shapes', s.shapes.length === 3, String(s.shapes.length));
  ok('they are circles', s.shapes.every(x => x.type === 'circle'));
  ok('they are blue', s.shapes.every(x => x.keyframes[0].color === COLOR_WORDS.blue),
     s.shapes[0].keyframes[0].color);
  ok('they start invisible', s.shapes.every(x => x.keyframes[0].opacity === 0));
  ok('and end visible', s.shapes.every(x => x.keyframes.at(-1).opacity === 1));
  ok('they are spread out, not stacked',
     new Set(s.shapes.map(x => x.keyframes[0].x)).size === 3,
     s.shapes.map(x => x.keyframes[0].x).join());
  ok('entrances are staggered',
     new Set(s.shapes.map(x => x.keyframes[0].time)).size === 3,
     s.shapes.map(x => x.keyframes[0].time).join());
}

console.log('--- shape vocabulary ---');
for (const [phrase, type] of [
  ['a red square', 'rect'], ['spinning triangles', 'triangle'],
  ['a wave that pulses', 'wave'], ['five orbs drifting', 'sphere'],
  // "orb" and "box" are three-dimensional words and now resolve to solids;
  // "circle" and "square" still resolve to the flat shapes.
  ['bouncing boxes', 'cube'], ['a title that fades in', 'text'],
  ['a circle spinning', 'circle'], ['a red square', 'rect'],
]) {
  const s = parseLocalCommand(phrase);
  ok(`"${phrase}" -> ${type}`, s && s.shapes[0].type === type, s ? s.shapes[0].type : 'null');
}

console.log('--- counts ---');
ok('digits', parseLocalCommand('7 circles spinning').shapes.length === 7);
ok('words', parseLocalCommand('five squares that fade in').shapes.length === 5);
ok('singular defaults to one', parseLocalCommand('a circle spinning').shapes.length === 1);
ok('absurd counts are capped',
   parseLocalCommand('99 circles spinning').shapes.length <= MAX_SHAPES,
   String(parseLocalCommand('99 circles spinning').shapes.length));

console.log('--- motion actually moves things ---');
{
  const spin = parseLocalCommand('a circle spinning');
  ok('spin changes rotation over time',
     sampleShape(spin.shapes[0], 0).rotation !== sampleShape(spin.shapes[0], 4).rotation);
  const zoom = parseLocalCommand('a square that zooms in');
  ok('zoom starts small', sampleShape(zoom.shapes[0], 0).scale < 0.5,
     String(sampleShape(zoom.shapes[0], 0).scale));
  ok('and ends full size', Math.abs(sampleShape(zoom.shapes[0], 5).scale - 1) < 0.01);
  const slide = parseLocalCommand('a circle sliding in from the left');
  ok('slide starts off-frame', sampleShape(slide.shapes[0], 0).x < 0,
     String(sampleShape(slide.shapes[0], 0).x));
  ok('and arrives on-frame', sampleShape(slide.shapes[0], 5).x > 20);
  const pulse = parseLocalCommand('a circle pulsing');
  ok('pulse has more than two keyframes', pulse.shapes[0].keyframes.length > 2,
     String(pulse.shapes[0].keyframes.length));
  const sizes = [];
  for (let i = 0; i <= 50; i++) sizes.push(sampleShape(pulse.shapes[0], i / 10).scale);
  ok('pulse both grows and shrinks', Math.max(...sizes) > 1.2 && Math.min(...sizes) < 1.0,
     `${Math.min(...sizes).toFixed(2)}..${Math.max(...sizes).toFixed(2)}`);
}

console.log('--- text content ---');
ok('quoted text is used', parseLocalCommand('a title saying "HELLO WORLD"').shapes[0].text === 'HELLO WORLD',
   parseLocalCommand('a title saying "HELLO WORLD"').shapes[0].text);
ok('unquoted "saying" works',
   /brand new/i.test(parseLocalCommand('text saying brand new').shapes[0].text),
   parseLocalCommand('text saying brand new').shapes[0].text);
ok('text falls back to something', parseLocalCommand('a title that fades in').shapes[0].text.length > 0);

console.log('--- audio reactivity ---');
ok('mentioning music marks shapes reactive',
   parseLocalCommand('circles pulsing to the music').shapes.every(s => s.reactive));
ok('not mentioning it leaves them alone',
   parseLocalCommand('circles pulsing').shapes.every(s => !s.reactive));

console.log('--- duration ---');
ok('an explicit duration is honoured', parseLocalCommand('a circle spinning for 12 seconds').duration === 12,
   String(parseLocalCommand('a circle spinning for 12 seconds').duration));
ok('absurd durations are capped',
   parseLocalCommand('a circle spinning for 99 seconds').duration <= MAX_DURATION);

console.log('--- it declines rather than guessing ---');
ok('empty input', parseLocalCommand('') === null);
ok('whitespace', parseLocalCommand('   ') === null);
ok('undefined does not throw', parseLocalCommand(undefined) === null);
ok('an unrelated sentence returns null so the model can take it',
   parseLocalCommand('what is the weather like today') === null);

console.log('--- model output is treated as untrusted ---');
{
  const hostile = validateAgentScene({
    duration: 1e9, fps: 9999, background: 'javascript:alert(1)',
    shapes: [{ type: 'circle', label: 'x'.repeat(500), keyframes: [
      { time: -50, x: 1e9, y: NaN, scale: 1e9, rotation: 1e9, opacity: 50, color: 'red; drop table' },
      { time: 3, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#ffffff' },
    ] }],
  });
  ok('it still produces a scene', hostile.ok, hostile.message);
  const kf = hostile.scene.shapes[0].keyframes[0];
  ok('duration is clamped', hostile.scene.duration <= MAX_DURATION, String(hostile.scene.duration));
  ok('fps is clamped', hostile.scene.fps <= 60, String(hostile.scene.fps));
  ok('a non-hex background is replaced', /^#[0-9a-f]{6}$/.test(hostile.scene.background), hostile.scene.background);
  ok('a non-hex colour is replaced', /^#[0-9a-f]{6}$/.test(kf.color), kf.color);
  ok('scale cannot hang the renderer', kf.scale <= 8, String(kf.scale));
  ok('negative time is clamped', kf.time >= 0, String(kf.time));
  ok('NaN becomes a number', Number.isFinite(kf.y), String(kf.y));
  ok('opacity stays in range', kf.opacity >= 0 && kf.opacity <= 1, String(kf.opacity));
  ok('labels are truncated', hostile.scene.shapes[0].label.length <= 40);
}
{
  const many = validateAgentScene({ duration: 5, fps: 30, background: '#000000',
    shapes: Array.from({ length: 400 }, () => ({ type: 'circle', label: 'c',
      keyframes: [{ time: 0, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#fff000' },
                  { time: 5, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#fff000' }] })) });
  ok('shape count is capped', many.scene.shapes.length <= MAX_SHAPES, String(many.scene.shapes.length));
}
ok('an unknown shape type falls back rather than reaching the renderer',
   validateAgentScene({ shapes: [{ type: 'wormhole', label: 'w',
     keyframes: [{ time: 0, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#ffffff' }] }] })
     .scene.shapes[0].type === 'circle');
ok('no shapes is refused', !validateAgentScene({ shapes: [] }).ok);
ok('null is refused', !validateAgentScene(null).ok);
ok('a string is refused', !validateAgentScene('a scene').ok);
ok('shapes with no keyframes are dropped',
   !validateAgentScene({ shapes: [{ type: 'circle', label: 'c', keyframes: [] }] }).ok);

console.log('--- duration always covers the last keyframe ---');
{
  const v = validateAgentScene({ duration: 2, fps: 30, background: '#000000',
    shapes: [{ type: 'circle', label: 'c', keyframes: [
      { time: 0, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#ffffff' },
      { time: 9, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, color: '#ffffff' }] }] });
  ok('a short duration is extended to reach the last keyframe',
     v.scene.duration >= 9, String(v.scene.duration));
}

console.log('--- endpoint configuration ---');
store.clear();
ok('nothing configured by default', getAgentEndpoint() === '');
ok('derived from a project url',
   defaultEndpointFor('https://abc.supabase.co') === 'https://abc.supabase.co/functions/v1/scene-agent',
   defaultEndpointFor('https://abc.supabase.co'));
ok('a trailing slash does not double up',
   defaultEndpointFor('https://abc.supabase.co/') === 'https://abc.supabase.co/functions/v1/scene-agent');
ok('no project means no endpoint', defaultEndpointFor('') === '');
ok('configured when a project exists', isAgentConfigured('https://abc.supabase.co'));
ok('not configured with nothing at all', !isAgentConfigured(''));
setAgentEndpoint('https://custom.example/agent');
ok('an override is stored', getAgentEndpoint() === 'https://custom.example/agent');
setAgentEndpoint('');
ok('and can be cleared', getAgentEndpoint() === '');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
