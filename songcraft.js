// Songwriting aids: syllable counting, rhyme matching, and diatonic chord
// progressions.
//
// English spelling is not phonetic, so syllable counting and rhyme
// detection here are orthographic approximations, not a pronunciation
// dictionary. They are right often enough to be useful for checking a line
// scans, and the UI presents them as guidance rather than fact.
//
// The chord theory, by contrast, is exact — scales and diatonic triads are
// arithmetic, not heuristics.

const VOWELS = 'aeiouy';

// Words the vowel-group rule reliably gets wrong.
const SYLLABLE_EXCEPTIONS = {
  the: 1, a: 1, i: 1, are: 1, were: 1, been: 1, come: 1, some: 1, done: 1,
  gone: 1, love: 1, live: 1, move: 1, have: 1, give: 1, one: 1, once: 1,
  every: 3, business: 2, evening: 2, different: 3, beautiful: 3, people: 2,
  little: 2, fire: 1, hour: 1, our: 1, being: 2, doing: 2, going: 2,
  poem: 2, quiet: 2, science: 2, area: 3, idea: 3, real: 1, cruel: 2,
};

export function countSyllables(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (SYLLABLE_EXCEPTIONS[w] !== undefined) return SYLLABLE_EXCEPTIONS[w];
  if (w.length <= 3) return 1;

  // Count runs of vowels: each run is roughly one spoken syllable.
  let count = 0;
  let prevWasVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = VOWELS.includes(w[i]);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }

  // Silent terminal 'e' ("stone" is one syllable, not two) — but not when
  // it is the only vowel run, and not after 'l' ("candle" keeps its beat).
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) count--;
  // "-ed" is usually silent unless it follows t or d ("wanted", "landed").
  if (/[^td]ed$/.test(w) && count > 1) count--;
  // Syllabic consonants: the -sm/-thm cluster is spoken as its own beat,
  // though it contains no written vowel (rhythm, prism, algorithm).
  if (/(sm|thm)$/.test(w)) count++;

  return Math.max(1, count);
}

export function countLineSyllables(line) {
  const words = String(line).trim().split(/\s+/).filter(Boolean);
  return words.reduce((sum, w) => sum + countSyllables(w), 0);
}

/**
 * Fold the many English spellings of one sound together, so comparison
 * happens on something closer to pronunciation than to orthography.
 * This must run BEFORE the rhyming part is extracted: a silent terminal
 * 'e' is still a vowel *character*, so "lane" would otherwise be read as
 * ending in the vowel run "e" rather than "ane".
 */
function phoneticish(word) {
  let w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  w = w.replace(/igh/g, 'ii');                                        // light, night
  w = w.replace(/([aeiouy])([^aeiouy]+)e$/, (_, v, c) => v + v + c);  // lane, bite
  w = w.replace(/ai|ay/g, 'aa');                                      // rain, day
  w = w.replace(/ee|ea/g, 'ii');                                      // see, sea
  w = w.replace(/oa|ow/g, 'oo');                                      // boat, slow
  return w;
}

/**
 * The rhyming part of a word: everything from its last vowel run onward.
 * "nation" and "station" share "ion"; "cat" and "hat" share "at"; and
 * after normalisation "rain" and "lane" both give "aan".
 */
export function rhymeKey(word) {
  const w = phoneticish(word);
  if (!w) return '';
  let lastVowelStart = -1;
  for (let i = w.length - 1; i >= 0; i--) {
    if (VOWELS.includes(w[i])) {
      lastVowelStart = i;
      while (lastVowelStart > 0 && VOWELS.includes(w[lastVowelStart - 1])) lastVowelStart--;
      break;
    }
  }
  return lastVowelStart === -1 ? w : w.slice(lastVowelStart);
}

export function doesRhyme(a, b) {
  const ka = rhymeKey(a);
  const kb = rhymeKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return String(a).toLowerCase() !== String(b).toLowerCase();
  return false;
}

/**
 * Rhyme scheme of a set of lines, as letters: lines that rhyme share a
 * letter, so a classic quatrain reads "ABAB".
 */
export function rhymeScheme(lines) {
  const keys = lines.map((l) => {
    const words = String(l).trim().split(/\s+/).filter(Boolean);
    return words.length ? rhymeKey(words[words.length - 1]) : '';
  });
  const seen = new Map();
  let next = 0;
  return keys.map((k) => {
    if (!k) return '-';
    if (!seen.has(k)) seen.set(k, String.fromCharCode(65 + next++));
    return seen.get(k);
  });
}

export function analyseLyrics(text) {
  const lines = String(text).split('\n').map((l) => l.trim());
  const scheme = rhymeScheme(lines);
  return lines.map((line, i) => ({
    line,
    syllables: countLineSyllables(line),
    rhyme: line ? scheme[i] : '-',
  }));
}

/* ---------------- Chord theory ---------------- */

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

// Quality of the triad built on each scale degree — a property of the
// scale itself, identical in every key.
const MAJOR_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];
const MINOR_QUALITIES = ['m', 'dim', '', 'm', 'm', '', ''];
const MAJOR_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MINOR_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

export const KEYS = CHROMATIC;
export const MODES = ['major', 'minor'];

export function scaleChords(root, mode = 'major') {
  const rootIndex = CHROMATIC.indexOf(root);
  if (rootIndex === -1) throw new Error(`Unknown key: ${root}`);
  const steps = mode === 'minor' ? MINOR_STEPS : MAJOR_STEPS;
  const qualities = mode === 'minor' ? MINOR_QUALITIES : MAJOR_QUALITIES;
  const numerals = mode === 'minor' ? MINOR_NUMERALS : MAJOR_NUMERALS;

  return steps.map((step, i) => ({
    degree: i + 1,
    numeral: numerals[i],
    name: CHROMATIC[(rootIndex + step) % 12] + qualities[i],
    semitone: (rootIndex + step) % 12,
  }));
}

// Progressions given as scale degrees, so they transpose to any key.
export const PROGRESSIONS = [
  { name: 'Pop', degrees: [1, 5, 6, 4], note: 'The most used progression in modern pop.' },
  { name: 'Ballad', degrees: [6, 4, 1, 5], note: 'Same chords, darker start.' },
  { name: 'Classic', degrees: [1, 6, 4, 5], note: 'Fifties songwriting staple.' },
  { name: 'Blues turnaround', degrees: [1, 4, 1, 5], note: 'Foundation of blues and rock.' },
  { name: 'Andalusian', degrees: [1, 7, 6, 5], note: 'Descending, flamenco flavour.' },
  { name: 'Jazz cadence', degrees: [2, 5, 1, 1], note: 'The ii–V–I every jazz tune leans on.' },
];

export function progressionInKey(progression, root, mode = 'major') {
  const chords = scaleChords(root, mode);
  return progression.degrees.map((d) => chords[d - 1]);
}

export const SONG_STRUCTURES = [
  { name: 'Pop standard', sections: ['Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Chorus'] },
  { name: 'Simple', sections: ['Verse', 'Chorus', 'Verse', 'Chorus'] },
  { name: 'Ballad', sections: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Outro'] },
  { name: 'Hip-hop', sections: ['Intro', 'Hook', 'Verse', 'Hook', 'Verse', 'Hook'] },
];
