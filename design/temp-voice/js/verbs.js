// What the words mean, physically.
//
// "A sphere smashing into a cube" is three facts: two objects, an ordering
// (the sphere is the aggressor), and a physical event (impact, then the
// target comes apart). The old parser found one shape type and no verb, so
// it produced a static cube — technically a noun from the sentence, and
// useless.
//
// This module turns a sentence into that structure. It does NOT try to
// cover all of English, which is not a thing a lookup table can do. It maps
// a few hundred of the verbs people actually reach for onto a small set of
// physical primitives, and reports honestly when it does not recognise
// something so the caller can hand the sentence to a model instead. A
// confident wrong answer is worse than no answer.

export const SHAPE_WORDS = {
  circle: 'circle', circles: 'circle', dot: 'circle', dots: 'circle',
  ball: 'sphere', balls: 'sphere', sphere: 'sphere', spheres: 'sphere',
  orb: 'sphere', orbs: 'sphere', globe: 'sphere', globes: 'sphere',
  bubble: 'sphere', bubbles: 'sphere', planet: 'sphere', moon: 'sphere',
  square: 'rect', squares: 'rect', rectangle: 'rect', rectangles: 'rect',
  rect: 'rect', panel: 'rect', panels: 'rect', card: 'rect', cards: 'rect',
  cube: 'cube', cubes: 'cube', box: 'cube', boxes: 'cube', block: 'cube',
  blocks: 'cube', brick: 'cube', bricks: 'cube', crate: 'cube', crates: 'cube',
  triangle: 'triangle', triangles: 'triangle', arrow: 'triangle', arrows: 'triangle',
  pyramid: 'pyramid', pyramids: 'pyramid', cone: 'pyramid', cones: 'pyramid',
  spike: 'pyramid', spikes: 'pyramid',
  cylinder: 'cylinder', cylinders: 'cylinder', tube: 'cylinder', tubes: 'cylinder',
  pillar: 'cylinder', pillars: 'cylinder', column: 'cylinder', columns: 'cylinder',
  can: 'cylinder', barrel: 'cylinder', rod: 'cylinder', pipe: 'cylinder',
  wave: 'wave', waves: 'wave', waveform: 'wave', ribbon: 'wave', line: 'wave',
  text: 'text', word: 'text', words: 'text', title: 'text', heading: 'text',
  caption: 'text', logo: 'text', letters: 'text',
  // Deliberately vague nouns: something has to be there to be acted upon.
  thing: 'cube', things: 'cube', something: 'cube', object: 'cube',
  objects: 'cube', target: 'cube', it: 'cube', shape: 'cube', shapes: 'cube',
};

export const SOLID_TYPES = ['cube', 'sphere', 'pyramid', 'cylinder'];

/**
 * Nouns that point rather than name.
 *
 * "Spin it" does not describe a cube; it describes whatever the person is
 * looking at. These still resolve to a shape type so a from-scratch scene
 * has something to draw, but a caller working on an existing scene needs
 * to know the word was a pointer so it can follow the selection instead.
 */
export const VAGUE_NOUNS = new Set([
  'it', 'this', 'that', 'them', 'these', 'those',
  'thing', 'things', 'something', 'object', 'objects', 'shape', 'shapes',
]);

/**
 * The physical primitives. Everything a verb can mean reduces to one of
 * these, plus modifiers for how hard and how fast.
 *
 * `needsTarget` marks the ones that are meaningless alone — you cannot
 * collide with nothing — so the parser can invent an object when the
 * sentence implies one ("a cylinder obliterating something").
 */
