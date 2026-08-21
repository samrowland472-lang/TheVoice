import { initBackground } from './background.js';
import { initVisualizer } from './visualizer.js';
import { createAudioEngine } from './audio-engine.js';
import { createBrowserTTS } from './tts-browser.js';
import { createNeuralTTS } from './tts-neural.js';
import { createRecorder } from './recorder.js';
import { detectPitch, frequencyToNote } from './pitch.js';
import { encodeWav16 } from './wav-encode.js';
import { createClipLibrary } from './clip-library.js';
import { decodeToAudioBuffer, applyVoiceEffect } from './voice-effects.js';
import { splitIntoChapters, concatAudio } from './chapters.js';
import { PLANS, planFromSession, planLabel, checkoutUrl, getPaymentLinks, setPaymentLink,
         resolvePlan, markAwaitingUpgrade, clearAwaitingUpgrade, awaitingUpgrade,
         nextPollDelay, MAX_UPGRADE_POLLS } from './billing.js';
import { modulate, PRESETS } from './modulation.js';
import { createPattern, renderPattern, applyPreset, mixTracks, patternDuration,
         TRACKS, STEPS, PRESET_PATTERNS } from './music.js';
import { analyseLyrics, scaleChords, progressionInKey, KEYS, PROGRESSIONS } from './songcraft.js';
import { composeAudio, fadeOut, describeProject } from './project.js';
import { createScene, createShape, setKeyframe, removeKeyframe, sampleShape,
         renderFrame, audioLevelTrack, EASING_NAMES } from './animation.js';
import {
  setSupabaseConfig,
  clearSupabaseConfig,
  isBackendConfigured,
  supabaseSignUp,
  supabaseSignIn,
  signInWithProvider,
  signOutUser,
  getCurrentSession,
  onAuthChange,
  fetchSubscriptionPlan,
  refreshSession,
} from './account.js';
import {
  getApiKey,
  setApiKey,
  getClonedVoices,
  saveClonedVoice,
  removeClonedVoice,
  cloneVoice,
  synthesize,
} from './tts-elevenlabs.js';

initBackground();
const visualizer = initVisualizer();
const audioEngine = createAudioEngine(visualizer);
const browserTTS = createBrowserTTS();
const neuralTTS = createNeuralTTS();
const recorder = createRecorder();
const clipLibrary = createClipLibrary();

/* ---------- Element refs ---------- */
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const rateRange = document.getElementById('rate-range');
const pitchRange = document.getElementById('pitch-range');
const volumeRange = document.getElementById('volume-range');
const rateValue = document.getElementById('rate-value');
const pitchValue = document.getElementById('pitch-value');
const volumeValue = document.getElementById('volume-value');
const rateItem = document.getElementById('rate-item');
const pitchItem = document.getElementById('pitch-item');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const downloadBtn = document.getElementById('download-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const highlightPreview = document.getElementById('highlight-preview');
const unsupportedHint = document.getElementById('unsupported-hint');
const engineHint = document.getElementById('engine-hint');
const modelProgress = document.getElementById('model-progress');
const modelProgressFill = document.getElementById('model-progress-fill');
const modelProgressText = document.getElementById('model-progress-text');

const recordBtn = document.getElementById('record-btn');
const recordTimer = document.getElementById('record-timer');
const recordCanvas = document.getElementById('record-canvas');
const recordCtx = recordCanvas.getContext('2d');
const micHint = document.getElementById('mic-hint');
const pitchReadout = document.getElementById('pitch-readout');
const levelReadout = document.getElementById('level-readout');
const noteReadout = document.getElementById('note-readout');
const recordingResult = document.getElementById('recording-result');
const playbackAudio = document.getElementById('playback-audio');
const transcriptBox = document.getElementById('transcript-box');
const useTranscriptBtn = document.getElementById('use-transcript-btn');
const downloadRecordingBtn = document.getElementById('download-recording-btn');
const resetEffectBtn = document.getElementById('reset-effect-btn');
const effectHint = document.getElementById('effect-hint');
const cloneVoiceBtn = document.getElementById('clone-voice-btn');
const cloneHint = document.getElementById('clone-hint');
const cloneStatus = document.getElementById('clone-status');

const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn');
const keyStatus = document.getElementById('key-status');
const clonedVoiceList = document.getElementById('cloned-voice-list');

/* ---------- State ---------- */
let engine = 'neural'; // 'neural' | 'browser' | 'elevenlabs'
let activeSource = null; // 'synth' | 'element' | null
let recordingBlob = null;
let originalRecordingBlob = null;
let recordingExt = 'webm';
let lastClipBlob = null;
let lastClipExt = '';
let recordTimerInterval = null;
let recordSeconds = 0;

/* ---------- Sidebar navigation ---------- */
const consoleView = document.getElementById('console-view');
const libraryView = document.getElementById('library-view');
const settingsView = document.getElementById('settings-view');
const accountView = document.getElementById('account-view');
const plansView = document.getElementById('plans-view');
const plansRefreshBtn = document.getElementById('plans-refresh-btn');
const modulateView = document.getElementById('modulate-view');
const animateView = document.getElementById('animate-view');
const musicView = document.getElementById('music-view');
const projectView = document.getElementById('project-view');

function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));
}

function switchSection(section) {
  document.querySelectorAll('.sidebar-item').forEach((b) => {
    const isCurrent = b.dataset.section === section;
    b.classList.toggle('active', isCurrent);
    // A highlight says "you are here" to someone who can see it. aria-current
    // is the same sentence for someone who cannot.
    if (isCurrent) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });

  const isConsole = section === 'speak' || section === 'studio';
  consoleView.hidden = !isConsole;
  libraryView.hidden = section !== 'library';
  settingsView.hidden = section !== 'settings';
  accountView.hidden = section !== 'account';
  longformView.hidden = section !== 'longform';
  plansView.hidden = section !== 'plans';
  modulateView.hidden = section !== 'modulate';
  animateView.hidden = section !== 'animate';
  musicView.hidden = section !== 'music';
  projectView.hidden = section !== 'project';

  if (isConsole) switchTab(section);
  if (section === 'library') renderLibrary();
  if (section === 'account') renderAccountView();
  if (section === 'plans') renderPlans();
  if (section === 'modulate') refreshModSource();
  if (section === 'animate') animOnShow();
  if (section === 'music') musicOnShow();
  if (section === 'project') projectOnShow();
}

document.querySelectorAll('.sidebar-item').forEach((btn) => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

/* ---------- Status ---------- */
function setStatus(state) {
  statusDot.className = 'status-dot';
  if (state === 'speaking') {
    statusDot.classList.add('speaking');
    statusText.textContent = 'Speaking';
  } else if (state === 'paused') {
    statusDot.classList.add('paused');
    statusText.textContent = 'Paused';
  } else if (state === 'loading') {
    statusText.textContent = 'Loading…';
  } else {
    statusText.textContent = 'Idle';
  }
}

function setPlayingUI(isPlaying) {
  playBtn.disabled = isPlaying;
  pauseBtn.disabled = !isPlaying;
  stopBtn.disabled = !isPlaying;
}

/* ---------- Engine selection ---------- */
document.querySelectorAll('.engine-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.engine-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    engine = btn.dataset.engine;
    stopPlayback();
    refreshVoiceOptions();
    updateEngineChrome();
  });
});

function updateEngineChrome() {
  highlightPreview.hidden = engine !== 'browser';
  highlightPreview.textContent = '';
  pitchItem.style.display = engine === 'browser' ? '' : 'none';
  rateItem.style.display = engine === 'elevenlabs' ? 'none' : '';
  unsupportedHint.hidden = !(engine === 'browser' && !browserTTS.isSupported);

  engineHint.textContent = '';
}

