// Live Ableton-style production engine.
// Real-time Web Audio clock, mixer meters, piano roll, session clips.
// Export is a bounce, not the workflow. Does not touch Animate.

import { onVoice } from './bus.js';

const STRIPS = [
  { id: 'kick', name: 'Kick', color: '#ff6b4a' },
  { id: 'snare', name: 'Snare', color: '#ffb238' },
  { id: 'hihat', name: 'Hat', color: '#f0e27a' },
  { id: 'clap', name: 'Clap', color: '#f0abfc' },
  { id: 'bass', name: 'Bass', color: '#7dff9a' },
  { id: 'keys', name: 'Keys', color: '#3fc6ff' },
  { id: 'return', name: 'Return', color: '#c084fc' },
  { id: 'master', name: 'Master', color: '#d9f5e3' },
];

const ROLL_LOW = 36;
const ROLL_HIGH = 84;
const ROLL_STEPS = 32;

let opts = {};
let getAudio = null;
let playing = false;
let recOn = false;
let metroOn = false;
let step = 0;
let nextTime = 0;
let timer = null;
let solo = new Set();
let armed = 'keys';
let detail = 'drums';
let quantize = 1;
let swing = 0;
let keysCutoff = 1800;
let keysRes = 0.8;
let keysAtk = 0.01;
let keysDec = 0.08;
let keysSus = 0.55;
let keysRel = 0.35;
let keysOsc = 0.5;
let keysDet = 9;
let keysFenv = 0.75;
let keysGlide = 0;
let lastKeyFreq = 0;
const fx = { send: 0.45, delayMs: 375, delayFb: 0.35, delayWet: 0.7, compTh: -18, compRatio: 3.2, eqL: 0, eqM: 0, eqH: 0, killL: false, killM: false, killH: false, on: { analog: true, delay: true, comp: true, eq3: true } };

function applyFx() {
  ensureMix();
  const a = audio();
  if (!a || !mix._delay) return;
  const t = a.ctx.currentTime;
  const delayOn = fx.on.delay !== false;
  const compOn = fx.on.comp !== false;
  const eqOn = fx.on.eq3 !== false;
  mix._send.gain.setTargetAtTime(delayOn ? fx.send : 0, t, 0.02);
  mix._delay.delayTime.setTargetAtTime(Math.max(0.02, fx.delayMs / 1000), t, 0.03);
  mix._delayFb.gain.setTargetAtTime(delayOn ? fx.delayFb : 0, t, 0.02);
  mix._delayWet.gain.setTargetAtTime(delayOn ? fx.delayWet : 0, t, 0.02);
  mix._comp.threshold.setTargetAtTime(compOn ? fx.compTh : 0, t, 0.02);
  mix._comp.ratio.setTargetAtTime(compOn ? fx.compRatio : 1, t, 0.02);
  if (mix._eq) {
    mix._eq.low.gain.setTargetAtTime(eqOn ? (fx.killL ? -72 : fx.eqL) : 0, t, 0.02);
    mix._eq.mid.gain.setTargetAtTime(eqOn ? (fx.killM ? -72 : fx.eqM) : 0, t, 0.02);
    mix._eq.high.gain.setTargetAtTime(eqOn ? (fx.killH ? -72 : fx.eqH) : 0, t, 0.02);
  }
  applyKeysFilter();
}

function applyKeysFilter() {
  const a = audio();
  if (!a || !mix.keys) return;
  if (!mix._keysFilter) {
    const f = a.ctx.createBiquadFilter();
    f.type = 'lowpass';
    try { mix.keys.input.disconnect(mix.keys.vol); } catch (_) {}
    mix.keys.input.connect(f);
    f.connect(mix.keys.vol);
    mix._keysFilter = f;
  }
  const t = a.ctx.currentTime;
  const on = fx.on.analog !== false;
  mix._keysFilter.frequency.setTargetAtTime(on ? keysCutoff : 18000, t, 0.015);
  mix._keysFilter.Q.setTargetAtTime(on ? Math.max(0.2, keysRes) : 0.3, t, 0.015);
}

function applyKeysEnv() {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime;
  midiHeld.forEach((h) => {
    if (!h || !h.g) return;
    const peak = h.peak || 0.001;
    const sus = Math.max(0.0008, peak * keysSus);
    try {
      h.g.gain.cancelScheduledValues(t);
      h.g.gain.setTargetAtTime(sus, t, 0.04);
    } catch (_) {}
  });
}

function oscMixGains() {
  const sqr = Math.max(0, Math.min(1, keysOsc));
  return { saw: 1 - sqr, sqr };
}

function applyKeysOsc() {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime;
  const { saw, sqr } = oscMixGains();
  midiHeld.forEach((h) => {
    if (!h || !h.gSaw || !h.gSqr) return;
    try {
      h.gSaw.gain.setTargetAtTime(saw, t, 0.02);
      h.gSqr.gain.setTargetAtTime(sqr, t, 0.02);
    } catch (_) {}
  });
}

function detuneRatio() {
  return Math.pow(2, keysDet / 1200);
}

function applyKeysDet() {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime;
  const r = detuneRatio();
  midiHeld.forEach((h) => {
    if (!h || !h.o2 || !h.freq) return;
    try {
      h.o2.frequency.setTargetAtTime(h.freq * r, t, 0.02);
    } catch (_) {}
  });
}

function filterEnvEnd(cut) {
  const amt = Math.max(0, Math.min(1, keysFenv));
  const closed = Math.max(80, cut * 0.12);
  return Math.max(80, cut + (closed - cut) * amt);
}

function applyKeysFenv() {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime;
  midiHeld.forEach((h) => {
    if (!h || !h.f) return;
    const cut = h.cut || keysCutoff;
    try {
      h.f.frequency.cancelScheduledValues(t);
      h.f.frequency.setTargetAtTime(filterEnvEnd(cut), t, 0.05);
    } catch (_) {}
  });
}

function glideOsc(o1, o2, freq, t) {
  const r = detuneRatio();
  const g = Math.max(0, keysGlide);
  if (g > 0.004 && lastKeyFreq > 20) {
    o1.frequency.setValueAtTime(lastKeyFreq, t);
    o2.frequency.setValueAtTime(lastKeyFreq * r, t);
    o1.frequency.exponentialRampToValueAtTime(freq, t + g);
    o2.frequency.exponentialRampToValueAtTime(freq * r, t + g);
  } else {
    o1.frequency.setValueAtTime(freq, t);
    o2.frequency.setValueAtTime(freq * r, t);
  }
  lastKeyFreq = freq;
}

const mix = {};
const notes = []; // { pitch, start, length, vel } in 16th-notes
const clips = []; // { track, scene, name, color, grid, notes, bassNotes, buffer }
const voiceSamples = []; // { id, name, buffer, duration }
let pendingScene = -1;
let currentScene = 0;
let selectedScene = 0;
let followSteps = 0;
const SESS_TRACKS = STRIPS.filter((s) => s.id !== 'return' && s.id !== 'master');
const liveClip = Object.fromEntries(SESS_TRACKS.map((s) => [s.id, 0]));
const pendingClip = {};
let prodView = 'session';
let midiMapOn = false;
let midiLearn = null;
const midiHeld = new Map();
const MIDI_MAP_KEY = 'thevoice-midi-map';
function defaultMidiMap() {
  const m = {
    'cc:7': { type: 'vol', id: 'master' },
    'cc:1': { type: 'cut' },
    'cc:10': { type: 'pan', id: 'master' },
  };
  STRIPS.forEach((s, i) => { m[`cc:${20 + i}`] = { type: 'vol', id: s.id }; });
  return m;
}
function loadMidiMap() {
  try {
    const raw = JSON.parse(localStorage.getItem(MIDI_MAP_KEY) || 'null');
    if (raw && typeof raw === 'object') return { ...defaultMidiMap(), ...raw };
  } catch (_) {}
  return defaultMidiMap();
}
let midiMap = loadMidiMap();
function saveMidiMap() {
  try { localStorage.setItem(MIDI_MAP_KEY, JSON.stringify(midiMap)); } catch (_) {}
}
function midiStatus(text) {
  const el = document.getElementById('abl-midi');
  if (el) el.textContent = text;
}

const FOLLOW_ACTIONS = [
  { id: 'none', label: 'No Action' },
  { id: 'stop', label: 'Stop' },
  { id: 'again', label: 'Play Again' },
  { id: 'next', label: 'Next' },
  { id: 'prev', label: 'Previous' },
  { id: 'first', label: 'First' },
  { id: 'last', label: 'Last' },
  { id: 'other', label: 'Other' },
  { id: 'any', label: 'Any' },
];
function defaultFollow() {
  return { on: false, bars: 2, a: 'next', b: 'again', chance: 100 };
}
function ensureFollow(c) {
  if (!c.follow) c.follow = defaultFollow();
  return c.follow;
}

const ARR_TRACKS = ['kick', 'snare', 'hihat', 'clap', 'bass', 'keys'];
const PX = 14;
const arr = {
  bars: 8,
  loopOn: true,
  loopStart: 0,
  loopEnd: 32,
  follow: true,
  punch: false,
  clips: [],
  selected: null,
};
let arrUid = 1;
function nextArrId() { return 'a' + (arrUid++); }
let envParam = 'vol';
const cue = { on: false, timer: null, step: 0, next: 0, snap: null, dest: null, id: '' };

function defaultEnv() {
  return {
    vol: [{ t: 0, v: 1 }, { t: 1, v: 1 }],
    cut: [{ t: 0, v: 1 }, { t: 1, v: 1 }],
  };
}
function ensureEnv(c) {
  if (!c.env) c.env = defaultEnv();
  if (!c.env.vol || !c.env.vol.length) c.env.vol = defaultEnv().vol;
  if (!c.env.cut || !c.env.cut.length) c.env.cut = defaultEnv().cut;
  c.env.vol.sort((a, b) => a.t - b.t);
  c.env.cut.sort((a, b) => a.t - b.t);
  return c.env;
}
function envAt(points, t) {
  if (!points || !points.length) return 1;
  t = Math.max(0, Math.min(1, t));
  if (t <= points[0].t) return points[0].v;
  if (t >= points[points.length - 1].t) return points[points.length - 1].v;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return a.v + (b.v - a.v) * u;
    }
  }
  return 1;
}
function voiceDest(track, t, cut) {
  const dest = mix[track] && mix[track].input;
  if (!dest) return dest;
  if (cut == null || cut >= 0.97) return dest;
  const a = audio();
  if (!a) return dest;
  const f = a.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(220 + Math.pow(Math.max(0.02, cut), 1.8) * 16000, t);
  f.Q.value = 0.9;
  f.connect(dest);
  return f;
}
function makeArrClip(partial) {
  const c = {
    id: nextArrId(),
    track: 'kick',
    start: 0,
    length: 16,
    name: '',
    color: '#3fc6ff',
    grid: null,
    notes: null,
    bassNotes: null,
    env: defaultEnv(),
    ...partial,
  };
  ensureEnv(c);
  if (c.buffer) ensureWarp(c);
  return c;
}

function audio() {
  const a = getAudio && getAudio();
  if (!a || !a.ctx) return null;
  return a;
}

function pattern() {
  return opts.getPattern ? opts.getPattern() : null;
}

function bpm() {
  const p = pattern();
  return Math.max(40, Math.min(240, (p && p.bpm) || 96));
}

function stepDur() {
  return 60 / bpm() / 4;
}

function ensureMix() {
  const a = audio();
  if (!a) return;
  const { ctx, master } = a;
  if (mix.master) return;
  STRIPS.forEach((s) => {
    const input = ctx.createGain();
    const vol = ctx.createGain();
    vol.gain.value = s.id === 'master' ? 0.9 : s.id === 'return' ? 0.45 : 0.85;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const mute = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;
    input.connect(vol);
    if (pan) vol.connect(pan);
    (pan || vol).connect(mute);
    mute.connect(analyser);
    mix[s.id] = {
      input, vol, pan, mute, analyser,
      level: 0.85,
      panVal: 0,
      muted: false,
      soloed: false,
      peak: 0,
      sendVal: s.id === 'keys' ? 1 : 0,
    };
  });
  const bus = ctx.createGain();
  STRIPS.filter((s) => s.id !== 'master' && s.id !== 'return').forEach((s) => {
    mix[s.id].analyser.connect(bus);
  });
  const delay = ctx.createDelay(1.2);
  delay.delayTime.value = 0.375;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  const wet = ctx.createGain();
  wet.gain.value = 0.7;
  const send = ctx.createGain();
  send.gain.value = 0.45;
  STRIPS.filter((s) => s.id !== 'master' && s.id !== 'return').forEach((s) => {
    const sendG = ctx.createGain();
    sendG.gain.value = mix[s.id].sendVal;
    mix[s.id].analyser.connect(sendG);
    sendG.connect(send);
    mix[s.id].send = sendG;
  });
  send.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(mix.return.input);
  mix.return.analyser.connect(bus);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3.2;
  comp.attack.value = 0.01;
  comp.release.value = 0.18;
  bus.connect(comp);
  const eqL = ctx.createBiquadFilter();
  eqL.type = 'lowshelf';
  eqL.frequency.value = 110;
  const eqM = ctx.createBiquadFilter();
  eqM.type = 'peaking';
  eqM.frequency.value = 1000;
  eqM.Q.value = 0.7;
  const eqH = ctx.createBiquadFilter();
  eqH.type = 'highshelf';
  eqH.frequency.value = 8000;
  comp.connect(eqL);
  eqL.connect(eqM);
  eqM.connect(eqH);
  eqH.connect(mix.master.input);
  mix.master.analyser.connect(master);
  mix._delay = delay;
  mix._delayFb = fb;
  mix._delayWet = wet;
  mix._send = send;
  mix._comp = comp;
  mix._eq = { low: eqL, mid: eqM, high: eqH };
  mix._bus = bus;
  applyFx();
}

