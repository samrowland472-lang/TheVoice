const { createHistory, historyIntent, isTextEntry, HISTORY_LIMIT }
  = await import('../js/history.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};

console.log('--- the basics ---');
{
  const h = createHistory({ n: 0 });
  ok('nothing to undo at the start', !h.canUndo());
  ok('nothing to redo either', !h.canRedo());
  ok('undo returns null rather than throwing', h.undo() === null);
  ok('redo too', h.redo() === null);

  h.push({ n: 1 });
  h.push({ n: 2 });
  ok('undo is now possible', h.canUndo());
  ok('undo steps back one', h.undo().n === 1);
  ok('and again', h.undo().n === 0);
  ok('and stops at the beginning', h.undo() === null);
  ok('redo walks forward', h.redo().n === 1);
  ok('all the way', h.redo().n === 2);
  ok('and stops at the end', h.redo() === null);
}

console.log('--- snapshots are copies, not references ---');
{
  const live = { shapes: [{ x: 1 }] };
  const h = createHistory(live);
  live.shapes[0].x = 999;          // mutate after recording
  live.shapes.push({ x: 5 });
  h.push({ shapes: [{ x: 2 }] });
  const back = h.undo();
  ok('the recorded state is unaffected by later mutation', back.shapes[0].x === 1,
     JSON.stringify(back));
  ok('and by later additions', back.shapes.length === 1, String(back.shapes.length));
  const again = h.undo();
  ok('there is nothing before it', again === null);
}
{
  const h = createHistory({ a: 1 });
  h.push({ a: 2 });
  const got = h.undo();
  got.a = 42;                       // mutate what undo handed back
  const got2 = h.redo(); h.undo();
  ok('mutating a returned state does not corrupt the stack', h.current().a === 1,
     JSON.stringify(h.current()));
}

console.log('--- identical states are not recorded ---');
{
  const h = createHistory({ n: 0 });
  ok('an identical push is rejected', h.push({ n: 0 }) === false);
  ok('the stack did not grow', h.length === 1, String(h.length));
  ok('a different push is accepted', h.push({ n: 1 }) === true);
  ok('key order does not create a false difference',
     h.push({ n: 1 }) === false);
  // Repeated no-op pushes are the common case after a drag that changed
  // nothing; letting them through makes Ctrl+Z look broken.
  for (let i = 0; i < 20; i++) h.push({ n: 1 });
  ok('twenty no-ops add nothing', h.length === 2, String(h.length));
  ok('one undo reaches the original', h.undo().n === 0);
}

console.log('--- a new action clears the redo branch ---');
{
  const h = createHistory({ n: 0 });
  h.push({ n: 1 }); h.push({ n: 2 });
  h.undo(); h.undo();
  ok('redo is available after undoing', h.canRedo());
  h.push({ n: 99 });
  ok('a fresh edit discards it', !h.canRedo());
  ok('and undo returns to where the branch started', h.undo().n === 0);
  ok('redo now follows the new branch', h.redo().n === 99);
}

console.log('--- the stack is bounded ---');
{
  const h = createHistory({ n: 0 }, { limit: 5 });
  for (let i = 1; i <= 20; i++) h.push({ n: i });
  ok('length is capped', h.length <= 5, String(h.length));
  ok('the newest state is still current', h.current().n === 20, JSON.stringify(h.current()));
  let steps = 0;
  while (h.undo() !== null) steps++;
  ok('undo walks the whole retained stack', steps === h.length - 1, `${steps} of ${h.length}`);
  ok('the default limit is sane', HISTORY_LIMIT >= 20 && HISTORY_LIMIT <= 500, String(HISTORY_LIMIT));
}
{
  // Dropping the oldest state must not corrupt the index.
  const h = createHistory({ n: 0 }, { limit: 3 });
  h.push({ n: 1 }); h.push({ n: 2 }); h.push({ n: 3 }); h.push({ n: 4 });
  ok('current survives eviction', h.current().n === 4, JSON.stringify(h.current()));
  ok('undo still works after eviction', h.undo().n === 3);
  ok('and redo', h.redo().n === 4);
  ok('position stays inside the stack', h.position >= 0 && h.position < h.length,
     `${h.position} / ${h.length}`);
}

console.log('--- reset ---');
{
  const h = createHistory({ n: 0 });
  h.push({ n: 1 }); h.push({ n: 2 });
  h.reset({ n: 100 });
  ok('history is cleared', !h.canUndo() && !h.canRedo());
  ok('the new state is current', h.current().n === 100);
  ok('length is one', h.length === 1, String(h.length));
}

console.log('--- real scene shapes survive the round trip ---');
{
  const scene = { duration: 5, fps: 30, background: '#0a0d0c', shapes: [
    { id: 's1', type: 'circle', label: 'C', text: '', src: '', reactive: true, easing: 'ease',
      keyframes: [{ time: 0, x: 1, y: 2, scale: 1, rotation: 0, opacity: 1, color: '#fff', ease: [0.1,0.2,0.3,0.4] }] }] };
  const h = createHistory(scene);
  h.push({ ...scene, duration: 9 });
  const back = h.undo();
  ok('duration restored', back.duration === 5);
  ok('custom bezier control points survive', Array.isArray(back.shapes[0].keyframes[0].ease));
  ok('and their values', back.shapes[0].keyframes[0].ease.join() === '0.1,0.2,0.3,0.4');
  ok('booleans survive', back.shapes[0].reactive === true);
}

console.log('--- keyboard intent ---');
const ev = (o) => ({ metaKey: false, ctrlKey: false, shiftKey: false, ...o });
ok('ctrl+z is undo', historyIntent(ev({ ctrlKey: true, key: 'z' })) === 'undo');
ok('cmd+z is undo', historyIntent(ev({ metaKey: true, key: 'z' })) === 'undo');
ok('uppercase Z still counts', historyIntent(ev({ ctrlKey: true, key: 'Z' })) === 'undo');
ok('ctrl+shift+z is redo', historyIntent(ev({ ctrlKey: true, shiftKey: true, key: 'z' })) === 'redo');
ok('cmd+shift+z is redo', historyIntent(ev({ metaKey: true, shiftKey: true, key: 'Z' })) === 'redo');
ok('ctrl+y is redo', historyIntent(ev({ ctrlKey: true, key: 'y' })) === 'redo');
ok('plain z is not', historyIntent(ev({ key: 'z' })) === null);
ok('ctrl+s is not', historyIntent(ev({ ctrlKey: true, key: 's' })) === null);
ok('a missing key does not throw', historyIntent(ev({ ctrlKey: true })) === null);

console.log('--- typing is left alone ---');
ok('a text input', isTextEntry({ tagName: 'INPUT', type: 'text' }));
ok('an input with no type defaults to text', isTextEntry({ tagName: 'INPUT' }));
ok('a textarea', isTextEntry({ tagName: 'TEXTAREA' }));
ok('a search box', isTextEntry({ tagName: 'INPUT', type: 'search' }));
ok('contenteditable', isTextEntry({ tagName: 'DIV', isContentEditable: true }));
ok('a range slider is not typing', !isTextEntry({ tagName: 'INPUT', type: 'range' }));
ok('a checkbox is not', !isTextEntry({ tagName: 'INPUT', type: 'checkbox' }));
ok('a colour picker is not', !isTextEntry({ tagName: 'INPUT', type: 'color' }));
ok('a button is not', !isTextEntry({ tagName: 'BUTTON' }));
ok('a canvas is not', !isTextEntry({ tagName: 'CANVAS' }));
ok('null does not throw', !isTextEntry(null));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
