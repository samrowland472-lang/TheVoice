import { splitIntoChapters, concatAudio } from '../js/chapters.js';

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
}

console.log('--- empty / whitespace ---');
check('empty string -> []', splitIntoChapters('').length === 0);
check('whitespace -> []', splitIntoChapters('   \n\n  ').length === 0);

console.log('--- short text stays one chunk ---');
const short = splitIntoChapters('Hello world. This is short.');
check('one chunk', short.length === 1, JSON.stringify(short.map(c=>c.chars)));
check('text preserved', short[0].text === 'Hello world. This is short.');
check('default title', short[0].title === 'Part 1', short[0].title);

console.log('--- explicit chapter headings ---');
const book = `Chapter 1
It was the best of times.

Chapter 2
It was the worst of times.

Chapter 3
That is all.`;
const chapters = splitIntoChapters(book);
check('3 chapters', chapters.length === 3, JSON.stringify(chapters.map(c=>c.title)));
check('titles captured', chapters[0].title === 'Chapter 1' && chapters[1].title === 'Chapter 2' && chapters[2].title === 'Chapter 3', JSON.stringify(chapters.map(c=>c.title)));
check('heading not in body', !chapters[0].text.includes('Chapter 1'), chapters[0].text);
check('body correct', chapters[1].text === 'It was the worst of times.', chapters[1].text);

console.log('--- roman numeral headings ---');
const roman = splitIntoChapters('Chapter IV\nFourth chapter body.\n\nChapter V\nFifth chapter body.');
check('roman numerals recognized', roman.length === 2, JSON.stringify(roman.map(c=>c.title)));

console.log('--- long text splits under cap ---');
const para = 'This is a sentence that repeats. '.repeat(80); // ~2640 chars
const longChunks = splitIntoChapters(para, 500);
check('multiple chunks', longChunks.length > 1, `got ${longChunks.length}`);
check('all under cap', longChunks.every(c => c.chars <= 500), JSON.stringify(longChunks.map(c=>c.chars)));
check('no empty chunks', longChunks.every(c => c.text.trim().length > 0));

console.log('--- content preservation (no text lost) ---');
const originalWords = para.trim().split(/\s+/).length;
const rejoinedWords = longChunks.map(c=>c.text).join(' ').trim().split(/\s+/).length;
check('word count preserved', originalWords === rejoinedWords, `orig=${originalWords} got=${rejoinedWords}`);

console.log('--- paragraph boundaries preferred ---');
const paras = ['A'.repeat(200), 'B'.repeat(200), 'C'.repeat(200)].join('\n\n');
const paraChunks = splitIntoChapters(paras, 450);
check('splits on paragraph boundary', paraChunks.every(c => !/A.*B|B.*C/s.test(c.text) || c.text.includes('\n\n')), JSON.stringify(paraChunks.map(c=>c.text.slice(0,3)+'...'+c.chars)));

console.log('--- single giant sentence hard-splits ---');
const giant = 'x'.repeat(2000);
const giantChunks = splitIntoChapters(giant, 500);
check('hard split applied', giantChunks.length >= 4, `got ${giantChunks.length}`);
check('all under cap', giantChunks.every(c => c.chars <= 500), JSON.stringify(giantChunks.map(c=>c.chars)));

console.log('--- indices sequential ---');
check('indices 0..n-1', longChunks.every((c,i) => c.index === i));

console.log('--- concatAudio ---');
const a = new Float32Array([1,1,1]);
const b = new Float32Array([2,2]);
const joined = concatAudio([a,b], 10, 1); // 1s gap @ 10Hz = 10 samples
check('length = 3 + 10 + 2', joined.length === 15, `got ${joined.length}`);
check('first part copied', joined[0] === 1 && joined[2] === 1);
check('gap is silent', joined[3] === 0 && joined[12] === 0);
check('second part after gap', joined[13] === 2 && joined[14] === 2, `${joined[13]},${joined[14]}`);
const single = concatAudio([a], 10, 1);
check('single part no trailing gap', single.length === 3, `got ${single.length}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