function refreshVoiceOptions() {
  voiceSelect.innerHTML = '';
  if (engine === 'neural') {
    neuralTTS.listVoices().forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      voiceSelect.appendChild(opt);
    });
  } else if (engine === 'browser') {
    browserTTS.listVoices().forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${v.name} (${v.lang})${v.default ? ' — default' : ''}`;
      voiceSelect.appendChild(opt);
    });
  } else {
    const cloned = getClonedVoices();
    if (cloned.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'No cloned voices yet — see Voice Studio';
      opt.disabled = true;
      voiceSelect.appendChild(opt);
    } else {
      cloned.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.voice_id;
        opt.textContent = v.name;
        voiceSelect.appendChild(opt);
      });
    }
  }
}

if (browserTTS.isSupported && browserTTS.refreshVoices) {
  window.speechSynthesis.onvoiceschanged = () => {
    browserTTS.refreshVoices();
    if (engine === 'browser') refreshVoiceOptions();
  };
}

/* ---------- Toasts ---------- */
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  toast.textContent = message;
  const dismiss = () => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 250);
  };
  toast.addEventListener('click', dismiss);
  toastContainer.appendChild(toast);
  setTimeout(dismiss, 3500);
}

/* ---------- Text stats ---------- */
const textStats = document.getElementById('text-stats');
const AVG_WORDS_PER_MINUTE = 150;

function updateTextStats() {
  const text = textInput.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const rate = parseFloat(rateRange.value) || 1;
  const estSeconds = Math.round((words / AVG_WORDS_PER_MINUTE) * 60 / rate);
  textStats.textContent = `${chars} character${chars === 1 ? '' : 's'} · ~${estSeconds}s at this speed`;
}

textInput.addEventListener('input', updateTextStats);

/* ---------- Sliders ---------- */
rateRange.addEventListener('input', () => {
  rateValue.textContent = rateRange.value;
  updateTextStats();
});
pitchRange.addEventListener('input', () => (pitchValue.textContent = pitchRange.value));
volumeRange.addEventListener('input', () => {
  volumeValue.textContent = volumeRange.value;
  audioEngine.setVolume(parseFloat(volumeRange.value));
});

/* ---------- Highlight helper (browser engine only) ---------- */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHighlight(text, start, end) {
  if (start == null) {
    highlightPreview.textContent = '';
    return;
  }
  const before = text.slice(0, start);
  const word = text.slice(start, end);
  const after = text.slice(end);
  highlightPreview.innerHTML = `${escapeHtml(before)}<span class="current-word">${escapeHtml(word)}</span>${escapeHtml(after)}`;
}

/* ---------- Playback control ---------- */
function stopPlayback() {
  browserTTS.stop();
  audioEngine.stop();
  activeSource = null;
  setStatus('idle');
  setPlayingUI(false);
  renderHighlight('', null, null);
}

playBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return;
  stopPlayback();

  if (engine === 'browser') {
    speakBrowser(text);
  } else if (engine === 'neural') {
    await speakNeural(text);
  } else {
    await speakElevenLabs(text);
  }
});

function speakBrowser(text) {
  if (!browserTTS.isSupported) return;
  activeSource = 'synth';
  browserTTS.speak(text, {
    voiceIndex: voiceSelect.value,
    rate: parseFloat(rateRange.value),
    pitch: parseFloat(pitchRange.value),
    volume: parseFloat(volumeRange.value),
    onStart: () => {
      setStatus('speaking');
      setPlayingUI(true);
    },
    onBoundary: (e) => {
      if (e.charIndex === undefined) return;
      const rest = text.slice(e.charIndex);
      const match = rest.match(/^\S+/);
      const len = match ? match[0].length : 1;
      renderHighlight(text, e.charIndex, e.charIndex + len);
      visualizer.pushAmplitude(0.6 + Math.random() * 0.4);
    },
    onEnd: () => {
      activeSource = null;
      setStatus('idle');
      setPlayingUI(false);
      renderHighlight('', null, null);
    },
    onError: () => {
      activeSource = null;
      setStatus('idle');
      setPlayingUI(false);
    },
  });
}

async function speakNeural(text) {
  activeSource = 'element';
  setStatus('loading');
  playBtn.disabled = true;
  const alreadyLoaded = neuralTTS.isLoaded();
  if (!alreadyLoaded) modelProgress.hidden = false;

  try {
    const rawAudio = await neuralTTS.generate(
      text,
      { voice: voiceSelect.value, speed: parseFloat(rateRange.value) },
      (data) => {
        if (data && typeof data.progress === 'number') {
          const pct = Math.max(0, Math.min(100, data.progress));
          modelProgressFill.style.width = `${pct}%`;
          modelProgressText.textContent = `Loading neural voice model… ${pct.toFixed(0)}%`;
        } else if (data && data.status === 'ready') {
          modelProgressText.textContent = 'Model ready.';
        }
      }
    );
    modelProgress.hidden = true;
    const neuralBlob = encodeWav16(rawAudio.audio, rawAudio.sampling_rate);
    setLastClip(neuralBlob, 'wav');
    saveClipToLibrary({
      engine: 'neural',
      voiceLabel: voiceSelect.options[voiceSelect.selectedIndex]?.textContent || voiceSelect.value,
      text,
      blob: neuralBlob,
      ext: 'wav',
      durationSec: rawAudio.audio.length / rawAudio.sampling_rate,
    });
    audioEngine.setVolume(parseFloat(volumeRange.value));
    setStatus('speaking');
    setPlayingUI(true);
    await audioEngine.playPCM(rawAudio.audio, rawAudio.sampling_rate, {
      onEnd: () => {
        activeSource = null;
        setStatus('idle');
        setPlayingUI(false);
      },
    });
  } catch (err) {
    modelProgress.hidden = true;
    activeSource = null;
    setStatus('idle');
    setPlayingUI(false);
    engineHint.textContent = `${err.message || err} Try the Browser engine meanwhile.`;
  }
}

async function speakElevenLabs(text) {
  const apiKey = getApiKey();
  if (!apiKey) {
    engineHint.textContent = 'Add your ElevenLabs API key in Settings first.';
    switchSection('settings');
    return;
  }
  const voiceId = voiceSelect.value;
  if (!voiceId) {
    engineHint.textContent = 'Record and clone a voice in Voice Studio first.';
    switchSection('studio');
    return;
  }

  activeSource = 'element';
  setStatus('loading');
  playBtn.disabled = true;

  try {
    const blob = await synthesize(apiKey, voiceId, text);
    setLastClip(blob, 'mp3');
    probeDuration(blob).then((durationSec) =>
      saveClipToLibrary({
        engine: 'elevenlabs',
        voiceLabel: voiceSelect.options[voiceSelect.selectedIndex]?.textContent || voiceSelect.value,
        text,
        blob,
        ext: 'mp3',
        durationSec,
      })
    );
    audioEngine.setVolume(parseFloat(volumeRange.value));
    setStatus('speaking');
    setPlayingUI(true);
    await audioEngine.play(blob, {
      onEnd: () => {
        activeSource = null;
        setStatus('idle');
        setPlayingUI(false);
      },
    });
  } catch (err) {
    activeSource = null;
    setStatus('idle');
    setPlayingUI(false);
    engineHint.textContent = err.message;
  }
}

pauseBtn.addEventListener('click', () => {
  if (activeSource === 'synth') {
    if (browserTTS.paused) {
      browserTTS.resume();
      setStatus('speaking');
    } else {
      browserTTS.pause();
      setStatus('paused');
    }
  } else if (activeSource === 'element') {
    if (audioEngine.paused) {
      audioEngine.resume();
      setStatus('speaking');
    } else {
      audioEngine.pause();
      setStatus('paused');
    }
  }
});

stopBtn.addEventListener('click', stopPlayback);

function setLastClip(blob, ext) {
  lastClipBlob = blob;
  lastClipExt = ext;
  downloadBtn.disabled = false;
  downloadBtn.title = `Download the last generated clip (.${ext})`;
}

// Inside Claude's artifact preview, saves must go through the `downloads`
// capability (plain <a download> is inert there); everywhere else — the
// standalone file, a real deployment — a normal blob link works and the
// capability doesn't exist at all. Try the capability first, fall back to
// a real download link, and only then give up with an explanation.
async function downloadBlob(blob, filename) {
  if (window.claude && typeof window.claude.use === 'function') {
    try {
      const downloads = await window.claude.use('downloads');
      if (downloads) {
        await downloads.save({ filename, data: blob });
        return { ok: true };
      }
    } catch (err) {
      if (err && err.code === 'rejected_extension') {
        return {
          ok: false,
          message: "This preview can't save audio files directly — open the standalone version to download clips.",
        };
      }
      if (err && err.code === 'declined') {
        return { ok: false, message: '' }; // user said no; not an error
      }
      return { ok: false, message: (err && err.message) || 'Download failed.' };
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err && err.message) || 'Download failed.' };
  }
}

downloadBtn.addEventListener('click', async () => {
  if (!lastClipBlob) return;
  const result = await downloadBlob(lastClipBlob, `speakscape-clip-${Date.now()}.${lastClipExt}`);
  if (result.ok) showToast('Clip downloaded');
  else if (result.message) engineHint.textContent = result.message;
});

/* ---------- Voice Studio: recording ---------- */
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

/* ---------- Live spectrum / pitch / level analysis while recording ---------- */
const SPECTRUM_BARS = 40;
const SPECTRUM_MIN_HZ = 60;
const SPECTRUM_MAX_HZ = 8000;

let currentAnalyser = null;
let currentSampleRate = 48000;
let freqBytesBuf = null;
let floatTimeBuf = null;
let analysisRafId = null;

function drawSpectrum(freqBytes, sampleRate) {
  const rect = recordCanvas.getBoundingClientRect();
  if (recordCanvas.width !== rect.width || recordCanvas.height !== rect.height) {
    recordCanvas.width = rect.width;
    recordCanvas.height = rect.height;
  }
  const w = recordCanvas.width;
  const h = recordCanvas.height;
  recordCtx.clearRect(0, 0, w, h);

  const nyquist = sampleRate / 2;
  const binHz = nyquist / freqBytes.length;
  const gap = 2;
  const barWidth = (w - gap * (SPECTRUM_BARS - 1)) / SPECTRUM_BARS;
  const logMin = Math.log10(SPECTRUM_MIN_HZ);
  const logMax = Math.log10(SPECTRUM_MAX_HZ);
  const grad = recordCtx.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0, '#3fc6ff');
  grad.addColorStop(0.6, '#ffb238');
  grad.addColorStop(1, '#ff4d4d');
  recordCtx.fillStyle = grad;

  for (let i = 0; i < SPECTRUM_BARS; i++) {
    const f0 = Math.pow(10, logMin + (i / SPECTRUM_BARS) * (logMax - logMin));
    const f1 = Math.pow(10, logMin + ((i + 1) / SPECTRUM_BARS) * (logMax - logMin));
    const bin0 = Math.max(0, Math.floor(f0 / binHz));
    const bin1 = Math.min(freqBytes.length - 1, Math.ceil(f1 / binHz));
    let sum = 0;
    let count = 0;
    for (let b = bin0; b <= bin1; b++) {
      sum += freqBytes[b];
      count++;
    }
    const avg = count > 0 ? sum / count / 255 : 0;
    const barH = Math.max(2, avg * h * 0.95);
    const x = i * (barWidth + gap);
    recordCtx.fillRect(x, h - barH, barWidth, barH);
  }
}

function updateReadouts(floatBuf, sampleRate) {
  let sumSq = 0;
  for (let i = 0; i < floatBuf.length; i++) sumSq += floatBuf[i] * floatBuf[i];
  const rms = Math.sqrt(sumSq / floatBuf.length);
  const db = rms > 0.00001 ? 20 * Math.log10(rms) : -Infinity;
  levelReadout.textContent = db === -Infinity ? '−∞ dB' : `${db.toFixed(1)} dB`;

  const freq = detectPitch(floatBuf, sampleRate);
  if (freq) {
    pitchReadout.textContent = `${freq.toFixed(0)} Hz`;
    const note = frequencyToNote(freq);
    noteReadout.textContent = note ? note.name : '—';
  } else {
    pitchReadout.textContent = '— Hz';
    noteReadout.textContent = '—';
  }
}

function resetReadouts() {
  pitchReadout.textContent = '— Hz';
  levelReadout.textContent = '−∞ dB';
  noteReadout.textContent = '—';
  recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
}

function analysisLoop() {
  if (!currentAnalyser) {
    analysisRafId = null;
    return;
  }
  currentAnalyser.getByteFrequencyData(freqBytesBuf);
  currentAnalyser.getFloatTimeDomainData(floatTimeBuf);
  drawSpectrum(freqBytesBuf, currentSampleRate);
  updateReadouts(floatTimeBuf, currentSampleRate);
  analysisRafId = requestAnimationFrame(analysisLoop);
}

if (!recorder.isSupported) {
  micHint.textContent = recorder.unavailableReason();
  recordBtn.disabled = true;
} else if (!recorder.sttSupported) {
  micHint.textContent = "Live transcript isn't supported in this browser (try Chrome or Edge) — recording still works.";
}

function describeMicError(err) {
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return "Microphone permission was denied. Click the camera/mic icon in your browser's address bar and allow access, then try again.";
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was found. Check that one is connected and enabled in your system settings.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return "Your microphone is busy — another app or browser tab may already be using it. Close it and try again.";
  }
  if (name === 'SecurityError') {
    return 'Your browser blocked microphone access for this page (insecure context). Open this file directly, or serve it over https.';
  }
  return `Couldn't access your microphone: ${(err && err.message) || err}`;
}

let isRecording = false;