export const ACTIONS = {
  // Impact families. These differ in more than name: a smash leaves heavy
  // chunks that fall, an obliteration leaves almost nothing and throws it
  // hard, a crush does not fragment at all. Collapsing them to one effect
  // is what made every violent verb look identical.
  collide:    { needsTarget: true,  destroys: false },
  smash:      { needsTarget: true,  destroys: true,
                pieces: 10, pieceScale: 1.0, speed: 1.0, gravity: 1.0,
                radial: 0.75, fade: 2.2, passThrough: true },
  obliterate: { needsTarget: true,  destroys: true,
                // Many tiny pieces, thrown hard, gone quickly: nothing
                // recognisable is left, which is what the word means.
                pieces: 16, pieceScale: 0.45, speed: 1.9, gravity: 0.55,
                radial: 1.0, fade: 3.2, passThrough: true },
  crush:      { needsTarget: true,  destroys: true,
                // Flattened, not scattered — few pieces, low and slow.
                pieces: 5, pieceScale: 1.5, speed: 0.35, gravity: 1.6,
                radial: 0.25, fade: 1.4, passThrough: false, flatten: true },
  explode:    { needsTarget: false, destroys: true,
                // From within, radiating evenly, with a fireball's lift.
                pieces: 14, pieceScale: 0.9, speed: 1.5, gravity: 0.7,
                radial: 1.0, fade: 2.4, lift: 0.5 },
  shatter:    { needsTarget: false, destroys: true,
                // Brittle: many shards, little push, they drop.
                pieces: 14, pieceScale: 0.7, speed: 0.6, gravity: 1.5,
                radial: 0.9, fade: 1.8 },
  vaporise:   { needsTarget: false, destroys: true,
                // Dispersal without debris: pieces shrink away rather than
                // falling, drifting upward as they go.
                pieces: 18, pieceScale: 0.5, speed: 0.7, gravity: -0.35,
                radial: 1.0, fade: 1.2, dissolve: true },
  orbit:      { needsTarget: true,  destroys: false },
  chase:      { needsTarget: true,  destroys: false },
  scatter:    { needsTarget: false, destroys: false },
  gather:     { needsTarget: false, destroys: false },
  spin:       { needsTarget: false, destroys: false },
  tumble:     { needsTarget: false, destroys: false },
  shake:      { needsTarget: false, destroys: false },
  bounce:     { needsTarget: false, destroys: false },
  fall:       { needsTarget: false, destroys: false },
  rise:       { needsTarget: false, destroys: false },
  swirl:      { needsTarget: false, destroys: false },
  pulse:      { needsTarget: false, destroys: false },
  grow:       { needsTarget: false, destroys: false },
  shrink:     { needsTarget: false, destroys: false },
  fadeIn:     { needsTarget: false, destroys: false },
  fadeOut:    { needsTarget: false, destroys: false },
  slide:      { needsTarget: false, destroys: false },
  drift:      { needsTarget: false, destroys: false },
  flip:       { needsTarget: false, destroys: false },
};

/**
 * Verb vocabulary.
 *
 * Stems, not full conjugations: the matcher strips -ing/-s/-ed/-es before
 * looking a word up, so "smash", "smashes", "smashing" and "smashed" all
 * reach the same entry from one line here. That is the difference between
 * a few hundred maintainable rows and a few thousand unmaintainable ones.
 */
