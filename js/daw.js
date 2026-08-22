import { initStudio, showStudio, studioPlay, studioStop, setProdView, addVoiceClip, studioMidi } from './daw-studio.js';
// The Voice DAW — Produce (session clips) + DJ Live (rekordbox-class decks).
// Web Audio actually sounds. MIDI / audio interfaces are detected live.
// Does not touch Animate. Existing sequencer in Music stays intact.

const CLIP_COLORS = ['#3fc6ff', '#ffb238', '#7dff9a', '#ff6b8a', '#c084fc', '#f0abfc', '#67e8f9', '#fbbf24'];
const SCENES = 8;
const SESSION_TRACKS = 4;
const HOT_CUES = 8;
const LOOP_BEATS = [0.25, 0.5, 1, 2, 4, 8, 16];

let opts = {};
let mode = 'produce';
let ctx = null;
let master = null;
let cueGain = null;
let recDest = null;
let recorder = null;
let recChunks = [];
let midiAccess = null;

const session = {
  clips: [],
  playing: new Map(),
  quantize: 1,
  launched: new Set(),
};

function emptyClip(track, scene) {
  return {
    id: `${track}-${scene}`,
    track,
    scene,
    name: '',
    color: CLIP_COLORS[track % CLIP_COLORS.length],
    buffer: null,
    duration: 0,
    looping: true,
    gain: 1,
  };
}