recordBtn.addEventListener('click', async () => {
  if (!isRecording) {
    try {
      transcriptBox.value = '';
      resetReadouts();
      await recorder.start({
        onTranscript: (text) => (transcriptBox.value = text),
        onAnalyser: (analyser, sampleRate) => {
          currentAnalyser = analyser;
          currentSampleRate = sampleRate;
          freqBytesBuf = new Uint8Array(analyser.frequencyBinCount);
          floatTimeBuf = new Float32Array(analyser.fftSize);
          if (!analysisRafId) analysisLoop();
        },
      });
    } catch (err) {
      micHint.textContent = describeMicError(err);
      return;
    }
    micHint.textContent = '';
    isRecording = true;
    recordBtn.classList.add('recording');
    recordBtn.lastChild.textContent = ' Stop';
    recordSeconds = 0;
    recordTimer.textContent = '00:00';
    recordTimerInterval = setInterval(() => {
      recordSeconds += 1;
      recordTimer.textContent = formatTime(recordSeconds);
    }, 1000);
    recordingResult.hidden = true;
  } else {
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordBtn.lastChild.textContent = ' Record';
    clearInterval(recordTimerInterval);
    currentAnalyser = null;
    if (analysisRafId) {
      cancelAnimationFrame(analysisRafId);
      analysisRafId = null;
    }
    resetReadouts();
    const blob = await recorder.stop();
    if (blob && blob.size > 0) {
      recordingBlob = blob;
      originalRecordingBlob = blob;
      recordingExt = blob.type.includes('ogg') ? 'ogg' : 'webm';
      playbackAudio.src = URL.createObjectURL(blob);
      recordingResult.hidden = false;
      resetEffectBtn.hidden = true;
      effectHint.textContent = '';
      document.querySelectorAll('.effect-btn').forEach((b) => b.classList.remove('active'));
      updateCloneAvailability();
      saveClipToLibrary({
        engine: 'recording',
        voiceLabel: null,
        text: transcriptBox.value.trim(),
        blob,
        ext: blob.type.includes('ogg') ? 'ogg' : 'webm',
        durationSec: recordSeconds,
      });
    }
  }
});

useTranscriptBtn.addEventListener('click', () => {
  if (transcriptBox.value.trim()) {
    textInput.value = transcriptBox.value.trim();
    switchSection('speak');
  }
});

downloadRecordingBtn.addEventListener('click', async () => {
  if (!recordingBlob) return;
  const result = await downloadBlob(recordingBlob, `speakscape-recording-${Date.now()}.${recordingExt}`);
  if (result.ok) showToast('Recording downloaded');
  else if (result.message) micHint.textContent = result.message;
});

document.querySelectorAll('.effect-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!originalRecordingBlob) return;
    const name = btn.dataset.effect;
    document.querySelectorAll('.effect-btn').forEach((b) => (b.disabled = true));
    const prevLabel = btn.textContent;
    btn.textContent = 'Working…';
    effectHint.textContent = '';

    try {
      const audioBuffer = await decodeToAudioBuffer(originalRecordingBlob);
      const processed = await applyVoiceEffect(name, audioBuffer);
      const wavBlob = encodeWav16(processed.getChannelData(0), processed.sampleRate);
      recordingBlob = wavBlob;
      recordingExt = 'wav';
      playbackAudio.src = URL.createObjectURL(wavBlob);
      document.querySelectorAll('.effect-btn').forEach((b) => b.classList.toggle('active', b === btn));
      resetEffectBtn.hidden = false;
      updateCloneAvailability();
      showToast(`Applied: ${prevLabel}`);
      saveClipToLibrary({
        engine: 'recording',
        voiceLabel: `Effect: ${prevLabel}`,
        text: transcriptBox.value.trim(),
        blob: wavBlob,
        ext: 'wav',
        durationSec: processed.length / processed.sampleRate,
      });
    } catch (err) {
      effectHint.textContent = err.message || 'That effect failed to apply.';
    } finally {
      document.querySelectorAll('.effect-btn').forEach((b) => (b.disabled = false));
      btn.textContent = prevLabel;
    }
  });
});

resetEffectBtn.addEventListener('click', () => {
  if (!originalRecordingBlob) return;
  recordingBlob = originalRecordingBlob;
  recordingExt = originalRecordingBlob.type.includes('ogg') ? 'ogg' : 'webm';
  playbackAudio.src = URL.createObjectURL(originalRecordingBlob);
  document.querySelectorAll('.effect-btn').forEach((b) => b.classList.remove('active'));
  resetEffectBtn.hidden = true;
  effectHint.textContent = '';
  updateCloneAvailability();
});

function updateCloneAvailability() {
  const hasKey = !!getApiKey();
  cloneVoiceBtn.disabled = !hasKey || !recordingBlob;
  cloneHint.textContent = hasKey
    ? 'Ready to clone — this sends your recording to ElevenLabs using your API key.'
    : 'Add an ElevenLabs API key in Settings to enable cloning.';
}

cloneVoiceBtn.addEventListener('click', async () => {
  const apiKey = getApiKey();
  if (!apiKey || !recordingBlob) return;

  cloneStatus.hidden = false;
  cloneStatus.className = 'hint hint-info';
  cloneStatus.textContent = 'Uploading your voice to ElevenLabs…';
  cloneVoiceBtn.disabled = true;

  try {
    const name = `My Voice ${new Date().toLocaleString()}`;
    const voice = await cloneVoice(apiKey, recordingBlob, name, `sample.${recordingExt}`);
    saveClonedVoice(voice);
    cloneStatus.className = 'hint hint-info';
    cloneStatus.textContent = `Cloned! "${voice.name}" is now available under the My Voices engine.`;
    showToast(`Voice cloned: ${voice.name}`);
    renderClonedVoiceList();
    if (engine === 'elevenlabs') refreshVoiceOptions();
  } catch (err) {
    cloneStatus.className = 'hint';
    cloneStatus.textContent = err.message;
  } finally {
    updateCloneAvailability();
  }
});

/* ---------- Settings ---------- */
apiKeyInput.value = getApiKey();
updateCloneAvailability();

saveKeyBtn.addEventListener('click', () => {
  setApiKey(apiKeyInput.value.trim());
  keyStatus.hidden = false;
  keyStatus.className = 'hint hint-info';
  keyStatus.textContent = 'Key saved to this browser.';
  showToast('ElevenLabs key saved');
  updateCloneAvailability();
});

clearKeyBtn.addEventListener('click', () => {
  setApiKey('');
  apiKeyInput.value = '';
  keyStatus.hidden = false;
  keyStatus.className = 'hint hint-info';
  keyStatus.textContent = 'Key cleared.';
  updateCloneAvailability();
});

function renderClonedVoiceList() {
  const voices = getClonedVoices();
  clonedVoiceList.innerHTML = '';
  if (voices.length === 0) {
    const li = document.createElement('li');
    li.className = 'voice-list-empty';
    li.textContent = 'No cloned voices yet — record one in Voice Studio.';
    clonedVoiceList.appendChild(li);
    return;
  }
  voices.forEach((v) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = v.name;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.addEventListener('click', () => {
      removeClonedVoice(v.voice_id);
      renderClonedVoiceList();
      if (engine === 'elevenlabs') refreshVoiceOptions();
    });
    li.append(span, btn);
    clonedVoiceList.appendChild(li);
  });
}

/* ---------- Clip Library / Dashboard ---------- */
const clipListEl = document.getElementById('clip-list');
const libraryEmpty = document.getElementById('library-empty');
const statTotalClips = document.getElementById('stat-total-clips');
const statTotalDuration = document.getElementById('stat-total-duration');
const statTopEngine = document.getElementById('stat-top-engine');
const statTopVoice = document.getElementById('stat-top-voice');
const clearLibraryBtn = document.getElementById('clear-library-btn');
const librarySearchInput = document.getElementById('library-search');
const libraryEngineFilter = document.getElementById('library-engine-filter');
const libraryNoMatch = document.getElementById('library-no-match');

const ENGINE_LABELS = { neural: 'Neural', elevenlabs: 'ElevenLabs', recording: 'Recording' };

function probeDuration(blob) {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    const done = (val) => {
      URL.revokeObjectURL(url);
      resolve(val);
    };
    audio.addEventListener('loadedmetadata', () => done(Number.isFinite(audio.duration) ? audio.duration : null));
    audio.addEventListener('error', () => done(null));
    audio.src = url;
  });
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || !Number.isFinite(totalSeconds)) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function saveClipToLibrary({ engine, voiceLabel, text, blob, ext, durationSec }) {
  if (!clipLibrary.isSupported) return;
  try {
    await clipLibrary.addClip({ engine, voiceLabel, text, blob, ext, durationSec });
    if (!libraryView.hidden) renderLibrary();
  } catch {
    /* non-critical: library storage failing shouldn't block playback */
  }
}

let allClips = [];

async function renderLibrary() {
  const [clips, stats] = await Promise.all([clipLibrary.listClips(), clipLibrary.getStats()]);
  allClips = clips;

  statTotalClips.textContent = String(stats.totalClips);
  statTotalDuration.textContent = formatDuration(stats.totalDuration);
  statTopEngine.textContent = stats.topEngine ? ENGINE_LABELS[stats.topEngine[0]] || stats.topEngine[0] : '—';
  statTopVoice.textContent = stats.topVoice ? stats.topVoice[0] : '—';
  libraryEmpty.hidden = clips.length > 0;

  applyLibraryFilters();
}

function applyLibraryFilters() {
  const query = librarySearchInput.value.trim().toLowerCase();
  const engineFilter = libraryEngineFilter.value;

  const filtered = allClips.filter((clip) => {
    if (engineFilter !== 'all' && clip.engine !== engineFilter) return false;
    if (query && !(clip.text || '').toLowerCase().includes(query)) return false;
    return true;
  });

  libraryNoMatch.hidden = !(allClips.length > 0 && filtered.length === 0);
  clipListEl.innerHTML = '';

  for (const clip of filtered) {
    const card = document.createElement('div');
    card.className = 'clip-card';

    const meta = document.createElement('div');
    meta.className = 'clip-meta';
    const badge = document.createElement('span');
    badge.className = `clip-badge clip-badge-${clip.engine}`;
    badge.textContent = ENGINE_LABELS[clip.engine] || clip.engine;
    const time = document.createElement('span');
    time.className = 'clip-time';
    const durationLabel = clip.durationSec ? ` · ${formatDuration(clip.durationSec)}` : '';
    time.textContent = new Date(clip.timestamp).toLocaleString() + durationLabel;
    meta.append(badge, time);

    const textEl = document.createElement('p');
    textEl.className = 'clip-text';
    textEl.textContent = clip.text || '(recording — no transcript)';

    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = URL.createObjectURL(clip.blob);

    const actions = document.createElement('div');
    actions.className = 'clip-actions';
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn';
    dlBtn.textContent = 'Download';
    dlBtn.addEventListener('click', async () => {
      const label = (clip.voiceLabel || clip.engine).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const result = await downloadBlob(clip.blob, `speakscape-${label}-${clip.timestamp}.${clip.ext}`);
      if (result.ok) showToast('Clip downloaded');
      else if (result.message) showToast(result.message, 'error');
    });
    const delBtn = document.createElement('button');
    delBtn.className = 'btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async () => {
      await clipLibrary.deleteClip(clip.id);
      showToast('Clip deleted');
      renderLibrary();
    });
    actions.append(dlBtn, delBtn);

    card.append(meta, textEl, audioEl, actions);
    clipListEl.appendChild(card);
  }
}