export const VERBS = {
  // Heavy impact that breaks something into recognisable chunks.
  smash: 'smash', slam: 'smash', batter: 'smash', clobber: 'smash',
  wallop: 'smash', wreck: 'smash', bash: 'smash', smack: 'smash',
  plough: 'smash', plow: 'smash', barrel: 'smash', barge: 'smash',
  demolish: 'smash', splinter: 'smash', bust: 'smash', bulldoz: 'smash',

  // Nothing recognisable left.
  obliterat: 'obliterate', annihilat: 'obliterate', vaporis: 'vaporise',
  vaporiz: 'obliterate', pulveris: 'obliterate', pulveriz: 'obliterate',
  atomis: 'vaporise', atomiz: 'vaporise', erase: 'vaporise',
  devastat: 'obliterate', decimat: 'obliterate', destroy: 'obliterate',
  ruin: 'obliterate', shred: 'obliterate', total: 'obliterate',
  nuke: 'obliterate', wipe: 'vaporise', evaporat: 'vaporise',
  dissolv: 'vaporise', disintegrat: 'vaporise', dematerialis: 'vaporise',

  // Squashed rather than scattered.
  crush: 'crush', flatten: 'crush', squash: 'crush', compress: 'crush',
  squish: 'crush', stomp: 'crush', tramp: 'crush', press: 'crush',

  // Contact without destruction.
  hit: 'collide', strike: 'collide', collid: 'collide', crash: 'collide',
  bump: 'collide', knock: 'collide', nudge: 'collide', tap: 'collide',
  punch: 'collide', kick: 'collide', ram: 'collide', charg: 'collide',
  headbutt: 'collide', bang: 'collide', clash: 'collide', meet: 'collide',
  impact: 'collide', contact: 'collide', touch: 'collide', boop: 'collide',

  // From within, outward.
  explod: 'explode', burst: 'explode', detonat: 'explode', blow: 'explode',
  erupt: 'explode', blast: 'explode', pop: 'explode', combust: 'explode',
  implod: 'explode', bomb: 'explode',

  // Brittle failure.
  shatter: 'shatter', fractur: 'shatter', crack: 'shatter', break: 'shatter',
  crumbl: 'shatter', fragment: 'shatter', collaps: 'shatter', shard: 'shatter',
  chip: 'shatter', snap: 'shatter',

  // Going round.
  orbit: 'orbit', circl: 'orbit', revolv: 'orbit', encircl: 'orbit',
  ring: 'orbit', loop: 'orbit', round: 'orbit', circumnavigat: 'orbit',
  swirl: 'swirl', spiral: 'swirl', whirl: 'swirl', vortex: 'swirl',
  twist: 'swirl', coil: 'swirl', curl: 'swirl',

  // Turning on the spot.
  spin: 'spin', rotat: 'spin', turn: 'spin', twirl: 'spin',
  pirouett: 'spin', gyrat: 'spin', swivel: 'spin',
  tumbl: 'tumble', roll: 'tumble', somersault: 'tumble', flail: 'tumble',
  cartwheel: 'tumble', careen: 'tumble',
  flip: 'flip', invert: 'flip',

  // Losing control.
  shak: 'shake', shudder: 'shake', vibrat: 'shake', judder: 'shake',
  rattl: 'shake', trembl: 'shake', quiver: 'shake', jitter: 'shake',
  wobbl: 'shake', wiggl: 'shake', jiggl: 'shake', twitch: 'shake',
  convuls: 'shake', spasm: 'shake', freak: 'shake', panic: 'shake',
  rampag: 'shake', rage: 'shake', riot: 'shake', thrash: 'shake',
  glitch: 'shake', malfunction: 'shake', haywire: 'shake', stutter: 'shake',

  // Travel.
  bounc: 'bounce', hop: 'bounce', spring: 'bounce', boing: 'bounce',
  fall: 'fall', drop: 'fall', plummet: 'fall', descend: 'fall',
  sink: 'fall', plung: 'fall', dive: 'fall',
  ris: 'rise', lift: 'rise', ascend: 'rise', soar: 'rise', climb: 'rise',
  float: 'rise', levitat: 'rise', hover: 'drift',
  slid: 'slide', glid: 'slide', swoop: 'slide', sweep: 'slide',
  travel: 'slide', mov: 'slide', fly: 'slide', dash: 'slide', zoom: 'slide',
  streak: 'slide', race: 'slide', shoot: 'slide', dart: 'slide',
  drift: 'drift', wander: 'drift', meander: 'drift', bob: 'drift',
  amble: 'drift', waft: 'drift', roam: 'drift',
  chas: 'chase', follow: 'chase', pursu: 'chase', track: 'chase',
  hunt: 'chase', tail: 'chase', stalk: 'chase',

  // Groups.
  scatter: 'scatter', dispers: 'scatter', spread: 'scatter',
  fan: 'scatter', strew: 'scatter', splay: 'scatter', flee: 'scatter',
  gather: 'gather', converg: 'gather', assembl: 'gather', unite: 'gather',
  merg: 'gather', collect: 'gather', cluster: 'gather', swarm: 'gather',

  // Size and presence.
  puls: 'pulse', throb: 'pulse', beat: 'pulse', breath: 'pulse',
  thump: 'pulse', palpitat: 'pulse',
  grow: 'grow', expand: 'grow', enlarg: 'grow', swell: 'grow',
  inflat: 'grow', balloon: 'grow',
  shrink: 'shrink', deflat: 'shrink', shrivel: 'shrink',
  appear: 'fadeIn', materialis: 'fadeIn', materializ: 'fadeIn',
  emerg: 'fadeIn', arriv: 'fadeIn', reveal: 'fadeIn', fade: 'fadeIn',
  disappear: 'fadeOut', vanish: 'fadeOut', dissipat: 'fadeOut',
  exit: 'fadeOut', retreat: 'fadeOut',
};

