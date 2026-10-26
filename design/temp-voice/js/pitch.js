// Fundamental frequency detection using YIN.
//
// A plain autocorrelation peak-pick is easy to write and wrong on voices:
// speech is harmonic-rich, and the signal correlates just as strongly at
// twice the true period, so it reports an octave too low. YIN's cumulative
// mean normalised difference function plus an absolute threshold is built
// to avoid that specific failure — it takes the *first* period that
// explains the signal, not the strongest.
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MIN_HZ = 70;
const MAX_HZ = 500;
const THRESHOLD = 0.15;
const MIN_RMS = 0.008; // below this it's effectively silence

export function detectPitch(buffer, sampleRate) {
  const n = buffer.length;

  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < MIN_RMS) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / MAX_HZ));
  const maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), Math.floor(n / 2));
  if (maxLag <= minLag) return null;

  // Step 1: squared difference function.
  const diff = new Float32Array(maxLag + 1);
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - maxLag; i++) {
      const d = buffer[i] - buffer[i + lag];
      sum += d * d;
    }
    diff[lag] = sum;
  }

  // Step 2: cumulative mean normalisation. This is what suppresses the
  // sub-octave: dividing by the running mean penalises later (longer)
  // periods that merely repeat an earlier one.
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    runningSum += diff[lag];
    cmnd[lag] = runningSum > 0 ? (diff[lag] * lag) / runningSum : 1;
  }

  // Step 3: first dip below the threshold, taken to its local minimum.
  let bestLag = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (cmnd[lag] < THRESHOLD) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      bestLag = lag;
      break;
    }
  }

  // Nothing convincing: fall back to the global minimum, but only if it is
  // strong enough to be worth reporting.
  if (bestLag === -1) {
    let min = Infinity;
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (cmnd[lag] < min) {
        min = cmnd[lag];
        bestLag = lag;
      }
    }
    if (min > 0.5) return null;
  }

  if (bestLag <= 0) return null;

  // Step 4: parabolic interpolation around the dip for sub-sample accuracy.
  let refined = bestLag;
  if (bestLag > 0 && bestLag < maxLag) {
    const a = cmnd[bestLag - 1];
    const b = cmnd[bestLag];
    const c = cmnd[bestLag + 1];
    const denom = 2 * (2 * b - a - c);
    if (Math.abs(denom) > 1e-9) refined = bestLag + (c - a) / denom;
  }

  const freq = sampleRate / refined;
  if (freq < MIN_HZ || freq > MAX_HZ) return null;
  return freq;
}

export function frequencyToNote(freq) {
  if (!freq || freq <= 0) return null;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  const centsOff = Math.round((midi - rounded) * 100);
  return { name: `${name}${octave}`, centsOff };
}