function applyMute() {
  const anySolo = STRIPS.some((s) => mix[s.id] && mix[s.id].soloed && s.id !== 'master');
  STRIPS.forEach((s) => {
    const m = mix[s.id];
    if (!m) return;
    let on = !m.muted;
    if (anySolo && s.id !== 'master' && s.id !== 'return' && !m.soloed) on = false;
    m.mute.gain.setTargetAtTime(on ? 1 : 0, audio().ctx.currentTime, 0.01);
  });
}

function applySend(id) {
  const m = mix[id];
  const a = audio();
  if (!m || !m.send || !a) return;
  m.send.gain.setTargetAtTime(Math.max(0, Math.min(1, m.sendVal || 0)), a.ctx.currentTime, 0.02);
}

function envGain(dest, t, vel, a, d, sus, r, dur) {
  const { ctx } = audio();
  const g = ctx.createGain();
  g.connect(dest);
  const v = Math.max(0.0008, vel);
  g.gain.setValueAtTime(0.0008, t);
  g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0008, v * sus), t + a + d);
  const off = t + dur;
  g.gain.setValueAtTime(Math.max(0.0008, v * sus), off);
  g.gain.exponentialRampToValueAtTime(0.0008, off + r);
  return g;
}

function trigKick(t, vel, dest) {
  const { ctx } = audio();
  dest = dest || mix.kick.input;
  const osc = ctx.createOscillator();
  const click = ctx.createOscillator();
  const g = envGain(dest, t, vel, 0.001, 0.08, 0.2, 0.22, 0.12);
  const cg = envGain(dest, t, vel * 0.4, 0.001, 0.01, 0.01, 0.02, 0.01);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, t);
  osc.frequency.exponentialRampToValueAtTime(46, t + 0.07);
  click.type = 'square';
  click.frequency.value = 1400;
  osc.connect(g);
  click.connect(cg);
  osc.start(t); osc.stop(t + 0.45);
  click.start(t); click.stop(t + 0.03);
}

function trigNoise(dest, t, vel, hp, decay, dur) {
  const { ctx } = audio();
  const n = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = envGain(dest, t, vel, 0.001, decay * 0.3, 0.15, decay, 0.02);
  n.connect(f); f.connect(g);
  n.start(t); n.stop(t + dur);
}

function trigSnare(t, vel, dest) {
  dest = dest || mix.snare.input;
  const { ctx } = audio();
  trigNoise(dest, t, vel * 0.9, 900, 0.12, 0.28);
  const osc = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.35, 0.001, 0.04, 0.1, 0.08, 0.04);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(210, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.2);
}

function trigHat(t, vel, dest) {
  chokeGroup(1, t, 'hihat');
  return trigHatKind(t, vel, dest, false);
}

function trigOpenHat(t, vel, dest) {
  chokeGroup(1, t, 'ohat');
  return trigHatKind(t, vel, dest, true);
}

const padVoices = {};

function chokeGroup(group, t, exceptId) {
  if (!group) return;
  PADS.forEach((p) => {
    if (p.choke !== group || p.id === exceptId) return;
    (padVoices[p.id] || []).forEach((g) => {
      try {
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0.0008, t, 0.008);
      } catch (_) {}
    });
    padVoices[p.id] = [];
  });
}

function rememberVoice(id, g) {
  if (!g) return;
  (padVoices[id] = padVoices[id] || []).push(g);
}

function trigHatKind(t, vel, dest, open) {
  const a = audio();
  if (!a) return null;
  dest = dest || mix.hihat.input;
  const { ctx } = a;
  const n = ctx.createBufferSource();
  const dur = open ? 0.5 : 0.12;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = open ? 5500 : 7000;
  const decay = open ? 0.32 : 0.04;
  const g = envGain(dest, t, vel * (open ? 0.5 : 0.55), 0.001, decay * 0.3, 0.12, decay, 0.02);
  n.connect(f); f.connect(g);
  n.start(t); n.stop(t + dur);
  rememberVoice(open ? 'ohat' : 'hihat', g);
  return g;
}

function trigTom(t, vel, dest, freq) {
  const { ctx } = audio();
  dest = dest || mix.snare.input;
  const osc = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.72, 0.001, 0.09, 0.22, 0.2, 0.14);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.52, t + 0.14);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.45);
  return g;
}

function trigRim(t, vel, dest) {
  dest = dest || mix.snare.input;
  const { ctx } = audio();
  const osc = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.55, 0.001, 0.012, 0.02, 0.03, 0.02);
  osc.type = 'square';
  osc.frequency.setValueAtTime(980, t);
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.03);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.06);
  trigNoise(dest, t, vel * 0.2, 2400, 0.03, 0.06);
  return g;
}

function trigCow(t, vel, dest) {
  dest = dest || mix.clap.input;
  const { ctx } = audio();
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.4, 0.001, 0.05, 0.15, 0.12, 0.08);
  o1.type = 'square'; o2.type = 'square';
  o1.frequency.value = 540;
  o2.frequency.value = 800;
  o1.connect(g); o2.connect(g);
  o1.start(t); o2.start(t);
  o1.stop(t + 0.22); o2.stop(t + 0.22);
  return g;
}

function trigShaker(t, vel, dest) {
  dest = dest || mix.hihat.input;
  const { ctx } = audio();
  const n = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 6500;
  f.Q.value = 1.4;
  const g = envGain(dest, t, vel * 0.45, 0.001, 0.03, 0.08, 0.05, 0.02);
  n.connect(f); f.connect(g);
  n.start(t); n.stop(t + 0.12);
  return g;
}

function trigCym(t, vel, dest, hp, decay) {
  dest = dest || mix.hihat.input;
  const { ctx } = audio();
  const n = ctx.createBufferSource();
  const dur = Math.max(0.3, decay + 0.2);
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = envGain(dest, t, vel * 0.48, 0.002, decay * 0.25, 0.2, decay, 0.04);
  n.connect(f); f.connect(g);
  n.start(t); n.stop(t + dur);
  return g;
}

function trigKick2(t, vel, dest) {
  dest = dest || mix.kick.input;
  const { ctx } = audio();
  const osc = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.9, 0.001, 0.12, 0.25, 0.28, 0.16);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.5);
  return g;
}

function trigFx(t, vel, dest) {
  dest = dest || mix.clap.input;
  const { ctx } = audio();
  const osc = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.35, 0.001, 0.08, 0.1, 0.18, 0.1);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.28);
  return g;
}

function trigPerc(t, vel, dest) {
  dest = dest || mix.clap.input;
  trigNoise(dest, t, vel * 0.45, 1800, 0.05, 0.12);
  const { ctx } = audio();
  const osc = ctx.createOscillator();
  const g = envGain(dest, t, vel * 0.25, 0.001, 0.02, 0.05, 0.04, 0.02);
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.1);
}

function trigClap(t, vel, dest) {
  trigNoise(dest || mix.clap.input, t, vel * 0.7, 1000, 0.14, 0.28);
}

function trigBass(t, vel, semi, cutMul, dest) {
  const { ctx } = audio();
  dest = dest || mix.bass.input;
  const freq = 110 * Math.pow(2, (semi || 0) / 12);
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const mul = cutMul == null ? 1 : Math.max(0.05, cutMul);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(freq * 5 * (0.35 + 1.4 * mul), t);
  f.frequency.exponentialRampToValueAtTime(freq * 2.2 * mul, t + 0.16);
  f.Q.value = 6;
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const g = envGain(dest, t, vel * 0.55, 0.005, 0.1, 0.35, 0.14, 0.18);
  osc.connect(f); f.connect(g);
  osc.start(t); osc.stop(t + 0.42);
}

function trigKey(t, pitch, vel, lengthBeats, cutHz, dest) {
  const { ctx } = audio();
  dest = dest || mix.keys.input;
  const freq = 440 * Math.pow(2, (pitch - 69) / 12);
  const dur = Math.max(0.05, lengthBeats * stepDur());
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = 'sawtooth';
  o2.type = 'square';
  glideOsc(o1, o2, freq, t);
  const f = ctx.createBiquadFilter();
  const cut = fx.on.analog === false ? 12000 : Math.max(80, cutHz || keysCutoff);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(cut, t);
  f.frequency.exponentialRampToValueAtTime(filterEnvEnd(cut), t + Math.max(0.04, dur * 0.7));
  f.Q.value = fx.on.analog === false ? 0.3 : keysRes;
  const g = envGain(dest, t, vel * 0.28, Math.max(0.005, keysAtk), Math.max(0.01, keysDec), keysSus, keysRel, dur);
  const { saw, sqr } = oscMixGains();
  const gSaw = ctx.createGain();
  const gSqr = ctx.createGain();
  gSaw.gain.value = saw;
  gSqr.gain.value = sqr;
  o1.connect(gSaw); o2.connect(gSqr);
  gSaw.connect(f); gSqr.connect(f); f.connect(g);
  o1.start(t); o2.start(t);
  o1.stop(t + dur + keysRel + 0.05);
  o2.stop(t + dur + keysRel + 0.05);
}

function trigMetro(t, accent) {
  const { ctx, master } = audio();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = accent ? 1200 : 800;
  g.gain.setValueAtTime(accent ? 0.12 : 0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.04);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.05);
}

function trigBuffer(t, buffer, dest, gain, rate) {
  const a = audio();
  if (!a || !buffer) return;
  const src = a.ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = Math.max(0.25, Math.min(4, rate || 1));
  const g = a.ctx.createGain();
  g.gain.value = gain == null ? 0.9 : gain;
  src.connect(g);
  g.connect(dest || (mix.master && mix.master.input) || a.master);
  src.start(t);
}

function detectBpm(buf) {
  if (!buf) return 120;
  const ch = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const hop = Math.floor(sr / 200);
  const env = [];
  for (let i = 0; i < ch.length; i += hop) {
    let sum = 0;
    const end = Math.min(ch.length, i + hop);
    for (let j = i; j < end; j++) sum += ch[j] * ch[j];
    env.push(Math.sqrt(sum / Math.max(1, end - i)));
  }
  for (let i = env.length - 1; i > 0; i--) env[i] = Math.max(0, env[i] - env[i - 1]);
  const minLag = Math.round((60 / 180) * 200);
  const maxLag = Math.round((60 / 70) * 200);
  let best = 0;
  let bestLag = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < env.length - lag; i++) corr += env[i] * env[i + lag];
    if (corr > best) { best = corr; bestLag = lag; }
  }
  let bpmEst = 60 / (bestLag / 200);
  if (bpmEst < 80) bpmEst *= 2;
  if (bpmEst > 160) bpmEst /= 2;
  return Math.round(bpmEst);
}

function ensureWarp(c) {
  if (!c) return { mode: 'free', origBpm: 120, gain: 1 };
  if (!c.warpMode) c.warpMode = c.buffer ? 'beats' : 'free';
  if (!c.origBpm && c.buffer) c.origBpm = detectBpm(c.buffer);
  if (c.gain == null) c.gain = 1;
  return c;
}

function clipPlayRate(c) {
  ensureWarp(c);
  if (c && c.warpMode === 'beats' && c.origBpm) return bpm() / c.origBpm;
  return 1;
}

function trackHas(c, track) {
  if (!c) return false;
  if (track === 'keys') return !!(c.notes && c.notes.length) || !!c.buffer;
  return !!(c.grid && c.grid[track] && c.grid[track].some(Boolean));
}

function liveSrc(track) {
  const sc = liveClip[track];
  if (sc == null || sc < 0) return null;
  return clips[sc] || null;
}

function scheduleStep(st, t) {
  const p = pattern();
  if (!p || !p.grid) return;
  const vel = 0.9;
  const i = st % 16;
  SESS_TRACKS.forEach((s) => {
    const src = liveSrc(s.id);
    const grid = (src && src.grid) || p.grid;
    if (s.id === 'keys') {
      const ns = (src && src.notes) || notes;
      ns.forEach((n) => {
        if ((n.start % ROLL_STEPS) === (st % ROLL_STEPS)) trigKey(t, n.pitch, (n.vel || 100) / 100, n.length);
      });
      if (src && src.buffer && i === 0) {
        ensureWarp(src);
        trigBuffer(t, src.buffer, mix.keys && mix.keys.input, 0.85 * (src.gain || 1), clipPlayRate(src));
      }
      return;
    }
    if (!grid[s.id] || !grid[s.id][i]) return;
    if (s.id === 'kick') trigKick(t, vel);
    else if (s.id === 'snare') trigSnare(t, vel);
    else if (s.id === 'hihat') trigHat(t, vel);
    else if (s.id === 'clap') trigClap(t, vel);
    else if (s.id === 'bass') trigBass(t, vel, (src && src.bassNotes && src.bassNotes[i]) || (p.bassNotes && p.bassNotes[i]) || 0);
  });
  if (metroOn && st % 4 === 0) trigMetro(t, st % 16 === 0);
}