function ensureSession() {
  if (session.clips.length) return;
  for (let t = 0; t < SESSION_TRACKS; t++) {
    for (let s = 0; s < SCENES; s++) session.clips.push(emptyClip(t, s));
  }
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    cueGain = ctx.createGain();
    cueGain.gain.value = 0;
    recDest = ctx.createMediaStreamDestination();
    master.connect(ctx.destination);
    master.connect(recDest);
    cueGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function dbToGain(db) {
  if (db <= -72) return 0;
  return Math.pow(10, db / 20);
}

function equalPower(x) {
  const a = Math.max(0, Math.min(1, x));
  return { a: Math.cos(a * Math.PI / 2), b: Math.sin(a * Math.PI / 2) };
}

function nextQuantizedTime(beats) {
  ensureCtx();
  const bpm = currentBpm();
  const spb = 60 / bpm;
  const now = ctx.currentTime;
  if (!beats) return now;
  const grid = spb * beats;
  return Math.ceil((now + 0.02) / grid) * grid;
}

function currentBpm() {
  if (opts.getBpm) return Math.max(40, Math.min(240, Number(opts.getBpm()) || 120));
  return 120;
}

function setBpm(n) {
  n = Math.round(Math.max(40, Math.min(240, n)));
  if (opts.setBpm) opts.setBpm(n);
  const el = document.getElementById('daw-bpm');
  if (el) el.value = String(n);
  const lab = document.getElementById('daw-bpm-val');
  if (lab) lab.textContent = `${n} BPM`;
}

export function setDawMode(next) {
  mode = next === 'dj' ? 'dj' : 'produce';
  const produce = document.getElementById('daw-produce');
  const live = document.getElementById('daw-live');
  if (produce) produce.hidden = mode !== 'produce';
  if (live) live.hidden = mode !== 'dj';
  document.querySelectorAll('[data-daw-mode]').forEach((btn) => {
    const on = btn.dataset.dawMode === mode;
    btn.classList.toggle('active', on);
    if (btn.getAttribute('role') === 'tab') btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  if (mode === 'dj') {
    document.querySelectorAll('[data-prod-view]').forEach((btn) => {
      btn.classList.remove('active');
      if (btn.getAttribute('role') === 'tab') btn.setAttribute('aria-selected', 'false');
    });
  }
  const music = document.getElementById('music-view');
  if (music) music.classList.toggle('is-dj', mode === 'dj');
  if (mode === 'dj') paintDecks();
  else showStudio();
}

function floatToBuffer(samples, sr) {
  ensureCtx();
  const buf = ctx.createBuffer(1, samples.length, sr || ctx.sampleRate);
  buf.copyToChannel(samples, 0);
  return buf;
}

function stopClip(track) {
  const node = session.playing.get(track);
  if (!node) return;
  try { node.stop(); } catch (_) {}
  session.playing.delete(track);
  session.launched.delete(track);
}

function launchClip(clip, when) {
  if (!clip || !clip.buffer) return;
  ensureCtx();
  stopClip(clip.track);
  const src = ctx.createBufferSource();
  src.buffer = clip.buffer;
  src.loop = clip.looping;
  const g = ctx.createGain();
  g.gain.value = clip.gain;
  src.connect(g);
  g.connect(master);
  src.start(when || ctx.currentTime);
  src.onended = () => {
    if (session.playing.get(clip.track) === src) session.playing.delete(clip.track);
  };
  session.playing.set(clip.track, src);
  session.launched.add(clip.id);
  paintSession();
}

function launchScene(scene) {
  const when = nextQuantizedTime(session.quantize);
  for (let t = 0; t < SESSION_TRACKS; t++) {
    const clip = session.clips.find((c) => c.track === t && c.scene === scene);
    if (clip && clip.buffer) launchClip(clip, when);
    else stopClip(t);
  }
}

function captureCurrentPatternInto(clip) {
  if (!opts.renderPattern || !opts.getPattern) return false;
  const pattern = opts.getPattern();
  const audio = opts.renderPattern(pattern, 44100, 1);
  clip.buffer = floatToBuffer(audio, 44100);
  clip.duration = audio.length / 44100;
  clip.name = clip.name || `${Math.round(pattern.bpm)}bpm`;
  return true;
}

function paintSession() {
  const root = document.getElementById('daw-session');
  if (!root) return;
  ensureSession();
  const trackNames = ['Drum', 'Bass', 'Music', 'Voice'];
  let html = '<div class="daw-session-bar">';
  html += `<span class="daw-kicker">Session</span>`;
  html += `<label>Quantize <select id="daw-q">`;
  for (const q of [0, 0.25, 0.5, 1, 2, 4]) {
    html += `<option value="${q}"${session.quantize === q ? ' selected' : ''}>${q ? q + ' beat' : 'none'}</option>`;
  }
  html += `</select></label>`;
  html += `<button type="button" class="btn" id="daw-stop-clips">Stop clips</button>`;
  html += `<span class="hint hint-info">Click a clip to launch. Right-click / long-press to capture the current beat into that slot. Scene buttons fire the whole row.</span>`;
  html += '</div><div class="daw-grid">';
  html += '<div class="daw-grid-corner"></div>';
  for (let t = 0; t < SESSION_TRACKS; t++) {
    html += `<div class="daw-col-h">${trackNames[t]}</div>`;
  }
  for (let s = 0; s < SCENES; s++) {
    html += `<button type="button" class="daw-scene" data-scene="${s}">${s + 1}</button>`;
    for (let t = 0; t < SESSION_TRACKS; t++) {
      const clip = session.clips.find((c) => c.track === t && c.scene === s);
      const on = clip && session.playing.get(t) && session.launched.has(clip.id);
      const filled = clip && clip.buffer;
      html += `<button type="button" class="daw-clip${filled ? ' filled' : ''}${on ? ' playing' : ''}" data-track="${t}" data-scene="${s}" style="--clip:${clip.color}">${filled ? (clip.name || 'CLIP') : '+'}</button>`;
    }
  }
  html += '</div>';
  root.innerHTML = html;
  root.querySelector('#daw-q').addEventListener('change', (e) => {
    session.quantize = parseFloat(e.target.value) || 0;
  });
  root.querySelector('#daw-stop-clips').addEventListener('click', () => {
    for (let t = 0; t < SESSION_TRACKS; t++) stopClip(t);
    paintSession();
  });
  root.querySelectorAll('.daw-scene').forEach((btn) => {
    btn.addEventListener('click', () => launchScene(Number(btn.dataset.scene)));
  });
  root.querySelectorAll('.daw-clip').forEach((btn) => {
    const t = Number(btn.dataset.track);
    const s = Number(btn.dataset.scene);
    const clip = session.clips.find((c) => c.track === t && c.scene === s);
    btn.addEventListener('click', () => {
      if (!clip.buffer) {
        if (captureCurrentPatternInto(clip)) paintSession();
        return;
      }
      if (session.launched.has(clip.id) && session.playing.has(t)) {
        stopClip(t);
        paintSession();
        return;
      }
      launchClip(clip, nextQuantizedTime(session.quantize));
    });
    btn.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (captureCurrentPatternInto(clip)) paintSession();
    });
  });
}

/* ---------------- DJ decks ---------------- */

function makeDeck(id) {
  return {
    id,
    name: id === 'a' ? 'DECK A' : 'DECK B',
    buf: null,
    fileName: '',
    duration: 0,
    bpm: 0,
    origBpm: 0,
    rate: 1,
    playing: false,
    cueAt: 0,
    off: 0,
    t0: 0,
    loopOn: false,
    loopStart: 0,
    loopEnd: 0,
    loopBeats: 4,
    cues: new Array(HOT_CUES).fill(null),
    eq: { low: 0, mid: 0, high: 0 },
    kill: { low: false, mid: false, high: false },
    filter: 0.5,
    gain: 0.85,
    cue: false,
    sync: false,
    slip: false,
    keylock: true,
    src: null,
    nodes: null,
    wave: null,
  };
}

const decks = { a: makeDeck('a'), b: makeDeck('b') };
let xfader = 0.5;
let deckPaint = 0;

function buildDeckGraph(deck) {
  ensureCtx();
  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 220;
  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1000;
  mid.Q.value = 0.7;
  const high = ctx.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 3200;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 18000;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.value = deck.gain;
  const cue = ctx.createGain();
  cue.gain.value = 0;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  low.connect(mid);
  mid.connect(high);
  high.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  gain.connect(analyser);
  filter.connect(cue);
  cue.connect(cueGain);
  deck.nodes = { in: low, low, mid, high, filter, gain, cue, analyser };
  applyDeckEq(deck);
  applyXfade();
}

function applyDeckEq(d) {
  if (!d.nodes) return;
  d.nodes.low.gain.value = d.kill.low ? -72 : d.eq.low;
  d.nodes.mid.gain.value = d.kill.mid ? -72 : d.eq.mid;
  d.nodes.high.gain.value = d.kill.high ? -72 : d.eq.high;
  const f = d.filter;
  if (f < 0.48) {
    d.nodes.filter.type = 'lowpass';
    d.nodes.filter.frequency.value = 200 + Math.pow(f / 0.48, 2) * 16000;
  } else if (f > 0.52) {
    d.nodes.filter.type = 'highpass';
    d.nodes.filter.frequency.value = 40 + Math.pow((f - 0.52) / 0.48, 2) * 8000;
  } else {
    d.nodes.filter.type = 'lowpass';
    d.nodes.filter.frequency.value = 18000;
  }
}

function applyXfade() {
  const { a, b } = equalPower(xfader);
  if (decks.a.nodes) decks.a.nodes.gain.gain.setTargetAtTime(decks.a.gain * a, ctx ? ctx.currentTime : 0, 0.02);
  if (decks.b.nodes) decks.b.nodes.gain.gain.setTargetAtTime(decks.b.gain * b, ctx ? ctx.currentTime : 0, 0.02);
}

function deckNow(d) {
  if (!d.playing || !ctx) return d.cueAt;
  const elapsed = (ctx.currentTime - d.t0) * (d.rate || 1);
  let t = d.off + elapsed;
  if (d.loopOn && d.loopEnd > d.loopStart) {
    const len = d.loopEnd - d.loopStart;
    if (t >= d.loopEnd && len > 0) t = d.loopStart + ((t - d.loopStart) % len);
  }
  if (d.buf) t = Math.max(0, Math.min(d.buf.duration - 0.001, t));
  return t;
}

function stopDeckAudio(d) {
  if (d.src) {
    try { d.src.stop(); } catch (_) {}
    try { d.src.disconnect(); } catch (_) {}
    d.src = null;
  }
}

function startDeckAt(d, time) {
  ensureCtx();
  if (!d.buf) return;
  if (!d.nodes) buildDeckGraph(d);
  stopDeckAudio(d);
  const src = ctx.createBufferSource();
  src.buffer = d.buf;
  src.playbackRate.value = d.rate || 1;
  if (d.loopOn && d.loopEnd > d.loopStart) {
    src.loop = true;
    src.loopStart = d.loopStart;
    src.loopEnd = d.loopEnd;
  }
  src.connect(d.nodes.in);
  const off = Math.max(0, Math.min(d.buf.duration - 0.01, time));
  src.start(0, off);
  src.onended = () => {
    if (d.src !== src) return;
    d.playing = false;
    d.cueAt = d.buf.duration;
    d.src = null;
  };
  d.src = src;
  d.t0 = ctx.currentTime;
  d.off = off;
  d.cueAt = off;
  d.playing = true;
}

function pauseDeck(d) {
  d.cueAt = deckNow(d);
  d.playing = false;
  stopDeckAudio(d);
}

function togglePlay(d) {
  ensureCtx();
  if (!d.buf) return;
  if (d.playing) pauseDeck(d);
  else startDeckAt(d, d.cueAt);
}

function cueDeck(d) {
  if (d.playing) {
    pauseDeck(d);
    d.cueAt = d.cues[0] != null ? d.cues[0] : 0;
    return;
  }
  startDeckAt(d, d.cues[0] != null ? d.cues[0] : d.cueAt);
}

function jumpCue(d, i) {
  const t = d.cues[i];
  if (t == null) {
    d.cues[i] = deckNow(d);
    paintDecks();
    return;
  }
  if (d.playing) startDeckAt(d, t);
  else d.cueAt = t;
}

function clearCue(d, i) {
  d.cues[i] = null;
  paintDecks();
}

function detectBpm(buf) {
  const ch = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const hop = Math.floor(sr / 200);
  const env = [];
  for (let i = 0; i < ch.length; i += hop) {
    let sum = 0;
    const end = Math.min(ch.length, i + hop);
    for (let j = i; j < end; j++) sum += ch[j] * ch[j];
    env.push(Math.sqrt(sum / (end - i)));
  }
  for (let i = env.length - 1; i > 0; i--) env[i] = Math.max(0, env[i] - env[i - 1]);
  const minB = 70;
  const maxB = 180;
  const minLag = Math.round((60 / maxB) * 200);
  const maxLag = Math.round((60 / minB) * 200);
  let best = 0;
  let bestLag = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < env.length - lag; i++) corr += env[i] * env[i + lag];
    if (corr > best) {
      best = corr;
      bestLag = lag;
    }
  }
  let bpm = 60 / (bestLag / 200);
  if (bpm < 80) bpm *= 2;
  if (bpm > 160) bpm /= 2;
  return Math.round(bpm);
}

