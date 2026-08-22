// Composition: assembling a finished piece from the parts made elsewhere.
//
// A project is a voice take, optionally over a beat, optionally driving an
// animation. The pieces are produced independently in their own sections;
// this module's job is only to line them up in time and mix them, which is
// pure arithmetic over sample arrays and therefore testable outside a
// browser.

/**
 * Repeat `pattern` until it covers at least `targetLength` samples.
 * A one-bar loop should not stop halfway through a thirty-second take.
 */
export function loopToLength(pattern, targetLength) {
  if (!pattern.length) return new Float32Array(targetLength);
  const out = new Float32Array(targetLength);
  for (let i = 0; i < targetLength; i++) out[i] = pattern[i % pattern.length];
  return out;
}

/**
 * Lay the voice over the beat.
 *
 * `voiceOffsetSec` delays the voice so a track can open with a bar of beat
 * before anyone speaks. The result runs to whichever finishes last, so
 * neither part is ever clipped short.
 */
export function composeAudio({
  voice = null,
  beat = null,
  sampleRate = 44100,
  voiceGain = 1,
  beatGain = 0.7,
  voiceOffsetSec = 0,
  loopBeat = true,
} = {}) {
  const offset = Math.max(0, Math.round(voiceOffsetSec * sampleRate));
  const voiceEnd = voice ? offset + voice.length : 0;
  const beatEnd = beat ? beat.length : 0;
  const length = Math.max(voiceEnd, beatEnd, 1);

  const out = new Float32Array(length);

  if (beat && beat.length) {
    // Only stretch the beat when the voice actually outlasts it.
    const bed = loopBeat && beat.length < length ? loopToLength(beat, length) : beat;
    for (let i = 0; i < length && i < bed.length; i++) out[i] += bed[i] * beatGain;
  }

  if (voice && voice.length) {
    for (let i = 0; i < voice.length; i++) {
      const at = offset + i;
      if (at < length) out[at] += voice[i] * voiceGain;
    }
  }

  // Normalise only if the sum actually clipped; quiet material should stay
  // quiet rather than being pumped up to full scale.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 1) for (let i = 0; i < length; i++) out[i] /= peak;

  return out;
}

/**
 * Fade the last `seconds` to silence so an exported piece ends cleanly.
 *
 * The ramp reaches exactly zero on the final sample rather than stopping a
 * fraction short of it: an export that ends on a small non-zero value is a
 * step edge, which is the click a fade is there to prevent.
 */
export function fadeOut(samples, sampleRate, seconds = 0.4) {
  const n = Math.min(samples.length, Math.round(seconds * sampleRate));
  if (n <= 0) return samples;
  if (n === 1) { samples[samples.length - 1] = 0; return samples; }
  for (let i = 0; i < n; i++) {
    const idx = samples.length - n + i;
    samples[idx] *= (n - 1 - i) / (n - 1);
  }
  return samples;
}

/** Human-readable summary of what a project currently contains. */
export function describeProject({ voice, beat, scene, sampleRate = 44100 }) {
  const parts = [];
  if (voice) parts.push(`voice ${(voice.length / sampleRate).toFixed(1)}s`);
  if (beat) parts.push(`beat ${(beat.length / sampleRate).toFixed(1)}s`);
  if (scene && scene.shapes && scene.shapes.length) {
    parts.push(`${scene.shapes.length} shape${scene.shapes.length === 1 ? '' : 's'}`);
  }
  return parts.length ? parts.join(' · ') : 'Nothing added yet.';
}
