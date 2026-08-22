// Live Ableton-style production engine.
// Real-time Web Audio clock, mixer meters, piano roll, session clips.
// Export is a bounce, not the workflow. Does not touch Animate.

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
let keysRel = 0.35;

const mix = {};
const notes = []; // { pitch, start, length, vel } in 16th-notes
const clips = []; // { track, scene, name, color, grid, notes, bassNotes }
let pendingScene = -1;
let currentScene = 0;

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
  wet.gain.value = 1;
  mix.keys.analyser.connect(delay);
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
  comp.connect(mix.master.input);
  mix.master.analyser.connect(master);
  mix._delay = delay;
  mix._bus = bus;
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

function trigKick(t, vel) {
  const { ctx } = audio();
  const dest = mix.kick.input;
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

function trigSnare(t, vel) {
  const { ctx } = audio();
  trigNoise(mix.snare.input, t, vel * 0.9, 900, 0.12, 0.28);
  const osc = ctx.createOscillator();
  const g = envGain(mix.snare.input, t, vel * 0.35, 0.001, 0.04, 0.1, 0.08, 0.04);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(210, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  osc.connect(g);
  osc.start(t); osc.stop(t + 0.2);
}

function trigHat(t, vel) {
  trigNoise(mix.hihat.input, t, vel * 0.55, 7000, 0.04, 0.1);
}

function trigClap(t, vel) {
  trigNoise(mix.clap.input, t, vel * 0.7, 1000, 0.14, 0.28);
}

function trigBass(t, vel, semi) {
  const { ctx } = audio();
  const dest = mix.bass.input;
  const freq = 110 * Math.pow(2, (semi || 0) / 12);
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(freq * 5, t);
  f.frequency.exponentialRampToValueAtTime(freq * 2.2, t + 0.16);
  f.Q.value = 6;
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  const g = envGain(dest, t, vel * 0.55, 0.005, 0.1, 0.35, 0.14, 0.18);
  osc.connect(f); f.connect(g);
  osc.start(t); osc.stop(t + 0.42);
}

function trigKey(t, pitch, vel, lengthBeats) {
  const { ctx } = audio();
  const dest = mix.keys.input;
  const freq = 440 * Math.pow(2, (pitch - 69) / 12);
  const dur = Math.max(0.05, lengthBeats * stepDur());
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = 'sawtooth';
  o2.type = 'square';
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.005;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(keysCutoff, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(120, keysCutoff * 0.35), t + dur * 0.7);
  f.Q.value = keysRes;
  const g = envGain(dest, t, vel * 0.28, 0.01, 0.08, 0.55, keysRel, dur);
  o1.connect(f); o2.connect(f); f.connect(g);
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

function scheduleStep(st, t) {
  const p = pattern();
  if (!p || !p.grid) return;
  const vel = 0.9;
  if (p.grid.kick && p.grid.kick[st % 16]) trigKick(t, vel);
  if (p.grid.snare && p.grid.snare[st % 16]) trigSnare(t, vel);
  if (p.grid.hihat && p.grid.hihat[st % 16]) trigHat(t, vel);
  if (p.grid.clap && p.grid.clap[st % 16]) trigClap(t, vel);
  if (p.grid.bass && p.grid.bass[st % 16]) trigBass(t, vel, (p.bassNotes && p.bassNotes[st % 16]) || 0);
  notes.forEach((n) => {
    if ((n.start % ROLL_STEPS) === (st % ROLL_STEPS)) trigKey(t, n.pitch, (n.vel || 100) / 100, n.length);
  });
  if (metroOn && st % 4 === 0) trigMetro(t, st % 16 === 0);
}

function applyPending() {
  if (pendingScene < 0) return;
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
    const seq = document.getElementById('sequencer');
    if (seq) seq.querySelectorAll('.seq-cell').forEach((cell) => {
      const on = p.grid[cell.dataset.track] && p.grid[cell.dataset.track][Number(cell.dataset.step)];
      cell.classList.toggle('on', !!on);
      cell.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    paintRoll();
  }
  pendingScene = -1;
  paintSession();
}

function clock() {
  if (!playing) return;
  const a = audio();
  if (!a) return;
  const { ctx } = a;
  const look = 0.12;
  while (nextTime < ctx.currentTime + look) {
    if (step % 16 === 0) applyPending();
    scheduleStep(step, nextTime);
    const swingAdd = (step % 2 === 1) ? stepDur() * swing * 0.5 : 0;
    highlightStep(step);
    step = (step + 1) % ROLL_STEPS;
    nextTime += stepDur() + swingAdd;
  }
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
  if (playhead) playhead.style.left = `${(st / ROLL_STEPS) * 100}%`;
  const pos = document.getElementById('abl-pos');
  if (pos) {
    const bar = Math.floor(st / 16) + 1;
    const beat = Math.floor((st % 16) / 4) + 1;
    pos.textContent = `${bar}.${beat}.${(st % 4) + 1}`;
  }
}

export function studioPlay() {
  ensureMix();
  const a = audio();
  if (!a) return;
  const { ctx } = a;
  if (ctx.state === 'suspended') ctx.resume();
  if (playing) return;
  playing = true;
  step = 0;
  nextTime = ctx.currentTime + 0.05;
  clock();
  syncTransport();
}

export function studioStop() {
  playing = false;
  recOn = false;
  if (timer) { clearTimeout(timer); timer = null; }
  step = 0;
  highlightStep(-1);
  syncTransport();
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
  let html = '<div class="abl-session">';
  html += '<div class="abl-session-h"><span>Session</span><span class="abl-muted">click launches on the next bar · right-click captures</span></div>';
  html += '<div class="abl-scenes">';
  for (let s = 0; s < 8; s++) {
    const c = clips[s];
    const on = currentScene === s && playing;
    const wait = pendingScene === s;
    html += `<button type="button" class="abl-clip${c.grid ? ' filled' : ''}${on ? ' playing' : ''}${wait ? ' queued' : ''}" data-scene="${s}" style="--clip:${c.color}">
      <i></i><span>${c.name || (c.grid ? 'Clip' : 'Empty')}</span>
    </button>`;
  }
  html += '<button type="button" class="abl-scene-fire" id="abl-stop-clips">■</button>';
  html += '</div></div>';
  root.innerHTML = html;
  root.querySelectorAll('.abl-clip').forEach((btn) => {
    const s = Number(btn.dataset.scene);
    btn.addEventListener('click', () => {
      const c = clips[s];
      if (!c.grid) {
        const snap = snapshotPattern();
        if (!snap) return;
        c.grid = snap.grid;
        c.notes = snap.notes;
        c.bassNotes = snap.bassNotes;
        c.name = `Scene ${s + 1}`;
        paintSession();
        return;
      }
      pendingScene = s;
      if (!playing) {
        applyPending();
        studioPlay();
      } else {
        paintSession();
      }
    });
    btn.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      const snap = snapshotPattern();
      if (!snap) return;
      const c = clips[s];
      c.grid = snap.grid;
      c.notes = snap.notes;
      c.bassNotes = snap.bassNotes;
      c.name = c.name || `Scene ${s + 1}`;
      paintSession();
    });
  });
  const stop = root.querySelector('#abl-stop-clips');
  if (stop) stop.addEventListener('click', studioStop);
}

function paintMixer() {
  const root = document.getElementById('abl-mixer');
  if (!root) return;
  ensureMix();
  root.innerHTML = STRIPS.map((s) => {
    const m = mix[s.id];
    return `<div class="abl-strip" data-strip="${s.id}" style="--strip:${s.color}">
      <canvas class="abl-meter" data-meter="${s.id}" width="10" height="92"></canvas>
      <input type="range" min="0" max="1.4" step="0.01" value="${m.level}" data-vol="${s.id}" title="Volume">
      <input type="range" min="-1" max="1" step="0.01" value="${m.panVal}" data-pan="${s.id}" title="Pan">
      <div class="abl-strip-btns">
        <button type="button" class="abl-m${m.muted ? ' on' : ''}" data-mute="${s.id}">M</button>
        <button type="button" class="abl-s${m.soloed ? ' on' : ''}" data-solo="${s.id}">S</button>
      </div>
      <span>${s.name}</span>
    </div>`;
  }).join('');
  root.querySelectorAll('[data-vol]').forEach((el) => {
    el.addEventListener('input', () => {
      const m = mix[el.dataset.vol];
      m.level = parseFloat(el.value);
      m.vol.gain.setTargetAtTime(m.level, audio().ctx.currentTime, 0.02);
    });
  });
  root.querySelectorAll('[data-pan]').forEach((el) => {
    el.addEventListener('input', () => {
      const m = mix[el.dataset.pan];
      m.panVal = parseFloat(el.value);
      if (m.pan) m.pan.pan.setTargetAtTime(m.panVal, audio().ctx.currentTime, 0.02);
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

function bindKeys() {
  if (window.__ablKeys) return;
  window.__ablKeys = true;
  document.addEventListener('keydown', (ev) => {
    const music = document.getElementById('music-view');
    if (!music || music.hidden) return;
    if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA' || ev.target.tagName === 'SELECT')) return;
    if (ev.code === 'Space') {
      ev.preventDefault();
      togglePlay();
      return;
    }
    const pitch = KEY_MAP[String(ev.key).toLowerCase()];
    if (pitch == null || held.has(ev.key)) return;
    ensureMix();
    const t = audio().ctx.currentTime;
    trigKey(t, pitch, 0.85, 2);
    held.set(ev.key, true);
    if (recOn && playing) {
      notes.push({ pitch, start: step % ROLL_STEPS, length: 2, vel: 100 });
      paintRoll();
    }
  });
  document.addEventListener('keyup', (ev) => held.delete(ev.key));
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
    ${presets.map((n) => `<button type="button" class="abl-lib" data-preset="${n}">${n}</button>`).join('')}
    <div class="abl-browser-sec">Devices</div>
    <div class="abl-knobs">
      <label>Cut <input id="abl-cut" type="range" min="200" max="8000" value="${keysCutoff}"></label>
      <label>Res <input id="abl-res" type="range" min="0.2" max="18" step="0.1" value="${keysRes}"></label>
      <label>Rel <input id="abl-rel" type="range" min="0.05" max="1.2" step="0.01" value="${keysRel}"></label>
    </div>
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
  root.querySelectorAll('[data-lib]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDetail(btn.dataset.lib === 'keys' ? 'keys' : 'drums');
    });
  });
  const cut = root.querySelector('#abl-cut');
  const res = root.querySelector('#abl-res');
  const rel = root.querySelector('#abl-rel');
  if (cut) cut.addEventListener('input', () => { keysCutoff = parseFloat(cut.value); });
  if (res) res.addEventListener('input', () => { keysRes = parseFloat(res.value); });
  if (rel) rel.addEventListener('input', () => { keysRel = parseFloat(rel.value); });
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
      <select id="abl-q">
        <option value="1" selected>1 bar</option>
        <option value="0.25">1/4</option>
        <option value="0">none</option>
      </select>
    </label>
    <span class="abl-spacer"></span>
    <button type="button" id="abl-bounce" title="Render the loop to a WAV — production itself is live">Bounce</button>
  `;
  root.querySelector('#abl-play').addEventListener('click', togglePlay);
  root.querySelector('#abl-rec').addEventListener('click', () => {
    recOn = !recOn;
    if (recOn && !playing) studioPlay();
    setDetail('keys');
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
  root.querySelector('#abl-q').addEventListener('change', (e) => { quantize = parseFloat(e.target.value) || 0; });
  root.querySelector('#abl-bounce').addEventListener('click', bounce);
}

async function bounce() {
  if (!opts.renderPattern || !opts.encodeWav16 || !pattern()) return;
  const samples = opts.renderPattern(pattern(), 44100, 2);
  const blob = opts.encodeWav16(samples, 44100);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `the-voice-${bpm()}bpm.wav`;
  a.click();
}

let metersOn = false;
function tickMeters() {
  meterLoop();
  if (detail === 'keys') {
    const ph = document.getElementById('abl-playhead');
    if (ph && playing) ph.style.left = `${((step % ROLL_STEPS) / ROLL_STEPS) * 100}%`;
  }
  metersOn = requestAnimationFrame(tickMeters);
}

export function initStudio(options, audioGetter) {
  opts = options || {};
  getAudio = audioGetter;
  paintTransport();
  paintBrowser();
  paintSession();
  paintMixer();
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
}

export function showStudio() {
  paintSession();
  paintMixer();
  paintBrowser();
  paintRoll();
  syncTransport();
}

export function studioPlaying() {
  return playing;
}