function drawWave(canvas, buf, playhead, cues, loopStart, loopEnd) {
  if (!canvas || !buf) return;
  const w = canvas.width = canvas.clientWidth || 320;
  const h = canvas.height = 64;
  const g = canvas.getContext('2d');
  const ch = buf.getChannelData(0);
  const step = Math.max(1, Math.floor(ch.length / w));
  g.clearRect(0, 0, w, h);
  for (let x = 0; x < w; x++) {
    let lo = 1;
    let hi = -1;
    let eLow = 0;
    let eHigh = 0;
    const start = x * step;
    for (let i = 0; i < step; i++) {
      const v = ch[start + i] || 0;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
      const abs = Math.abs(v);
      if (i % 4 === 0) eLow += abs;
      else eHigh += abs;
    }
    const mid = h / 2;
    const energy = (eHigh + 0.001) / (eLow + eHigh + 0.001);
    g.fillStyle = energy > 0.55 ? '#3fc6ff' : energy > 0.35 ? '#7dff9a' : '#ffb238';
    const top = mid - hi * mid;
    const bot = mid - lo * mid;
    g.fillRect(x, top, 1, Math.max(1, bot - top));
  }
  if (loopEnd > loopStart) {
    g.fillStyle = 'rgba(63,198,255,0.12)';
    g.fillRect((loopStart / buf.duration) * w, 0, ((loopEnd - loopStart) / buf.duration) * w, h);
  }
  cues.forEach((t, i) => {
    if (t == null) return;
    const x = (t / buf.duration) * w;
    g.fillStyle = CLIP_COLORS[i % CLIP_COLORS.length];
    g.fillRect(x, 0, 2, h);
  });
  if (playhead != null) {
    g.fillStyle = '#fff';
    g.fillRect((playhead / buf.duration) * w, 0, 2, h);
  }
}

