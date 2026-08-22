import { parseVoiceLines, parseNL, stripVoice, sectionFor, SECTIONS } from '../js/flick-cmd.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${x}`));
};

console.log('--- sections ---');
ok('all sidebar ids known', SECTIONS.includes('speak') && SECTIONS.includes('animate') && SECTIONS.includes('dj'));
ok('voice studio alias', sectionFor('Voice Studio') === 'studio');
ok('audiobook alias', sectionFor('the audiobook view') === 'longform');
ok('dj live alias', sectionFor('DJ Live') === 'dj');
ok('unknown is null', sectionFor('photoshop') === null);

console.log('--- strip / lines ---');
const mixed = 'Opening Animate.\nANIM:{"op":"create","prompt":"a red cube"}\nDAW:{"op":"play"}';
ok('strip hides directives', stripVoice(mixed) === 'Opening Animate.');
const lines = parseVoiceLines(mixed);
ok('two directives', lines.length === 2, String(lines.length));
ok('anim app', lines[0].app === 'animate' && lines[0].prompt === 'a red cube');
ok('daw passthrough', lines[1].app === 'music' && lines[1].daw && lines[1].daw.op === 'play');

const voice = parseVoiceLines('VOICE:{"app":"speak","op":"speak","text":"hello"}');
ok('VOICE speak', voice[0] && voice[0].app === 'speak' && voice[0].text === 'hello');
ok('bad json skipped', parseVoiceLines('SPEAK:{nope}').length === 0);

console.log('--- natural language ---');
const open = parseNL('Open Animate');
ok('open animate', open.length === 1 && open[0].section === 'animate');

const say = parseNL('Speak this: The night is a river');
ok('speak navigates', say.some((c) => c.app === 'nav' && c.section === 'speak'));
ok('speak text', say.some((c) => c.app === 'speak' && c.text === 'The night is a river'));

const quoted = parseNL('Say "keep the light on"');
ok('quoted say', quoted.some((c) => c.op === 'speak' && c.text === 'keep the light on'));

const rec = parseNL('Record my voice');
ok('record opens studio', rec.some((c) => c.section === 'studio') && rec.some((c) => c.op === 'record'));

const openRec = parseNL('Open Voice Studio and record');
ok('open studio and record', openRec.some((c) => c.section === 'studio') && openRec.some((c) => c.op === 'record'));

const anim = parseNL('Animate three blue circles that fade in');
ok('animate create', anim.some((c) => c.app === 'animate' && /three blue circles/.test(c.prompt)));

const lib = parseNL('Search the library for rain');
ok('library search', lib.some((c) => c.app === 'library' && c.q === 'rain'));

const mix = parseNL('Build the mix');
ok('project build', mix.some((c) => c.app === 'project' && c.op === 'build'));

ok('music bpm left to DAW', parseNL('Play the set at 128 BPM').length === 0);
ok('mute left to DAW', parseNL('Mute drums and launch scene 1').length === 0);
ok('bare play left to DAW', parseNL('Play').length === 0);

const book = parseNL('Generate the audiobook');
ok('longform generate', book.some((c) => c.app === 'longform' && c.op === 'generate'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
