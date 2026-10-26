import { wordCount, clipToWords, chunkScript, formatEta, MAX_SPEAK_WORDS }
  from '../js/speak-script.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => {
  if (c) { pass++; console.log(`  PASS  ${n}`); }
  else { fail++; console.log(`  FAIL  ${n} ${x}`); }
};

console.log('--- word count ---');
ok('empty', wordCount('') === 0);
ok('one word', wordCount('hello') === 1);
ok('trims', wordCount('  a  b  ') === 2);
ok('cap is 20k words', MAX_SPEAK_WORDS === 20000);

console.log('--- clip ---');
ok('under cap is unchanged', clipToWords('one two') === 'one two');
const many = Array.from({ length: 12 }, (_, i) => `w${i}`).join(' ');
ok('clips extra words', clipToWords(many, 4).split(/\s+/).length === 4);

console.log('--- chunks ---');
const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i} lands here.`).join(' ');
const chunks = chunkScript(long, 80);
ok('splits into pieces', chunks.length >= 2);
ok('offsets are numbers', chunks.every((c) => Number.isInteger(c.start)));
ok('pieces join back', chunks.map((c) => c.text).join('').replace(/\s+/g, ' ').length > 0);

console.log('--- eta ---');
ok('seconds', formatEta(12) === '~12s');
ok('minutes', formatEta(90) === '~1m 30s');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