function setLoop(d, beats) {
  if (!d.buf) return;
  const bpm = d.bpm || currentBpm();
  const dur = (60 / bpm) * beats;
  const at = deckNow(d);
  d.loopStart = at;
  d.loopEnd = Math.min(d.buf.duration, at + dur);
  d.loopBeats = beats;
  d.loopOn = true;
  if (d.playing) startDeckAt(d, at);
}

function syncToOther(d) {
  const other = d.id === 'a' ? decks.b : decks.a;
  const target = other.bpm || currentBpm();
  if (!d.origBpm) return;
  d.rate = target / d.origBpm;
  d.bpm = target;
  d.sync = true;
  if (d.src) d.src.playbackRate.value = d.rate;
  setBpm(target);
}

async function loadFileIntoDeck(d, file) {
  ensureCtx();
  const arr = await file.arrayBuffer();
  const buf = await ctx.decodeAudioData(arr.slice(0));
  d.buf = buf;
  d.fileName = file.name;
  d.duration = buf.duration;
  d.origBpm = detectBpm(buf);
  d.bpm = d.origBpm;
  d.rate = 1;
  d.cueAt = 0;
  d.off = 0;
  d.playing = false;
  d.cues = new Array(HOT_CUES).fill(null);
  d.loopOn = false;
  stopDeckAudio(d);
  if (!d.nodes) buildDeckGraph(d);
  paintDecks();
}

