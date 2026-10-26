// Real-time-capable audio effects applied offline to a recorded clip via
// OfflineAudioContext — pure Web Audio DSP, no server and no ML needed for
// the pitch/robot/echo/radio effects. Denoising is the one exception: it
// runs an actual trained model (RNNoise) via WASM, loaded from a CDN the
// same way the neural voice model is.
export async function decodeToAudioBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close();
  }
}

function makeDistortionCurve(amount) {
  const n = 4096;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

async function resamplePitch(audioBuffer, rate) {
  const newLength = Math.max(1, Math.ceil(audioBuffer.length / rate));
  const ctx = new OfflineAudioContext(1, newLength, audioBuffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = rate;
  source.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

async function robotEffect(audioBuffer) {
  const ctx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const carrier = ctx.createOscillator();
  carrier.frequency.value = 45;
  const modGain = ctx.createGain();
  modGain.gain.value = 0;
  carrier.connect(modGain.gain);
  source.connect(modGain);
  modGain.connect(ctx.destination);
  source.start(0);
  carrier.start(0);
  return ctx.startRendering();
}

async function echoEffect(audioBuffer) {
  const tailSamples = Math.round(audioBuffer.sampleRate * 1.2);
  const ctx = new OfflineAudioContext(1, audioBuffer.length + tailSamples, audioBuffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.25;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.45;
  const wet = ctx.createGain();
  wet.gain.value = 0.6;
  source.connect(ctx.destination);
  source.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

async function radioEffect(audioBuffer) {
  const ctx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1800;
  bandpass.Q.value = 0.7;
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(15);
  source.connect(bandpass);
  bandpass.connect(shaper);
  shaper.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

const RNNOISE_BASE = 'https://cdn.jsdelivr.net/npm/@sapphi-red/web-noise-suppressor@0.4.0/dist';

async function denoiseEffect(audioBuffer) {
  const { RnnoiseWorkletNode, loadRnnoise } = await import(`${RNNOISE_BASE}/index.js`);
  const ctx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  await ctx.audioWorklet.addModule(`${RNNOISE_BASE}/rnnoise/workletProcessor.js`);
  const wasmBinary = await loadRnnoise({
    url: `${RNNOISE_BASE}/rnnoise.wasm`,
    simdUrl: `${RNNOISE_BASE}/rnnoise_simd.wasm`,
  });
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  const rnnoise = new RnnoiseWorkletNode(ctx, { maxChannels: 1, wasmBinary });
  source.connect(rnnoise);
  rnnoise.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

const EFFECTS = {
  deeper: (buf) => resamplePitch(buf, 0.8),
  higher: (buf) => resamplePitch(buf, 1.35),
  robot: robotEffect,
  echo: echoEffect,
  radio: radioEffect,
  denoise: denoiseEffect,
};

export async function applyVoiceEffect(name, audioBuffer) {
  const fn = EFFECTS[name];
  if (!fn) throw new Error(`Unknown effect: ${name}`);
  try {
    return await fn(audioBuffer);
  } catch (err) {
    if (name === 'denoise') {
      const msg = String((err && err.message) || err);
      if (window.self !== window.top || /fetch|network|NetworkError/i.test(msg)) {
        throw new Error("Couldn't reach the noise-suppression model (blocked here, e.g. an embedded preview, or a network issue). Works from a normal browser tab.");
      }
    }
    throw err;
  }
}