function applyPending() {
  let changed = false;
  Object.keys(pendingClip).forEach((track) => {
    liveClip[track] = pendingClip[track];
    delete pendingClip[track];
    changed = true;
  });
  if (pendingScene < 0) {
    if (changed) paintSession();
    return;
  }
  SESS_TRACKS.forEach((s) => { liveClip[s.id] = pendingScene; });
  const sceneClips = clips.filter((c) => c.scene === pendingScene && c.grid);
  if (sceneClips.length) {
    const p = pattern();
    const src = sceneClips[0];
    if (p && src.grid) {
      Object.keys(src.grid).forEach((id) => {
        if (p.grid[id]) p.grid[id] = src.grid[id].slice();
      });
      if (src.bassNotes) p.bassNotes = src.bassNotes.slice();
    }
    if (src.notes) {
      notes.length = 0;
      src.notes.forEach((n) => notes.push({ ...n }));
    }
    currentScene = pendingScene;
    selectedScene = currentScene;
    followSteps = 0;
    const seq = document.getElementById('sequencer');
    if (seq) seq.querySelectorAll('.seq-cell').forEach((cell) => {
      const on = p.grid[cell.dataset.track] && p.grid[cell.dataset.track][Number(cell.dataset.step)];
      cell.classList.toggle('on', !!on);
      cell.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    paintRoll();
  }
  if (pendingScene >= 0) sceneToArrange(pendingScene);
  pendingScene = -1;
  paintSession();
}

function sceneToArrange(sceneIdx) {
  const src = clips[sceneIdx];
  if (!src || (!src.grid && !src.buffer)) return;
  const start = Math.floor(step / 16) * 16;
  const length = 32;
  if (src.buffer) {
    arr.clips = arr.clips.filter((c) => !(c.track === 'keys' && c.start < start + length && c.start + c.length > start));
    arr.clips.push(makeArrClip({
      track: 'keys',
      start,
      length,
      name: src.name || 'Voice',
      color: src.color || '#3fc6ff',
      buffer: src.buffer,
    }));
  }
  if (!src.grid) {
    paintArrangeClips();
    return;
  }
  ARR_TRACKS.forEach((track) => {
    const has = track === 'keys'
      ? (src.notes && src.notes.length)
      : src.grid[track] && src.grid[track].some(Boolean);
    if (!has) return;
    arr.clips = arr.clips.filter((c) => !(c.track === track && c.start < start + length && c.start + c.length > start));
    arr.clips.push(makeArrClip({
      track,
      start,
      length,
      name: src.name || track,
      color: (STRIPS.find((s) => s.id === track) || {}).color || src.color,
      grid: src.grid,
      notes: src.notes,
      bassNotes: src.bassNotes,
    }));
  });
  paintArrangeClips();
}

function filledScenes() {
  return clips.map((c, i) => i).filter((i) => clips[i] && clips[i].grid);
}

function runFollow(pick) {
  if (pick === 'none' || !pick) return;
  if (pick === 'stop') {
    studioStop();
    return;
  }
  if (pick === 'again') {
    followSteps = 0;
    return;
  }
  const filled = filledScenes();
  if (!filled.length) return;
  let next = currentScene;
  const i = filled.indexOf(currentScene);
  if (pick === 'next') next = filled[(Math.max(0, i) + 1) % filled.length];
  else if (pick === 'prev') next = filled[(i < 0 ? 0 : i - 1 + filled.length) % filled.length];
  else if (pick === 'first') next = filled[0];
  else if (pick === 'last') next = filled[filled.length - 1];
  else if (pick === 'any') next = filled[Math.floor(Math.random() * filled.length)];
  else if (pick === 'other') {
    const others = filled.filter((n) => n !== currentScene);
    if (!others.length) return;
    next = others[Math.floor(Math.random() * others.length)];
  }
  if (next == null || next === currentScene && pick !== 'any') {
    if (pick !== 'any') followSteps = 0;
  }
  pendingScene = next;
}

function maybeFollow() {
  if (prodView !== 'session' || !playing) return;
  const c = clips[currentScene];
  if (!c) return;
  const f = ensureFollow(c);
  if (!f.on) return;
  const need = Math.max(1, Number(f.bars) || 2) * 16;
  if (followSteps < need) return;
  followSteps = 0;
  const chance = Math.max(0, Math.min(100, Number(f.chance) || 0));
  const pick = (Math.random() * 100) < chance ? f.a : f.b;
  runFollow(pick);
}

/** Global Q in bars → 16th-note grid. 1 = 1 bar, 0.25 = 1/4, 0 = none (immediate). */
function quantizeSteps() {
  if (!quantize) return 0;
  return Math.max(1, Math.round(quantize * 16));
}

function quantizeHit(st) {
  const q = quantizeSteps();
  if (!q) return true;
  return (st % q) === 0;
}

function flushLaunch() {
  if (!playing || !quantizeSteps()) {
    applyPending();
    return playing;
  }
  paintSession();
  return true;
}

function clock() {
  if (!playing) return;
  const a = audio();
  if (!a) return;
  const { ctx } = a;
  const look = 0.12;
  while (nextTime < ctx.currentTime + look) {
    if (prodView === 'arrange') {
      if (arr.loopOn && step >= arr.loopEnd) step = arr.loopStart;
      if (step >= arr.bars * 16) step = arr.loopOn ? arr.loopStart : 0;
      punchBar(step);
      scheduleArrange(step, nextTime);
    } else {
      if (quantizeHit(step)) applyPending();
      scheduleStep(step, nextTime);
      followSteps += 1;
      if (step % 16 === 15) maybeFollow();
    }
    const swingAdd = (step % 2 === 1) ? stepDur() * swing * 0.5 : 0;
    highlightStep(step);
    if (prodView === 'arrange') step += 1;
    else step = (step + 1) % ROLL_STEPS;
    nextTime += stepDur() + swingAdd;
  }
  growRecNotes();
  timer = setTimeout(clock, 20);
}

function highlightStep(st) {
  const seq = document.getElementById('sequencer');
  if (seq) {
    seq.querySelectorAll('.seq-cell').forEach((c) => {
      c.classList.toggle('now', Number(c.dataset.step) === (st % 16));
    });
  }
  const playhead = document.getElementById('abl-playhead');
  if (playhead) playhead.style.left = `${((st % ROLL_STEPS) / ROLL_STEPS) * 100}%`;
  const pos = document.getElementById('abl-pos');
  if (pos) {
    const bar = Math.floor(st / 16) + 1;
    const beat = Math.floor((st % 16) / 4) + 1;
    pos.textContent = `${bar}.${beat}.${(st % 4) + 1}`;
  }
  tickArrangePlayhead(st);
}

export function studioPlay() {
  ensureMix();
  const a = audio();
  if (!a) return;
  const { ctx } = a;
  if (ctx.state === 'suspended') ctx.resume();
  if (playing) return;
  playing = true;
  if (prodView === 'arrange') {
    if (arr.loopOn && (step < arr.loopStart || step >= arr.loopEnd)) step = arr.loopStart;
  } else {
    step = 0;
  }
  nextTime = ctx.currentTime + 0.05;
  clock();
  syncTransport();
}

export function studioStop() {
  playing = false;
  recOn = false;
  followSteps = 0;
  if (timer) { clearTimeout(timer); timer = null; }
  step = prodView === 'arrange' ? arr.loopStart : 0;
  highlightStep(step);
  syncTransport();
  paintSession();
}

function togglePlay() {
  if (playing) studioStop();
  else studioPlay();
}

function snapshotPattern() {
  const p = pattern();
  if (!p) return null;
  const grid = {};
  Object.keys(p.grid).forEach((k) => { grid[k] = p.grid[k].slice(); });
  return {
    grid,
    bassNotes: (p.bassNotes || []).slice(),
    notes: notes.map((n) => ({ ...n })),
    bpm: p.bpm,
  };
}

function clipAt(track, st) {
  for (let i = 0; i < arr.clips.length; i++) {
    const c = arr.clips[i];
    if (c.track === track && st >= c.start && st < c.start + c.length) return c;
  }
  return null;
}

function scheduleArrange(st, t) {
  const vel0 = 0.9;
  for (let i = 0; i < ARR_TRACKS.length; i++) {
    const track = ARR_TRACKS[i];
    const c = clipAt(track, st);
    if (!c) continue;
    ensureEnv(c);
    const pos = (st - c.start) / Math.max(1, c.length);
    const vol = envAt(c.env.vol, pos);
    const cut = envAt(c.env.cut, pos);
    const vel = vel0 * vol;
    const dest = voiceDest(track, t, cut);
    const local = (st - c.start) % 16;
    if (c.buffer && local === 0) {
      ensureWarp(c);
      trigBuffer(t, c.buffer, dest, vel * (c.gain || 1), clipPlayRate(c));
      continue;
    }
    if (track === 'keys') {
      (c.notes || []).forEach((n) => {
        if ((n.start % 16) === local) {
          trigKey(t, n.pitch, ((n.vel || 100) / 100) * vol, n.length, 80 + cut * 8000);
        }
      });
      continue;
    }
    if (!c.grid || !c.grid[track] || !c.grid[track][local]) continue;
    if (track === 'kick') trigKick(t, vel, dest);
    else if (track === 'snare') trigSnare(t, vel, dest);
    else if (track === 'hihat') trigHat(t, vel, dest);
    else if (track === 'clap') trigClap(t, vel, dest);
    else if (track === 'bass') trigBass(t, vel, (c.bassNotes && c.bassNotes[local]) || 0, cut);
  }
  if (metroOn && st % 4 === 0) trigMetro(t, st % 16 === 0);
}

function punchBar(st) {
  if (!recOn || prodView !== 'arrange') return;
  if (st % 16 !== 0) return;
  if (arr.punch && (st < arr.loopStart || st >= arr.loopEnd)) return;
  const snap = snapshotPattern();
  if (!snap) return;
  ARR_TRACKS.forEach((track) => {
    const has = track === 'keys'
      ? (snap.notes && snap.notes.length)
      : snap.grid[track] && snap.grid[track].some(Boolean);
    if (!has) return;
    arr.clips = arr.clips.filter((c) => !(c.track === track && c.start === st && c.length === 16));
    arr.clips.push(makeArrClip({
      track,
      start: st,
      length: 16,
      name: recOn ? 'Rec' : track,
      color: (STRIPS.find((s) => s.id === track) || {}).color || '#3fc6ff',
      grid: snap.grid,
      notes: snap.notes,
      bassNotes: snap.bassNotes,
    }));
  });
  paintArrangeClips();
}

function seedArrange() {
  if (arr.clips.length) return;
  const snap = snapshotPattern();
  if (!snap) return;
  ARR_TRACKS.forEach((track) => {
    const has = track === 'keys'
      ? (snap.notes && snap.notes.length)
      : snap.grid[track] && snap.grid[track].some(Boolean);
    if (!has) return;
    arr.clips.push(makeArrClip({
      track,
      start: 0,
      length: 32,
      name: track,
      color: (STRIPS.find((s) => s.id === track) || {}).color || '#3fc6ff',
      grid: snap.grid,
      notes: snap.notes,
      bassNotes: snap.bassNotes,
      env: {
        vol: [{ t: 0, v: 0.12 }, { t: 0.1, v: 1 }, { t: 0.82, v: 1 }, { t: 1, v: 0.18 }],
        cut: [{ t: 0, v: 0.35 }, { t: 0.35, v: 1 }, { t: 1, v: 0.5 }],
      },
    }));
  });
}

function dropAtPlayhead() {
  const snap = snapshotPattern();
  if (!snap) return;
  const start = Math.floor(step / 16) * 16;
  const length = 32;
  ARR_TRACKS.forEach((track) => {
    const has = track === 'keys'
      ? (snap.notes && snap.notes.length)
      : snap.grid[track] && snap.grid[track].some(Boolean);
    if (!has) return;
    arr.clips = arr.clips.filter((c) => !(c.track === track && c.start < start + length && c.start + c.length > start));
    arr.clips.push(makeArrClip({
      track,
      start,
      length,
      name: 'Clip',
      color: (STRIPS.find((s) => s.id === track) || {}).color || '#3fc6ff',
      grid: snap.grid,
      notes: snap.notes,
      bassNotes: snap.bassNotes,
    }));
  });
  paintArrangeClips();
}

function arrMax() { return arr.bars * 16; }

export function setProdView(name) {
  prodView = name === 'arrange' ? 'arrange' : 'session';
  document.querySelectorAll('[data-prod-view]').forEach((btn) => {
    const on = btn.dataset.prodView === prodView;
    btn.classList.toggle('active', on);
    if (btn.getAttribute('role') === 'tab') btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const sess = document.getElementById('daw-session');
  const el = document.getElementById('daw-arrange');
  if (sess) sess.hidden = prodView !== 'session';
  if (el) el.hidden = prodView !== 'arrange';
  if (prodView === 'arrange') {
    seedArrange();
    paintArrange();
  }
}

function paintArrange() {
  const root = document.getElementById('daw-arrange');
  if (!root) return;
  const width = arrMax() * PX;
  if (!root._built) {
    root._built = true;
    root.innerHTML = `
      <div class="arr-bar">
        <span>Arrangement</span>
        <button type="button" id="arr-loop-btn" title="Loop brace">Loop</button>
        <button type="button" id="arr-follow-btn" title="Follow playhead">Follow</button>
        <button type="button" id="arr-punch-btn" title="Punch-in: Rec only writes inside the loop">Punch</button>
        <button type="button" id="arr-drop-btn" title="Drop the current clip at the playhead">Drop clip</button>
        <span class="abl-muted">Tab flips Session · select a clip to draw its envelope</span>
      </div>
      <div class="arr-scroll" id="arr-scroll">
        <div class="arr-inner" id="arr-inner" style="width:${width}px">
          <div class="arr-ruler" id="arr-ruler"></div>
          <div class="arr-loop" id="arr-loop"><i data-h="l"></i><i data-h="r"></i></div>
          <div class="arr-lanes" id="arr-lanes"></div>
          <div class="arr-playhead" id="arr-playhead"></div>
        </div>
      </div>
      <div class="arr-env" id="arr-env">
        <div class="arr-env-bar">
          <span>Clip envelope</span>
          <button type="button" data-env="vol" class="on">Vol</button>
          <button type="button" data-env="cut">Cut</button>
          <button type="button" id="arr-env-fadein">Fade in</button>
          <button type="button" id="arr-env-fadeout">Fade out</button>
          <span class="abl-muted" id="arr-env-clip">select a clip</span>
        </div>
        <canvas id="arr-env-canvas" width="640" height="88" aria-label="Clip envelope. Click to add a breakpoint, drag to move, right-click to delete."></canvas>
      </div>
    `;
    bindArrange();
  }
  const inner = document.getElementById('arr-inner');
  if (inner) inner.style.width = `${width}px`;
  paintArrangeRuler();
  paintArrangeLanes();
  paintArrangeClips();
  paintLoopBrace();
  syncArrangeBtns();
  tickArrangePlayhead(step);
  paintEnvEditor();
}

function paintArrangeRuler() {
  const ruler = document.getElementById('arr-ruler');
  if (!ruler) return;
  let html = '';
  for (let b = 0; b < arr.bars; b++) {
    html += `<span class="arr-barnum" style="left:${b * 16 * PX}px">${b + 1}</span>`;
  }
  ruler.innerHTML = html;
}

function paintArrangeLanes() {
  const lanes = document.getElementById('arr-lanes');
  if (!lanes) return;
  lanes.innerHTML = ARR_TRACKS.map((id) => {
    const s = STRIPS.find((x) => x.id === id);
    return `<div class="arr-lane" data-lane="${id}"><span class="arr-lane-h">${s.name}</span><div class="arr-lane-g"></div></div>`;
  }).join('');
}

function paintArrangeClips() {
  const lanes = document.getElementById('arr-lanes');
  if (!lanes) return;
  lanes.querySelectorAll('.arr-clip').forEach((n) => n.remove());
  arr.clips.forEach((c) => {
    ensureEnv(c);
    const lane = lanes.querySelector(`[data-lane="${c.track}"] .arr-lane-g`);
    if (!lane) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'arr-clip' + (arr.selected === c.id ? ' selected' : '');
    el.dataset.id = c.id;
    el.style.left = `${c.start * PX}px`;
    el.style.width = `${Math.max(8, c.length * PX)}px`;
    el.style.setProperty('--clip', c.color);
    el.innerHTML = `<span>${c.name || c.track}</span><canvas class="arr-clip-env"></canvas><b class="arr-resize"></b>`;
    lane.appendChild(el);
    drawMiniEnv(el.querySelector('canvas'), c);
  });
  paintEnvEditor();
}

function drawMiniEnv(canvas, c) {
  if (!canvas) return;
  const w = Math.max(8, c.length * PX);
  canvas.width = w;
  canvas.height = 22;
  const g = canvas.getContext('2d');
  const pts = (c.env && c.env[envParam]) || [];
  if (pts.length < 2) return;
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 1.2;
  g.beginPath();
  pts.forEach((p, i) => {
    const x = p.t * w;
    const y = (1 - p.v) * 20 + 1;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  g.stroke();
}

function selectedClip() {
  return arr.clips.find((c) => c.id === arr.selected) || null;
}

function paintEnvEditor() {
  const canvas = document.getElementById('arr-env-canvas');
  const lab = document.getElementById('arr-env-clip');
  const c = selectedClip();
  document.querySelectorAll('[data-env]').forEach((b) => b.classList.toggle('on', b.dataset.env === envParam));
  if (lab) lab.textContent = c ? `${c.track} · ${envParam === 'vol' ? 'volume' : 'cutoff'}` : 'select a clip';
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const cssW = Math.max(120, (wrap && wrap.clientWidth) || 640);
  const cssH = 88;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#070a09';
  g.fillRect(0, 0, cssW, cssH);
  g.strokeStyle = 'rgba(63,198,255,0.12)';
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo(0, (cssH * i) / 4);
    g.lineTo(cssW, (cssH * i) / 4);
    g.stroke();
  }
  if (!c) return;
  ensureEnv(c);
  const pts = c.env[envParam];
  g.strokeStyle = envParam === 'vol' ? '#3fc6ff' : '#ffb238';
  g.fillStyle = g.strokeStyle;
  g.lineWidth = 1.6;
  g.beginPath();
  pts.forEach((p, i) => {
    const x = p.t * cssW;
    const y = (1 - p.v) * (cssH - 8) + 4;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  g.stroke();
  pts.forEach((p) => {
    const x = p.t * cssW;
    const y = (1 - p.v) * (cssH - 8) + 4;
    g.beginPath();
    g.arc(x, y, 4, 0, Math.PI * 2);
    g.fill();
  });
}

function bindEnv() {
  const canvas = document.getElementById('arr-env-canvas');
  if (!canvas || canvas._bound) return;
  canvas._bound = true;
  const hit = (ev) => {
    const r = canvas.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (ev.clientX - r.left) / Math.max(1, r.width)));
    const v = Math.max(0, Math.min(1, 1 - (ev.clientY - r.top) / Math.max(1, r.height)));
    const c = selectedClip();
    if (!c) return { t, v, pt: null, c: null, pts: null };
    ensureEnv(c);
    const pts = c.env[envParam];
    let pt = null;
    let best = 0.045;
    pts.forEach((p) => {
      const d = Math.hypot(p.t - t, p.v - v);
      if (d < best) { best = d; pt = p; }
    });
    return { t, v, pt, c, pts };
  };
  canvas.addEventListener('pointerdown', (ev) => {
    const h = hit(ev);
    if (!h.c) return;
    if (ev.button === 2) {
      if (h.pt && h.pts.length > 1) {
        h.c.env[envParam] = h.pts.filter((p) => p !== h.pt);
        paintEnvEditor();
        paintArrangeClips();
      }
      return;
    }
    let pt = h.pt;
    if (!pt) {
      pt = { t: h.t, v: h.v };
      h.pts.push(pt);
      h.pts.sort((a, b) => a.t - b.t);
    }
    const move = (e) => {
      const n = hit(e);
      pt.t = n.t;
      pt.v = n.v;
      h.c.env[envParam].sort((a, b) => a.t - b.t);
      paintEnvEditor();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      paintArrangeClips();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    paintEnvEditor();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function paintLoopBrace() {
  const brace = document.getElementById('arr-loop');
  if (!brace) return;
  brace.style.left = `${arr.loopStart * PX}px`;
  brace.style.width = `${Math.max(PX, (arr.loopEnd - arr.loopStart) * PX)}px`;
  brace.classList.toggle('off', !arr.loopOn);
}

function syncArrangeBtns() {
  const loop = document.getElementById('arr-loop-btn');
  const follow = document.getElementById('arr-follow-btn');
  const punch = document.getElementById('arr-punch-btn');
  if (loop) loop.classList.toggle('on', arr.loopOn);
  if (follow) follow.classList.toggle('on', arr.follow);
  if (punch) punch.classList.toggle('on', arr.punch);
}

function tickArrangePlayhead(st) {
  const ph = document.getElementById('arr-playhead');
  const scroll = document.getElementById('arr-scroll');
  if (!ph) return;
  const x = Math.max(0, st) * PX;
  ph.style.left = `${x}px`;
  if (arr.follow && playing && scroll && prodView === 'arrange') {
    const mid = scroll.clientWidth * 0.4;
    const target = x - mid;
    if (Math.abs(scroll.scrollLeft - target) > 8) scroll.scrollLeft = Math.max(0, target);
  }
}

function bindArrange() {
  const root = document.getElementById('daw-arrange');
  if (!root || root._bound) return;
  root._bound = true;
  root.querySelector('#arr-loop-btn').addEventListener('click', () => { arr.loopOn = !arr.loopOn; syncArrangeBtns(); paintLoopBrace(); });
  root.querySelector('#arr-follow-btn').addEventListener('click', () => { arr.follow = !arr.follow; syncArrangeBtns(); });
  root.querySelector('#arr-punch-btn').addEventListener('click', () => { arr.punch = !arr.punch; syncArrangeBtns(); });
  root.querySelector('#arr-drop-btn').addEventListener('click', dropAtPlayhead);
  root.querySelectorAll('[data-env]').forEach((btn) => {
    btn.addEventListener('click', () => {
      envParam = btn.dataset.env === 'cut' ? 'cut' : 'vol';
      paintEnvEditor();
      paintArrangeClips();
    });
  });
  const fadeIn = root.querySelector('#arr-env-fadein');
  const fadeOut = root.querySelector('#arr-env-fadeout');
  if (fadeIn) fadeIn.addEventListener('click', () => {
    const c = selectedClip();
    if (!c) return;
    ensureEnv(c);
    c.env.vol = [{ t: 0, v: 0 }, { t: 0.2, v: 1 }, { t: 1, v: 1 }];
    envParam = 'vol';
    paintEnvEditor();
    paintArrangeClips();
  });
  if (fadeOut) fadeOut.addEventListener('click', () => {
    const c = selectedClip();
    if (!c) return;
    ensureEnv(c);
    c.env.vol = [{ t: 0, v: 1 }, { t: 0.75, v: 1 }, { t: 1, v: 0 }];
    envParam = 'vol';
    paintEnvEditor();
    paintArrangeClips();
  });
  bindEnv();
  const ruler = document.getElementById('arr-ruler');
  const inner = document.getElementById('arr-inner');
  const xToStep = (clientX) => {
    const r = inner.getBoundingClientRect();
    return Math.max(0, Math.min(arrMax() - 1, Math.round((clientX - r.left) / PX)));
  };
  ruler.addEventListener('pointerdown', (ev) => {
    step = xToStep(ev.clientX);
    highlightStep(step);
  });
  const brace = document.getElementById('arr-loop');
  brace.addEventListener('pointerdown', (ev) => {
    const h = ev.target.getAttribute('data-h');
    if (!h) return;
    ev.preventDefault();
    ev.stopPropagation();
    const move = (e) => {
      const st = xToStep(e.clientX);
      if (h === 'l') arr.loopStart = Math.min(st, arr.loopEnd - 4);
      else arr.loopEnd = Math.max(st, arr.loopStart + 4);
      arr.loopStart = Math.max(0, arr.loopStart);
      arr.loopEnd = Math.min(arrMax(), arr.loopEnd);
      paintLoopBrace();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  root.addEventListener('pointerdown', (ev) => {
    const clipEl = ev.target.closest('.arr-clip');
    if (!clipEl) return;
    const c = arr.clips.find((x) => x.id === clipEl.dataset.id);
    if (!c) return;
    arr.selected = c.id;
    paintArrangeClips();
    if (ev.target.classList.contains('arr-resize')) {
      const move = (e) => {
        const end = xToStep(e.clientX);
        c.length = Math.max(4, end - c.start);
        paintArrangeClips();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }
    const origin = c.start;
    const grab = xToStep(ev.clientX);
    const move = (e) => {
      const now = xToStep(e.clientX);
      c.start = Math.max(0, Math.min(arrMax() - c.length, origin + (now - grab)));
      paintArrangeClips();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  root.addEventListener('dblclick', (ev) => {
    const clipEl = ev.target.closest('.arr-clip');
    if (!clipEl) return;
    const c = arr.clips.find((x) => x.id === clipEl.dataset.id);
    if (!c || !c.grid) return;
    const p = pattern();
    if (p && c.grid) {
      Object.keys(c.grid).forEach((id) => { if (p.grid[id]) p.grid[id] = c.grid[id].slice(); });
      if (c.bassNotes) p.bassNotes = c.bassNotes.slice();
    }
    if (c.notes) { notes.length = 0; c.notes.forEach((n) => notes.push({ ...n })); }
    const seq = document.getElementById('sequencer');
    if (seq && p) seq.querySelectorAll('.seq-cell').forEach((cell) => {
      const on = p.grid[cell.dataset.track] && p.grid[cell.dataset.track][Number(cell.dataset.step)];
      cell.classList.toggle('on', !!on);
    });
    paintRoll();
    setDetail(c.track === 'keys' ? 'keys' : 'drums');
  });
  root.addEventListener('contextmenu', (ev) => {
    const clipEl = ev.target.closest('.arr-clip');
    if (!clipEl) return;
    ev.preventDefault();
    arr.clips = arr.clips.filter((c) => c.id !== clipEl.dataset.id);
    arr.selected = null;
    paintArrangeClips();
  });
}

function paintSession() {
  const root = document.getElementById('daw-session');
  if (!root) return;
  if (!clips.length) {
    const colors = ['#3fc6ff', '#ffb238', '#7dff9a', '#ff6b8a', '#c084fc', '#67e8f9', '#fbbf24', '#f0abfc'];
    for (let s = 0; s < 8; s++) {
      clips.push({
        track: 0,
        scene: s,
        name: s === 0 ? 'Loop' : '',
        color: colors[s],
        grid: null,
        notes: null,
        bassNotes: null,
        follow: defaultFollow(),
      });
    }
    const snap = snapshotPattern();
    if (snap) {
      clips[0].grid = snap.grid;
      clips[0].notes = snap.notes;
      clips[0].bassNotes = snap.bassNotes;
      clips[0].name = 'Loop';
    }
  }
  clips.forEach(ensureFollow);
  const sel = clips[selectedScene] || clips[0];
  const f = ensureFollow(sel);
  const actionOpts = FOLLOW_ACTIONS.map((a) => `<option value="${a.id}">${a.label}</option>`).join('');
  let html = '<div class="abl-session">';
  html += '<div class="abl-matrix">';
  html += '<div class="abl-matrix-corner"></div>';
  SESS_TRACKS.forEach((s) => {
    html += `<div class="abl-col-h" style="--strip:${s.color}">${s.name}</div>`;
  });
  html += '<div class="abl-col-h abl-col-stop">Stop</div>';
  for (let s = 0; s < 8; s++) {
    const c = clips[s];
    const sceneOn = pendingScene === s;
    html += `<button type="button" class="abl-scene-launch${sceneOn ? ' queued' : ''}${currentScene === s && playing ? ' playing' : ''}" data-scene="${s}" title="Launch scene ${s + 1}">▶</button>`;
    SESS_TRACKS.forEach((tr) => {
      const filled = trackHas(c, tr.id);
      const on = liveClip[tr.id] === s && playing && filled;
      const wait = pendingClip[tr.id] === s;
      const picked = selectedScene === s;
      html += `<button type="button" class="abl-slot${filled ? ' filled' : ''}${on ? ' playing' : ''}${wait ? ' queued' : ''}${picked ? ' selected' : ''}" data-scene="${s}" data-track="${tr.id}" style="--clip:${c.color};--ph:0">
        <span>${filled ? (tr.id === 'keys' && c.buffer ? (c.name || 'Audio') : (c.name || tr.name)) : ''}</span>
      </button>`;
    });
    html += `<button type="button" class="abl-scene-stop" data-stop-scene="${s}" title="Stop this scene's clips">■</button>`;
  }
  html += '</div>';
  html += `<div class="abl-follow">
    <label class="abl-follow-on"><input type="checkbox" id="fol-on"${f.on ? ' checked' : ''}> Follow</label>
    <label>After <select id="fol-bars">
      ${[1, 2, 4, 8].map((n) => `<option value="${n}"${Number(f.bars) === n ? ' selected' : ''}>${n} bar${n > 1 ? 's' : ''}</option>`).join('')}
    </select></label>
    <label>A <select id="fol-a">${actionOpts}</select></label>
    <label>B <select id="fol-b">${actionOpts}</select></label>
    <label>A chance <input id="fol-chance" type="range" min="0" max="100" value="${f.chance}"><span id="fol-chance-val">${f.chance}%</span></label>
    <span class="abl-muted" id="fol-target">${sel.name || 'Scene ' + (selectedScene + 1)}</span>
  </div>`;
  if (sel.buffer) {
    ensureWarp(sel);
    const rate = clipPlayRate(sel);
    html += `<div class="abl-warp" id="abl-warp">
      <span class="daw-kicker">Warp</span>
      <label>Mode <select id="warp-mode">
        <option value="beats"${sel.warpMode === 'beats' ? ' selected' : ''}>Beats (lock to tempo)</option>
        <option value="free"${sel.warpMode === 'free' ? ' selected' : ''}>Free (1:1)</option>
      </select></label>
      <label>Orig BPM <input id="warp-bpm" type="number" min="40" max="240" value="${sel.origBpm || 120}"></label>
      <label>Gain <input id="warp-gain" type="range" min="0" max="1.5" step="0.01" value="${sel.gain}"><span id="warp-gain-val">${Number(sel.gain).toFixed(2)}</span></label>
      <span class="abl-muted">rate ${rate.toFixed(2)}× · ${sel.buffer.duration.toFixed(1)}s</span>
    </div>`;
  }
  html += '</div>';
  root.innerHTML = html;
  root.querySelector('#fol-a').value = f.a;
  root.querySelector('#fol-b').value = f.b;
  const writeFollow = () => {
    const c = clips[selectedScene];
    if (!c) return;
    const ff = ensureFollow(c);
    ff.on = document.getElementById('fol-on').checked;
    ff.bars = Number(document.getElementById('fol-bars').value) || 2;
    ff.a = document.getElementById('fol-a').value;
    ff.b = document.getElementById('fol-b').value;
    ff.chance = Number(document.getElementById('fol-chance').value) || 0;
    const val = document.getElementById('fol-chance-val');
    if (val) val.textContent = `${ff.chance}%`;
  };
  ['fol-on', 'fol-bars', 'fol-a', 'fol-b', 'fol-chance'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', writeFollow);
    if (el) el.addEventListener('change', writeFollow);
  });
  const warpMode = document.getElementById('warp-mode');
  const warpBpm = document.getElementById('warp-bpm');
  const warpGain = document.getElementById('warp-gain');
  const writeWarp = () => {
    const c = clips[selectedScene];
    if (!c || !c.buffer) return;
    ensureWarp(c);
    if (warpMode) c.warpMode = warpMode.value === 'free' ? 'free' : 'beats';
    if (warpBpm) c.origBpm = Math.max(40, Math.min(240, Number(warpBpm.value) || 120));
    if (warpGain) c.gain = Math.max(0, Math.min(1.5, Number(warpGain.value) || 1));
    const gv = document.getElementById('warp-gain-val');
    if (gv) gv.textContent = Number(c.gain).toFixed(2);
  };
  [warpMode, warpBpm, warpGain].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', writeWarp);
    el.addEventListener('change', writeWarp);
  });
  function captureScene(s) {
    const snap = snapshotPattern();
    if (!snap) return;
    const c = clips[s];
    c.grid = snap.grid;
    c.notes = snap.notes;
    c.bassNotes = snap.bassNotes;
    c.name = c.name || `Scene ${s + 1}`;
  }
  function launchSceneRow(s) {
    selectedScene = s;
    const c = clips[s];
    if (!c.grid) captureScene(s);
    pendingScene = s;
    SESS_TRACKS.forEach((tr) => { pendingClip[tr.id] = s; });
    followSteps = 0;
    if (!flushLaunch()) studioPlay();
  }
  function launchSlot(s, track) {
    selectedScene = s;
    const c = clips[s];
    if (!trackHas(c, track)) {
      captureScene(s);
      paintSession();
      return;
    }
    if (liveClip[track] === s && playing && pendingClip[track] == null) {
      pendingClip[track] = -1;
    } else {
      pendingClip[track] = s;
    }
    if (!flushLaunch()) studioPlay();
  }
  root.querySelectorAll('.abl-scene-launch').forEach((btn) => {
    btn.addEventListener('click', () => launchSceneRow(Number(btn.dataset.scene)));
  });
  root.querySelectorAll('.abl-slot').forEach((btn) => {
    const s = Number(btn.dataset.scene);
    const track = btn.dataset.track;
    btn.addEventListener('click', (ev) => {
      if (ev.altKey) { selectedScene = s; paintSession(); return; }
      launchSlot(s, track);
    });
    btn.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      captureScene(s);
      selectedScene = s;
      paintSession();
    });
  });
  root.querySelectorAll('[data-stop-scene]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SESS_TRACKS.forEach((tr) => {
        if (liveClip[tr.id] === Number(btn.dataset.stopScene) || pendingClip[tr.id] === Number(btn.dataset.stopScene)) {
          pendingClip[tr.id] = -1;
        }
      });
      flushLaunch();
    });
  });
  const stopAll = document.getElementById('abl-stop-clips');
  if (stopAll) stopAll.addEventListener('click', studioStop);
}

function paintMixer() {
  const root = document.getElementById('abl-mixer');
  if (!root) return;
  ensureMix();
  root.innerHTML = STRIPS.map((s) => {
    const m = mix[s.id];
    const canSend = s.id !== 'master' && s.id !== 'return';
    const sendVal = m.sendVal || 0;
    const sendHtml = canSend
      ? `<label class="abl-send-lab">A <input type="range" min="0" max="1" step="0.01" value="${sendVal}" data-send="${s.id}" aria-label="${s.name} send A" aria-valuetext="${Math.round(sendVal * 100)}%"></label>`
      : `<span class="abl-send-lab abl-send-lab-empty" aria-hidden="true">A</span>`;
    return `<div class="abl-strip" data-strip="${s.id}" style="--strip:${s.color}">
      <canvas class="abl-meter" data-meter="${s.id}" width="10" height="92" aria-hidden="true"></canvas>
      <input type="range" min="0" max="1.4" step="0.01" value="${m.level}" data-vol="${s.id}" aria-label="${s.name} volume" aria-valuetext="${Math.round(m.level * 100)}%">
      <input type="range" min="-1" max="1" step="0.01" value="${m.panVal}" data-pan="${s.id}" aria-label="${s.name} pan" aria-valuetext="${m.panVal === 0 ? 'center' : (m.panVal < 0 ? 'left' : 'right')}">
      ${sendHtml}
      <div class="abl-strip-btns">
        <button type="button" class="abl-m${m.muted ? ' on' : ''}" data-mute="${s.id}" aria-pressed="${m.muted ? 'true' : 'false'}" aria-label="Mute ${s.name}">M</button>
        <button type="button" class="abl-s${m.soloed ? ' on' : ''}" data-solo="${s.id}" aria-pressed="${m.soloed ? 'true' : 'false'}" aria-label="Solo ${s.name}">S</button>
      </div>
      <span>${s.name}</span>
    </div>`;
  }).join('');
  root.querySelectorAll('[data-vol]').forEach((el) => {
    el.addEventListener('input', () => {
      if (midiMapOn) {
        midiLearn = { type: 'vol', id: el.dataset.vol };
        midiStatus(`Learn volume ${el.dataset.vol} — move a CC`);
        syncTransport();
        return;
      }
      const m = mix[el.dataset.vol];
      m.level = parseFloat(el.value);
      m.vol.gain.setTargetAtTime(m.level, audio().ctx.currentTime, 0.02);
      el.setAttribute('aria-valuetext', `${Math.round(m.level * 100)}%`);
    });
  });
  root.querySelectorAll('[data-pan]').forEach((el) => {
    el.addEventListener('input', () => {
      if (midiMapOn) {
        midiLearn = { type: 'pan', id: el.dataset.pan };
        midiStatus(`Learn pan ${el.dataset.pan} — move a CC`);
        syncTransport();
        return;
      }
      const m = mix[el.dataset.pan];
      m.panVal = parseFloat(el.value);
      if (m.pan) m.pan.pan.setTargetAtTime(m.panVal, audio().ctx.currentTime, 0.02);
    });
  });
  root.querySelectorAll('[data-send]').forEach((el) => {
    el.addEventListener('input', () => {
      if (midiMapOn) {
        midiLearn = { type: 'send', id: el.dataset.send };
        midiStatus(`Learn send A ${el.dataset.send} — move a CC`);
        syncTransport();
        return;
      }
      const m = mix[el.dataset.send];
      if (!m) return;
      m.sendVal = parseFloat(el.value) || 0;
      applySend(el.dataset.send);
      el.setAttribute('aria-valuetext', `${Math.round(m.sendVal * 100)}%`);
    });
  });
  root.querySelectorAll('[data-mute]').forEach((el) => {
    el.addEventListener('click', () => {
      const m = mix[el.dataset.mute];
      m.muted = !m.muted;
      applyMute();
      paintMixer();
    });
  });
  root.querySelectorAll('[data-solo]').forEach((el) => {
    el.addEventListener('click', () => {
      const m = mix[el.dataset.solo];
      m.soloed = !m.soloed;
      applyMute();
      paintMixer();
    });
  });
}

function meterLoop() {
  if (!mix.master) return;
  STRIPS.forEach((s) => {
    const m = mix[s.id];
    const canvas = document.querySelector(`[data-meter="${s.id}"]`);
    if (!m || !canvas) return;
    const buf = new Uint8Array(m.analyser.fftSize);
    m.analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = Math.abs(buf[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    m.peak = Math.max(peak, m.peak * 0.86);
    const g = canvas.getContext('2d');
    const h = canvas.height;
    const w = canvas.width;
    g.clearRect(0, 0, w, h);
    const mag = Math.max(0.02, m.peak);
    const fill = mag * h;
    g.fillStyle = mag > 0.92 ? '#ff4d4d' : mag > 0.7 ? '#ffb238' : s.color;
    g.fillRect(0, h - fill, w, fill);
  });
}

function paintRoll() {
  const canvas = document.getElementById('abl-roll');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 640;
  const cssH = canvas.clientHeight || 220;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rows = ROLL_HIGH - ROLL_LOW;
  const rowH = cssH / rows;
  const colW = cssW / ROLL_STEPS;
  const scale = scalePitches();
  for (let p = ROLL_HIGH - 1; p >= ROLL_LOW; p--) {
    const y = (ROLL_HIGH - 1 - p) * rowH;
    const black = [1, 3, 6, 8, 10].includes(p % 12);
    g.fillStyle = black ? '#0d1210' : '#141a17';
    if (scale.has(p % 12)) g.fillStyle = black ? '#10241c' : '#1a2c24';
    g.fillRect(0, y, cssW, rowH);
  }
  g.strokeStyle = 'rgba(63,198,255,0.08)';
  for (let s = 0; s <= ROLL_STEPS; s++) {
    g.beginPath();
    g.moveTo(s * colW, 0);
    g.lineTo(s * colW, cssH);
    g.stroke();
  }
  notes.forEach((n) => {
    if (n.pitch < ROLL_LOW || n.pitch >= ROLL_HIGH) return;
    const x = n.start * colW;
    const y = (ROLL_HIGH - 1 - n.pitch) * rowH;
    g.fillStyle = '#3fc6ff';
    g.fillRect(x + 1, y + 1, Math.max(4, n.length * colW - 2), rowH - 2);
  });
}

function scalePitches() {
  const keyEl = document.getElementById('song-key');
  const modeEl = document.getElementById('song-mode');
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const root = names.indexOf(keyEl && keyEl.value ? keyEl.value : 'C');
  const intervals = (modeEl && modeEl.value === 'minor') ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  return new Set(intervals.map((i) => (root + i) % 12));
}

function hitNote(mx, my, canvas) {
  const r = canvas.getBoundingClientRect();
  const x = mx - r.left;
  const y = my - r.top;
  const colW = r.width / ROLL_STEPS;
  const rowH = r.height / (ROLL_HIGH - ROLL_LOW);
  const start = Math.max(0, Math.min(ROLL_STEPS - 1, Math.floor(x / colW)));
  const pitch = ROLL_HIGH - 1 - Math.max(0, Math.min(ROLL_HIGH - ROLL_LOW - 1, Math.floor(y / rowH)));
  const existing = notes.find((n) => n.pitch === pitch && start >= n.start && start < n.start + n.length);
  return { start, pitch, existing };
}

function bindRoll() {
  const canvas = document.getElementById('abl-roll');
  if (!canvas || canvas._bound) return;
  canvas._bound = true;
  let drag = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const hit = hitNote(ev.clientX, ev.clientY, canvas);
    if (ev.button === 2 || ev.altKey) {
      if (hit.existing) {
        const i = notes.indexOf(hit.existing);
        if (i >= 0) notes.splice(i, 1);
        paintRoll();
      }
      return;
    }
    if (hit.existing) {
      drag = { mode: 'move', note: hit.existing, ox: hit.start, op: hit.pitch };
    } else {
      const n = { pitch: hit.pitch, start: hit.start, length: 1, vel: 100 };
      notes.push(n);
      drag = { mode: 'draw', note: n };
      ensureMix();
      trigKey(audio().ctx.currentTime, n.pitch, 0.8, 1);
    }
    paintRoll();
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const hit = hitNote(ev.clientX, ev.clientY, canvas);
    if (drag.mode === 'draw') {
      drag.note.length = Math.max(1, hit.start - drag.note.start + 1);
    } else {
      drag.note.start = Math.max(0, hit.start);
      drag.note.pitch = hit.pitch;
    }
    paintRoll();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

const KEY_MAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };
const held = new Map();

const PADS = [
  { id: 'crash', name: 'Crash', key: 'q', color: '#b794f4', choke: 3, dest: 'hihat', kind: 'crash' },
  { id: 'ride', name: 'Ride', key: 'w', color: '#d6bcfa', choke: 3, dest: 'hihat', kind: 'ride' },
  { id: 'tomh', name: 'Tom H', key: 'e', color: '#63b3ed', choke: 2, dest: 'snare', kind: 'tomh' },
  { id: 'clap', name: 'Clap', key: 'r', color: '#f0abfc', choke: 0, dest: 'clap', kind: 'clap' },
  { id: 'ohat', name: 'OH', key: 'a', color: '#e8d48a', choke: 1, dest: 'hihat', kind: 'oh' },
  { id: 'hihat', name: 'CH', key: 's', color: '#f0e27a', choke: 1, dest: 'hihat', kind: 'ch' },
  { id: 'tomm', name: 'Tom M', key: 'd', color: '#4299e1', choke: 2, dest: 'snare', kind: 'tomm' },
  { id: 'snare', name: 'Snare', key: 'f', color: '#ffb238', choke: 0, dest: 'snare', kind: 'snare' },
  { id: 'shaker', name: 'Shaker', key: 'z', color: '#c8c070', choke: 1, dest: 'hihat', kind: 'shaker' },
  { id: 'perc', name: 'Perc', key: 'x', color: '#7dff9a', choke: 0, dest: 'clap', kind: 'perc' },
  { id: 'toml', name: 'Tom L', key: 'c', color: '#3182ce', choke: 2, dest: 'snare', kind: 'toml' },
  { id: 'rim', name: 'Rim', key: 'v', color: '#e09a20', choke: 0, dest: 'snare', kind: 'rim' },
  { id: 'kick', name: 'Kick', key: '1', color: '#ff6b4a', choke: 0, dest: 'kick', kind: 'kick' },
  { id: 'kick2', name: 'Sub', key: '2', color: '#d94a32', choke: 0, dest: 'kick', kind: 'kick2' },
  { id: 'cow', name: 'Cow', key: '3', color: '#9ae6b4', choke: 0, dest: 'clap', kind: 'cow' },
  { id: 'fx', name: 'FX', key: '4', color: '#3fc6ff', choke: 0, dest: 'clap', kind: 'fx' },
];

function destForPad(pad) {
  return (mix[pad.dest] && mix[pad.dest].input) || mix.kick.input;
}

function trigKind(kind, t, vel, dest) {
  switch (kind) {
    case 'kick': trigKick(t, vel, dest); return null;
    case 'kick2': return trigKick2(t, vel, dest);
    case 'snare': trigSnare(t, vel, dest); return null;
    case 'rim': return trigRim(t, vel, dest);
    case 'ch': return trigHat(t, vel, dest);
    case 'oh': return trigOpenHat(t, vel, dest);
    case 'shaker': return trigShaker(t, vel, dest);
    case 'clap': trigClap(t, vel, dest); return null;
    case 'perc': trigPerc(t, vel, dest); return null;
    case 'cow': return trigCow(t, vel, dest);
    case 'tomh': return trigTom(t, vel, dest, 320);
    case 'tomm': return trigTom(t, vel, dest, 210);
    case 'toml': return trigTom(t, vel, dest, 140);
    case 'ride': return trigCym(t, vel, dest, 4800, 0.55);
    case 'crash': return trigCym(t, vel, dest, 3200, 0.85);
    case 'fx': return trigFx(t, vel, dest);
    default: return null;
  }
}

function firePad(pad, t, vel) {
  if (!pad) return;
  const dest = destForPad(pad);
  chokeGroup(pad.choke, t, pad.id);
  const g = trigKind(pad.kind, t, vel, dest);
  rememberVoice(pad.id, g);
}

function hitPad(id) {
  ensureMix();
  const a = audio();
  if (!a || !mix.kick) return;
  if (a.ctx.state === 'suspended') a.ctx.resume();
  const t = a.ctx.currentTime;
  const pad = PADS.find((p) => p.id === id);
  firePad(pad, t, 0.95);
  recordPadHit(pad);
  const el = document.querySelector(`[data-pad="${id}"]`);
  if (el) {
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  }
}

function recordPadHit(pad) {
  if (!recOn || !playing || !pad) return;
  const p = pattern();
  if (!p || !p.grid) return;
  const lane = p.grid[pad.dest];
  if (!lane || !lane.length) return;
  const st = step % lane.length;
  lane[st] = true;
  const cell = document.querySelector(`.seq-cell[data-track="${pad.dest}"][data-step="${st}"]`);
  if (cell) cell.classList.add('on');
}

function paintPads() {
  const root = document.getElementById('abl-pads');
  if (!root || root.dataset.ready === '16') return;
  root.dataset.ready = '16';
  root.innerHTML = PADS.map((p) =>
    `<button type="button" class="abl-pad" data-pad="${p.id}" style="--pad:${p.color}" aria-label="${p.name} pad. Choke group ${p.choke || 'off'}.">
      <b>${p.name}</b><span>${p.key} <i data-choke="${p.id}">${p.choke ? 'G' + p.choke : '—'}</i></span>
    </button>`
  ).join('');
  root.querySelectorAll('[data-pad]').forEach((btn) => {
    btn.addEventListener('pointerdown', (ev) => {
      if (ev.target && ev.target.dataset.choke) return;
      ev.preventDefault();
      hitPad(btn.dataset.pad);
    });
  });
  root.querySelectorAll('[data-choke]').forEach((badge) => {
    badge.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const pad = PADS.find((p) => p.id === badge.dataset.choke);
      if (!pad) return;
      pad.choke = (pad.choke + 1) % 5;
      badge.textContent = pad.choke ? 'G' + pad.choke : '—';
      const btn = badge.closest('[data-pad]');
      if (btn) btn.setAttribute('aria-label', `${pad.name} pad. Choke group ${pad.choke || 'off'}.`);
    });
  });
}

function bindKeys() {
  if (window.__ablKeys) return;
  window.__ablKeys = true;
  document.addEventListener('keydown', (ev) => {
    const music = document.getElementById('music-view');
    if (!music || music.hidden) return;
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'SELECT')) return;
    if (ev.code === 'Space') {
      const live = document.getElementById('daw-live');
      if (live && !live.hidden) return;
      ev.preventDefault();
      togglePlay();
      return;
    }
    if (detail === 'drums') {
      const pad = PADS.find((p) => p.key === ev.key.toLowerCase() || p.key === ev.key);
      if (pad) {
        ev.preventDefault();
        hitPad(pad.id);
        return;
      }
    }
    if (ev.code === 'Tab') {
      const live = document.getElementById('daw-live');
      if (live && !live.hidden) return;
      ev.preventDefault();
      setProdView(prodView === 'session' ? 'arrange' : 'session');
      return;
    }
    if ((ev.key === 'Backspace' || ev.key === 'Delete') && prodView === 'arrange' && arr.selected) {
      ev.preventDefault();
      arr.clips = arr.clips.filter((c) => c.id !== arr.selected);
      arr.selected = null;
      paintArrangeClips();
      return;
    }
    const pitch = KEY_MAP[String(ev.key).toLowerCase()];
    if (pitch == null || held.has(ev.key)) return;
    ev.preventDefault();
    held.set(ev.key, pitch);
    studioNoteOn(pitch, 0.85);
  });
  document.addEventListener('keyup', (ev) => {
    const pitch = held.get(ev.key);
    held.delete(ev.key);
    if (pitch != null) studioNoteOff(pitch);
  });
}

function snapFromPreset(name) {
  const src = opts.PRESET_PATTERNS && opts.PRESET_PATTERNS[name];
  if (!src) return null;
  const grid = {};
  ['kick', 'snare', 'hihat', 'clap', 'bass'].forEach((id) => {
    grid[id] = new Array(16).fill(false);
    (src[id] || []).forEach((st) => { grid[id][st] = true; });
  });
  return { grid, bassNotes: new Array(16).fill(0), notes: [], bpm: bpm() };
}

function ensureCue() {
  const a = audio();
  if (!a) return null;
  if (cue.dest) return cue.dest;
  const g = a.ctx.createGain();
  g.gain.value = 0.72;
  g.connect(a.ctx.destination);
  cue.dest = g;
  return g;
}

export function stopPreview() {
  cue.on = false;
  if (cue.timer) { clearTimeout(cue.timer); cue.timer = null; }
  cue.snap = null;
  cue.id = '';
  const a = audio();
  if (cue.dest && a) cue.dest.gain.setTargetAtTime(0, a.ctx.currentTime, 0.03);
  document.querySelectorAll('.abl-preview.on').forEach((el) => el.classList.remove('on'));
}

function scheduleCue(st, t) {
  const snap = cue.snap;
  const dest = cue.dest;
  if (!snap || !snap.grid || !dest) return;
  const vel = 0.85;
  const i = st % 16;
  if (snap.grid.kick && snap.grid.kick[i]) trigKick(t, vel, dest);
  if (snap.grid.snare && snap.grid.snare[i]) trigSnare(t, vel, dest);
  if (snap.grid.hihat && snap.grid.hihat[i]) trigHat(t, vel, dest);
  if (snap.grid.clap && snap.grid.clap[i]) trigClap(t, vel, dest);
  if (snap.grid.bass && snap.grid.bass[i]) trigBass(t, vel, (snap.bassNotes && snap.bassNotes[i]) || 0, 1, dest);
  (snap.notes || []).forEach((n) => {
    if ((n.start % 16) === i) trigKey(t, n.pitch, ((n.vel || 100) / 100) * 0.9, n.length, keysCutoff, dest);
  });
}

function cueClock() {
  if (!cue.on) return;
  const a = audio();
  if (!a) return;
  while (cue.next < a.ctx.currentTime + 0.12) {
    scheduleCue(cue.step, cue.next);
    cue.step += 1;
    if (cue.step >= 32) cue.step = 0;
    cue.next += stepDur();
  }
  cue.timer = setTimeout(cueClock, 20);
}

function startPreview(snap, id) {
  ensureMix();
  const a = audio();
  if (!a || !snap) return;
  if (a.ctx.state === 'suspended') a.ctx.resume();
  const dest = ensureCue();
  if (!dest) return;
  if (cue.on && cue.id === id) { stopPreview(); return; }
  stopPreview();
  dest.gain.cancelScheduledValues(a.ctx.currentTime);
  dest.gain.setValueAtTime(0.72, a.ctx.currentTime);
  cue.on = true;
  cue.snap = snap;
  cue.id = id || '';
  cue.step = 0;
  cue.next = a.ctx.currentTime + 0.03;
  cueClock();
  document.querySelectorAll(`.abl-preview[data-cue="${id}"]`).forEach((el) => el.classList.add('on'));
}

function paintBrowser() {
  const root = document.getElementById('abl-browser');
  if (!root) return;
  const presets = opts.PRESET_PATTERNS ? Object.keys(opts.PRESET_PATTERNS) : [];
  root.innerHTML = `
    <div class="abl-browser-h">Browser</div>
    <div class="abl-browser-sec">Instruments</div>
    <button type="button" class="abl-lib on" data-lib="drums">Drum Rack</button>
    <button type="button" class="abl-lib" data-lib="keys">Analog</button>
    <button type="button" class="abl-lib" data-lib="bass">Bass</button>
    <div class="abl-browser-sec">Clips</div>
    ${presets.map((n) => `<div class="abl-lib-row">
      <button type="button" class="abl-preview" data-cue="preset:${n}" title="Preview without loading">▶</button>
      <button type="button" class="abl-lib" data-preset="${n}">${n}</button>
    </div>`).join('')}
    <div class="abl-browser-sec">Voice</div>
    ${voiceSamples.length
      ? voiceSamples.map((s) => `<button type="button" class="abl-lib" data-voice="${s.id}">${s.name}</button>`).join('')
      : '<p class="abl-muted">Speak or record a take — it lands here.</p>'}
  `;
  root.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (opts.applyPreset && pattern()) opts.applyPreset(pattern(), btn.dataset.preset);
      const seq = document.getElementById('sequencer');
      if (seq) seq.querySelectorAll('.seq-cell').forEach((cell) => {
        const p = pattern();
        const on = p.grid[cell.dataset.track][Number(cell.dataset.step)];
        cell.classList.toggle('on', !!on);
      });
      if (!playing) studioPlay();
    });
  });
  root.querySelectorAll('[data-cue]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const name = btn.dataset.cue.replace(/^preset:/, '');
      startPreview(snapFromPreset(name), btn.dataset.cue);
    });
  });
  root.querySelectorAll('[data-lib]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDetail(btn.dataset.lib === 'keys' ? 'keys' : 'drums');
    });
  });
  root.querySelectorAll('[data-voice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sample = voiceSamples.find((s) => s.id === btn.dataset.voice);
      if (!sample) return;
      const slot = clips[selectedScene] || clips[0];
      if (!slot) return;
      slot.buffer = sample.buffer;
      slot.name = sample.name;
      if (!playing) studioPlay();
      paintSession();
    });
  });
}

