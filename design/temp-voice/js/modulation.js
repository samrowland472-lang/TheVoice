// Voice modulation: pitch and formant shifted independently.
//
// Why both, and why they're different: pitch is how high the note is;
// formants are the resonances of the vocal tract, which is what actually
// tells a listener how big the speaker is. Shift pitch alone and you get
// the chipmunk artefact — a small-sounding voice singing high. Shift
// formants alone and the speaker seems to change size while holding the
// same note. Real character changes need control of both, so they're
// separate parameters here.
//
// This is signal processing, not machine learning: no model to download,
// no server, no per-use cost, and it runs on any browser with Web Audio.

const FFT_SIZE = 2048;
const HOP = FFT_SIZE / 4;

/* ---------- FFT (iterative radix-2 Cooley-Tukey, in-place) ---------- */
function fft(re, im, inverse = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

function hann(n) {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

/* ---------- Time stretch (phase vocoder) ---------- */
// Stretches duration by `ratio` while holding pitch, by advancing synthesis
// frames at a different rate than analysis frames and integrating the phase
// difference so successive frames stay coherent.
export function timeStretch(input, ratio) {
  if (Math.abs(ratio - 1) < 1e-6) return Float32Array.from(input);

  const win = hann(FFT_SIZE);
  // Hold the SYNTHESIS hop fixed and vary the analysis hop. Doing it the
  // other way lets synthesis overlap collapse as the ratio grows — at
  // ratio 2 the hop reaches half the window, and the resulting frame-rate
  // ripple becomes an audible tone once the signal is resampled.
  const synthHop = HOP;
  const analysisHop = Math.max(1, HOP / ratio);
  const frames = Math.max(1, Math.floor((input.length - FFT_SIZE) / analysisHop));
  const out = new Float32Array(frames * synthHop + FFT_SIZE + synthHop);
  const norm = new Float32Array(out.length);

  const lastPhase = new Float32Array(FFT_SIZE / 2 + 1);
  const sumPhase = new Float32Array(FFT_SIZE / 2 + 1);
  const expected = (2 * Math.PI * analysisHop) / FFT_SIZE;

  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);

  for (let f = 0; f < frames; f++) {
    const start = Math.round(f * analysisHop);
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (input[start + i] || 0) * win[i];
      im[i] = 0;
    }
    fft(re, im);

    for (let k = 0; k <= FFT_SIZE / 2; k++) {
      const mag = Math.hypot(re[k], im[k]);
      const phase = Math.atan2(im[k], re[k]);

      // True frequency of this bin = expected advance + wrapped deviation.
      let delta = phase - lastPhase[k] - expected * k;
      delta = delta - 2 * Math.PI * Math.round(delta / (2 * Math.PI));
      lastPhase[k] = phase;

      sumPhase[k] += (expected * k + delta) * (synthHop / analysisHop);

      re[k] = mag * Math.cos(sumPhase[k]);
      im[k] = mag * Math.sin(sumPhase[k]);
      if (k > 0 && k < FFT_SIZE / 2) {
        re[FFT_SIZE - k] = re[k];
        im[FFT_SIZE - k] = -im[k];
      }
    }

    fft(re, im, true);

    const outStart = f * synthHop;
    for (let i = 0; i < FFT_SIZE; i++) {
      out[outStart + i] += re[i] * win[i];
      norm[outStart + i] += win[i] * win[i];
    }
  }

  for (let i = 0; i < out.length; i++) {
    if (norm[i] > 1e-8) out[i] /= norm[i];
  }
  return out;
}

/* ---------- Resample ---------- */
// Linear interpolation. Changes pitch, formants and duration together.
export function resample(input, ratio) {
  if (Math.abs(ratio - 1) < 1e-6) return Float32Array.from(input);
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] || 0;
    const b = input[idx + 1] !== undefined ? input[idx + 1] : a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

/* ---------- Pitch shift ---------- */
// Stretch by r, then resample by r: duration returns to the original while
// the pitch ends up scaled — the standard phase-vocoder pitch shift.
export function pitchShift(input, semitones) {
  if (Math.abs(semitones) < 1e-6) return Float32Array.from(input);
  const ratio = Math.pow(2, semitones / 12);
  return resample(timeStretch(input, ratio), ratio);
}