/** Adverbs and adjectives that scale how hard the action is. */
const INTENSITY = {
  gently: 0.4, softly: 0.4, slowly: 0.5, slightly: 0.4, lazily: 0.5,
  calmly: 0.5, subtly: 0.35, barely: 0.3, faintly: 0.35,
  quickly: 1.3, fast: 1.4, rapidly: 1.4, sharply: 1.4, hard: 1.6,
  violently: 2, wildly: 2, furiously: 2, savagely: 2, brutally: 2,
  crazy: 1.9, crazily: 1.9, madly: 1.9, insanely: 2, berserk: 2,
  massively: 1.8, hugely: 1.7, enormously: 1.7, utterly: 1.8,
  completely: 1.5, totally: 1.5, absolutely: 1.6, really: 1.3,
  extremely: 1.8, incredibly: 1.7, terribly: 1.6,
};

/** Strip a common inflection so one vocabulary row covers a whole verb. */
export function stem(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return '';
  const candidates = [w];
  if (w.endsWith('ing')) {
    candidates.push(w.slice(0, -3));
    // "smashing" -> "smash", but also "ramming" -> "ram" (doubled consonant)
    if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) candidates.push(w.slice(0, -4));
    candidates.push(`${w.slice(0, -3)}e`);
  }
  if (w.endsWith('es')) candidates.push(w.slice(0, -2));
  if (w.endsWith('s')) candidates.push(w.slice(0, -1));
  if (w.endsWith('ed')) {
    candidates.push(w.slice(0, -2));
    candidates.push(w.slice(0, -1));
    if (w.length > 4 && w[w.length - 3] === w[w.length - 4]) candidates.push(w.slice(0, -3));
  }
  return candidates;
}

/** The action a single word names, or null. */
export function verbFor(word) {
  const forms = stem(word);
  if (!forms) return null;
  for (const f of forms) {
    if (VERBS[f]) return VERBS[f];
  }
  // Prefix match catches the stems stored without their ending, so
  // "obliterating" reaches "obliterat" without listing every form.
  const w = forms[0];
  for (const key of Object.keys(VERBS)) {
    if (key.length >= 4 && w.startsWith(key)) return VERBS[key];
  }
  return null;
}

export function shapeFor(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (SHAPE_WORDS[w]) return SHAPE_WORDS[w];
  if (w.endsWith('s') && SHAPE_WORDS[w.slice(0, -1)]) return SHAPE_WORDS[w.slice(0, -1)];
  return null;
}

const NUMBER_WORDS = {
  a: 1, an: 1, one: 1, single: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  couple: 2, few: 3, several: 4, many: 6, loads: 8, lots: 8, dozens: 10,
};

export const COLOUR_WORDS = {
  red: '#e4483d', crimson: '#d21f3c', scarlet: '#e02020', orange: '#f08a24',
  amber: '#f5b301', gold: '#e8c14a', yellow: '#f2d024', lime: '#9fd356',
  green: '#3fbf72', emerald: '#1f9e6b', teal: '#2bb3a3', cyan: '#3fd8e8',
  turquoise: '#31c9c1', blue: '#3fc6ff', azure: '#2f8fe0', navy: '#2b4a8a',
  indigo: '#5a5ae6', purple: '#9a5ae6', violet: '#b06ae8', magenta: '#e055b8',
  pink: '#f06fa8', rose: '#ee5f86', white: '#f2f7f3', silver: '#c8d2cc',
  grey: '#8a9490', gray: '#8a9490', black: '#14181a', charcoal: '#2a3033',
  brown: '#8a5a3c', copper: '#c87a45', bronze: '#a97142',
};

const MAX_COUNT = 12;

/**
 * Parse one noun phrase: "three glowing red cubes" -> count, type, colour.
 *
 * Returns null when no shape noun is present, which is how the caller
 * distinguishes "a sphere hits a cube" from "a sphere hits the mood".
 */
