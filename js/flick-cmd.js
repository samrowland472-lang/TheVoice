// Flick command language.
//
// The chat model (and the local parser) emit one-line directives the host
// executes. This module is the only place those strings are parsed, so a
// test can cover "speak this" / "open Animate" without a browser.

export const SECTIONS = [
  'speak', 'studio', 'longform', 'modulate', 'animate',
  'music', 'dj', 'project', 'library', 'settings', 'plans', 'account',
];

const ALIAS = {
  speak: 'speak', tts: 'speak', talking: 'speak', speech: 'speak',
  studio: 'studio', recording: 'studio', mic: 'studio',
  longform: 'longform', audiobook: 'longform', book: 'longform',
  modulate: 'modulate', formant: 'modulate',
  animate: 'animate', animation: 'animate', motion: 'animate',
  music: 'music', daw: 'music', session: 'music', arrange: 'music',
  dj: 'dj', decks: 'dj',
  project: 'project', mix: 'project',
  library: 'library', clips: 'library',
  settings: 'settings',
  plans: 'plans', billing: 'plans',
  account: 'account', profile: 'account',
};

const LINE_RE = /\b(VOICE|DAW|SPEAK|ANIM|APP|STUDIO|LONG|MOD|LIB|PROJ):\s*(\{[^\n]+})/g;
const STRIP_RE = /\b(VOICE|DAW|SPEAK|ANIM|APP|STUDIO|LONG|MOD|LIB|PROJ):\s*\{[^\n]+}\s*/g;

export function sectionFor(raw) {
  let s = String(raw || '').toLowerCase().trim();
  s = s.replace(/[.?!:]+$/g, '').replace(/\s+/g, ' ');
  s = s.replace(/^(the|a|an)\s+/, '');
  s = s.replace(/\s+(view|app|page|panel|section)$/, '');
  if (s === 'voice studio' || s === 'voice-studio' || s === 'record') return 'studio';
  if (s === 'long form' || s === 'long-form' || s === 'studio') {
    // Bare "studio" is Voice Studio elsewhere; "Studio" in the sidebar is
    // long-form. Callers that mean Voice Studio should pass "voice studio".
    if (s === 'studio') return 'studio';
    return 'longform';
  }
  if (s === 'dj live' || s === 'dj-live' || s === 'live') return 'dj';
  if (s === 'my voices' || s === 'cloned') return 'speak';
  if (ALIAS[s]) return ALIAS[s];
  if (SECTIONS.includes(s)) return s;
  return null;
}

function normalize(kind, obj) {
  const k = String(kind || '').toUpperCase();
  const o = obj && typeof obj === 'object' && !Array.isArray(obj) ? { ...obj } : {};
  if (k === 'VOICE') {
    if (!o.app) o.app = o.section ? 'nav' : 'nav';
    if (o.section && !o.op) o.op = 'go';
    return o;
  }
  if (k === 'DAW') return { app: 'music', op: o.op, daw: o, ...o };
  if (k === 'SPEAK') return { app: 'speak', ...o };
  if (k === 'ANIM') return { app: 'animate', ...o };
  if (k === 'APP') return { app: 'nav', op: o.op || 'go', section: o.section || o.id };
  if (k === 'STUDIO') return { app: 'studio', ...o };
  if (k === 'LONG') return { app: 'longform', ...o };
  if (k === 'MOD') return { app: 'modulate', ...o };
  if (k === 'LIB') return { app: 'library', ...o };
  if (k === 'PROJ') return { app: 'project', ...o };
  return o;
}

export function parseVoiceLines(text) {
  const cmds = [];
  const src = String(text || '');
  const re = new RegExp(LINE_RE.source, 'g');
  let m;
  while ((m = re.exec(src))) {
    let obj;
    try { obj = JSON.parse(m[2]); } catch {
      continue;
    }
    cmds.push(normalize(m[1], obj));
  }
  return cmds;
}

export function stripVoice(text) {
  return String(text || '').replace(STRIP_RE, '').trim();
}

function quoted(text) {
  const m = /[“"]([^”"]{1,2000})[”"]/.exec(text);
  return m ? m[1].trim() : '';
}