clearLibraryBtn.addEventListener('click', async () => {
  if (!confirm('Delete every saved clip? This cannot be undone.')) return;
  await clipLibrary.clearAll();
  showToast('Library cleared');
  renderLibrary();
});

librarySearchInput.addEventListener('input', applyLibraryFilters);
libraryEngineFilter.addEventListener('change', applyLibraryFilters);

/* ---------- Studio: long-form / audiobooks ---------- */
const longformView = document.getElementById('longform-view');
const longformInput = document.getElementById('longform-input');
const longformVoice = document.getElementById('longform-voice');
const longformChunk = document.getElementById('longform-chunk');
const longformChunkValue = document.getElementById('longform-chunk-value');
const longformGap = document.getElementById('longform-gap');
const longformGapValue = document.getElementById('longform-gap-value');
const longformAnalyzeBtn = document.getElementById('longform-analyze-btn');
const longformGenerateBtn = document.getElementById('longform-generate-btn');
const longformDownloadBtn = document.getElementById('longform-download-btn');
const longformProgress = document.getElementById('longform-progress');
const longformProgressFill = document.getElementById('longform-progress-fill');
const longformProgressText = document.getElementById('longform-progress-text');
const longformHint = document.getElementById('longform-hint');
const longformAudio = document.getElementById('longform-audio');
const longformStats = document.getElementById('longform-stats');
const longformStatParts = document.getElementById('longform-stat-parts');
const longformStatChars = document.getElementById('longform-stat-chars');
const longformStatDuration = document.getElementById('longform-stat-duration');
const chapterList = document.getElementById('chapter-list');

let currentChapters = [];
let longformBlob = null;

longformChunk.addEventListener('input', () => (longformChunkValue.textContent = longformChunk.value));
longformGap.addEventListener('input', () => (longformGapValue.textContent = `${longformGap.value}s`));

function refreshLongformVoices() {
  longformVoice.innerHTML = '';
  neuralTTS.listVoices().forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.label;
    longformVoice.appendChild(opt);
  });
}

function renderChapterList() {
  chapterList.innerHTML = '';
  currentChapters.forEach((chapter) => {
    const li = document.createElement('li');
    li.className = 'chapter-item';
    li.dataset.index = String(chapter.index);

    const body = document.createElement('div');
    body.className = 'chapter-body';
    const title = document.createElement('div');
    title.className = 'chapter-title';
    title.textContent = chapter.title;
    const text = document.createElement('div');
    text.className = 'chapter-text';
    text.textContent = chapter.text;
    body.append(title, text);

    const meta = document.createElement('div');
    meta.className = 'chapter-meta';
    meta.textContent = `${chapter.chars} ch`;

    li.append(body, meta);
    chapterList.appendChild(li);
  });
}

function analyzeLongform() {
  const text = longformInput.value;
  currentChapters = splitIntoChapters(text, parseInt(longformChunk.value, 10));
  longformHint.textContent = '';
  longformBlob = null;
  longformDownloadBtn.disabled = true;
  longformAudio.hidden = true;

  if (!currentChapters.length) {
    chapterList.innerHTML = '';
    longformStats.hidden = true;
    longformGenerateBtn.disabled = true;
    longformHint.textContent = 'Paste some text first.';
    return;
  }

  const totalChars = currentChapters.reduce((sum, c) => sum + c.chars, 0);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  longformStatParts.textContent = String(currentChapters.length);
  longformStatChars.textContent = totalChars.toLocaleString();
  longformStatDuration.textContent = formatDuration((words / 150) * 60);
  longformStats.hidden = false;
  longformGenerateBtn.disabled = false;
  renderChapterList();
}

longformAnalyzeBtn.addEventListener('click', analyzeLongform);

longformGenerateBtn.addEventListener('click', async () => {
  if (!currentChapters.length) return;
  longformGenerateBtn.disabled = true;
  longformAnalyzeBtn.disabled = true;
  longformDownloadBtn.disabled = true;
  longformHint.textContent = '';
  longformProgress.hidden = false;
  longformAudio.hidden = true;

  const rendered = [];
  let sampleRate = 24000;

  try {
    for (const chapter of currentChapters) {
      const li = chapterList.querySelector(`[data-index="${chapter.index}"]`);
      if (li) li.className = 'chapter-item active';

      const pct = Math.round((chapter.index / currentChapters.length) * 100);
      longformProgressFill.style.width = `${pct}%`;
      longformProgressText.textContent = `Part ${chapter.index + 1} of ${currentChapters.length}`;

      const rawAudio = await neuralTTS.generate(
        chapter.text,
        { voice: longformVoice.value, speed: 1 },
        (data) => {
          if (data && typeof data.progress === 'number') {
            longformProgressText.textContent = `Loading voice model… ${data.progress.toFixed(0)}%`;
          }
        }
      );
      rendered.push(rawAudio.audio);
      sampleRate = rawAudio.sampling_rate;
      if (li) li.className = 'chapter-item done';
    }

    longformProgressFill.style.width = '100%';
    longformProgressText.textContent = 'Stitching…';

    const combined = concatAudio(rendered, sampleRate, parseFloat(longformGap.value));
    longformBlob = encodeWav16(combined, sampleRate);
    longformAudio.src = URL.createObjectURL(longformBlob);
    longformAudio.hidden = false;
    longformDownloadBtn.disabled = false;
    longformProgress.hidden = true;

    longformStatDuration.textContent = formatDuration(combined.length / sampleRate);
    showToast(`Rendered ${currentChapters.length} parts`);

    saveClipToLibrary({
      engine: 'neural',
      voiceLabel: longformVoice.options[longformVoice.selectedIndex]?.textContent || longformVoice.value,
      text: longformInput.value.slice(0, 300),
      blob: longformBlob,
      ext: 'wav',
      durationSec: combined.length / sampleRate,
    });
  } catch (err) {
    longformProgress.hidden = true;
    const active = chapterList.querySelector('.chapter-item.active');
    if (active) active.className = 'chapter-item failed';
    longformHint.textContent = err.message || 'Rendering failed.';
  } finally {
    longformGenerateBtn.disabled = false;
    longformAnalyzeBtn.disabled = false;
  }
});

longformDownloadBtn.addEventListener('click', async () => {
  if (!longformBlob) return;
  const result = await downloadBlob(longformBlob, `the-voice-longform-${Date.now()}.wav`);
  if (result.ok) showToast('Downloaded');
  else if (result.message) longformHint.textContent = result.message;
});

/* ---------- Modulate ---------- */
const modSourceLabel = document.getElementById('mod-source-label');
const modLoadBtn = document.getElementById('mod-load-btn');
const modPresets = document.getElementById('mod-presets');
const modPitch = document.getElementById('mod-pitch');
const modPitchValue = document.getElementById('mod-pitch-value');
const modFormant = document.getElementById('mod-formant');
const modFormantValue = document.getElementById('mod-formant-value');
const modSpeed = document.getElementById('mod-speed');
const modSpeedValue = document.getElementById('mod-speed-value');
const modApplyBtn = document.getElementById('mod-apply-btn');
const modResetBtn = document.getElementById('mod-reset-btn');
const modDownloadBtn = document.getElementById('mod-download-btn');
const modHint = document.getElementById('mod-hint');
const modAudio = document.getElementById('mod-audio');

let modSourceBuffer = null;
let modResultBlob = null;

function syncModLabels() {
  const st = parseInt(modPitch.value, 10);
  modPitchValue.textContent = `${st > 0 ? '+' : ''}${st} st`;
  modFormantValue.textContent = parseFloat(modFormant.value).toFixed(2);
  modSpeedValue.textContent = parseFloat(modSpeed.value).toFixed(2);
}

[modPitch, modFormant, modSpeed].forEach((el) =>
  el.addEventListener('input', () => {
    syncModLabels();
    document.querySelectorAll('.mod-preset-btn').forEach((b) => b.classList.remove('active'));
  })
);

