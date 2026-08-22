// Free, real neural TTS (Kokoro-82M) running entirely client-side via
// Transformers.js/ONNX — loaded lazily from a CDN on first use so the page
// itself stays tiny. Falls back gracefully if the model can't load.
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const LOAD_TIMEOUT_MS = 60000;

const STATIC_VOICES = [
  { id: 'af_heart', label: 'Heart — US Female (A)' },
  { id: 'af_bella', label: 'Bella — US Female (A-)' },
  { id: 'bf_emma', label: 'Emma — UK Female (B-)' },
  { id: 'af_nicole', label: 'Nicole — US Female (B-)' },
  { id: 'af_sarah', label: 'Sarah — US Female (C+)' },
  { id: 'af_aoede', label: 'Aoede — US Female (C+)' },
  { id: 'am_fenrir', label: 'Fenrir — US Male (C+)' },
  { id: 'am_michael', label: 'Michael — US Male (C+)' },
  { id: 'am_puck', label: 'Puck — US Male (C+)' },
  { id: 'bm_george', label: 'George — UK Male (C)' },
  { id: 'bm_fable', label: 'Fable — UK Male (C)' },
  { id: 'am_onyx', label: 'Onyx — US Male (D)' },
];

function friendlyLoadError(err) {
  const msg = String((err && err.message) || err || '');
  if (window.self !== window.top) {
    return 'The neural voice model could not be reached from this embedded preview (its sandbox blocks the model CDN). Open this page directly in your browser instead.';
  }
  if (/dynamically imported module|Failed to fetch|NetworkError|ERR_/i.test(msg)) {
    return "Couldn't reach the neural voice model over the network. Check your connection, and that nothing (ad-blocker, corporate proxy/firewall) is blocking cdn.jsdelivr.net or huggingface.co.";
  }
  if (/timed out/i.test(msg)) {
    return 'The neural voice model took too long to load (slow connection). Try again, or use the Browser engine meanwhile.';
  }
  if (/wasm|webassembly/i.test(msg)) {
    return "Your browser couldn't run the neural voice model (WebAssembly issue). Try the latest Chrome or Edge, or use the Browser engine.";
  }
  return `Neural voice failed to load: ${msg || 'unknown error'}.`;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function createNeuralTTS() {
  let instance = null;
  let loadingPromise = null;

  async function load(onProgress) {
    if (instance) return instance;
    if (!loadingPromise) {
      loadingPromise = withTimeout(
        (async () => {
          const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm');
          const device = typeof navigator !== 'undefined' && navigator.gpu ? 'webgpu' : 'wasm';
          instance = await KokoroTTS.from_pretrained(MODEL_ID, {
            dtype: device === 'webgpu' ? 'fp32' : 'q8',
            device,
            progress_callback: onProgress,
          });
          return instance;
        })(),
        LOAD_TIMEOUT_MS,
        'Neural voice model load'
      ).catch((err) => {
        loadingPromise = null;
        throw new Error(friendlyLoadError(err));
      });
    }
    return loadingPromise;
  }

  return {
    listVoices: () => STATIC_VOICES,
    isLoaded: () => !!instance,
    async generate(text, { voice, speed }, onProgress) {
      const model = await load(onProgress);
      return model.generate(text, { voice, speed });
    },
  };
}