export function parseNL(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  const low = t.toLowerCase();
  const cmds = [];

  // Music transport belongs to daw-ai. Leave those sentences alone so
  // TheVoiceDAW.applyText still owns play / bpm / mute / scene.
  if (/\b(\d{2,3}\s*bpm|mute\s+[a-z]|solo\s+[a-z]|launch\s+scene|crossfader|xfade)\b/.test(low)) {
    return [];
  }
  if (/^(play|stop|record)\b/.test(low) && !/\b(speak|say|animation|scene|voice)\b/.test(low)) {
    return [];
  }

  const nav = t.match(/^(?:open|show|go to|switch to|take me to|jump to)\s+(?:the\s+)?(.+?)$/i);
  if (nav) {
    const parts = nav[1].split(/\s+and\s+/i);
    const sec = sectionFor(parts[0]);
    if (sec) cmds.push({ app: 'nav', op: 'go', section: sec });
    if (parts[1] && /^\s*record\b/.test(parts[1].toLowerCase())) {
      if (!cmds.some((c) => c.section === 'studio')) {
        cmds.push({ app: 'nav', op: 'go', section: 'studio' });
      }
      cmds.push({ app: 'studio', op: 'record' });
      return cmds;
    }
  }

  if (/\bstop (speaking|speech|the voice)\b/.test(low) || /^stop speaking\b/.test(low)) {
    cmds.push({ app: 'speak', op: 'stop' });
    return cmds;
  }
  if (/\bpause (speaking|speech)\b/.test(low)) {
    cmds.push({ app: 'speak', op: 'pause' });
    return cmds;
  }

  const engine = low.match(/\b(?:use|switch to|set engine to)\s+(neural|browser|cloned|elevenlabs|my voices)\b/);
  if (engine) {
    let id = engine[1];
    if (id === 'cloned' || id === 'my voices') id = 'elevenlabs';
    cmds.push({ app: 'nav', op: 'go', section: 'speak' });
    cmds.push({ app: 'speak', op: 'engine', id });
  }

  const afterSpeak = t.match(/^(?:speak|say|read(?: this)?|make it say)\s*(?:this\s*)?[:\-]\s*([\s\S]+)$/i);
  const speakQuoted = quoted(t);
  if (afterSpeak || (/^(?:speak|say)\b/i.test(t) && speakQuoted) || /^(?:speak|say)\s+.{2,400}$/i.test(t)) {
    let body = afterSpeak ? afterSpeak[1].trim() : (speakQuoted || t.replace(/^(?:speak|say|read(?: this)?|make it say)\s*/i, '').trim());
    body = body.replace(/^[:\-]\s*/, '');
    if (body && !/\bbpm\b/i.test(body)) {
      if (!cmds.some((c) => c.app === 'nav')) cmds.push({ app: 'nav', op: 'go', section: 'speak' });
      cmds.push({ app: 'speak', op: 'speak', text: body });
      return cmds;
    }
  }

  if (/\b(start recording|record (this|me|my voice)|record a (take|clip))\b/.test(low)
      || /^record(?:\s+now)?[.!?]?$/.test(low)) {
    cmds.push({ app: 'nav', op: 'go', section: 'studio' });
    cmds.push({ app: 'studio', op: 'record' });
    return cmds;
  }

  const anim = t.match(/^(?:animate|create (?:an? )?(?:animation|scene)|make (?:an? )?(?:animation|scene)(?: of)?|draw (?:an? )?animation of)\s+([\s\S]+)$/i)
    || t.match(/\bcreate (?:an? )?(?:animation|scene) (?:of |with |where )?([\s\S]+)$/i);
  if (anim && anim[1]) {
    cmds.push({ app: 'nav', op: 'go', section: 'animate' });
    cmds.push({ app: 'animate', op: 'create', prompt: anim[1].trim() });
    return cmds;
  }
  if (/^(play|preview) (the )?(animation|scene)\b/.test(low)) {
    cmds.push({ app: 'animate', op: 'play' });
    return cmds;
  }

  const lib = low.match(/\b(?:search|find) (?:in |the )?library(?:\s+for)?\s+(.+)$/);
  if (lib) {
    cmds.push({ app: 'nav', op: 'go', section: 'library' });
    cmds.push({ app: 'library', op: 'search', q: lib[1].trim() });
    return cmds;
  }

  if (/\bbuild (the )?(mix|project)\b/.test(low)) {
    cmds.push({ app: 'nav', op: 'go', section: 'project' });
    cmds.push({ app: 'project', op: 'build' });
    return cmds;
  }

  if (/\b(split|analyze) (the )?(book|script|chapters|parts)\b/.test(low) || /\bgenerate (the )?audiobook\b/.test(low)) {
    cmds.push({ app: 'nav', op: 'go', section: 'longform' });
    cmds.push({ app: 'longform', op: /\bgenerate\b/.test(low) ? 'generate' : 'split' });
    return cmds;
  }

  return cmds;
}