function renderModPresets() {
  modPresets.innerHTML = '';
  for (const preset of PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'btn mod-preset-btn';
    btn.textContent = preset.name;
    btn.addEventListener('click', () => {
      modPitch.value = String(preset.semitones);
      modFormant.value = String(preset.formant);
      syncModLabels();
      document.querySelectorAll('.mod-preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
    modPresets.appendChild(btn);
  }
}

function refreshModSource() {
  if (modSourceBuffer) return;
  modSourceLabel.textContent = originalRecordingBlob
    ? 'A recording is available to load.'
    : 'No clip loaded — record one in Voice Studio first.';
  modLoadBtn.disabled = !originalRecordingBlob;
}

modLoadBtn.addEventListener('click', async () => {
  if (!originalRecordingBlob) return;
  modHint.textContent = '';
  try {
    const buf = await decodeToAudioBuffer(originalRecordingBlob);
    modSourceBuffer = { data: buf.getChannelData(0), sampleRate: buf.sampleRate };
    modSourceLabel.textContent = `Loaded ${(buf.duration).toFixed(1)}s clip.`;
    modApplyBtn.disabled = false;
  } catch (err) {
    modHint.textContent = err.message || 'Could not load that clip.';
  }
});

modApplyBtn.addEventListener('click', async () => {
  if (!modSourceBuffer) return;
  modApplyBtn.disabled = true;
  const label = modApplyBtn.textContent;
  modApplyBtn.textContent = 'Working…';
  modHint.textContent = '';
  // Yield so the button repaints before the synchronous DSP run.
  await new Promise((r) => setTimeout(r, 20));
  try {
    const out = modulate(modSourceBuffer.data, {
      semitones: parseInt(modPitch.value, 10),
      formant: parseFloat(modFormant.value),
      speed: parseFloat(modSpeed.value),
    });
    modResultBlob = encodeWav16(out, modSourceBuffer.sampleRate);
    modAudio.src = URL.createObjectURL(modResultBlob);
    modAudio.hidden = false;
    modDownloadBtn.disabled = false;
    showToast('Modulated');
    saveClipToLibrary({
      engine: 'recording',
      voiceLabel: 'Modulated',
      text: '',
      blob: modResultBlob,
      ext: 'wav',
      durationSec: out.length / modSourceBuffer.sampleRate,
    });
  } catch (err) {
    modHint.textContent = err.message || 'Modulation failed.';
  } finally {
    modApplyBtn.disabled = false;
    modApplyBtn.textContent = label;
  }
});

modResetBtn.addEventListener('click', () => {
  modPitch.value = '0';
  modFormant.value = '1';
  modSpeed.value = '1';
  syncModLabels();
  document.querySelectorAll('.mod-preset-btn').forEach((b) => b.classList.remove('active'));
});

modDownloadBtn.addEventListener('click', async () => {
  if (!modResultBlob) return;
  const result = await downloadBlob(modResultBlob, `the-voice-modulated-${Date.now()}.wav`);
  if (result.ok) showToast('Downloaded');
  else if (result.message) modHint.textContent = result.message;
});

/* ---------- Animate ---------- */
const animCanvas = document.getElementById('anim-canvas');
const animCtx = animCanvas.getContext('2d');
const animPlayBtn = document.getElementById('anim-play-btn');
const animTime = document.getElementById('anim-time');
const animTimeLabel = document.getElementById('anim-time-label');
const animShapeType = document.getElementById('anim-shape-type');
const animAddBtn = document.getElementById('anim-add-btn');
const animKeyBtn = document.getElementById('anim-key-btn');
const animDeleteBtn = document.getElementById('anim-delete-btn');
const animVoiceBtn = document.getElementById('anim-voice-btn');
const animExportBtn = document.getElementById('anim-export-btn');
const animShapeList = document.getElementById('anim-shape-list');
const animProps = document.getElementById('anim-props');
const animKeyframesEl = document.getElementById('anim-keyframes');
const animHint = document.getElementById('anim-hint');
const animTextInput = document.getElementById('anim-text');
const animColor = document.getElementById('anim-color');
const animReactive = document.getElementById('anim-reactive');
const animEasing = document.getElementById('anim-easing');
const animSliders = {
  x: document.getElementById('anim-x'),
  y: document.getElementById('anim-y'),
  scale: document.getElementById('anim-scale'),
  rotation: document.getElementById('anim-rotation'),
  opacity: document.getElementById('anim-opacity'),
};
const animSliderLabels = {
  x: document.getElementById('anim-x-value'),
  y: document.getElementById('anim-y-value'),
  scale: document.getElementById('anim-scale-value'),
  rotation: document.getElementById('anim-rotation-value'),
  opacity: document.getElementById('anim-opacity-value'),
};

let animScene = createScene();
let animSelectedId = null;
let animPlaying = false;
let animRaf = null;
let animStartedAt = 0;
let animLevels = null;

for (const name of EASING_NAMES) {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  animEasing.appendChild(opt);
}

const animSelected = () => animScene.shapes.find((s) => s.id === animSelectedId) || null;

function animCurrentLevel(t) {
  if (!animLevels) return 0;
  const i = Math.floor(t * animScene.fps);
  return animLevels[Math.max(0, Math.min(animLevels.length - 1, i))] || 0;
}

function animDraw() {
  const t = parseFloat(animTime.value);
  renderFrame(animCtx, animScene, t, animCanvas.width, animCanvas.height, animCurrentLevel(t));
  animTimeLabel.textContent = `${t.toFixed(2)}s`;
}

function animRenderShapeList() {
  animShapeList.innerHTML = '';
  for (const shape of animScene.shapes) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    const selected = shape.id === animSelectedId;
    btn.type = 'button';
    btn.className = 'anim-shape-item' + (selected ? ' selected' : '');
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    const name = document.createElement('span');
    name.textContent = shape.label;
    const kf = document.createElement('span');
    kf.className = 'anim-shape-kf';
    // "3kf ~" reads as nonsense in speech; spell it out for the label only.
    kf.textContent = `${shape.keyframes.length}kf${shape.reactive ? ' ~' : ''}`;
    btn.setAttribute('aria-label',
      `${shape.label}, ${shape.keyframes.length} keyframe${shape.keyframes.length === 1 ? '' : 's'}`
      + (shape.reactive ? ', reacts to voice' : ''));
    btn.append(name, kf);
    btn.addEventListener('click', () => {
      animSelectedId = shape.id;
      animRenderShapeList();
      animSyncProps();
    });
    li.appendChild(btn);
    animShapeList.appendChild(li);
  }
  const has = !!animSelected();
  animKeyBtn.disabled = !has;
  animDeleteBtn.disabled = !has;
  animExportBtn.disabled = animScene.shapes.length === 0;
}

function animRenderKeyframes() {
  animKeyframesEl.innerHTML = '';
  const shape = animSelected();
  if (!shape) return;
  for (const kf of shape.keyframes) {
    const chip = document.createElement('button');
    chip.className = 'anim-kf-chip';
    chip.textContent = `${kf.time.toFixed(2)}s ×`;
    chip.title = 'Jump here — click again to delete';
    chip.addEventListener('click', () => {
      if (Math.abs(parseFloat(animTime.value) - kf.time) < 0.005) {
        if (removeKeyframe(shape, kf.time)) {
          animRenderKeyframes();
          animRenderShapeList();
          animDraw();
        } else {
          animHint.textContent = 'A shape must keep at least one keyframe.';
        }
      } else {
        animTime.value = String(kf.time);
        animSyncProps();
        animDraw();
      }
    });
    animKeyframesEl.appendChild(chip);
  }
}

/** Push the shape's state at the playhead into the property controls. */
function animSyncProps() {
  const shape = animSelected();
  animProps.hidden = !shape;
  if (!shape) return;
  const p = sampleShape(shape, parseFloat(animTime.value));
  animSliders.x.value = String(p.x);
  animSliders.y.value = String(p.y);
  animSliders.scale.value = String(p.scale);
  animSliders.rotation.value = String(p.rotation);
  animSliders.opacity.value = String(p.opacity);
  animColor.value = p.color;
  animTextInput.value = shape.text || '';
  animReactive.checked = !!shape.reactive;
  animEasing.value = shape.easing;
  animSyncSliderLabels();
  animRenderKeyframes();
}

function animSyncSliderLabels() {
  animSliderLabels.x.textContent = animSliders.x.value;
  animSliderLabels.y.textContent = animSliders.y.value;
  animSliderLabels.scale.textContent = parseFloat(animSliders.scale.value).toFixed(1);
  animSliderLabels.rotation.textContent = animSliders.rotation.value;
  animSliderLabels.opacity.textContent = parseFloat(animSliders.opacity.value).toFixed(2);
}

/** Live edits write straight into the nearest keyframe at the playhead. */
function animCommit() {
  const shape = animSelected();
  if (!shape) return;
  setKeyframe(shape, parseFloat(animTime.value), {
    x: parseFloat(animSliders.x.value),
    y: parseFloat(animSliders.y.value),
    scale: parseFloat(animSliders.scale.value),
    rotation: parseFloat(animSliders.rotation.value),
    opacity: parseFloat(animSliders.opacity.value),
    color: animColor.value,
  });
  animSyncSliderLabels();
  animRenderKeyframes();
  animRenderShapeList();
  animDraw();
}

Object.values(animSliders).forEach((el) => el.addEventListener('input', animCommit));
animColor.addEventListener('input', animCommit);
animTextInput.addEventListener('input', () => {
  const shape = animSelected();
  if (shape) { shape.text = animTextInput.value; animDraw(); }
});
animReactive.addEventListener('change', () => {
  const shape = animSelected();
  if (shape) { shape.reactive = animReactive.checked; animRenderShapeList(); animDraw(); }
});
animEasing.addEventListener('change', () => {
  const shape = animSelected();
  if (shape) { shape.easing = animEasing.value; animDraw(); }
});

animTime.addEventListener('input', () => { animSyncProps(); animDraw(); });

animAddBtn.addEventListener('click', () => {
  const shape = createShape(animShapeType.value, parseFloat(animTime.value));
  animScene.shapes.push(shape);
  animSelectedId = shape.id;
  animRenderShapeList();
  animSyncProps();
  animDraw();
});

animKeyBtn.addEventListener('click', () => {
  animCommit();
  showToast('Keyframe set');
});

animDeleteBtn.addEventListener('click', () => {
  const i = animScene.shapes.findIndex((s) => s.id === animSelectedId);
  if (i === -1) return;
  animScene.shapes.splice(i, 1);
  animSelectedId = animScene.shapes.length ? animScene.shapes[0].id : null;
  animRenderShapeList();
  animSyncProps();
  animDraw();
});

function animStop() {
  animPlaying = false;
  animPlayBtn.textContent = 'Play';
  if (animRaf) cancelAnimationFrame(animRaf);
  animRaf = null;
}

animPlayBtn.addEventListener('click', () => {
  if (animPlaying) { animStop(); return; }
  animPlaying = true;
  animPlayBtn.textContent = 'Pause';
  animStartedAt = performance.now() - parseFloat(animTime.value) * 1000;
  const tick = () => {
    if (!animPlaying) return;
    const t = (performance.now() - animStartedAt) / 1000;
    if (t >= animScene.duration) {
      animTime.value = String(animScene.duration);
      animDraw();
      animStop();
      return;
    }
    animTime.value = String(t);
    animDraw();
    animRaf = requestAnimationFrame(tick);
  };
  tick();
});

animVoiceBtn.addEventListener('click', async () => {
  const source = modResultBlob || originalRecordingBlob || lastClipBlob;
  if (!source) {
    animHint.textContent = 'No clip yet — record one in Voice Studio, or generate speech first.';
    return;
  }
  animHint.textContent = '';
  try {
    const buf = await decodeToAudioBuffer(source);
    animScene.duration = Math.max(1, buf.duration);
    animTime.max = String(animScene.duration);
    animLevels = audioLevelTrack(buf.getChannelData(0), buf.sampleRate, animScene.fps, animScene.duration);
    showToast(`Voice loaded — ${buf.duration.toFixed(1)}s`);
    animHint.textContent = 'Tick "React to voice" on a shape to make it move with the audio.';
    animDraw();
  } catch (err) {
    animHint.textContent = err.message || 'Could not load that clip.';
  }
});

// Export renders every frame to PNG. Encoding real video in-browser needs
// a codec library; PNG frames import directly into any editor, so this
// stays honest about what it produces rather than mislabelling it.
animExportBtn.addEventListener('click', async () => {
  if (!animScene.shapes.length) return;
  const total = Math.ceil(animScene.duration * animScene.fps);
  if (total > 300) {
    animHint.textContent = `That is ${total} frames — shorten the scene before exporting.`;
    return;
  }
  animExportBtn.disabled = true;
  const label = animExportBtn.textContent;
  try {
    for (let f = 0; f < total; f++) {
      const t = f / animScene.fps;
      animExportBtn.textContent = `Frame ${f + 1}/${total}`;
      renderFrame(animCtx, animScene, t, animCanvas.width, animCanvas.height, animCurrentLevel(t));
      const blob = await new Promise((res) => animCanvas.toBlob(res, 'image/png'));
      const r = await downloadBlob(blob, `frame-${String(f).padStart(4, '0')}.png`);
      if (!r.ok) {
        animHint.textContent = r.message || 'Export cancelled.';
        break;
      }
    }
  } finally {
    animExportBtn.textContent = label;
    animExportBtn.disabled = false;
    animDraw();
  }
});

function animOnShow() {
  animTime.max = String(animScene.duration);
  animRenderShapeList();
  animSyncProps();
  animDraw();
}

/* ---------- Music ---------- */
const sequencerEl = document.getElementById('sequencer');
const musicPreset = document.getElementById('music-preset');
const musicBpm = document.getElementById('music-bpm');
const musicBpmValue = document.getElementById('music-bpm-value');
const musicSwing = document.getElementById('music-swing');
const musicSwingValue = document.getElementById('music-swing-value');
const musicBars = document.getElementById('music-bars');
const musicBarsValue = document.getElementById('music-bars-value');
const musicPlayBtn = document.getElementById('music-play-btn');
const musicVoiceBtn = document.getElementById('music-voice-btn');
const musicClearBtn = document.getElementById('music-clear-btn');
const musicDownloadBtn = document.getElementById('music-download-btn');
const musicHint = document.getElementById('music-hint');
const musicAudio = document.getElementById('music-audio');

const songKey = document.getElementById('song-key');
const songMode = document.getElementById('song-mode');
const songProgression = document.getElementById('song-progression');
const chordRow = document.getElementById('chord-row');
const progressionNote = document.getElementById('progression-note');
const lyricsInput = document.getElementById('lyrics-input');
const lyricAnalysis = document.getElementById('lyric-analysis');

const MUSIC_SR = 44100;
let musicPattern = createPattern();
let musicBlob = null;
let musicSequencerBuilt = false;

for (const name of Object.keys(PRESET_PATTERNS)) {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  musicPreset.appendChild(opt);
}
for (const k of KEYS) {
  const opt = document.createElement('option');
  opt.value = k;
  opt.textContent = k;
  songKey.appendChild(opt);
}
songKey.value = 'C';
PROGRESSIONS.forEach((prog, i) => {
  const opt = document.createElement('option');
  opt.value = String(i);
  opt.textContent = `${prog.name} — ${prog.degrees.map((d) => ['I','ii','iii','IV','V','vi','vii'][d-1]).join('–')}`;
  songProgression.appendChild(opt);
});

function buildSequencer() {
  sequencerEl.innerHTML = '';
  for (const track of TRACKS) {
    const row = document.createElement('div');
    row.className = 'seq-row';
    const label = document.createElement('span');
    label.className = 'seq-label';
    label.textContent = track.name;
    const steps = document.createElement('div');
    steps.className = 'seq-steps';

    for (let i = 0; i < STEPS; i++) {
      const cell = document.createElement('button');
      cell.className = 'seq-cell' + (i % 4 === 0 ? ' beat' : '');
      cell.dataset.track = track.id;
      cell.dataset.step = String(i);
      cell.setAttribute('aria-label', `${track.name} step ${i + 1}`);
      cell.setAttribute('aria-pressed', 'false');
      cell.addEventListener('click', () => {
        const on = !musicPattern.grid[track.id][i];
        musicPattern.grid[track.id][i] = on;
        cell.classList.toggle('on', on);
        cell.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      steps.appendChild(cell);
    }
    row.append(label, steps);
    sequencerEl.appendChild(row);
  }
  musicSequencerBuilt = true;
}

function syncSequencer() {
  for (const cell of sequencerEl.querySelectorAll('.seq-cell')) {
    const on = musicPattern.grid[cell.dataset.track][Number(cell.dataset.step)];
    cell.classList.toggle('on', !!on);
    cell.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}

musicPreset.addEventListener('change', () => {
  applyPreset(musicPattern, musicPreset.value);
  syncSequencer();
});

musicBpm.addEventListener('input', () => {
  musicPattern.bpm = parseInt(musicBpm.value, 10);
  musicBpmValue.textContent = `${musicBpm.value} bpm`;
});
musicSwing.addEventListener('input', () => {
  musicPattern.swing = parseFloat(musicSwing.value);
  musicSwingValue.textContent = parseFloat(musicSwing.value).toFixed(2);
});
musicBars.addEventListener('input', () => {
  musicBarsValue.textContent = musicBars.value;
});

function renderCurrentBeat() {
  const bars = parseInt(musicBars.value, 10);
  return renderPattern(musicPattern, MUSIC_SR, bars);
}

musicPlayBtn.addEventListener('click', async () => {
  const anyHits = TRACKS.some((t) => musicPattern.grid[t.id].some(Boolean));
  if (!anyHits) {
    musicHint.textContent = 'Nothing to play yet — tap some squares, or pick a starting pattern.';
    return;
  }
  musicHint.textContent = '';
  musicPlayBtn.disabled = true;
  const label = musicPlayBtn.textContent;
  musicPlayBtn.textContent = 'Rendering…';
  await new Promise((r) => setTimeout(r, 20));
  try {
    const audio = renderCurrentBeat();
    musicBlob = encodeWav16(audio, MUSIC_SR);
    musicAudio.src = URL.createObjectURL(musicBlob);
    musicAudio.hidden = false;
    musicDownloadBtn.disabled = false;
    musicAudio.play().catch(() => {});
    saveClipToLibrary({
      engine: 'recording',
      voiceLabel: `Beat ${musicPattern.bpm}bpm`,
      text: '',
      blob: musicBlob,
      ext: 'wav',
      durationSec: audio.length / MUSIC_SR,
    });
  } catch (err) {
    musicHint.textContent = err.message || 'Could not render that pattern.';
  } finally {
    musicPlayBtn.disabled = false;
    musicPlayBtn.textContent = label;
  }
});

musicVoiceBtn.addEventListener('click', async () => {
  const source = modResultBlob || originalRecordingBlob || lastClipBlob;
  if (!source) {
    musicHint.textContent = 'No voice clip yet — record one in Voice Studio, or generate speech first.';
    return;
  }
  musicHint.textContent = '';
  musicVoiceBtn.disabled = true;
  const label = musicVoiceBtn.textContent;
  musicVoiceBtn.textContent = 'Mixing…';
  try {
    const buf = await decodeToAudioBuffer(source);
    // Loop the beat out to at least the length of the voice, so a long
    // take doesn't run off the end of a one-bar pattern.
    const beatOneBar = patternDuration(musicPattern, 1);
    const barsNeeded = Math.max(parseInt(musicBars.value, 10), Math.ceil(buf.duration / beatOneBar));
    const beat = renderPattern(musicPattern, MUSIC_SR, barsNeeded);
    const voice = buf.sampleRate === MUSIC_SR
      ? buf.getChannelData(0)
      : resampleLinear(buf.getChannelData(0), buf.sampleRate, MUSIC_SR);
    const mixed = mixTracks(beat, voice, 0.75, 1);
    musicBlob = encodeWav16(mixed, MUSIC_SR);
    musicAudio.src = URL.createObjectURL(musicBlob);
    musicAudio.hidden = false;
    musicDownloadBtn.disabled = false;
    showToast('Voice mixed over the beat');
    saveClipToLibrary({
      engine: 'recording',
      voiceLabel: 'Voice + beat',
      text: '',
      blob: musicBlob,
      ext: 'wav',
      durationSec: mixed.length / MUSIC_SR,
    });
  } catch (err) {
    musicHint.textContent = err.message || 'Could not mix that clip.';
  } finally {
    musicVoiceBtn.disabled = false;
    musicVoiceBtn.textContent = label;
  }
});

/** Sample-rate conversion so a mic recording lines up with the beat. */
function resampleLinear(input, fromRate, toRate) {
  const ratio = fromRate / toRate;
  const outLen = Math.floor(input.length / ratio);
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

musicClearBtn.addEventListener('click', () => {
  for (const t of TRACKS) musicPattern.grid[t.id].fill(false);
  syncSequencer();
  musicHint.textContent = '';
});

musicDownloadBtn.addEventListener('click', async () => {
  if (!musicBlob) return;
  const result = await downloadBlob(musicBlob, `the-voice-beat-${Date.now()}.wav`);
  if (result.ok) showToast('Downloaded');
  else if (result.message) musicHint.textContent = result.message;
});

function renderChords() {
  const progression = PROGRESSIONS[parseInt(songProgression.value || '0', 10)];
  const chords = progressionInKey(progression, songKey.value, songMode.value);
  chordRow.innerHTML = '';
  for (const chord of chords) {
    const card = document.createElement('div');
    card.className = 'chord-card';
    const name = document.createElement('div');
    name.className = 'chord-name';
    name.textContent = chord.name;
    const numeral = document.createElement('div');
    numeral.className = 'chord-numeral';
    numeral.textContent = chord.numeral;
    card.append(name, numeral);
    chordRow.appendChild(card);
  }
  progressionNote.textContent = progression.note;
}

[songKey, songMode, songProgression].forEach((el) => el.addEventListener('change', renderChords));

function renderLyricAnalysis() {
  const text = lyricsInput.value;
  lyricAnalysis.innerHTML = '';
  if (!text.trim()) return;
  for (const row of analyseLyrics(text)) {
    if (!row.line) continue;
    const div = document.createElement('div');
    div.className = 'lyric-line';
    const syl = document.createElement('span');
    syl.className = 'lyric-syl';
    syl.textContent = String(row.syllables);
    const rhyme = document.createElement('span');
    rhyme.className = 'lyric-rhyme';
    rhyme.textContent = row.rhyme;
    const txt = document.createElement('span');
    txt.className = 'lyric-text';
    txt.textContent = row.line;
    div.append(syl, rhyme, txt);
    lyricAnalysis.appendChild(div);
  }
}

lyricsInput.addEventListener('input', renderLyricAnalysis);

function musicOnShow() {
  if (!musicSequencerBuilt) {
    buildSequencer();
    applyPreset(musicPattern, musicPreset.value);
    renderChords();
  }
  syncSequencer();
}

/* ---------- Payment link settings ---------- */
const linkStudioInput = document.getElementById('link-studio-input');
const linkProInput = document.getElementById('link-pro-input');
const saveLinksBtn = document.getElementById('save-links-btn');
const linksStatus = document.getElementById('links-status');

function loadPaymentLinkInputs() {
  const links = getPaymentLinks();
  linkStudioInput.value = links.studio || '';
  linkProInput.value = links.pro || '';
}

saveLinksBtn.addEventListener('click', () => {
  setPaymentLink('studio', linkStudioInput.value.trim());
  setPaymentLink('pro', linkProInput.value.trim());
  linksStatus.hidden = false;
  linksStatus.className = 'hint hint-info';
  linksStatus.textContent = 'Payment links saved.';
  showToast('Payment links saved');
});

/* ---------- Plans ---------- */
const planGrid = document.getElementById('plan-grid');
const plansCurrent = document.getElementById('plans-current');
const plansHint = document.getElementById('plans-hint');

async function renderPlans() {
  const session = await getCurrentSession().catch(() => null);
  // The subscriptions row is what the webhook writes, so it reflects a
  // payment straight away; the JWT's copy lags until the token refreshes.
  const tablePlan = await fetchSubscriptionPlan().catch(() => null);
  const currentPlan = resolvePlan(session, tablePlan);
  const links = getPaymentLinks();

  plansCurrent.textContent = `Current plan: ${planLabel(currentPlan)}`;
  plansHint.textContent = '';
  planGrid.innerHTML = '';

  for (const plan of PLANS) {
    const card = document.createElement('div');
    card.className = `plan-card${plan.id === currentPlan ? ' current' : ''}`;

    const name = document.createElement('div');
    name.className = 'plan-name';
    name.textContent = plan.name;

    const price = document.createElement('div');
    price.className = 'plan-price';
    price.textContent = plan.price;

    const cadence = document.createElement('div');
    cadence.className = 'plan-cadence';
    cadence.textContent = plan.cadence;

    const features = document.createElement('ul');
    features.className = 'plan-features';
    for (const feature of plan.features) {
      const li = document.createElement('li');
      li.textContent = feature;
      features.appendChild(li);
    }

    card.append(name, price, cadence, features);

    if (plan.id === currentPlan) {
      const tag = document.createElement('div');
      tag.className = 'plan-current-tag';
      tag.textContent = 'Active';
      card.appendChild(tag);
    } else if (plan.id !== 'free') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = `Upgrade to ${plan.name}`;
      const url = checkoutUrl(plan.id, session);
      if (!url) {
        btn.disabled = true;
        btn.title = 'No payment link configured for this plan yet.';
      } else {
        btn.addEventListener('click', () => {
          markAwaitingUpgrade(plan.id);
          window.open(url, '_blank', 'noopener');
          startUpgradeWatch();
        });
      }
      card.appendChild(btn);
    }

    planGrid.appendChild(card);
  }

  if (upgradeWatchMessage) {
    plansHint.className = 'hint hint-info';
    plansHint.textContent = upgradeWatchMessage;
  } else if (!Object.keys(links).length) {
    plansHint.className = 'hint hint-info';
    plansHint.textContent = 'Add Stripe payment links in Settings to enable upgrades.';
  }

  return currentPlan;
}

/* ---------- Picking up a completed payment ---------- */
//
// Checkout happens in Stripe's tab and the upgrade is applied by the webhook
// on Supabase's servers. Neither of those touches this page, so a buyer who
// switches back would otherwise sit looking at "Free" with nothing to
// suggest the payment worked. Watch for the plan changing and say so.
//
// Note what this does NOT do: it never sets a plan. It only re-reads what
// the server decided, so nothing here can be edited into a free upgrade.
let upgradeWatchTimer = null;
let upgradeWatchRunning = false;
let upgradeWatchMessage = '';

function stopUpgradeWatch(message = '') {
  if (upgradeWatchTimer !== null) {
    clearTimeout(upgradeWatchTimer);
    upgradeWatchTimer = null;
  }
  upgradeWatchRunning = false;
  upgradeWatchMessage = message;
}

async function startUpgradeWatch() {
  const pending = awaitingUpgrade();
  // Claim the watch synchronously: the baseline reads below are awaited, and
  // a second call arriving in that gap would otherwise start a rival poller.
  if (!pending || upgradeWatchRunning) return;
  upgradeWatchRunning = true;

  // Say so before the first check rather than after it — a buyer coming back
  // from Stripe should not meet a page that looks like nothing happened.
  upgradeWatchMessage = 'Confirming your payment with Stripe…';
  if (!plansView.hidden) renderPlans();

  const before = resolvePlan(
    await getCurrentSession().catch(() => null),
    await fetchSubscriptionPlan().catch(() => null),
  );

  let attempt = 0;
  const poll = async () => {
    upgradeWatchTimer = null;
    const plan = await fetchSubscriptionPlan().catch(() => null);

    if (plan && plan !== before && plan !== 'free') {
      // Bring the token in line too, so anything reading app_metadata
      // elsewhere sees the same plan the table does.
      await refreshSession().catch(() => null);
      clearAwaitingUpgrade();
      stopUpgradeWatch('');
      showToast(`You're on ${planLabel(plan)} — thanks.`);
      if (!plansView.hidden) renderPlans();
      return;
    }

    attempt += 1;
    if (attempt >= MAX_UPGRADE_POLLS) {
      // Stripe retries a failed webhook for hours, so "not yet" is a far
      // more likely story than "it failed" — say so rather than alarming.
      stopUpgradeWatch('Payment received. The upgrade can take a minute to land — reopen this page shortly, or use Check for updates.');
      if (!plansView.hidden) renderPlans();
      return;
    }

    upgradeWatchMessage = 'Confirming your payment with Stripe…';
    if (!plansView.hidden) renderPlans();
    upgradeWatchTimer = setTimeout(poll, nextPollDelay(attempt));
  };

  upgradeWatchTimer = setTimeout(poll, nextPollDelay(0));
}

// Coming back from the Stripe tab is the moment worth checking on.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) startUpgradeWatch();
});

plansRefreshBtn.addEventListener('click', async () => {
  const label = plansRefreshBtn.textContent;
  plansRefreshBtn.disabled = true;
  plansRefreshBtn.textContent = 'Checking…';
  stopUpgradeWatch('');
  try {
    await refreshSession().catch(() => null);
    const plan = await renderPlans();
    showToast(`Plan confirmed: ${planLabel(plan)}`);
    if (plan !== 'free') clearAwaitingUpgrade();
  } finally {
    plansRefreshBtn.disabled = false;
    plansRefreshBtn.textContent = label;
  }
});

/* ---------- Account ---------- */
const accountEmailDisplay = document.getElementById('account-email-display');
const signoutBtn = document.getElementById('signout-btn');

async function renderAccountView() {
  const session = await getCurrentSession().catch(() => null);
  accountEmailDisplay.textContent = session ? session.user.email : '';
}

signoutBtn.addEventListener('click', async () => {
  await signOutUser();
  showGate();
});

/* ---------- Entry gate ---------- */
const gate = document.getElementById('gate');
const appShell = document.getElementById('app-shell');
const gateForms = document.getElementById('gate-forms');
const gateEmail = document.getElementById('gate-email');
const gatePassword = document.getElementById('gate-password');
const gateLoginBtn = document.getElementById('gate-login-btn');
const gateSignupBtn = document.getElementById('gate-signup-btn');
const gateStatus = document.getElementById('gate-status');
const gateSetupToggle = document.getElementById('gate-setup-toggle');
const gateSetupPanel = document.getElementById('gate-setup-panel');
const gateSupabaseUrl = document.getElementById('gate-supabase-url');
const gateSupabaseKey = document.getElementById('gate-supabase-key');
const gateConnectBtn = document.getElementById('gate-connect-btn');

function setGateStatus(message, kind = 'error') {
  gateStatus.textContent = message || '';
  gateStatus.className = `gate-status${kind === 'info' ? ' info' : ''}`;
}

function showGate() {
  gate.hidden = false;
  appShell.hidden = true;
  gatePassword.value = '';

  // Without a backend there is nobody to authenticate against, so lead with
  // setup rather than letting someone submit into a void. Once a project is
  // connected the same control steps back to a quiet way to change it.
  const configured = isBackendConfigured();
  gateForms.hidden = !configured;
  gateSetupToggle.hidden = false;
  gateSetupToggle.classList.toggle('needed', !configured);
  gateSetupToggle.textContent = configured ? 'Change Supabase project' : 'Connect Supabase';

  if (!configured) {
    gateSetupPanel.hidden = false;
    setGateStatus('Connect a Supabase project to enable accounts.', 'info');
  } else {
    gateSetupPanel.hidden = true;
  }
}

function enterApp() {
  gate.hidden = true;
  gateSetupToggle.hidden = true;
  appShell.hidden = false;
  switchSection('speak');
}

async function attemptAuth(mode) {
  const email = gateEmail.value.trim();
  const password = gatePassword.value;
  if (!email || !password) {
    setGateStatus('Enter an email and password.');
    return;
  }
  gateLoginBtn.disabled = true;
  gateSignupBtn.disabled = true;
  setGateStatus(mode === 'signup' ? 'Creating account…' : 'Verifying…', 'info');
  try {
    if (mode === 'signup') {
      const data = await supabaseSignUp(email, password);
      if (data.session) {
        enterApp();
      } else {
        setGateStatus('Check your email to confirm your account.', 'info');
      }
    } else {
      await supabaseSignIn(email, password);
      enterApp();
    }
  } catch (err) {
    setGateStatus(err.message);
  } finally {
    gateLoginBtn.disabled = false;
    gateSignupBtn.disabled = false;
  }
}

gateLoginBtn.addEventListener('click', () => attemptAuth('login'));
gateSignupBtn.addEventListener('click', () => attemptAuth('signup'));
gatePassword.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') attemptAuth('login');
});

document.querySelectorAll('.oauth-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    setGateStatus('Redirecting…', 'info');
    try {
      await signInWithProvider(btn.dataset.provider);
    } catch (err) {
      setGateStatus(err.message);
    }
  });
});

