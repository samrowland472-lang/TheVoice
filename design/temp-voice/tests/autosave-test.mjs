const { createAutosave, workspaceHasContent, describeWorkspace }
  = await import('../js/autosave.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};

// Deterministic timers: fire on demand, no real clock.
function fakeTimers() {
  let next = 1;
  const timers = new Map();
  return {
    setTimer: (fn, ms) => { const id = next++; timers.set(id, { fn, ms }); return id; },
    clearTimer: (id) => timers.delete(id),
    fire: () => { for (const [id, t] of [...timers]) { timers.delete(id); t.fn(); } },
    count: () => timers.size,
  };
}
const fakeStorage = () => {
  const m = new Map();
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k,v) => m.set(k,String(v)),
           removeItem: k => m.delete(k), map: m };
};

console.log('--- debounce collapses a burst into one write ---');
{
  const t = fakeTimers(); const s = fakeStorage();
  let serialized = 0;
  const a = createAutosave({ key: 'k', storage: s, setTimer: t.setTimer, clearTimer: t.clearTimer });
  for (let i = 0; i < 25; i++) a.schedule(() => { serialized++; return { n: i }; });
  ok('nothing written until the timer fires', s.map.size === 0);
  ok('only one timer is pending', t.count() === 1, String(t.count()));
  t.fire();
  ok('one write for twenty-five schedules', serialized === 1, String(serialized));
  ok('the last payload won', JSON.parse(s.map.get('k')).n === 24);
  ok('a savedAt stamp rides along', typeof JSON.parse(s.map.get('k')).savedAt === 'number');
  ok('no timer left behind', !a.hasPending());
}

console.log('--- flush writes immediately and cancels the pending save ---');
{
  const t = fakeTimers(); const s = fakeStorage();
  const a = createAutosave({ key: 'k', storage: s, setTimer: t.setTimer, clearTimer: t.clearTimer });
  a.schedule(() => ({ v: 'debounced' }));
  ok('flush returns true on success', a.flush(() => ({ v: 'flushed' })) === true);
  ok('the flushed payload is stored', JSON.parse(s.map.get('k')).v === 'flushed');
  t.fire();
  ok('the debounced write never happens after flush',
     JSON.parse(s.map.get('k')).v === 'flushed');
}

console.log('--- failure never escapes ---');
{
  const t = fakeTimers();
  const quota = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const a = createAutosave({ key: 'k', storage: quota, setTimer: t.setTimer, clearTimer: t.clearTimer });
  a.schedule(() => ({ big: 'x' }));
  let threw = false;
  try { t.fire(); } catch { threw = true; }
  ok('a full quota does not throw out of the timer', !threw);
  ok('flush reports the failure instead', a.flush(() => ({})) === false);

  const s = fakeStorage();
  const b = createAutosave({ key: 'k', storage: s, setTimer: t.setTimer, clearTimer: t.clearTimer });
  ok('a broken serializer is contained', b.flush(() => { throw new Error('boom'); }) === false);
  ok('and writes nothing', s.map.size === 0);
}

console.log('--- loading is safe against every kind of damage ---');
{
  const s = fakeStorage();
  const a = createAutosave({ key: 'k', storage: s });
  ok('empty storage loads null', a.load() === null);
  s.map.set('k', 'not json at all');
  ok('corrupt JSON loads null', a.load() === null);
  s.map.set('k', '"just a string"');
  ok('a non-object loads null', a.load() === null);
  s.map.set('k', JSON.stringify({ savedAt: 1, scene: { shapes: [] } }));
  ok('a valid payload loads', a.load() !== null);
  const denied = createAutosave({ key: 'k', storage: { getItem: () => { throw new Error('denied'); } } });
  ok('a storage that throws loads null', denied.load() === null);
  a.clear();
  ok('clear removes it', a.load() === null);
}

console.log('--- content detection ---');
ok('null has none', !workspaceHasContent(null));
ok('empty scene has none', !workspaceHasContent({ scene: { shapes: [] } }));
ok('a shape counts', workspaceHasContent({ scene: { shapes: [{}] } }));
ok('a beat counts', workspaceHasContent({ pattern: { grid: { kick: [false, true] } } }));
ok('a silent grid does not', !workspaceHasContent({ pattern: { grid: { kick: [false, false] } } }));
ok('lyrics count', workspaceHasContent({ lyrics: 'first line' }));
ok('whitespace lyrics do not', !workspaceHasContent({ lyrics: '   \n ' }));

console.log('--- description reads as words ---');
{
  const d = describeWorkspace({
    scene: { shapes: [{}, {}, {}], camera: {} },
    pattern: { grid: { kick: [true] } },
    lyrics: 'la la',
  });
  ok('names each part', d.includes('3 shapes') && d.includes('3D') && d.includes('a beat') && d.includes('lyrics'), d);
  ok('singular shape', describeWorkspace({ scene: { shapes: [{}] } }) === '1 shape');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
