// files.js touches the DOM only inside pickFile/makeDropTarget; the
// validation half is pure and is what actually guards the app.
globalThis.document = { createElement: () => ({ style: {}, addEventListener(){}, remove(){}, click(){} }),
                        body: { appendChild(){} }, addEventListener(){} };
globalThis.window = { addEventListener(){} };

const { validateFile, fileExtension, formatBytes, LIMITS, ACCEPT }
  = await import('../js/files.js');

let pass=0,fail=0;
const ok=(n,c,x='')=>{c?(pass++,console.log(`  PASS  ${n}`)):(fail++,console.log(`  FAIL  ${n} ${x}`))};
const f = (name, type, size = 1024) => ({ name, type, size });

console.log('--- extensions ---');
ok('simple', fileExtension('a.wav') === 'wav');
ok('uppercase is normalised', fileExtension('A.WAV') === 'wav');
ok('multiple dots take the last', fileExtension('my.voice.take.mp3') === 'mp3');
ok('no extension', fileExtension('README') === '');
ok('undefined does not throw', fileExtension(undefined) === '');
ok('a dotfile has no extension', fileExtension('.gitignore') === 'gitignore');

console.log('--- audio accepted broadly ---');
for (const [name, type] of [
  ['take.wav', 'audio/wav'], ['take.mp3', 'audio/mpeg'], ['take.m4a', ''],
  ['take.ogg', 'audio/ogg'], ['take.opus', ''], ['take.flac', 'audio/flac'],
  ['recording.webm', 'video/webm'], ['take.WAV', 'audio/wave'],
]) ok(`${name} (${type || 'no type'})`, validateFile(f(name, type), 'audio').ok);

console.log('--- audio rejected sensibly ---');
{
  const r = validateFile(f('cat.png', 'image/png'), 'audio');
  ok('an image is refused', !r.ok);
  ok('and the message names the file', r.message.includes('cat.png'), r.message);
  ok('and says what it looks like', r.message.includes('.png'), r.message);
}
ok('a document is refused', !validateFile(f('notes.pdf', 'application/pdf'), 'audio').ok);
ok('nothing at all is refused', !validateFile(null, 'audio').ok);

console.log('--- size limits ---');
{
  const big = validateFile(f('huge.wav', 'audio/wav', LIMITS.audio + 1), 'audio');
  ok('over the limit is refused', !big.ok);
  ok('the message gives both numbers', /MB/.test(big.message) && big.message.includes('huge.wav'), big.message);
  ok('exactly at the limit is allowed', validateFile(f('x.wav', 'audio/wav', LIMITS.audio), 'audio').ok);
  const empty = validateFile(f('empty.wav', 'audio/wav', 0), 'audio');
  ok('a zero-byte file is caught early', !empty.ok && /empty/i.test(empty.message), empty.message);
}

console.log('--- images ---');
ok('png', validateFile(f('logo.png', 'image/png'), 'image').ok);
ok('svg', validateFile(f('logo.svg', 'image/svg+xml'), 'image').ok);
ok('webp with no reported type', validateFile(f('logo.webp', ''), 'image').ok);
ok('audio is not an image', !validateFile(f('take.wav', 'audio/wav'), 'image').ok);
ok('images have a tighter limit than audio', LIMITS.image < LIMITS.audio);
ok('an oversized image is refused',
   !validateFile(f('huge.png', 'image/png', LIMITS.image + 1), 'image').ok);

console.log('--- json ---');
ok('a .json file', validateFile(f('scene.json', 'application/json'), 'json').ok);
ok('reported as plain text', validateFile(f('scene.json', 'text/plain'), 'json').ok);
ok('a .txt script', validateFile(f('script.txt', 'text/plain'), 'json').ok);
ok('audio is not json', !validateFile(f('take.wav', 'audio/wav'), 'json').ok);

console.log('--- byte formatting ---');
ok('bytes', formatBytes(512) === '512 B', formatBytes(512));
ok('kilobytes', formatBytes(2048) === '2 KB', formatBytes(2048));
ok('megabytes', formatBytes(5 * 1024 * 1024) === '5.0 MB', formatBytes(5*1024*1024));
ok('zero', formatBytes(0) === '0 B');
ok('nonsense does not throw', formatBytes(NaN) === '0 B');
ok('negative does not throw', formatBytes(-5) === '0 B');

console.log('--- accept strings cover the pickers ---');
ok('audio accept mentions wav', ACCEPT.audio.includes('.wav'));
ok('image accept mentions png', ACCEPT.image.includes('.png'));
ok('json accept mentions json', ACCEPT.json.includes('.json'));

console.log('--- an unknown kind is refused, not waved through ---');
ok('unknown kind fails closed', !validateFile(f('x.wav', 'audio/wav'), 'nonsense').ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