export function parseNounPhrase(words, names = null) {
  let type = null;
  let typeIndex = -1;
  let name = null;
  for (let i = 0; i < words.length; i++) {
    const t = shapeFor(words[i]);
    if (t) { type = t; typeIndex = i; break; }
  }
  // A shape word can also be something's name: a scene may well contain an
  // object called "Barrel", and "barrel" is a cylinder in the vocabulary.
  // Recording both lets a caller try the name first and fall back to the
  // kind, instead of the kind quietly winning and the object being missed.
  if (type && names) {
    const w = String(words[typeIndex]).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (names.has(w)) name = w;
  }
  if (!type && names) {
    // Nothing here is a shape word — but the caller may know that the
    // scene contains something called this. Without that, "the dragon
    // smashes into the tower" parses to nothing at all, which is exactly
    // the sentence someone types once they have imported a dragon.
    for (let i = 0; i < words.length; i++) {
      const w = String(words[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (w && names.has(w)) {
        name = w;
        typeIndex = i;
        // A named object still needs a type for anything that has to draw
        // a stand-in; a cube is the least presumptuous.
        type = 'cube';
        break;
      }
    }
  }
  if (!type) return null;

  let count = 1;
  let colour = null;
  // Only look at the words modifying THIS noun, so a colour belonging to
  // the other object in the sentence is not stolen.
  for (let i = 0; i < typeIndex; i++) {
    const w = String(words[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/^\d+$/.test(w)) count = Math.min(MAX_COUNT, Math.max(1, parseInt(w, 10)));
    else if (NUMBER_WORDS[w] !== undefined) count = Math.min(MAX_COUNT, NUMBER_WORDS[w]);
    if (COLOUR_WORDS[w]) colour = COLOUR_WORDS[w];
  }
  // A plural noun with no number still means more than one.
  const raw = String(words[typeIndex]).toLowerCase().replace(/[^a-z]/g, '');
  const vague = !name && VAGUE_NOUNS.has(raw);
  if (count === 1 && raw.endsWith('s') && shapeFor(raw.slice(0, -1)) === type) count = 3;

  return {
    type, count, colour, index: typeIndex,
    ...(name ? { name } : {}),
    ...(vague ? { vague: true } : {}),
  };
}

/**
 * Particle verbs, where the preposition carries the meaning.
 *
 * "Zoom" alone is fast travel; "zoom in" is a change of size. "Fade" alone
 * is an entrance; "fade out" is the opposite. A single-word lookup cannot
 * tell these apart, so the phrase is matched before the words are.
 */
export const PHRASES = [
  [/\bzoom(?:s|ing|ed)?\s+in\b/i, 'grow'],
  [/\bzoom(?:s|ing|ed)?\s+out\b/i, 'shrink'],
  [/\bscal(?:e|es|ing|ed)\s+up\b/i, 'grow'],
  [/\bscal(?:e|es|ing|ed)\s+down\b/i, 'shrink'],
  [/\bfad(?:e|es|ing|ed)\s+out\b/i, 'fadeOut'],
  [/\bfad(?:e|es|ing|ed)\s+in\b/i, 'fadeIn'],
  [/\b(?:blow|blows|blowing|blew|blown)\s+up\b/i, 'explode'],
  [/\bbounc(?:e|es|ing|ed)\s+(?:up\s+and\s+)?down\b/i, 'bounce'],
  [/\bspin(?:s|ning)?\s+(?:a)?round\b/i, 'spin'],
  [/\bslid(?:e|es|ing)\s+in\b/i, 'slide'],
  [/\bfall(?:s|ing)?\s+(?:down|apart)\b/i, 'fall'],
];

/** The action a whole sentence names through a particle verb, or null. */
export function phraseAction(text) {
  const t = String(text || '');
  for (const [re, action] of PHRASES) {
    if (re.test(t)) return action;
  }
  return null;
}

/**
 * The words a text shape should carry.
 *
 * Quotes win — someone who typed them means exactly those characters. Then
 * "saying"/"reading"/"that says", which is how people write it when they
 * cannot be bothered with quotes.
 */
export function labelIn(text) {
  const t = String(text || '');
  const quoted = /["\u201c\u2018']([^"\u201d\u2019']{1,60})["\u201d\u2019']/.exec(t);
  if (quoted) return quoted[1].trim();
  const said = /\b(?:saying|says|say|reading|reads|read|labelled|labeled|titled)\s+(.{1,60})$/i.exec(t);
  if (said) {
    // Trim a trailing clause: "saying hello for 5 seconds" is not a label
    // that includes the timing.
    return said[1].replace(/\s+(?:for|over|in)\s+\d.*$/i, '').trim();
  }
  return '';
}

/** Whether the sentence asks the shapes to answer to sound. */
export function reactiveIn(text) {
  return /\b(music|musical|beat|beats|audio|sound|sounds|rhythm|rhythmic|bass|track|song|tempo)\b/i
    .test(String(text || ''));
}

export function intensityOf(text) {
  let scale = 1;
  const words = String(text).toLowerCase().split(/[^a-z]+/);
  for (const w of words) {
    if (INTENSITY[w] !== undefined) scale *= INTENSITY[w];
  }
  return Math.min(2.5, Math.max(0.25, scale));
}

export function durationOf(text, fallback = 5) {
  const m = /\b(\d{1,2}(?:\.\d)?)\s*(?:s\b|sec|second)/i.exec(text);
  if (m) return Math.min(60, Math.max(1, parseFloat(m[1])));
  return fallback;
}

/**
 * Parse a whole instruction into actors and an action.
 *
 * The shape of the answer is deliberately small: a subject phrase, an
 * action, an optional object phrase. That is enough to express "a sphere
 * smashes into a cube", "five cubes scatter", "a cylinder obliterates
 * something" — and it is honest about everything else by returning null.
 */
export function parseInstruction(text, { names = null } = {}) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const words = raw.split(/\s+/);

  // A particle verb outranks any single word in the sentence: "zooms in"
  // is one idea, and reading "zoom" on its own gets it wrong.
  let action = phraseAction(raw);
  let verbIndex = -1;
  if (action) {
    for (let i = 0; i < words.length; i++) {
      if (!shapeFor(words[i]) && verbFor(words[i])) { verbIndex = i; break; }
    }
  }

  // Otherwise find the verb: the pivot the sentence turns on.
  for (let i = 0; action === null && i < words.length; i++) {
    // A shape noun is never the verb. Several nouns collide with verb
    // stems — "circles" prefix-matches "circl" (to orbit), "rings" matches
    // "ring", "rolls" matches "roll" — and without this the subject of the
    // sentence gets eaten as its predicate and the whole parse fails.
    if (shapeFor(words[i])) continue;
    // The same goes for something the scene actually contains: a model
    // called "Ring" must not be read as the verb "to ring".
    if (names && names.has(String(words[i]).toLowerCase().replace(/[^a-z0-9]/g, ''))) continue;
    const a = verbFor(words[i]);
    // "going crazy" and "goes mad": the verb carries no meaning, the
    // adverb does. Skip a bare "go" so the real word is found.
    if (a && !/^go(es|ing)?$/i.test(words[i])) { action = a; verbIndex = i; break; }
  }

  let subject = parseNounPhrase(verbIndex === -1 ? words : words.slice(0, verbIndex), names);
  let target = verbIndex === -1 ? null : parseNounPhrase(words.slice(verbIndex + 1), names);

  if (!subject && !target) return null;

  // "a cube going crazy" — an intensity word with no verb still describes
  // motion, and shaking is what that phrase means.
  if (!action) {
    const scale = intensityOf(raw);
    // A bare noun phrase is a legitimate request: "a red square" means put
    // one there. Appearing is the least presumptuous way to do that.
    if (scale >= 1.5) action = 'shake';
    else if (subject) action = 'fadeIn';
    else return null;
  }

  // "spinning triangles": English puts the subject after an intransitive
  // participle. With nothing before the verb, a noun after it is the thing
  // doing the action, not the thing it is done to.
  if (!subject && target && !(ACTIONS[action] || {}).needsTarget) {
    subject = target;
    target = null;
  }

  const spec = ACTIONS[action];
  let object = target;
  // "a cylinder obliterating something": the sentence implies a victim even
  // when it does not name a useful one.
  if (spec && spec.needsTarget && !object) {
    object = { type: 'cube', count: 1, colour: null, index: -1, implied: true };
  }

  return {
    action,
    subject: subject || { type: 'sphere', count: 1, colour: null, index: -1, implied: true },
    object,
    intensity: intensityOf(raw),
    duration: durationOf(raw),
    destroys: !!(spec && spec.destroys),
    label: labelIn(raw),
    reactive: reactiveIn(raw),
    text: raw,
  };
}