/* ---------- Formant shift ---------- */
// Separates each frame's spectrum into a coarse envelope (the vocal tract
// resonances) and the fine structure (the harmonics carrying pitch), warps
// only the envelope, and recombines — so the speaker changes apparent size
// while the note stays put.
export function formantShift(input, ratio) {
  if (Math.abs(ratio - 1) < 1e-6) return Float32Array.from(input);

  const win = hann(FFT_SIZE);
  const bins = FFT_SIZE / 2 + 1;
  const frames = Math.max(1, Math.floor((input.length - FFT_SIZE) / HOP));
  const out = new Float32Array(input.length + FFT_SIZE);
  const norm = new Float32Array(out.length);

  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  const mag = new Float64Array(bins);
  const env = new Float64Array(bins);
  const warped = new Float64Array(bins);

  const SMOOTH = 12; // bins either side — wide enough to ride over harmonics

  for (let f = 0; f < frames; f++) {
    const start = f * HOP;
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (input[start + i] || 0) * win[i];
      im[i] = 0;
    }
    fft(re, im);

    for (let k = 0; k < bins; k++) mag[k] = Math.hypot(re[k], im[k]);

    // Envelope: moving average of the magnitude spectrum.
    for (let k = 0; k < bins; k++) {
      let sum = 0;
      let count = 0;
      const lo = Math.max(0, k - SMOOTH);
      const hi = Math.min(bins - 1, k + SMOOTH);
      for (let j = lo; j <= hi; j++) {
        sum += mag[j];
        count++;
      }
      env[k] = sum / count;
    }

    // Warp the envelope along the frequency axis.
    for (let k = 0; k < bins; k++) {
      const src = k / ratio;
      const i0 = Math.floor(src);
      const frac = src - i0;
      const a = i0 < bins ? env[i0] : 0;
      const b = i0 + 1 < bins ? env[i0 + 1] : a;
      warped[k] = a + (b - a) * frac;
    }

    // Re-apply: keep the harmonic detail, swap the resonance shape.
    for (let k = 0; k < bins; k++) {
      const gain = env[k] > 1e-8 ? warped[k] / env[k] : 0;
      re[k] *= gain;
      im[k] *= gain;
      if (k > 0 && k < FFT_SIZE / 2) {
        re[FFT_SIZE - k] = re[k];
        im[FFT_SIZE - k] = -im[k];
      }
    }

    fft(re, im, true);

    for (let i = 0; i < FFT_SIZE; i++) {
      out[start + i] += re[i] * win[i];
      norm[start + i] += win[i] * win[i];
    }
  }

  for (let i = 0; i < out.length; i++) {
    if (norm[i] > 1e-8) out[i] /= norm[i];
  }
  return out.subarray(0, input.length);
}

/* ---------- Combined ---------- */
export function modulate(input, { semitones = 0, formant = 1, speed = 1 } = {}) {
  let signal = Float32Array.from(input);
  if (Math.abs(formant - 1) > 1e-6) signal = formantShift(signal, formant);
  if (Math.abs(semitones) > 1e-6) signal = pitchShift(signal, semitones);
  if (Math.abs(speed - 1) > 1e-6) signal = timeStretch(signal, 1 / speed);
  return signal;
}

// Presets describe a target character, not an effect name — each is just a
// point in the pitch/formant space above.
export const PRESETS = [
  { id: 'none', name: 'Original', semitones: 0, formant: 1 },
  { id: 'deeper', name: 'Deeper', semitones: -3, formant: 0.88 },
  { id: 'giant', name: 'Giant', semitones: -7, formant: 0.72 },
  { id: 'lighter', name: 'Lighter', semitones: 3, formant: 1.12 },
  { id: 'child', name: 'Child', semitones: 6, formant: 1.35 },
  { id: 'masc', name: 'Masculine', semitones: -4, formant: 0.85 },
  { id: 'fem', name: 'Feminine', semitones: 4, formant: 1.18 },
  { id: 'anon', name: 'Anonymised', semitones: -5, formant: 1.25 },
];