gateSetupToggle.addEventListener('click', () => {
  gateSetupPanel.hidden = !gateSetupPanel.hidden;
});

gateConnectBtn.addEventListener('click', async () => {
  const url = gateSupabaseUrl.value.trim();
  const key = gateSupabaseKey.value.trim();
  if (!url || !key) {
    setGateStatus('Enter both the project URL and the anon key.');
    return;
  }
  setSupabaseConfig(url, key);
  setGateStatus('Connecting…', 'info');
  try {
    await getCurrentSession();
    setGateStatus('Connected.', 'info');
    gateSetupPanel.hidden = true;
    gateForms.hidden = false;
    // The job this button existed for is done — step it back so it stops
    // competing with the sign-in form it was blocking.
    gateSetupToggle.classList.remove('needed');
    gateSetupToggle.textContent = 'Change Supabase project';
  } catch (err) {
    clearSupabaseConfig();
    setGateStatus(err.message);
  }
});

onAuthChange((event) => {
  if (event === 'SIGNED_OUT') showGate();
});

async function bootstrapAuth() {
  if (!isBackendConfigured()) {
    showGate();
    return;
  }
  try {
    const session = await getCurrentSession();
    if (session) enterApp();
    else showGate();
  } catch {
    showGate();
  }
}

/* ---------- Project ---------- */
const projectSummary = document.getElementById('project-summary');
const projectVoiceSel = document.getElementById('project-voice');
const projectBeatSel = document.getElementById('project-beat');
const projectSceneSel = document.getElementById('project-scene');
const projectVoiceGain = document.getElementById('project-voice-gain');
const projectVoiceGainValue = document.getElementById('project-voice-gain-value');
const projectBeatGain = document.getElementById('project-beat-gain');
const projectBeatGainValue = document.getElementById('project-beat-gain-value');
const projectOffset = document.getElementById('project-offset');
const projectOffsetValue = document.getElementById('project-offset-value');
const projectLoop = document.getElementById('project-loop');
const projectFade = document.getElementById('project-fade');
const projectBuildBtn = document.getElementById('project-build-btn');
const projectRefreshBtn = document.getElementById('project-refresh-btn');
const projectAudioBtn = document.getElementById('project-audio-btn');
const projectFramesBtn = document.getElementById('project-frames-btn');
const projectHint = document.getElementById('project-hint');
const projectAudio = document.getElementById('project-audio');
const projectStage = document.getElementById('project-stage');
const projectCanvas = document.getElementById('project-canvas');
const projectCtx = projectCanvas.getContext('2d');

