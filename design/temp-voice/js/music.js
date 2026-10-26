// Drum and bass synthesis plus a step sequencer.
//
// Every sound is generated from oscillators and filtered noise rather than
// sample files: nothing to download, nothing to licence, and the whole
// engine is plain arithmetic on a Float32Array — which also means it can
// be tested properly outside a browser.
//
// Rendering is done by hand rather than through OfflineAudioContext so the
// same code path runs in tests and in the page.

export const STEPS = 16;

export const TRACKS = [
  { id: 'kick', name: 'Kick' },
  { id: 'snare', name: 'Snare' },
  { id: 'hihat', name: 'Hi-hat' },
  { id: 'clap', name: 'Clap' },
  { id: 'bass', name: 'Bass' },
];

// Semitone offsets from A2 (110 Hz) for the bass track, one per step.
const A2 = 110;

export function createPattern() {
  const grid = {};
  for (const t of TRACKS) grid[t.id] = new Array(STEPS).fill(false);
  return {
    bpm: 96,
    swing: 0,
    grid,
    // Which note each bass step plays, as semitones above A2.
    bassNotes: new Array(STEPS).fill(0),
  };
}

/** Exponential decay envelope — the shape almost every percussive sound has. */
function decay(t, tau) {
  return Math.exp(-t / tau);
}

function noise() {
  return Math.random() * 2 - 1;
}

/**
 * A one-pole low/high pass, applied sample by sample. Cheap, stable, and
 * enough to separate a hi-hat from a snare.
 */
function makeOnePole(cutoffHz, sampleRate, highpass = false) {
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  let lp = 0;
  return (x) => {
    lp += alpha * (x - lp);
    return highpass ? x - lp : lp;
  };
}

const VOICES = {
  kick(out, start, sampleRate, gain) {
    const dur = 0.42;
    const n = Math.floor(dur * sampleRate);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const t = i / sampleRate;
      // Pitch drops fast from a click down to a body tone — the drop is
      // what makes it read as a kick rather than a low beep.
      const freq = 42 + 118 * decay(t, 0.028);
      phase += (2 * Math.PI * freq) / sampleRate;
      out[idx] += Math.sin(phase) * decay(t, 0.16) * gain;
    }
  },

  snare(out, start, sampleRate, gain) {
    const dur = 0.24;
    const n = Math.floor(dur * sampleRate);
    const bp = makeOnePole(1800, sampleRate, true);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const t = i / sampleRate;
      phase += (2 * Math.PI * 185) / sampleRate;
      const body = Math.sin(phase) * decay(t, 0.06) * 0.4;
      const rattle = bp(noise()) * decay(t, 0.1) * 0.7;
      out[idx] += (body + rattle) * gain;
    }
  },

  hihat(out, start, sampleRate, gain) {
    const dur = 0.09;
    const n = Math.floor(dur * sampleRate);
    const hp = makeOnePole(7000, sampleRate, true);
    for (let i = 0; i < n; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const t = i / sampleRate;
      out[idx] += hp(noise()) * decay(t, 0.022) * gain * 0.6;
    }
  },

  clap(out, start, sampleRate, gain) {
    // Three quick bursts then a tail — a clap is many hands, slightly apart.
    const bursts = [0, 0.011, 0.023];
    const bp = makeOnePole(1200, sampleRate, true);
    const dur = 0.3;
    const n = Math.floor(dur * sampleRate);
    for (let i = 0; i < n; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const t = i / sampleRate;
      let env = decay(Math.max(0, t - bursts[2]), 0.12) * 0.6;
      for (const b of bursts) {
        if (t >= b && t < b + 0.01) env += decay(t - b, 0.004);
      }
      out[idx] += bp(noise()) * env * gain * 0.5;
    }
  },

  bass(out, start, sampleRate, gain, semitones = 0) {
    const dur = 0.3;
    const n = Math.floor(dur * sampleRate);
    const freq = A2 * Math.pow(2, semitones / 12);
    const lp = makeOnePole(freq * 4.5, sampleRate);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const t = i / sampleRate;
      phase += freq / sampleRate;
      if (phase > 1) phase -= 1;
      const saw = phase * 2 - 1; // bright source for the filter to shape
      out[idx] += lp(saw) * decay(t, 0.13) * gain * 0.55;
    }
  },
};

export function stepDuration(bpm) {
  // 16 steps to a bar, four beats to a bar => four steps per beat.
  return 60 / bpm / 4;
}

export function patternDuration(pattern, bars = 1) {
  return stepDuration(pattern.bpm) * STEPS * bars;
}

/**
 * Render a pattern to mono Float32 audio.
 * Tail time lets the last hit ring out instead of being cut off.
 */
export function renderPattern(pattern, sampleRate = 44100, bars = 1) {
  const stepDur = stepDuration(pattern.bpm);
  const tail = 0.5;
  const total = Math.ceil((stepDur * STEPS * bars + tail) * sampleRate);
  const out = new Float32Array(total);

  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < STEPS; step++) {
      // Swing delays every other step, which is what stops a grid from
      // sounding mechanical.
      const swung = step % 2 === 1 ? pattern.swing * stepDur * 0.5 : 0;
      const at = Math.floor(((bar * STEPS + step) * stepDur + swung) * sampleRate);

      for (const track of TRACKS) {
        if (!pattern.grid[track.id][step]) continue;
        if (track.id === 'bass') {
          VOICES.bass(out, at, sampleRate, 1, pattern.bassNotes[step] || 0);
        } else {
          VOICES[track.id](out, at, sampleRate, 1);
        }
      }
    }
  }

  // Soft-clip rather than hard-clip: layered hits routinely exceed 1.0, and
  // tanh keeps that sounding like loudness instead of distortion.
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0.95) {
    for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 0.9);
  }

  return out;
}

/** Mix a voice track over a beat, so a recording can sit on top of music. */
export function mixTracks(a, b, gainA = 1, gainB = 1) {
  const len = Math.max(a.length, b.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (i < a.length ? a[i] * gainA : 0) + (i < b.length ? b[i] * gainB : 0);
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 1) for (let i = 0; i < len; i++) out[i] /= peak;
  return out;
}

export const PRESET_PATTERNS = {
  'Four on the floor': {
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hihat: [2, 6, 10, 14],
    clap: [],
    bass: [0, 3, 8, 11],
  },
  'Boom bap': {
    kick: [0, 3, 8, 10],
    snare: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
    clap: [],
    bass: [0, 8],
  },
  'Trap': {
    kick: [0, 6, 10],
    snare: [8],
    hihat: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14, 15],
    clap: [8],
    bass: [0, 10],
  },
  'Half time': {
    kick: [0, 10],
    snare: [8],
    hihat: [0, 4, 8, 12],
    clap: [8],
    bass: [0, 6, 12],
  },
};

export function applyPreset(pattern, name) {
  const preset = PRESET_PATTERNS[name];
  if (!preset) throw new Error(`Unknown preset: ${name}`);
  for (const track of TRACKS) {
    pattern.grid[track.id] = new Array(STEPS).fill(false);
    for (const step of preset[track.id] || []) pattern.grid[track.id][step] = true;
  }
  return pattern;
}