async function loadBeatIntoDeck(d) {
  if (!opts.renderPattern || !opts.getPattern) return;
  ensureCtx();
  const pattern = opts.getPattern();
  const samples = opts.renderPattern(pattern, 44100, 4);
  const buf = floatToBuffer(samples, 44100);
  d.buf = buf;
  d.fileName = `pattern ${pattern.bpm}bpm`;
  d.duration = buf.duration;
  d.origBpm = pattern.bpm;
  d.bpm = pattern.bpm;
  d.rate = 1;
  d.cueAt = 0;
  d.playing = false;
  stopDeckAudio(d);
  if (!d.nodes) buildDeckGraph(d);
  paintDecks();
}

function fmtTime(s) {
  if (!Number.isFinite(s)) return '0:00.0';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toFixed(1).padStart(4, '0')}`;
}

function deckHtml(d) {
  const cues = d.cues.map((t, i) =>
    `<button type="button" class="dj-cue${t != null ? ' set' : ''}" data-deck="${d.id}" data-cue="${i}">${i + 1}</button>`
  ).join('');
  const loops = LOOP_BEATS.map((b) =>
    `<button type="button" class="dj-loop${d.loopOn && d.loopBeats === b ? ' on' : ''}" data-deck="${d.id}" data-loop="${b}">${b}</button>`
  ).join('');
  return `
  <section class="dj-deck" data-deck="${d.id}">
    <header class="dj-deck-h">
      <span class="dj-name">${d.name}</span>
      <span class="dj-file">${d.fileName || 'No track loaded'}</span>
      <span class="dj-bpm">${d.bpm ? d.bpm + ' BPM' : '— BPM'}</span>
    </header>
    <canvas class="dj-wave" data-wave="${d.id}"></canvas>
    <div class="dj-times">
      <span class="dj-now" data-now="${d.id}">${fmtTime(deckNow(d))}</span>
      <span class="dj-bpm-lg">${d.bpm ? d.bpm.toFixed(1) : '—.—'}</span>
      <span data-remain="${d.id}">${d.buf ? fmtTime(Math.max(0, d.duration - deckNow(d))) : '0:00.0'}</span>
    </div>
    <div class="dj-transport">
      <button type="button" class="dj-play" data-act="play" data-deck="${d.id}">${d.playing ? '❚❚' : '▶'}</button>
      <button type="button" class="btn" data-act="cue" data-deck="${d.id}">CUE</button>
      <button type="button" class="btn${d.sync ? ' on' : ''}" data-act="sync" data-deck="${d.id}">SYNC</button>
      <button type="button" class="btn${d.cue ? ' on' : ''}" data-act="pfl" data-deck="${d.id}">PFL</button>
      <button type="button" class="btn" data-act="load" data-deck="${d.id}">Load</button>
      <button type="button" class="btn" data-act="beat" data-deck="${d.id}">Beat</button>
    </div>
    <div class="dj-pads">${cues}</div>
    <div class="dj-loops"><span>Loop</span>${loops}<button type="button" class="btn" data-act="loop-off" data-deck="${d.id}">Off</button></div>
    <div class="dj-eq">
      ${['high', 'mid', 'low'].map((band) => `
        <div class="dj-eq-col">
          <button type="button" class="dj-kill${d.kill[band] ? ' on' : ''}" data-act="kill" data-deck="${d.id}" data-band="${band}">${band.toUpperCase()} KILL</button>
          <input type="range" min="-24" max="12" step="0.5" value="${d.eq[band]}" data-eq="${band}" data-deck="${d.id}" orient="vertical">
          <span>${d.eq[band].toFixed(1)}</span>
        </div>`).join('')}
      <div class="dj-eq-col">
        <span>FILTER</span>
        <input type="range" min="0" max="1" step="0.01" value="${d.filter}" data-act="filter" data-deck="${d.id}">
        <span>GAIN</span>
        <input type="range" min="0" max="1" step="0.01" value="${d.gain}" data-act="gain" data-deck="${d.id}">
      </div>
    </div>
  </section>`;
}

function paintDecks() {
  const root = document.getElementById('daw-live');
  if (!root) return;
  const hw = hardwareStatus();
  root.innerHTML = `
    <div class="dj-shell">
      <div class="dj-top">
        <span class="daw-kicker">DJ Live</span>
        <label>Master <input id="daw-bpm" type="number" min="40" max="240" value="${currentBpm()}"></label>
        <span id="daw-bpm-val">${currentBpm()} BPM</span>
        <button type="button" class="btn" id="dj-tap">Tap</button>
        <button type="button" class="btn" id="dj-rec">${recorder && recorder.state === 'recording' ? 'Stop rec' : 'Record mix'}</button>
        <span class="hint hint-info" id="dj-hw">${hw}</span>
      </div>
      <div class="dj-decks">
        ${deckHtml(decks.a)}
        ${deckHtml(decks.b)}
      </div>
      <div class="dj-xf">
        <span>A</span>
        <input type="range" id="dj-xfader" min="0" max="1" step="0.001" value="${xfader}">
        <span>B</span>
      </div>
    </div>
    <input type="file" id="dj-file" accept="audio/*" hidden>
  `;
  bindDeckUi(root);
  requestAnimationFrame(() => {
    ['a', 'b'].forEach((id) => {
      const canvas = root.querySelector(`[data-wave="${id}"]`);
      const d = decks[id];
      if (canvas && d.buf) drawWave(canvas, d.buf, deckNow(d), d.cues, d.loopStart, d.loopEnd);
    });
  });
}

let loadTarget = 'a';
let lastTap = 0;
let tapTimes = [];

function bindDeckUi(root) {
  root.querySelector('#daw-bpm').addEventListener('change', (e) => setBpm(Number(e.target.value)));
  root.querySelector('#dj-xfader').addEventListener('input', (e) => {
    xfader = parseFloat(e.target.value);
    ensureCtx();
    applyXfade();
  });
  root.querySelector('#dj-tap').addEventListener('click', () => {
    const now = performance.now();
    if (now - lastTap > 2000) tapTimes = [];
    tapTimes.push(now);
    lastTap = now;
    if (tapTimes.length >= 2) {
      const spans = [];
      for (let i = 1; i < tapTimes.length; i++) spans.push(tapTimes[i] - tapTimes[i - 1]);
      const avg = spans.reduce((a, b) => a + b, 0) / spans.length;
      setBpm(60000 / avg);
    }
  });
  root.querySelector('#dj-rec').addEventListener('click', toggleMixRecord);
  root.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = decks[btn.dataset.deck];
      const act = btn.dataset.act;
      if (act === 'play') togglePlay(d);
      if (act === 'cue') cueDeck(d);
      if (act === 'sync') syncToOther(d);
      if (act === 'pfl') {
        d.cue = !d.cue;
        if (d.nodes) d.nodes.cue.gain.value = d.cue ? 0.8 : 0;
      }
      if (act === 'load') {
        loadTarget = d.id;
        document.getElementById('dj-file').click();
      }
      if (act === 'beat') loadBeatIntoDeck(d);
      if (act === 'loop-off') {
        d.loopOn = false;
        if (d.playing) startDeckAt(d, deckNow(d));
      }
      if (act === 'kill') {
        d.kill[btn.dataset.band] = !d.kill[btn.dataset.band];
        applyDeckEq(d);
      }
      paintDecks();
    });
  });
  root.querySelectorAll('[data-cue]').forEach((btn) => {
    btn.addEventListener('click', () => jumpCue(decks[btn.dataset.deck], Number(btn.dataset.cue)));
    btn.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      clearCue(decks[btn.dataset.deck], Number(btn.dataset.cue));
    });
  });
  root.querySelectorAll('[data-loop]').forEach((btn) => {
    btn.addEventListener('click', () => setLoop(decks[btn.dataset.deck], parseFloat(btn.dataset.loop)));
    btn.addEventListener('click', () => paintDecks());
  });
  root.querySelectorAll('[data-eq]').forEach((el) => {
    el.addEventListener('input', () => {
      const d = decks[el.dataset.deck];
      d.eq[el.dataset.eq] = parseFloat(el.value);
      applyDeckEq(d);
    });
  });
  root.querySelectorAll('[data-act="filter"]').forEach((el) => {
    el.addEventListener('input', () => {
      const d = decks[el.dataset.deck];
      d.filter = parseFloat(el.value);
      applyDeckEq(d);
    });
  });
  root.querySelectorAll('[data-act="gain"]').forEach((el) => {
    el.addEventListener('input', () => {
      const d = decks[el.dataset.deck];
      d.gain = parseFloat(el.value);
      ensureCtx();
      applyXfade();
    });
  });
  const file = root.querySelector('#dj-file');
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0];
    if (f) await loadFileIntoDeck(decks[loadTarget], f);
    file.value = '';
  });
  root.querySelectorAll('.dj-deck').forEach((el) => {
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop'));
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      el.classList.remove('drop');
      const f = e.dataTransfer.files[0];
      if (f) await loadFileIntoDeck(decks[el.dataset.deck], f);
    });
  });
}

function toggleMixRecord() {
  ensureCtx();
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    return;
  }
  recChunks = [];
  recorder = new MediaRecorder(recDest.stream);
  recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `the-voice-mix-${Date.now()}.webm`;
    a.click();
    paintDecks();
  };
  recorder.start();
  paintDecks();
}

function hardwareStatus() {
  const bits = [];
  if (midiAccess) {
    const ins = [...midiAccess.inputs.values()].map((i) => i.name);
    bits.push(ins.length ? `MIDI: ${ins.join(', ')}` : 'MIDI: no controller');
  } else bits.push('MIDI: requesting…');
  return bits.join(' · ') + ' · drop tracks onto a deck';
}

function onMidiMessage(ev) {
  const [status, d1, d2] = ev.data;
  const cmd = status & 0xf0;
  if (mode !== 'dj') {
    studioMidi(cmd, d1, d2);
    return;
  }
  const vel = d2 / 127;
  if (cmd === 0xb0) {
    if (d1 === 8 || d1 === 10) {
      xfader = vel;
      applyXfade();
      const sl = document.getElementById('dj-xfader');
      if (sl) sl.value = String(xfader);
    }
    if (d1 === 1) { decks.a.filter = vel; applyDeckEq(decks.a); }
    if (d1 === 2) { decks.b.filter = vel; applyDeckEq(decks.b); }
    if (d1 === 3) { decks.a.gain = vel; applyXfade(); }
    if (d1 === 4) { decks.b.gain = vel; applyXfade(); }
  }
  if (cmd === 0x90 && d2 > 0) {
    if (d1 >= 36 && d1 <= 43) jumpCue(decks.a, d1 - 36);
    if (d1 >= 48 && d1 <= 55) jumpCue(decks.b, d1 - 48);
    if (d1 === 32) togglePlay(decks.a);
    if (d1 === 33) togglePlay(decks.b);
  }
}

async function hookMidi() {
  if (!navigator.requestMIDIAccess) return;
  try {
    midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    const hook = () => {
      midiAccess.inputs.forEach((input) => {
        input.onmidimessage = onMidiMessage;
      });
    };
    hook();
    midiAccess.onstatechange = hook;
    if (mode === 'dj') paintDecks();
  } catch (_) {
    midiAccess = null;
  }
}

function tickWaves() {
  if (mode === 'dj') {
    const root = document.getElementById('daw-live');
    if (root && !root.hidden) {
      ['a', 'b'].forEach((id) => {
        const d = decks[id];
        const canvas = root.querySelector(`[data-wave="${id}"]`);
        if (canvas && d.buf) drawWave(canvas, d.buf, deckNow(d), d.cues, d.loopStart, d.loopEnd);
        const now = root.querySelector(`[data-now="${id}"]`);
        const rem = root.querySelector(`[data-remain="${id}"]`);
        if (now) now.textContent = fmtTime(deckNow(d));
        if (rem && d.buf) rem.textContent = fmtTime(Math.max(0, d.duration - deckNow(d)));
      });
    }
  }
  deckPaint = requestAnimationFrame(tickWaves);
}

export function initDaw(options) {
  opts = options || {};
  ensureSession();
  paintDecks();
  initStudio(opts, () => {
    ensureCtx();
    return { ctx, master, recDest };
  });
  setDawMode('produce');
  document.querySelectorAll('[data-daw-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setDawMode(btn.dataset.dawMode));
  });
  document.querySelectorAll('[data-prod-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDawMode('produce');
      setProdView(btn.dataset.prodView);
    });
  });
  hookMidi();
  if (!deckPaint) tickWaves();
  window.TheVoiceDAW = Object.assign(window.TheVoiceDAW || {}, {
    play: () => { if (mode === 'dj') togglePlay(decks.a); else studioPlay(); },
    stop: () => {
      studioStop();
      pauseDeck(decks.a); pauseDeck(decks.b);
      for (let t = 0; t < SESSION_TRACKS; t++) stopClip(t);
    },
    setBpm,
    xfade: (v) => { xfader = Math.max(0, Math.min(1, v)); applyXfade(); },
    view: setDawMode,
    launchScene,
    addVoiceClip,
  });
}

export function showDaw() {
  if (mode === 'produce') showStudio();
  else paintDecks();
}