const PROJECT_SR = MUSIC_SR;
let projectBlob = null;
let projectMix = null;      // Float32Array of the last build
let projectLevels = null;   // per-frame loudness, for the reactive scene
let projectDuration = 0;
let projectRaf = null;

/** The take that hasn't been saved to the library yet, if there is one. */
function projectSessionTake() {
  return modResultBlob || originalRecordingBlob || lastClipBlob || null;
}

async function projectRefreshSources() {
  const keep = projectVoiceSel.value;
  projectVoiceSel.innerHTML = '<option value="">None</option>';

  if (projectSessionTake()) {
    const opt = document.createElement('option');
    opt.value = 'session';
    opt.textContent = 'This session’s latest take';
    projectVoiceSel.appendChild(opt);
  }

  let clips = [];
  try {
    clips = await clipLibrary.listClips();
  } catch {
    /* library unavailable: the session take alone is still usable */
  }
  for (const clip of clips.slice(0, 50)) {
    const opt = document.createElement('option');
    opt.value = clip.id;
    const when = new Date(clip.timestamp).toLocaleString();
    opt.textContent = `${clip.voiceLabel || 'Clip'} · ${formatDuration(clip.durationSec)} · ${when}`;
    projectVoiceSel.appendChild(opt);
  }

  // Keep the operator's choice across a refresh where the clip still exists.
  if (keep && [...projectVoiceSel.options].some((o) => o.value === keep)) {
    projectVoiceSel.value = keep;
  } else if (!keep) {
    projectVoiceSel.value = projectSessionTake() ? 'session' : '';
  }

  projectUpdateSummary();
}