function paintDevices() {
  const root = document.getElementById('abl-chain');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  const knob = (id, label, min, max, step, val) =>
    `<label class="abl-dev-k">${label}<input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  const onBtn = (id, label) => {
    const on = fx.on[id] !== false;
    return `<header class="abl-dev-h">
      <button type="button" class="abl-dev-on${on ? ' on' : ''}" data-dev-on="${id}" aria-pressed="${on}" title="${label} on/off"></button>
      ${label}
    </header>`;
  };
  root.innerHTML = `
    <article class="abl-dev${fx.on.analog === false ? ' bypassed' : ''}" data-dev="analog">
      ${onBtn('analog', 'Analog')}
      <div class="abl-dev-body">
        ${knob('abl-osc', 'Sqr', 0, 1, 0.01, keysOsc)}
        ${knob('abl-det', 'Det', -50, 50, 1, keysDet)}
        ${knob('abl-cut', 'Cut', 200, 8000, 1, keysCutoff)}
        ${knob('abl-res', 'Res', 0.2, 18, 0.1, keysRes)}
        ${knob('abl-fenv', 'FEnv', 0, 1, 0.01, keysFenv)}
        ${knob('abl-gli', 'Gli', 0, 0.8, 0.01, keysGlide)}
        ${knob('abl-atk', 'Atk', 0.005, 0.8, 0.005, keysAtk)}
        ${knob('abl-dec', 'Dec', 0.01, 1.2, 0.01, keysDec)}
        ${knob('abl-sus', 'Sus', 0.05, 1, 0.01, keysSus)}
        ${knob('abl-rel', 'Rel', 0.05, 1.2, 0.01, keysRel)}
      </div>
    </article>
    <article class="abl-dev${fx.on.delay === false ? ' bypassed' : ''}" data-dev="delay">
      ${onBtn('delay', 'Delay')}
      <div class="abl-dev-body">
        ${knob('abl-send', 'Send', 0, 1, 0.01, fx.send)}
        ${knob('abl-delay', 'Time', 50, 900, 5, fx.delayMs)}
        ${knob('abl-fdbk', 'Fdbk', 0, 0.85, 0.01, fx.delayFb)}
        ${knob('abl-wet', 'Wet', 0, 1, 0.01, fx.delayWet)}
      </div>
    </article>
    <article class="abl-dev${fx.on.comp === false ? ' bypassed' : ''}" data-dev="comp">
      ${onBtn('comp', 'Compressor')}
      <div class="abl-dev-body">
        ${knob('abl-comp', 'Th', -40, -4, 1, fx.compTh)}
        ${knob('abl-ratio', 'Ratio', 1, 12, 0.1, fx.compRatio)}
      </div>
    </article>
    <article class="abl-dev${fx.on.eq3 === false ? ' bypassed' : ''}" data-dev="eq3">
      ${onBtn('eq3', 'EQ Three')}
      <div class="abl-dev-body">
        ${knob('abl-eq-l', 'Lo', -12, 12, 0.5, fx.eqL)}
        ${knob('abl-eq-m', 'Mid', -12, 12, 0.5, fx.eqM)}
        ${knob('abl-eq-h', 'Hi', -12, 12, 0.5, fx.eqH)}
        <div class="abl-eq-kills">
          <button type="button" id="abl-kill-l" class="${fx.killL ? 'on' : ''}" aria-pressed="${fx.killL}">K Lo</button>
          <button type="button" id="abl-kill-m" class="${fx.killM ? 'on' : ''}" aria-pressed="${fx.killM}">K Mid</button>
          <button type="button" id="abl-kill-h" class="${fx.killH ? 'on' : ''}" aria-pressed="${fx.killH}">K Hi</button>
        </div>
      </div>
    </article>
  `;
  const osc = root.querySelector('#abl-osc');
  const det = root.querySelector('#abl-det');
  const cut = root.querySelector('#abl-cut');
  const res = root.querySelector('#abl-res');
  const fenv = root.querySelector('#abl-fenv');
  const gli = root.querySelector('#abl-gli');
  const atk = root.querySelector('#abl-atk');
  const dec = root.querySelector('#abl-dec');
  const sus = root.querySelector('#abl-sus');
  const rel = root.querySelector('#abl-rel');
  const bindAnalog = (el, type, label, apply) => {
    if (!el) return;
    el.addEventListener('pointerdown', () => {
      if (!midiMapOn) return;
      midiLearn = { type };
      midiStatus(`Learn Analog ${label} — move a CC`);
      syncTransport();
    });
    el.addEventListener('input', () => {
      if (midiMapOn) return;
      apply(parseFloat(el.value));
    });
  };
  bindAnalog(osc, 'osc', 'Sqr', (v) => { keysOsc = v; applyKeysOsc(); });
  bindAnalog(det, 'det', 'Det', (v) => { keysDet = v; applyKeysDet(); });
  bindAnalog(cut, 'cut', 'Cut', (v) => { keysCutoff = v; applyKeysFilter(); });
  bindAnalog(res, 'res', 'Res', (v) => { keysRes = v; applyKeysFilter(); });
  bindAnalog(fenv, 'fenv', 'FEnv', (v) => { keysFenv = v; applyKeysFenv(); });
  bindAnalog(gli, 'gli', 'Gli', (v) => { keysGlide = v; });
  bindAnalog(atk, 'atk', 'Atk', (v) => { keysAtk = v; });
  bindAnalog(dec, 'dec', 'Dec', (v) => { keysDec = v; });
  bindAnalog(sus, 'sus', 'Sus', (v) => { keysSus = v; applyKeysEnv(); });
  bindAnalog(rel, 'rel', 'Rel', (v) => { keysRel = v; });
  const bindFx = (id, key, parse, label, min, max) => {
    const el = root.querySelector(id);
    if (!el) return;
    el.addEventListener('pointerdown', () => {
      if (!midiMapOn) return;
      midiLearn = { type: 'fx', key, el: el.id, min, max, label };
      midiStatus(`Learn ${label} — move a CC`);
      syncTransport();
    });
    el.addEventListener('input', () => {
      if (midiMapOn) return;
      fx[key] = parse(el.value);
      applyFx();
    });
  };
  bindFx('#abl-send', 'send', parseFloat, 'Delay Send', 0, 1);
  bindFx('#abl-delay', 'delayMs', parseFloat, 'Delay Time', 50, 900);
  bindFx('#abl-fdbk', 'delayFb', parseFloat, 'Delay Fdbk', 0, 0.85);
  bindFx('#abl-wet', 'delayWet', parseFloat, 'Delay Wet', 0, 1);
  bindFx('#abl-comp', 'compTh', parseFloat, 'Comp Th', -40, -4);
  bindFx('#abl-ratio', 'compRatio', parseFloat, 'Comp Ratio', 1, 12);
  bindFx('#abl-eq-l', 'eqL', parseFloat, 'EQ Lo', -12, 12);
  bindFx('#abl-eq-m', 'eqM', parseFloat, 'EQ Mid', -12, 12);
  bindFx('#abl-eq-h', 'eqH', parseFloat, 'EQ Hi', -12, 12);
  [['#abl-kill-l', 'killL'], ['#abl-kill-m', 'killM'], ['#abl-kill-h', 'killH']].forEach(([id, key]) => {
    const el = root.querySelector(id);
    if (!el) return;
    el.addEventListener('click', () => {
      fx[key] = !fx[key];
      el.classList.toggle('on', fx[key]);
      el.setAttribute('aria-pressed', fx[key] ? 'true' : 'false');
      applyFx();
    });
  });
  root.querySelectorAll('[data-dev-on]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.devOn;
      fx.on[id] = fx.on[id] === false;
      const on = fx.on[id] !== false;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const card = btn.closest('.abl-dev');
      if (card) card.classList.toggle('bypassed', !on);
      applyFx();
    });
  });
}

function setDetail(name) {
  detail = name;
  ['drums', 'keys', 'writer'].forEach((id) => {
    const el = document.getElementById(`abl-${id}`);
    if (el) el.hidden = id !== name;
  });
  document.querySelectorAll('[data-detail]').forEach((b) => {
    b.classList.toggle('active', b.dataset.detail === name);
  });
  if (name === 'keys') paintRoll();
}

function syncTransport() {
  const play = document.getElementById('abl-play');
  const rec = document.getElementById('abl-rec');
  const metro = document.getElementById('abl-metro');
  if (play) play.textContent = playing ? 'Stop' : 'Play';
  if (play) play.classList.toggle('playing', playing);
  if (rec) rec.classList.toggle('on', recOn);
  if (metro) metro.classList.toggle('on', metroOn);
  const mapBtn = document.getElementById('abl-midi-map');
  if (mapBtn) {
    mapBtn.classList.toggle('on', midiMapOn);
    mapBtn.textContent = midiMapOn ? (midiLearn ? 'Move a CC…' : 'MIDI Map on') : 'MIDI Map';
  }
  const bpmEl = document.getElementById('abl-bpm');
  if (bpmEl && document.activeElement !== bpmEl) bpmEl.value = String(bpm());
}

function paintTransport() {
  const root = document.getElementById('abl-transport');
  if (!root || root._built) {
    syncTransport();
    return;
  }
  root._built = true;
  root.innerHTML = `
    <button type="button" class="abl-play" id="abl-play">Play</button>
    <button type="button" class="abl-rec" id="abl-rec" title="Record notes from the keyboard into the piano roll">Rec</button>
    <button type="button" id="abl-metro" title="Metronome">Click</button>
    <span class="abl-pos" id="abl-pos">1.1.1</span>
    <label class="abl-bpm-wrap">BPM <input id="abl-bpm" type="number" min="40" max="240" value="${bpm()}"></label>
    <button type="button" id="abl-tap">Tap</button>
    <label>Q
      <select id="abl-q" title="Global launch quantize — clips wait for this grid">
        <option value="1"${quantize === 1 ? ' selected' : ''}>1 bar</option>
        <option value="0.5"${quantize === 0.5 ? ' selected' : ''}>1/2</option>
        <option value="0.25"${quantize === 0.25 ? ' selected' : ''}>1/4</option>
        <option value="0.125"${quantize === 0.125 ? ' selected' : ''}>1/8</option>
        <option value="0.0625"${quantize === 0.0625 ? ' selected' : ''}>1/16</option>
        <option value="0"${quantize === 0 ? ' selected' : ''}>none</option>
      </select>
    </label>
    <span class="abl-spacer"></span>
    <button type="button" id="abl-midi-map" title="MIDI Map — click a fader, then move a CC">MIDI Map</button>
    <span class="abl-midi" id="abl-midi" aria-live="polite"></span>
    <button type="button" id="abl-bounce" title="Render the loop to a WAV — production itself is live">Bounce</button>
  `;
  root.querySelector('#abl-play').addEventListener('click', togglePlay);
  root.querySelector('#abl-rec').addEventListener('click', () => {
    recOn = !recOn;
    if (recOn && !playing) studioPlay();
    if (prodView !== 'arrange') setDetail('keys');
    syncTransport();
  });
  root.querySelector('#abl-metro').addEventListener('click', () => { metroOn = !metroOn; syncTransport(); });
  root.querySelector('#abl-bpm').addEventListener('change', (e) => {
    const n = Math.round(Number(e.target.value) || 96);
    if (opts.setBpm) opts.setBpm(n);
    const p = pattern();
    if (p) p.bpm = n;
  });
  let taps = [];
  root.querySelector('#abl-tap').addEventListener('click', () => {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
    taps.push(now);
    if (taps.length >= 2) {
      const avg = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
      if (opts.setBpm) opts.setBpm(Math.round(60000 / avg));
      const p = pattern();
      if (p) p.bpm = Math.round(60000 / avg);
      syncTransport();
    }
  });
  root.querySelector('#abl-q').addEventListener('change', (e) => {
    quantize = parseFloat(e.target.value) || 0;
    midiStatus(quantize ? `Q ${e.target.options[e.target.selectedIndex].text}` : 'Q none — instant launch');
  });
  root.querySelector('#abl-midi-map').addEventListener('click', () => {
    midiMapOn = !midiMapOn;
    midiLearn = null;
    syncTransport();
    paintMixer();
  });
  root.querySelector('#abl-bounce').addEventListener('click', bounce);
}

async function bounce() {
  const a = audio();
  ensureMix();
  if (a && a.ctx && mix.master && typeof MediaRecorder !== 'undefined') {
    if (window.__ablBounce && window.__ablBounce.state === 'recording') {
      window.__ablBounce.stop();
      return;
    }
    const dest = a.ctx.createMediaStreamDestination();
    mix.master.analyser.connect(dest);
    const rec = new MediaRecorder(dest.stream);
    window.__ablBounce = rec;
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      window.__ablBounce = null;
      try { mix.master.analyser.disconnect(dest); } catch (_) {}
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      if (!blob.size) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `the-voice-${bpm()}bpm.webm`;
      link.click();
      const btn = document.getElementById('abl-bounce');
      if (btn) btn.textContent = 'Bounce';
    };
    if (!playing) studioPlay();
    rec.start();
    const btn = document.getElementById('abl-bounce');
    if (btn) btn.textContent = 'Stop bounce';
    const ms = (60 / bpm()) * 4 * 8 * 1000;
    setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, Math.max(2000, Math.min(ms, 60000)));
    return;
  }
  if (!opts.renderPattern || !opts.encodeWav16 || !pattern()) return;
  const samples = opts.renderPattern(pattern(), 44100, 2);
  const blob = opts.encodeWav16(samples, 44100);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `the-voice-${bpm()}bpm.wav`;
  link.click();
}

function playPhase01() {
  if (!playing) return 0;
  const a = audio();
  if (!a) return 0;
  const sd = stepDur() || 0.001;
  const until = Math.max(0, nextTime - a.ctx.currentTime);
  const into = 1 - Math.min(1, until / sd);
  const st = (step + ROLL_STEPS - 1) % ROLL_STEPS;
  return Math.max(0, Math.min(1, ((st % 16) + into) / 16));
}

function playhead01() {
  if (!playing) return (step % ROLL_STEPS) / ROLL_STEPS;
  const a = audio();
  if (!a) return 0;
  const sd = stepDur() || 0.001;
  const until = Math.max(0, nextTime - a.ctx.currentTime);
  const into = 1 - Math.min(1, until / sd);
  const st = (step + ROLL_STEPS - 1) % ROLL_STEPS;
  return Math.max(0, Math.min(1, (st + into) / ROLL_STEPS));
}

let metersOn = false;
function produceOnScreen() {
  if (document.hidden) return false;
  const m = document.getElementById('music-view');
  const live = document.getElementById('daw-live');
  return !!(m && !m.hidden && (!live || live.hidden));
}
function tickMeters() {
  if (!produceOnScreen()) {
    metersOn = false;
    return;
  }
  meterLoop();
  const clipP = playPhase01();
  document.querySelectorAll('.abl-slot.playing').forEach((el) => {
    el.style.setProperty('--ph', String(clipP));
  });
  const ph = document.getElementById('abl-playhead');
  if (ph) ph.style.left = `${playhead01() * 100}%`;
  metersOn = requestAnimationFrame(tickMeters);
}
function kickMeters() {
  if (!metersOn) tickMeters();
}

export function studioMidi(cmd, d1, d2) {
  const vel = (d2 || 0) / 127;
  if (cmd === 0xb0) {
    if (midiMapOn && midiLearn) {
      midiMap[`cc:${d1}`] = { ...midiLearn };
      saveMidiMap();
      midiStatus(`CC ${d1} → ${midiLearn.label || `${midiLearn.type} ${midiLearn.id || midiLearn.key || ''}`.trim()}`);
      midiLearn = null;
      midiMapOn = false;
      syncTransport();
      paintMixer();
      applyMidiTarget(midiMap[`cc:${d1}`], vel);
      return;
    }
    const target = midiMap[`cc:${d1}`];
    if (target) applyMidiTarget(target, vel);
    else midiStatus(`CC ${d1}`);
    return;
  }
  if (cmd === 0x90 && d2 > 0) {
    studioNoteOn(d1, vel);
    midiStatus(`Note ${d1}`);
    return;
  }
  if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) {
    studioNoteOff(d1);
  }
}

function applyMidiTarget(target, vel) {
  if (!target) return;
  ensureMix();
  const a = audio();
  if (!a) return;
  if (target.type === 'vol') {
    const m = mix[target.id];
    if (!m) return;
    m.level = vel * 1.4;
    m.vol.gain.setTargetAtTime(m.level, a.ctx.currentTime, 0.02);
    const el = document.querySelector(`[data-vol="${target.id}"]`);
    if (el) el.value = String(m.level);
  } else if (target.type === 'pan') {
    const m = mix[target.id];
    if (!m || !m.pan) return;
    m.panVal = vel * 2 - 1;
    m.pan.pan.setTargetAtTime(m.panVal, a.ctx.currentTime, 0.02);
    const el = document.querySelector(`[data-pan="${target.id}"]`);
    if (el) el.value = String(m.panVal);
  } else if (target.type === 'send') {
    const m = mix[target.id];
    if (!m) return;
    m.sendVal = vel;
    applySend(target.id);
    const el = document.querySelector(`[data-send="${target.id}"]`);
    if (el) el.value = String(m.sendVal);
  } else if (target.type === 'osc') {
    keysOsc = vel;
    applyKeysOsc();
    const el = document.getElementById('abl-osc');
    if (el) el.value = String(keysOsc);
  } else if (target.type === 'det') {
    keysDet = -50 + vel * 100;
    applyKeysDet();
    const el = document.getElementById('abl-det');
    if (el) el.value = String(keysDet);
  } else if (target.type === 'cut') {
    keysCutoff = 200 + vel * 7800;
    applyKeysFilter();
    const el = document.getElementById('abl-cut');
    if (el) el.value = String(keysCutoff);
  } else if (target.type === 'res') {
    keysRes = 0.2 + vel * 17.8;
    applyKeysFilter();
    const el = document.getElementById('abl-res');
    if (el) el.value = String(keysRes);
  } else if (target.type === 'fenv') {
    keysFenv = vel;
    applyKeysFenv();
    const el = document.getElementById('abl-fenv');
    if (el) el.value = String(keysFenv);
  } else if (target.type === 'gli') {
    keysGlide = vel * 0.8;
    const el = document.getElementById('abl-gli');
    if (el) el.value = String(keysGlide);
  } else if (target.type === 'atk') {
    keysAtk = 0.005 + vel * 0.795;
    const el = document.getElementById('abl-atk');
    if (el) el.value = String(keysAtk);
  } else if (target.type === 'dec') {
    keysDec = 0.01 + vel * 1.19;
    const el = document.getElementById('abl-dec');
    if (el) el.value = String(keysDec);
  } else if (target.type === 'sus') {
    keysSus = 0.05 + vel * 0.95;
    applyKeysEnv();
    const el = document.getElementById('abl-sus');
    if (el) el.value = String(keysSus);
  } else if (target.type === 'rel') {
    keysRel = 0.05 + vel * 1.15;
    const el = document.getElementById('abl-rel');
    if (el) el.value = String(keysRel);
  } else if (target.type === 'fx' && target.key) {
    const min = Number(target.min);
    const max = Number(target.max);
    const lo = Number.isFinite(min) ? min : 0;
    const hi = Number.isFinite(max) ? max : 1;
    fx[target.key] = lo + vel * (hi - lo);
    applyFx();
    const el = document.getElementById(target.el);
    if (el) el.value = String(fx[target.key]);
  }
}

function recBegin(pitch, vel) {
  if (!recOn || !playing) return null;
  const a = audio();
  const n = {
    pitch,
    start: step % ROLL_STEPS,
    length: 1,
    vel: Math.max(1, Math.round((vel || 0.85) * 127)),
    recT0: a ? a.ctx.currentTime : 0,
  };
  notes.push(n);
  paintRoll();
  return n;
}

function recGrow(n) {
  if (!n || n.recT0 == null) return;
  const a = audio();
  if (!a) return;
  const sixteenths = Math.max(1, Math.round((a.ctx.currentTime - n.recT0) / stepDur()));
  n.length = Math.max(1, Math.min(ROLL_STEPS, sixteenths));
}

function recEnd(n) {
  if (!n) return;
  recGrow(n);
  delete n.recT0;
  paintRoll();
}

function growRecNotes() {
  let dirty = false;
  notes.forEach((n) => {
    if (n.recT0 == null) return;
    const prev = n.length;
    recGrow(n);
    if (n.length !== prev) dirty = true;
  });
  if (dirty && detail === 'keys') paintRoll();
}

function studioNoteOn(pitch, vel) {
  ensureMix();
  const a = audio();
  if (!a || !mix.keys) return;
  studioNoteOff(pitch);
  const t = a.ctx.currentTime;
  const freq = 440 * Math.pow(2, (pitch - 69) / 12);
  const o1 = a.ctx.createOscillator();
  const o2 = a.ctx.createOscillator();
  o1.type = 'sawtooth';
  o2.type = 'square';
  glideOsc(o1, o2, freq, t);
  const atk = Math.max(0.005, keysAtk);
  const dec = Math.max(0.01, keysDec);
  const f = a.ctx.createBiquadFilter();
  f.type = 'lowpass';
  const cut = Math.max(80, keysCutoff);
  f.frequency.setValueAtTime(cut, t);
  f.frequency.exponentialRampToValueAtTime(filterEnvEnd(cut), t + atk + dec);
  f.Q.value = keysRes;
  const g = a.ctx.createGain();
  const v = Math.max(0.001, vel * 0.28);
  g.gain.setValueAtTime(0.0008, t);
  g.gain.exponentialRampToValueAtTime(v, t + atk);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0008, v * keysSus), t + atk + dec);
  const { saw, sqr } = oscMixGains();
  const gSaw = a.ctx.createGain();
  const gSqr = a.ctx.createGain();
  gSaw.gain.value = saw;
  gSqr.gain.value = sqr;
  o1.connect(gSaw); o2.connect(gSqr);
  gSaw.connect(f); gSqr.connect(f); f.connect(g); g.connect(mix.keys.input);
  o1.start(t); o2.start(t);
  const rec = recBegin(pitch, vel);
  midiHeld.set(pitch, { o1, o2, g, gSaw, gSqr, peak: v, rec, freq, f, cut });
}

function studioNoteOff(pitch) {
  const h = midiHeld.get(pitch);
  if (!h) return;
  const a = audio();
  const t = a ? a.ctx.currentTime : 0;
  const rel = Math.max(0.03, keysRel);
  try {
    h.g.gain.cancelScheduledValues(t);
    h.g.gain.setTargetAtTime(0.0008, t, rel / 3);
    h.o1.stop(t + rel + 0.05);
    h.o2.stop(t + rel + 0.05);
  } catch (_) {}
  if (h.rec) recEnd(h.rec);
  midiHeld.delete(pitch);
}

export function initStudio(options, audioGetter) {
  opts = options || {};
  getAudio = audioGetter;
  paintTransport();
  paintBrowser();
  paintSession();
  paintMixer();
  paintPads();
  paintDevices();
  bindRoll();
  bindKeys();
  paintRoll();
  document.querySelectorAll('[data-detail]').forEach((btn) => {
    btn.addEventListener('click', () => setDetail(btn.dataset.detail));
  });
  const swingEl = document.getElementById('music-swing');
  if (swingEl) {
    swing = parseFloat(swingEl.value) || 0;
    swingEl.addEventListener('input', () => { swing = parseFloat(swingEl.value) || 0; });
  }
  if (!metersOn) tickMeters();
  bindVoiceBus();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kickMeters(); });
}

export function showStudio() {
  paintSession();
  paintMixer();
  paintBrowser();
  paintPads();
  paintDevices();
  paintRoll();
  if (prodView === 'arrange') paintArrange();
  syncTransport();
  kickMeters();
}

export function studioPlaying() {
  return playing;
}

export async function addVoiceClip({ name, blob, buffer }) {
  const a = audio();
  let buf = buffer;
  if (!buf && blob && a && a.ctx) {
    try {
      const raw = await blob.arrayBuffer();
      buf = await a.ctx.decodeAudioData(raw.slice(0));
    } catch (err) {
      console.warn('voice clip decode failed', err);
      return null;
    }
  }
  if (!buf) return null;
  const sample = {
    id: `v${Date.now().toString(36)}`,
    name: name || 'Voice',
    buffer: buf,
    duration: buf.duration,
  };
  voiceSamples.unshift(sample);
  if (voiceSamples.length > 24) voiceSamples.length = 24;
  const slot = clips[selectedScene] || clips[0];
  if (slot && !slot.buffer) {
    slot.buffer = buf;
    slot.name = slot.name || sample.name;
    slot.origBpm = detectBpm(buf);
    slot.warpMode = 'free';
    slot.gain = 1;
  }
  paintBrowser();
  paintSession();
  return sample;
}

export function listVoiceSamples() {
  return voiceSamples.slice();
}

let voiceBusBound = false;
function bindVoiceBus() {
  if (voiceBusBound) return;
  voiceBusBound = true;
  onVoice('clip', (clip) => {
    if (!clip || !clip.blob) return;
    addVoiceClip({
      name: (clip.voiceLabel || clip.engine || 'Voice').toString().slice(0, 28),
      blob: clip.blob,
    }).catch(() => {});
  });
}