/** Resolve the voice picker to a blob, or null. */
async function projectVoiceBlob() {
  const v = projectVoiceSel.value;
  if (!v) return null;
  if (v === 'session') return projectSessionTake();
  const clips = await clipLibrary.listClips();
  const clip = clips.find((c) => c.id === v);
  return clip ? clip.blob : null;
}

function projectUsesBeat() {
  return projectBeatSel.value === 'current' && TRACKS.some((t) => musicPattern.grid[t.id].some(Boolean));
}

function projectUsesScene() {
  return projectSceneSel.value === 'current' && animScene.shapes.length > 0;
}

function projectUpdateSummary() {
  const bits = [];
  const voiceOpt = projectVoiceSel.selectedOptions[0];
  if (projectVoiceSel.value) bits.push(`voice: ${voiceOpt.textContent.split(' · ')[0]}`);
  if (projectBeatSel.value === 'current') {
    bits.push(projectUsesBeat()
      ? `beat: ${musicPattern.bpm}bpm × ${musicBars.value} bar${musicBars.value === '1' ? '' : 's'}`
      : 'beat: pattern is empty');
  }
  if (projectSceneSel.value === 'current') {
    bits.push(projectUsesScene()
      ? `scene: ${animScene.shapes.length} shape${animScene.shapes.length === 1 ? '' : 's'}`
      : 'scene: nothing drawn yet');
  }
  projectSummary.textContent = bits.length ? bits.join('  ·  ') : 'Nothing added yet.';
}

/**
 * Render a beat bed long enough to sit under the whole piece.
 *
 * renderPattern appends a ring-out tail so the last hit isn't cut off, which
 * means tiling its output would punch a half-second hole into the groove at
 * every loop point. Render the bars actually needed in one pass instead, and
 * the mixer never has to tile at all.
 */
function projectBeatBed(neededSec) {
  const oneBar = patternDuration(musicPattern, 1);
  const chosen = parseInt(musicBars.value, 10);
  const bars = projectLoop.checked
    ? Math.max(chosen, Math.ceil(neededSec / oneBar))
    : chosen;
  return renderPattern(musicPattern, PROJECT_SR, Math.min(bars, 64));
}

projectVoiceGain.addEventListener('input', () => {
  projectVoiceGainValue.textContent = parseFloat(projectVoiceGain.value).toFixed(2);
});
projectBeatGain.addEventListener('input', () => {
  projectBeatGainValue.textContent = parseFloat(projectBeatGain.value).toFixed(2);
});
projectOffset.addEventListener('input', () => {
  projectOffsetValue.textContent = `${parseFloat(projectOffset.value).toFixed(1)}s`;
});
for (const el of [projectVoiceSel, projectBeatSel, projectSceneSel]) {
  el.addEventListener('change', projectUpdateSummary);
}
projectRefreshBtn.addEventListener('click', () => {
  projectRefreshSources();
  projectHint.textContent = '';
});

projectBuildBtn.addEventListener('click', async () => {
  const label = projectBuildBtn.textContent;
  projectBuildBtn.disabled = true;
  projectBuildBtn.textContent = 'Building…';
  projectHint.textContent = '';
  try {
    const blob = await projectVoiceBlob();
    if (!blob && !projectUsesBeat()) {
      projectHint.textContent = 'Pick a voice clip, or build a beat in Music first — a project needs at least one of them.';
      return;
    }

    let voice = null;
    if (blob) {
      const buf = await decodeToAudioBuffer(blob);
      voice = buf.sampleRate === PROJECT_SR
        ? buf.getChannelData(0)
        : resampleLinear(buf.getChannelData(0), buf.sampleRate, PROJECT_SR);
    }

    const offsetSec = parseFloat(projectOffset.value);
    const neededSec = voice ? offsetSec + voice.length / PROJECT_SR : 0;
    const beat = projectUsesBeat() ? projectBeatBed(neededSec) : null;

    const mix = composeAudio({
      voice,
      beat,
      sampleRate: PROJECT_SR,
      voiceGain: parseFloat(projectVoiceGain.value),
      beatGain: parseFloat(projectBeatGain.value),
      voiceOffsetSec: offsetSec,
      loopBeat: projectLoop.checked,
    });
    if (projectFade.checked) fadeOut(mix, PROJECT_SR);

    projectMix = mix;
    projectDuration = mix.length / PROJECT_SR;
    projectBlob = encodeWav16(mix, PROJECT_SR);

    if (projectAudio.src) URL.revokeObjectURL(projectAudio.src);
    projectAudio.src = URL.createObjectURL(projectBlob);
    projectAudio.hidden = false;
    projectAudioBtn.disabled = false;

    // The payoff of combining the two halves: the scene reacts to the
    // finished mix, not to the voice alone.
    if (projectUsesScene()) {
      animScene.duration = Math.max(1, projectDuration);
      projectLevels = audioLevelTrack(mix, PROJECT_SR, animScene.fps, animScene.duration);
      projectStage.hidden = false;
      projectFramesBtn.disabled = false;
      projectDrawAt(0);
    } else {
      projectLevels = null;
      projectStage.hidden = true;
      projectFramesBtn.disabled = true;
    }

    projectHint.textContent = '';
    showToast(`Project built — ${formatDuration(projectDuration)}`);
    saveClipToLibrary({
      engine: 'recording',
      voiceLabel: 'Project mix',
      text: '',
      blob: projectBlob,
      ext: 'wav',
      durationSec: projectDuration,
    });
    projectUpdateSummary();
  } catch (err) {
    projectHint.textContent = err.message || 'Could not build that project.';
  } finally {
    projectBuildBtn.disabled = false;
    projectBuildBtn.textContent = label;
  }
});

function projectLevelAt(t) {
  if (!projectLevels || !projectLevels.length) return 0;
  const i = Math.floor(t * animScene.fps);
  return projectLevels[Math.max(0, Math.min(projectLevels.length - 1, i))] || 0;
}

function projectDrawAt(t) {
  if (!projectUsesScene()) return;
  renderFrame(projectCtx, animScene, t, projectCanvas.width, projectCanvas.height, projectLevelAt(t));
}

// Drive the scene from the audio element's own clock, so scrubbing and
// pausing the preview move the picture with it rather than drifting.
function projectFollowAudio() {
  projectDrawAt(projectAudio.currentTime);
  projectRaf = requestAnimationFrame(projectFollowAudio);
}
projectAudio.addEventListener('play', () => {
  if (projectRaf === null) projectFollowAudio();
});
for (const ev of ['pause', 'ended', 'seeked']) {
  projectAudio.addEventListener(ev, () => {
    if (projectRaf !== null) { cancelAnimationFrame(projectRaf); projectRaf = null; }
    projectDrawAt(projectAudio.currentTime);
  });
}

projectAudioBtn.addEventListener('click', async () => {
  if (!projectBlob) return;
  const r = await downloadBlob(projectBlob, `project-${Date.now()}.wav`);
  if (!r.ok) projectHint.textContent = r.message || 'Download cancelled.';
});

// Frames plus the WAV are what an editor needs to assemble the video. Encoding
// a real video file in-browser needs a codec library, so this says what it
// produces instead of mislabelling it.
projectFramesBtn.addEventListener('click', async () => {
  if (!projectUsesScene()) return;
  const total = Math.ceil(animScene.duration * animScene.fps);
  if (total > 300) {
    projectHint.textContent = `That is ${total} frames — shorten the project before exporting.`;
    return;
  }
  projectFramesBtn.disabled = true;
  const label = projectFramesBtn.textContent;
  try {
    for (let f = 0; f < total; f++) {
      projectFramesBtn.textContent = `Frame ${f + 1}/${total}`;
      projectDrawAt(f / animScene.fps);
      const blob = await new Promise((res) => projectCanvas.toBlob(res, 'image/png'));
      const r = await downloadBlob(blob, `project-frame-${String(f).padStart(4, '0')}.png`);
      if (!r.ok) {
        projectHint.textContent = r.message || 'Export cancelled.';
        break;
      }
    }
  } finally {
    projectFramesBtn.textContent = label;
    projectFramesBtn.disabled = false;
    projectDrawAt(projectAudio.currentTime);
  }
});

function projectOnShow() {
  projectRefreshSources();
}

/* ---------- Init ---------- */
// Tells the inline boot guard in the page that the module actually ran.
window.__voiceBooted = true;
refreshVoiceOptions();
refreshLongformVoices();
loadPaymentLinkInputs();
renderModPresets();
syncModLabels();
updateEngineChrome();
renderClonedVoiceList();
updateTextStats();
bootstrapAuth();
startUpgradeWatch();
