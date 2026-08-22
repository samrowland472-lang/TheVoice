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
import { initDaw, setDawMode, showDaw } from './daw.js';
import { emitVoice } from './bus.js';
import { wordCount, clipToWords, chunkScript, formatEta, MAX_SPEAK_WORDS } from './speak-script.js';
import { analyseLyrics, scaleChords, progressionInKey, KEYS, PROGRESSIONS } from './songcraft.js';
import { composeAudio, fadeOut, describeProject, loopToLength } from './project.js';
import { createScene, createShape, setKeyframe, removeKeyframe, sampleShape,
         renderFrame, audioLevelTrack, registerImage, hydrateSceneImages,
         serializeScene, deserializeScene, enable3D, disable3D, is3D,
         setCameraKey, removeCameraKey, cameraKeys,
         setLightKey, removeLightKey, lightKeys, shapePathScreen,
         cameraAt, worldTransforms, attachSceneModel,
         hydrateSceneModels, resolveFrame, localDelta } from './animation.js';
import { readModel, flattenModel, GltfError } from './gltf.js';
import { pickAt, dragToWorld, selectionOutline } from './picking.js';
import { actOnScene } from './casting.js';
import { gizmoHandles, pickHandle, axisMoveAmount, rotationForDrag, scaleForDrag,
         AXES, GIZMO_MODES, AXIS_ROTATION_CHANNEL } from './gizmo.js';
import { treeOrder, setParent, wouldCycle, childrenOf, depthOf, ancestorsOf,
         MAX_DEPTH } from './scenegraph.js';
import { normaliseSelection, applyClick, selectionRoots, duplicateShapes,
         deleteShapes } from './selection.js';
import { resolveEasing, easingPoints, hasOvershoot, EASING_CURVES, ALL_EASING_NAMES } from './easing.js';
import { createCamera, orbit, dolly, distanceTo, framingDistance,
         projectPoint, CAMERA_PRESETS } from './camera3d.js';
import { isMeshType, registerMesh } from './mesh3d.js';
import { createLight } from './light3d.js';
import { createGLRenderer, glRenderFrame } from './webgl3d.js';
import { recordScene, canRecord, frameCount } from './videoexport.js';
import { createAutosave, workspaceHasContent, describeWorkspace } from './autosave.js';
import { createHistory, historyIntent, isTextEntry } from './history.js';
import { timeToX, xToTime, rowY, rowAt, timelineHeight, hitTestKeyframe,
         moveKeyframe, snapToFrame, rulerTicks, ROW_HEIGHT, RULER_HEIGHT } from './timeline.js';
import { parseLocalCommand, requestScene, getAgentEndpoint, setAgentEndpoint,
         defaultEndpointFor, isAgentConfigured } from './agent.js';
import { pickFile, pickValidated, validateFile, readText, readJson, readDataUrl,
         loadImage, makeDropTarget, guardStrayDrops, fileExtension, ACCEPT,
         readArrayBuffer } from './files.js';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig,
  isBackendConfigured,
  supabaseSignUp,
  supabaseSignIn,
  signInWithProvider,
  signOutUser,
  getCurrentSession,
  onAuthChange,
  canReachAuthSdk,
  fetchSubscriptionPlan,
  refreshSession,
  checkSupabasePair,
  verifyBackend,
} from './account.js';
import {
  getApiKey,
  setApiKey,
  getClonedVoices,
  saveClonedVoice,
  removeClonedVoice,
  cloneVoice,
  synthesize,
  probeElevenLabsKey,
  keyFingerprint,
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
const studioMic = document.getElementById('studio-mic');
const studioGain = document.getElementById('studio-gain');
const studioGainVal = document.getElementById('studio-gain-val');
const studioMonitor = document.getElementById('studio-monitor');
const studioMonVol = document.getElementById('studio-mon-vol');
const studioPauseBtn = document.getElementById('studio-pause-btn');
const studioCloneName = document.getElementById('studio-clone-name');
const studioVuFill = document.getElementById('studio-vu-fill');
const studioVuPeak = document.getElementById('studio-vu-peak');

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
  musicView.hidden = section !== 'music' && section !== 'dj';
  projectView.hidden = section !== 'project';

  if (isConsole) switchTab(section);
  if (section === 'library') renderLibrary();
  if (section === 'account') renderAccountView();
  if (section === 'settings') renderSettings();
  if (section === 'plans') renderPlans();
  if (section === 'modulate') refreshModSource();
  if (section === 'animate') animOnShow();
  const shell = document.getElementById('app-shell');
  if (shell) shell.classList.toggle('is-daw', section === 'music' || section === 'dj');
  if (section === 'music') { musicOnShow(); setDawMode('produce'); }
  if (section === 'dj') { musicOnShow(); setDawMode('dj'); }
  if (section === 'project') projectOnShow();
}

document.querySelectorAll('.sidebar-item').forEach((btn) => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

const sidebarNav = document.getElementById('sidebar-nav');
if (sidebarNav) {
  sidebarNav.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp' && ev.key !== 'Home' && ev.key !== 'End') return;
    const items = [...sidebarNav.querySelectorAll('.sidebar-item')];
    if (!items.length) return;
    ev.preventDefault();
    let i = items.indexOf(document.activeElement);
    if (i < 0) i = items.findIndex((b) => b.classList.contains('active'));
    if (ev.key === 'Home') i = 0;
    else if (ev.key === 'End') i = items.length - 1;
    else i = (i + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[i].focus();
    items[i].click();
  });
}

document.addEventListener('keydown', (ev) => {
  const tag = ev.target && ev.target.tagName;
  const inField = tag === 'INPUT' || tag === 'SELECT';
  if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
    const speakOpen = consoleView && !consoleView.hidden && document.querySelector('[data-panel="speak"].active');
    if (speakOpen) {
      ev.preventDefault();
      playBtn.click();
    }
    return;
  }
  if (ev.key === 'Escape' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    stopPlayback();
  }
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
  const words = wordCount(text);
  const rate = parseFloat(rateRange.value) || 1;
  const estSeconds = (words / AVG_WORDS_PER_MINUTE) * 60 / rate;
  const over = words > MAX_SPEAK_WORDS;
  const left = Math.max(0, MAX_SPEAK_WORDS - words);
  textStats.textContent = over
    ? `${words.toLocaleString()} / ${MAX_SPEAK_WORDS.toLocaleString()} words — extra will be cut · ${formatEta(estSeconds)}`
    : `${words.toLocaleString()} / ${MAX_SPEAK_WORDS.toLocaleString()} words · ${left.toLocaleString()} left · ${formatEta(estSeconds)}`;
  textStats.classList.toggle('is-over', over);
}

textInput.addEventListener('input', () => {
  const words = wordCount(textInput.value);
  if (words > MAX_SPEAK_WORDS) {
    textInput.value = clipToWords(textInput.value);
    showToast(`Speak is capped at ${MAX_SPEAK_WORDS.toLocaleString()} words.`, 'error');
  }
  updateTextStats();
});

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

let speakGen = 0;
let playbackWait = null;
function releasePlaybackWait() {
  if (playbackWait) {
    const done = playbackWait;
    playbackWait = null;
    done();
  }
}

/* ---------- Playback control ---------- */
function stopPlayback() {
  speakGen += 1;
  browserTTS.stop();
  audioEngine.stop();
  activeSource = null;
  setStatus('idle');
  setPlayingUI(false);
  renderHighlight('', null, null);
  releasePlaybackWait();
  if (typeof stopLibraryPlay === 'function') stopLibraryPlay();
  if (typeof stopProjectPlay === 'function') stopProjectPlay();
  if (typeof stopModPlay === 'function') stopModPlay();
  if (typeof stopLongformPlay === 'function') stopLongformPlay();
}

playBtn.addEventListener('click', async () => {
  let text = textInput.value.trim();
  if (!text) return;
  if (wordCount(text) > MAX_SPEAK_WORDS) {
    text = clipToWords(text).trim();
    textInput.value = text;
    updateTextStats();
    showToast(`Trimmed to ${MAX_SPEAK_WORDS.toLocaleString()} words.`);
  }
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
  const chunks = chunkScript(text, 480);
  browserTTS.speakQueue(chunks, {
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
  const gen = speakGen;
  const chunks = chunkScript(text, 720);
  activeSource = 'element';
  setStatus('loading');
  playBtn.disabled = true;
  const alreadyLoaded = neuralTTS.isLoaded();
  if (!alreadyLoaded) modelProgress.hidden = false;

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (gen !== speakGen) return;
      if (chunks.length > 1) {
        engineHint.textContent = `Neural ${i + 1} / ${chunks.length}`;
      }
      const rawAudio = await neuralTTS.generate(
        chunks[i].text,
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
      if (gen !== speakGen) return;
      modelProgress.hidden = true;
      if (i === 0) {
        const neuralBlob = encodeWav16(rawAudio.audio, rawAudio.sampling_rate);
        setLastClip(neuralBlob, 'wav');
        if (chunks.length === 1) {
          saveClipToLibrary({
            engine: 'neural',
            voiceLabel: voiceSelect.options[voiceSelect.selectedIndex]?.textContent || voiceSelect.value,
            text,
            blob: neuralBlob,
            ext: 'wav',
            durationSec: rawAudio.audio.length / rawAudio.sampling_rate,
          });
        }
      }
      audioEngine.setVolume(parseFloat(volumeRange.value));
      setStatus('speaking');
      setPlayingUI(true);
      await new Promise((resolve) => {
        playbackWait = resolve;
        audioEngine.playPCM(rawAudio.audio, rawAudio.sampling_rate, {
          onEnd: () => { releasePlaybackWait(); },
        });
      });
    }
    if (gen === speakGen) {
      activeSource = null;
      setStatus('idle');
      setPlayingUI(false);
      engineHint.textContent = '';
    }
  } catch (err) {
    if (gen !== speakGen) return;
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

  const gen = speakGen;
  const chunks = chunkScript(text, 2400);
  activeSource = 'element';
  setStatus('loading');
  playBtn.disabled = true;

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (gen !== speakGen) return;
      if (chunks.length > 1) engineHint.textContent = `My Voices ${i + 1} / ${chunks.length}`;
      const blob = await synthesize(apiKey, voiceId, chunks[i].text);
      if (gen !== speakGen) return;
      if (i === 0) {
        setLastClip(blob, 'mp3');
        if (chunks.length === 1) {
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
        }
      }
      audioEngine.setVolume(parseFloat(volumeRange.value));
      setStatus('speaking');
      setPlayingUI(true);
      await new Promise((resolve) => {
        playbackWait = resolve;
        audioEngine.play(blob, { onEnd: () => { releasePlaybackWait(); } });
      });
    }
    if (gen === speakGen) {
      activeSource = null;
      setStatus('idle');
      setPlayingUI(false);
      engineHint.textContent = '';
    }
  } catch (err) {
    if (gen !== speakGen) return;
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

let peakHoldDb = -60;
let peakHoldUntil = 0;

function updateReadouts(floatBuf, sampleRate) {
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < floatBuf.length; i++) {
    const v = floatBuf[i];
    sumSq += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sumSq / floatBuf.length);
  const db = rms > 0.00001 ? 20 * Math.log10(rms) : -60;
  const peakDb = peak > 0.00001 ? 20 * Math.log10(peak) : -60;
  const now = performance.now();
  if (peakDb >= peakHoldDb) {
    peakHoldDb = peakDb;
    peakHoldUntil = now + 1200;
  } else if (now > peakHoldUntil) {
    peakHoldDb = Math.max(-60, peakHoldDb - 0.6);
  }
  levelReadout.textContent = db <= -59 ? '−∞ dB' : `${db.toFixed(1)} dB`;
  if (studioVuFill) {
    const pct = Math.max(0, Math.min(100, (db + 60) / 60 * 100));
    studioVuFill.style.height = `${pct}%`;
    studioVuFill.classList.toggle('clip', peakDb > -1);
  }
  if (studioVuPeak) {
    const pct = Math.max(0, Math.min(100, (peakHoldDb + 60) / 60 * 100));
    studioVuPeak.style.bottom = `${pct}%`;
    studioVuPeak.classList.toggle('clip', peakHoldDb > -1);
  }

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
  peakHoldDb = -60;
  if (studioVuFill) studioVuFill.style.height = '0%';
  if (studioVuPeak) studioVuPeak.style.bottom = '0%';
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
let studioPaused = false;

async function populateMics() {
  if (!studioMic || !recorder.listMics) return;
  try {
    const mics = await recorder.listMics();
    const saved = localStorage.getItem('voice_studio_mic') || '';
    const prev = studioMic.value || saved;
    studioMic.innerHTML = '';
    if (!mics.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = 'Default input';
      studioMic.appendChild(o);
      return;
    }
    mics.forEach((d, i) => {
      const o = document.createElement('option');
      o.value = d.deviceId;
      o.textContent = d.label || `Microphone ${i + 1}`;
      studioMic.appendChild(o);
    });
    if (prev && [...studioMic.options].some((o) => o.value === prev)) studioMic.value = prev;
  } catch (_) {}
}

if (studioMic) {
  studioMic.addEventListener('change', () => {
    localStorage.setItem('voice_studio_mic', studioMic.value);
  });
  populateMics();
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', populateMics);
  }
}
if (studioGain) {
  studioGain.addEventListener('input', () => {
    const v = parseFloat(studioGain.value);
    if (studioGainVal) studioGainVal.textContent = v.toFixed(2);
    if (isRecording) recorder.setGain(v);
  });
}
if (studioMonitor && studioMonVol) {
  const syncMon = () => {
    studioMonVol.disabled = !studioMonitor.checked;
    if (isRecording) recorder.setMonitor(studioMonitor.checked, parseFloat(studioMonVol.value));
  };
  studioMonitor.addEventListener('change', syncMon);
  studioMonVol.addEventListener('input', syncMon);
}
if (studioPauseBtn) {
  studioPauseBtn.addEventListener('click', () => {
    if (!isRecording) return;
    if (!studioPaused) {
      if (recorder.pause()) {
        studioPaused = true;
        studioPauseBtn.textContent = 'Resume';
        recordBtn.classList.remove('recording');
      }
    } else if (recorder.resume()) {
      studioPaused = false;
      studioPauseBtn.textContent = 'Pause';
      recordBtn.classList.add('recording');
    }
  });
}

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
        deviceId: studioMic && studioMic.value ? studioMic.value : undefined,
        gain: studioGain ? parseFloat(studioGain.value) : 1,
        monitor: !!(studioMonitor && studioMonitor.checked),
        monitorVol: studioMonVol ? parseFloat(studioMonVol.value) : 0.55,
      });
    } catch (err) {
      micHint.textContent = describeMicError(err);
      return;
    }
    micHint.textContent = '';
    isRecording = true;
    studioPaused = false;
    recordBtn.classList.add('recording');
    recordBtn.lastChild.textContent = ' Stop';
    if (studioPauseBtn) { studioPauseBtn.disabled = false; studioPauseBtn.textContent = 'Pause'; }
    populateMics();
    recordSeconds = 0;
    recordTimer.textContent = '00:00';
    recordTimerInterval = setInterval(() => {
      recordSeconds += 1;
      recordTimer.textContent = formatTime(recordSeconds);
    }, 1000);
    recordingResult.hidden = true;
  } else {
    isRecording = false;
    studioPaused = false;
    recordBtn.classList.remove('recording');
    recordBtn.lastChild.textContent = ' Record';
    if (studioPauseBtn) { studioPauseBtn.disabled = true; studioPauseBtn.textContent = 'Pause'; }
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
    const name = (studioCloneName && studioCloneName.value.trim()) || `My Voice ${new Date().toLocaleString()}`;
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
const keyFingerprintEl = document.getElementById('key-fingerprint');
const showKeyBtn = document.getElementById('show-key-btn');
const testKeyBtn = document.getElementById('test-key-btn');
const settingsEmail = document.getElementById('settings-email');
const settingsSignout = document.getElementById('settings-signout');

function paintKeyFingerprint() {
  const key = getApiKey();
  if (keyFingerprintEl) {
    keyFingerprintEl.textContent = key
      ? `Saved on this browser: ${keyFingerprint(key)}`
      : 'No key on this browser.';
  }
}

async function renderSettings() {
  paintKeyFingerprint();
  const session = await getCurrentSession().catch(() => null);
  if (settingsEmail) settingsEmail.textContent = session && session.user
    ? session.user.email
    : 'Not signed in';
}

updateCloneAvailability();
paintKeyFingerprint();

saveKeyBtn.addEventListener('click', async () => {
  const typed = apiKeyInput.value.trim();
  if (!typed) {
    keyStatus.hidden = false;
    keyStatus.className = 'hint';
    keyStatus.textContent = 'Paste a new key to replace the saved one.';
    return;
  }
  setApiKey(typed);
  apiKeyInput.value = '';
  paintKeyFingerprint();
  keyStatus.hidden = false;
  keyStatus.className = 'hint hint-info';
  keyStatus.textContent = `Saved ${keyFingerprint(typed)}. Testing…`;
  showToast('ElevenLabs key saved');
  updateCloneAvailability();
  const probe = await probeElevenLabsKey(typed);
  keyStatus.className = probe.ok ? 'hint hint-info' : 'hint';
  keyStatus.textContent = probe.ok
    ? `${probe.message} · ${keyFingerprint(typed)}`
    : probe.message;
});

if (testKeyBtn) {
  testKeyBtn.addEventListener('click', async () => {
    const typed = apiKeyInput.value.trim() || getApiKey();
    keyStatus.hidden = false;
    keyStatus.className = 'hint hint-info';
    keyStatus.textContent = 'Talking to ElevenLabs…';
    const probe = await probeElevenLabsKey(typed);
    keyStatus.className = probe.ok ? 'hint hint-info' : 'hint';
    keyStatus.textContent = probe.message;
  });
}

if (showKeyBtn) {
  showKeyBtn.addEventListener('click', () => {
    const show = apiKeyInput.type === 'password';
    apiKeyInput.type = show ? 'text' : 'password';
    showKeyBtn.textContent = show ? 'Hide' : 'Show';
    showKeyBtn.setAttribute('aria-pressed', show ? 'true' : 'false');
  });
}

if (settingsSignout) {
  settingsSignout.addEventListener('click', async () => {
    await signOutUser();
    showGate();
  });
}

clearKeyBtn.addEventListener('click', () => {
  setApiKey('');
  apiKeyInput.value = '';
  paintKeyFingerprint();
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
const librarySort = document.getElementById('library-sort');
const libraryNoMatch = document.getElementById('library-no-match');
const libraryPlayer = document.getElementById('library-player');

const ENGINE_LABELS = { neural: 'Neural', browser: 'Browser', elevenlabs: 'ElevenLabs', recording: 'Recording' };

let libraryObjectUrls = [];
let libraryPlayingId = null;

function revokeLibraryUrls() {
  libraryObjectUrls.forEach((u) => URL.revokeObjectURL(u));
  libraryObjectUrls = [];
}

function stopLibraryPlay() {
  if (libraryPlayer) {
    libraryPlayer.pause();
    libraryPlayer.removeAttribute('src');
  }
  libraryPlayingId = null;
  document.querySelectorAll('.clip-card.is-playing').forEach((c) => c.classList.remove('is-playing'));
  document.querySelectorAll('.clip-play').forEach((b) => { b.textContent = '▶'; });
}

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
    const clip = await clipLibrary.addClip({ engine, voiceLabel, text, blob, ext, durationSec });
    if (!libraryView.hidden) renderLibrary();
    emitVoice('clip', clip);
    const daw = window.TheVoiceDAW;
    if (daw && typeof daw.addVoiceClip === 'function' && blob) {
      daw.addVoiceClip({
        name: (voiceLabel || engine || 'Voice').toString().slice(0, 28),
        blob,
      }).catch(() => {});
    }
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

function clipHaystack(clip) {
  return [clip.text, clip.title, clip.voiceLabel, clip.engine, ENGINE_LABELS[clip.engine]]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function applyLibraryFilters() {
  const query = librarySearchInput.value.trim().toLowerCase();
  const engineFilter = libraryEngineFilter.value;
  const sort = librarySort ? librarySort.value : 'newest';

  let filtered = allClips.filter((clip) => {
    if (engineFilter !== 'all' && clip.engine !== engineFilter) return false;
    if (query && !clipHaystack(clip).includes(query)) return false;
    return true;
  });
  filtered = filtered.slice().sort((a, b) => {
    if (sort === 'oldest') return a.timestamp - b.timestamp;
    if (sort === 'longest') return (b.durationSec || 0) - (a.durationSec || 0);
    if (sort === 'az') return String(a.title || a.text || '').localeCompare(String(b.title || b.text || ''));
    return b.timestamp - a.timestamp;
  });

  libraryNoMatch.hidden = !(allClips.length > 0 && filtered.length === 0);
  revokeLibraryUrls();
  clipListEl.innerHTML = '';

  for (const clip of filtered) {
    const card = document.createElement('div');
    card.className = 'clip-card' + (libraryPlayingId === clip.id ? ' is-playing' : '');
    card.dataset.id = clip.id;

    const meta = document.createElement('div');
    meta.className = 'clip-meta';
    const badge = document.createElement('span');
    badge.className = `clip-badge clip-badge-${clip.engine}`;
    badge.textContent = ENGINE_LABELS[clip.engine] || clip.engine;
    const voice = document.createElement('span');
    voice.className = 'clip-voice';
    voice.textContent = clip.voiceLabel || '';
    const time = document.createElement('span');
    time.className = 'clip-time';
    const durationLabel = clip.durationSec ? ` · ${formatDuration(clip.durationSec)}` : '';
    time.textContent = new Date(clip.timestamp).toLocaleString() + durationLabel;
    meta.append(badge, voice, time);

    const title = document.createElement('input');
    title.className = 'clip-title';
    title.value = clip.title || (clip.text || 'Untitled').slice(0, 80);
    title.setAttribute('aria-label', 'Clip title');
    title.addEventListener('change', async () => {
      clip.title = title.value.trim();
      await clipLibrary.updateClip(clip.id, { title: clip.title });
    });

    const textEl = document.createElement('p');
    textEl.className = 'clip-text';
    textEl.textContent = clip.text || '(recording — no transcript)';

    const transport = document.createElement('div');
    transport.className = 'clip-transport';
    const playBtnClip = document.createElement('button');
    playBtnClip.type = 'button';
    playBtnClip.className = 'clip-play';
    playBtnClip.textContent = libraryPlayingId === clip.id && libraryPlayer && !libraryPlayer.paused ? '■' : '▶';
    playBtnClip.setAttribute('aria-label', 'Play clip');
    const scrub = document.createElement('button');
    scrub.type = 'button';
    scrub.className = 'clip-scrub';
    scrub.setAttribute('aria-label', 'Seek');
    const fill = document.createElement('div');
    fill.className = 'clip-scrub-fill';
    scrub.appendChild(fill);
    const pos = document.createElement('span');
    pos.className = 'clip-pos';
    pos.textContent = formatDuration(clip.durationSec);
    transport.append(playBtnClip, scrub, pos);

    playBtnClip.addEventListener('click', () => toggleLibraryClip(clip, card, playBtnClip));
    scrub.addEventListener('click', (ev) => {
      if (!libraryPlayer || libraryPlayingId !== clip.id || !libraryPlayer.duration) return;
      const r = scrub.getBoundingClientRect();
      libraryPlayer.currentTime = ((ev.clientX - r.left) / r.width) * libraryPlayer.duration;
    });

    const actions = document.createElement('div');
    actions.className = 'clip-actions';
    const useBtn = document.createElement('button');
    useBtn.className = 'btn';
    useBtn.textContent = 'Use in Speak';
    useBtn.disabled = !clip.text;
    useBtn.addEventListener('click', () => {
      if (!clip.text) return;
      textInput.value = clipToWords(clip.text);
      updateTextStats();
      switchSection('speak');
      showToast('Loaded into Speak');
    });
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
      if (libraryPlayingId === clip.id) stopLibraryPlay();
      await clipLibrary.deleteClip(clip.id);
      showToast('Clip deleted');
      renderLibrary();
    });
    actions.append(useBtn, dlBtn, delBtn);

    card.append(meta, title, textEl, transport, actions);
    clipListEl.appendChild(card);
  }
}

function toggleLibraryClip(clip, card, btn) {
  if (!libraryPlayer) return;
  if (libraryPlayingId === clip.id && !libraryPlayer.paused) {
    libraryPlayer.pause();
    btn.textContent = '▶';
    card.classList.remove('is-playing');
    return;
  }
  stopPlayback();
  const url = URL.createObjectURL(clip.blob);
  libraryObjectUrls.push(url);
  libraryPlayingId = clip.id;
  libraryPlayer.src = url;
  libraryPlayer.play().catch(() => {});
  document.querySelectorAll('.clip-card').forEach((c) => c.classList.toggle('is-playing', c.dataset.id === clip.id));
  document.querySelectorAll('.clip-play').forEach((b) => { b.textContent = '▶'; });
  btn.textContent = '■';
}

if (libraryPlayer) {
  libraryPlayer.addEventListener('timeupdate', () => {
    const card = clipListEl.querySelector(`.clip-card[data-id="${libraryPlayingId}"]`);
    if (!card || !libraryPlayer.duration) return;
    const fill = card.querySelector('.clip-scrub-fill');
    const pos = card.querySelector('.clip-pos');
    if (fill) fill.style.width = `${(libraryPlayer.currentTime / libraryPlayer.duration) * 100}%`;
    if (pos) pos.textContent = `${formatDuration(libraryPlayer.currentTime)} / ${formatDuration(libraryPlayer.duration)}`;
  });
  libraryPlayer.addEventListener('ended', () => stopLibraryPlay());
}

clearLibraryBtn.addEventListener('click', async () => {
  if (!confirm('Delete every saved clip? This cannot be undone.')) return;
  stopLibraryPlay();
  await clipLibrary.clearAll();
  showToast('Library cleared');
  renderLibrary();
});

librarySearchInput.addEventListener('input', applyLibraryFilters);
libraryEngineFilter.addEventListener('change', applyLibraryFilters);
if (librarySort) librarySort.addEventListener('change', applyLibraryFilters);

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
const longformTransport = document.getElementById('longform-transport');
const longformPlay = document.getElementById('longform-play');
const longformScrub = document.getElementById('longform-scrub');
const longformScrubFill = document.getElementById('longform-scrub-fill');
const longformPos = document.getElementById('longform-pos');
const longformCancelBtn = document.getElementById('longform-cancel-btn');
const longformWordStats = document.getElementById('longform-word-stats');
const longformStats = document.getElementById('longform-stats');
const longformStatParts = document.getElementById('longform-stat-parts');
const longformStatChars = document.getElementById('longform-stat-chars');
const longformStatDuration = document.getElementById('longform-stat-duration');
const chapterList = document.getElementById('chapter-list');

let currentChapters = [];
let longformBlob = null;
let longformOffsets = [];
let longformGen = 0;

function stopLongformPlay() {
  if (longformAudio && !longformAudio.paused) longformAudio.pause();
  if (longformPlay) longformPlay.textContent = '▶';
}

function paintLongformWords() {
  if (!longformWordStats || !longformInput) return;
  const n = wordCount(longformInput.value);
  const over = n > MAX_SPEAK_WORDS;
  longformWordStats.textContent = over
    ? `${n.toLocaleString()} / ${MAX_SPEAK_WORDS.toLocaleString()} words — extra will be cut`
    : `${n.toLocaleString()} / ${MAX_SPEAK_WORDS.toLocaleString()} words`;
  longformWordStats.classList.toggle('is-over', over);
}
if (longformInput) {
  longformInput.addEventListener('input', () => {
    if (wordCount(longformInput.value) > MAX_SPEAK_WORDS) {
      longformInput.value = clipToWords(longformInput.value);
    }
    paintLongformWords();
  });
  paintLongformWords();
}

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
    const words = wordCount(chapter.text);
    meta.textContent = `${words.toLocaleString()} w`;

    li.append(body, meta);
    li.addEventListener('click', () => {
      if (!longformAudio || !longformAudio.src || longformOffsets[chapter.index] == null) return;
      longformAudio.currentTime = longformOffsets[chapter.index];
      document.querySelectorAll('.chapter-item').forEach((el) => el.classList.toggle('listening', el === li));
    });
    chapterList.appendChild(li);
  });
}

function analyzeLongform() {
  let text = longformInput.value;
  if (wordCount(text) > MAX_SPEAK_WORDS) {
    text = clipToWords(text);
    longformInput.value = text;
    paintLongformWords();
    showToast(`Trimmed to ${MAX_SPEAK_WORDS.toLocaleString()} words.`);
  }
  currentChapters = splitIntoChapters(text, parseInt(longformChunk.value, 10));
  longformHint.textContent = '';
  longformBlob = null;
  longformOffsets = [];
  longformDownloadBtn.disabled = true;
  if (longformTransport) longformTransport.hidden = true;
  stopLongformPlay();
  if (longformAudio) longformAudio.removeAttribute('src');

  if (!currentChapters.length) {
    chapterList.innerHTML = '';
    longformStats.hidden = true;
    longformGenerateBtn.disabled = true;
    longformHint.textContent = 'Paste some text first.';
    return;
  }

  const words = wordCount(text);
  longformStatParts.textContent = String(currentChapters.length);
  longformStatChars.textContent = words.toLocaleString();
  longformStatDuration.textContent = formatDuration((words / 150) * 60);
  longformStats.hidden = false;
  longformGenerateBtn.disabled = false;
  renderChapterList();
}

longformAnalyzeBtn.addEventListener('click', analyzeLongform);

longformGenerateBtn.addEventListener('click', async () => {
  if (!currentChapters.length) return;
  const gen = ++longformGen;
  longformGenerateBtn.disabled = true;
  longformAnalyzeBtn.disabled = true;
  longformDownloadBtn.disabled = true;
  if (longformCancelBtn) longformCancelBtn.disabled = false;
  longformHint.textContent = '';
  longformProgress.hidden = false;
  if (longformTransport) longformTransport.hidden = true;
  stopLongformPlay();

  const rendered = [];
  let sampleRate = 24000;

  try {
    for (const chapter of currentChapters) {
      if (gen !== longformGen) return;
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
      if (gen !== longformGen) return;
      rendered.push(rawAudio.audio);
      sampleRate = rawAudio.sampling_rate;
      if (li) li.className = 'chapter-item done';
    }

    longformProgressFill.style.width = '100%';
    longformProgressText.textContent = 'Stitching…';

    const gapSec = parseFloat(longformGap.value);
    const gapSamples = Math.round(sampleRate * gapSec);
    longformOffsets = [];
    let off = 0;
    rendered.forEach((part, i) => {
      longformOffsets.push(off / sampleRate);
      off += part.length + (i < rendered.length - 1 ? gapSamples : 0);
    });

    const combined = concatAudio(rendered, sampleRate, gapSec);
    if (gen !== longformGen) return;
    longformBlob = encodeWav16(combined, sampleRate);
    if (longformAudio.src) URL.revokeObjectURL(longformAudio.src);
    longformAudio.src = URL.createObjectURL(longformBlob);
    if (longformTransport) longformTransport.hidden = false;
    if (longformPlay) longformPlay.textContent = '▶';
    if (longformPos) longformPos.textContent = formatDuration(combined.length / sampleRate);
    if (longformScrubFill) longformScrubFill.style.width = '0%';
    longformDownloadBtn.disabled = false;
    longformProgress.hidden = true;

    longformStatDuration.textContent = formatDuration(combined.length / sampleRate);
    showToast(`Rendered ${currentChapters.length} parts`);

    saveClipToLibrary({
      engine: 'neural',
      voiceLabel: longformVoice.options[longformVoice.selectedIndex]?.textContent || longformVoice.value,
      text: clipToWords(longformInput.value).slice(0, 300),
      blob: longformBlob,
      ext: 'wav',
      durationSec: combined.length / sampleRate,
    });
  } catch (err) {
    if (gen !== longformGen) return;
    longformProgress.hidden = true;
    const active = chapterList.querySelector('.chapter-item.active');
    if (active) active.className = 'chapter-item failed';
    longformHint.textContent = err.message || 'Rendering failed.';
  } finally {
    if (gen === longformGen) {
      longformGenerateBtn.disabled = false;
      longformAnalyzeBtn.disabled = false;
      if (longformCancelBtn) longformCancelBtn.disabled = true;
    }
  }
});

if (longformCancelBtn) {
  longformCancelBtn.addEventListener('click', () => {
    longformGen += 1;
    longformProgress.hidden = true;
    longformHint.textContent = 'Cancelled.';
    longformGenerateBtn.disabled = false;
    longformAnalyzeBtn.disabled = false;
    longformCancelBtn.disabled = true;
  });
}

if (longformPlay) {
  longformPlay.addEventListener('click', () => {
    if (!longformAudio.src) return;
    if (longformAudio.paused) {
      if (typeof stopPlayback === 'function') stopPlayback();
      longformAudio.play().catch(() => {});
      longformPlay.textContent = '■';
    } else {
      longformAudio.pause();
      longformPlay.textContent = '▶';
    }
  });
}
if (longformScrub) {
  longformScrub.addEventListener('click', (ev) => {
    if (!longformAudio.duration) return;
    const r = longformScrub.getBoundingClientRect();
    longformAudio.currentTime = ((ev.clientX - r.left) / r.width) * longformAudio.duration;
  });
}
if (longformAudio) {
  longformAudio.addEventListener('timeupdate', () => {
    if (!longformAudio.duration) return;
    if (longformScrubFill) longformScrubFill.style.width = `${(longformAudio.currentTime / longformAudio.duration) * 100}%`;
    if (longformPos) longformPos.textContent = `${formatDuration(longformAudio.currentTime)} / ${formatDuration(longformAudio.duration)}`;
    let idx = 0;
    for (let i = 0; i < longformOffsets.length; i++) {
      if (longformAudio.currentTime >= longformOffsets[i] - 0.05) idx = i;
    }
    chapterList.querySelectorAll('.chapter-item').forEach((el) => {
      el.classList.toggle('listening', Number(el.dataset.index) === idx);
    });
  });
  longformAudio.addEventListener('ended', () => { if (longformPlay) longformPlay.textContent = '▶'; });
}

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
const modClipSel = document.getElementById('mod-clip');
const modAbBtn = document.getElementById('mod-ab-btn');
const modTransport = document.getElementById('mod-transport');
const modPlay = document.getElementById('mod-play');
const modScrub = document.getElementById('mod-scrub');
const modScrubFill = document.getElementById('mod-scrub-fill');
const modPos = document.getElementById('mod-pos');
const modAbFlag = document.getElementById('mod-ab-flag');

let modSourceBuffer = null;
let modResultBlob = null;
let modDryBlob = null;
let modHearing = 'b';

function stopModPlay() {
  if (modAudio && !modAudio.paused) modAudio.pause();
  if (modPlay) modPlay.textContent = '▶';
}

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

async function refreshModSource() {
  if (modClipSel) {
    const keep = modClipSel.value;
    modClipSel.innerHTML = '<option value="">Library clip…</option>';
    try {
      const clips = await clipLibrary.listClips();
      for (const clip of clips.slice(0, 50)) {
        const o = document.createElement('option');
        o.value = clip.id;
        o.textContent = `${clip.title || clip.voiceLabel || clip.engine} · ${formatDuration(clip.durationSec)}`;
        modClipSel.appendChild(o);
      }
      if (keep && [...modClipSel.options].some((o) => o.value === keep)) modClipSel.value = keep;
    } catch (_) {}
  }
  if (modSourceBuffer) return;
  modSourceLabel.textContent = originalRecordingBlob
    ? 'A recording is available to load.'
    : 'No clip loaded — pick a Library clip, import, or record in Voice Studio.';
  modLoadBtn.disabled = !originalRecordingBlob;
}

async function loadModFromBlob(blob, label) {
  const buf = await decodeToAudioBuffer(blob);
  modSourceBuffer = { data: buf.getChannelData(0), sampleRate: buf.sampleRate };
  modDryBlob = blob;
  modResultBlob = null;
  modHearing = 'a';
  modSourceLabel.textContent = `${label} · ${buf.duration.toFixed(1)}s`;
  modApplyBtn.disabled = false;
  if (modAbBtn) modAbBtn.disabled = true;
  if (modAbFlag) modAbFlag.textContent = 'A';
  armModPlayer(modDryBlob);
}

function armModPlayer(blob) {
  if (!modAudio || !blob) return;
  if (modAudio.src) URL.revokeObjectURL(modAudio.src);
  modAudio.src = URL.createObjectURL(blob);
  if (modTransport) modTransport.hidden = false;
  if (modPlay) modPlay.textContent = '▶';
  if (modScrubFill) modScrubFill.style.width = '0%';
}

modLoadBtn.addEventListener('click', async () => {
  if (!originalRecordingBlob) return;
  modHint.textContent = '';
  try {
    await loadModFromBlob(originalRecordingBlob, 'Session take');
  } catch (err) {
    modHint.textContent = err.message || 'Could not load that clip.';
  }
});
if (modClipSel) {
  modClipSel.addEventListener('change', async () => {
    const id = modClipSel.value;
    if (!id) return;
    try {
      const clips = await clipLibrary.listClips();
      const clip = clips.find((c) => c.id === id);
      if (!clip) return;
      await loadModFromBlob(clip.blob, clip.title || clip.voiceLabel || 'Library clip');
    } catch (err) {
      modHint.textContent = err.message || 'Could not load that clip.';
    }
  });
}

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
    modHearing = 'b';
    if (modAbFlag) modAbFlag.textContent = 'B';
    if (modAbBtn) modAbBtn.disabled = false;
    armModPlayer(modResultBlob);
    modDownloadBtn.disabled = false;
    showToast('Modulated — A/B compares dry vs wet');
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

if (modAbBtn) {
  modAbBtn.addEventListener('click', () => {
    if (!modDryBlob || !modResultBlob) return;
    const t = modAudio && Number.isFinite(modAudio.currentTime) ? modAudio.currentTime : 0;
    const playing = modAudio && !modAudio.paused;
    modHearing = modHearing === 'a' ? 'b' : 'a';
    if (modAbFlag) modAbFlag.textContent = modHearing === 'a' ? 'A' : 'B';
    armModPlayer(modHearing === 'a' ? modDryBlob : modResultBlob);
    modAudio.currentTime = t;
    if (playing) modAudio.play().catch(() => {});
    if (modPlay) modPlay.textContent = playing ? '■' : '▶';
  });
}
if (modPlay) {
  modPlay.addEventListener('click', () => {
    if (!modAudio.src) return;
    if (modAudio.paused) {
      if (typeof stopPlayback === 'function') stopPlayback();
      modAudio.play().catch(() => {});
      modPlay.textContent = '■';
    } else {
      modAudio.pause();
      modPlay.textContent = '▶';
    }
  });
}
if (modScrub) {
  modScrub.addEventListener('click', (ev) => {
    if (!modAudio.duration) return;
    const r = modScrub.getBoundingClientRect();
    modAudio.currentTime = ((ev.clientX - r.left) / r.width) * modAudio.duration;
  });
}
if (modAudio) {
  modAudio.addEventListener('timeupdate', () => {
    if (!modAudio.duration) return;
    if (modScrubFill) modScrubFill.style.width = `${(modAudio.currentTime / modAudio.duration) * 100}%`;
    if (modPos) modPos.textContent = `${formatDuration(modAudio.currentTime)} / ${formatDuration(modAudio.duration)}`;
  });
  modAudio.addEventListener('ended', () => { if (modPlay) modPlay.textContent = '▶'; });
}

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
const animVideoBtn = document.getElementById('anim-video-btn');
const animShapeList = document.getElementById('anim-shape-list');
const animParentSelect = document.getElementById('anim-parent');
const animLabelInput = document.getElementById('anim-label');
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
// Every selected id, with animSelectedId the active one — the object the
// properties panel edits and the gizmo attaches to. Single-selection code
// keeps working against the active id; only bulk operations read the set.
let animSelectedIds = new Set();
let animPlaying = false;
let animRaf = null;
let animStartedAt = 0;
let animLevels = null;

// Named after what they do to a movement, not after the maths — someone
// choosing how a title should arrive is thinking "settle", not
// "cubic-bezier(0.22, 1, 0.36, 1)".
const EASING_LABELS = {
  linear: 'Linear', ease: 'Ease', easeIn: 'Ease in', easeOut: 'Ease out',
  easeInOut: 'Ease in-out', quadIn: 'Quad in', quadOut: 'Quad out',
  quartIn: 'Quart in', quartOut: 'Quart out', expoIn: 'Expo in',
  expoOut: 'Expo out', settle: 'Settle', anticipate: 'Anticipate',
  backIn: 'Back in', backOut: 'Back out', bounce: 'Bounce',
  elastic: 'Elastic', hold: 'Hold (no move)', step: 'Step',
};
function refreshEasingOptions() {
  animEasing.innerHTML = '';
  for (const name of ALL_EASING_NAMES) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = EASING_LABELS[name] || name;
    animEasing.appendChild(opt);
  }
  const custom = document.createElement('option');
  custom.value = 'custom';
  custom.textContent = 'Custom curve';
  animEasing.appendChild(custom);
}
refreshEasingOptions();

const animSelected = () => animScene.shapes.find((s) => s.id === animSelectedId) || null;

/** Set the selection, keeping the set and the active id consistent. */
function animSetSelection(ids, activeId) {
  animSelectedId = activeId || null;
  animSelectedIds = normaliseSelection(ids, activeId, animScene);
}

/** The shapes a bulk edit should act on: the selection minus its descendants. */
function animSelectionRoots() {
  return selectionRoots(animScene, animSelectedIds);
}

function animCurrentLevel(t) {
  if (!animLevels) return 0;
  const i = Math.floor(t * animScene.fps);
  return animLevels[Math.max(0, Math.min(animLevels.length - 1, i))] || 0;
}

function animDraw() {
  const t = parseFloat(animTime.value);
  animRenderAt(t);
  animTimeLabel.textContent = `${t.toFixed(2)}s`;
  animDrawTimeline();
}

function animLabelFor(id) {
  const shape = animScene.shapes.find((s) => s.id === id);
  return shape ? shape.label : 'a missing object';
}

/**
 * Fill the parent picker with everything the selection could legally hang
 * from. A choice that would make a loop, or nest deeper than the graph
 * allows, is left out rather than offered and then refused — a control that
 * does nothing when you use it is worse than one that never offered.
 */
function animRenderParentPicker() {
  if (!animParentSelect) return;
  const shape = animSelected();
  animParentSelect.innerHTML = '';
  const root = document.createElement('option');
  root.value = '';
  root.textContent = 'Scene root';
  animParentSelect.appendChild(root);
  if (!shape) { animParentSelect.disabled = true; return; }
  animParentSelect.disabled = false;
  for (const { shape: other, depth } of treeOrder(animScene)) {
    if (other.id === shape.id) continue;
    if (wouldCycle(animScene, shape.id, other.id)) continue;
    if (depth + 1 >= MAX_DEPTH) continue;
    const opt = document.createElement('option');
    opt.value = other.id;
    opt.textContent = `${'\u2003'.repeat(depth)}${other.label}`;
    animParentSelect.appendChild(opt);
  }
  animParentSelect.value = shape.parent || '';
}

/**
 * The readings setParent binds against. Both interpolate between keyframes
 * exactly as playback does, so parenting mid-motion binds against where the
 * object actually is rather than where its last keyframe left it.
 */
const animSampler = {
  world: (shape, time) =>
    worldTransforms(animScene, time).get(shape.id) || sampleShape(shape, time),
  local: (shape, time) => sampleShape(shape, time),
};

function animRenderShapeList() {
  animShapeList.innerHTML = '';
  // Parents first, each followed by its children — the outliner's row
  // order. A flat scene produces exactly the list it always did.
  for (const { shape, depth } of treeOrder(animScene)) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    const selected = shape.id === animSelectedId;
    const inSelection = animSelectedIds.has(shape.id);
    const kids = childrenOf(animScene, shape.id).length;
    btn.type = 'button';
    btn.className = 'anim-shape-item'
      + (selected ? ' selected' : '')
      + (inSelection && !selected ? ' also-selected' : '');
    btn.dataset.depth = String(Math.min(6, depth));
    btn.setAttribute('aria-pressed', inSelection ? 'true' : 'false');
    // Depth is carried in aria-level rather than in the visible text, so a
    // screen reader announces the nesting without every row reading out a
    // row of dashes.
    btn.setAttribute('aria-level', String(depth + 1));
    const name = document.createElement('span');
    if (depth > 0) {
      const kin = document.createElement('span');
      kin.className = 'anim-shape-kin';
      kin.setAttribute('aria-hidden', 'true');
      kin.textContent = '└';
      name.appendChild(kin);
    }
    name.append(shape.label);
    const kf = document.createElement('span');
    kf.className = 'anim-shape-kf';
    // "3kf ~" reads as nonsense in speech; spell it out for the label only.
    kf.textContent = `${shape.keyframes.length}kf${shape.reactive ? ' ~' : ''}`;
    btn.setAttribute('aria-label',
      `${shape.label}, ${shape.keyframes.length} keyframe${shape.keyframes.length === 1 ? '' : 's'}`
      + (shape.reactive ? ', reacts to voice' : '')
      + (depth > 0 ? `, child of ${animLabelFor(shape.parent)}` : '')
      + (kids ? `, ${kids} child${kids === 1 ? '' : 'ren'}` : ''));
    btn.append(name, kf);
    btn.addEventListener('click', (ev) => {
      const next = applyClick(animSelectedIds, animSelectedId, shape.id,
                              { additive: ev.shiftKey || ev.ctrlKey || ev.metaKey });
      animSetSelection(next.ids, next.activeId);
      animRenderShapeList();
      animSyncProps();
      // The viewport shows the selection — its outline and its motion path
      // — so changing the selection has to repaint. Without this the
      // outline stays around whatever was selected before, which reads as
      // the click having done nothing.
      animDraw();
    });
    li.appendChild(btn);
    animShapeList.appendChild(li);
  }
  animRenderParentPicker();
  const has = !!animSelected();
  animKeyBtn.disabled = !has;
  animDeleteBtn.disabled = !has;
  animExportBtn.disabled = animScene.shapes.length === 0;
  animVideoBtn.disabled = animScene.shapes.length === 0;
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
  // The sliders edit the shape's own channels, so they show the local
  // transform. A child's sliders reading its world position would move it
  // somewhere else the moment you touched one.
  const p = sampleShape(shape, parseFloat(animTime.value));
  animRenderParentPicker();
  animSliders.x.value = String(p.x);
  animSliders.y.value = String(p.y);
  animSliders.scale.value = String(p.scale);
  animSliders.rotation.value = String(p.rotation);
  animSliders.opacity.value = String(p.opacity);
  animColor.value = p.color;
  animLabelInput.value = shape.label || '';
  animTextInput.value = shape.text || '';
  animReactive.checked = !!shape.reactive;
  animExtrudeRow.hidden = !(shape.type === 'text' && is3D(animScene));
  animExtrude.value = String(shape.extrude === undefined ? 8 : shape.extrude);
  animExtrudeValue.textContent = animExtrude.value;
  animZ.value = String(Math.round(p.z || 0));
  animRotX.value = String(Math.round(p.rotX || 0));
  animRotY.value = String(Math.round(p.rotY || 0));
  anim3dSyncLabels();
  animSyncSliderLabels();
  animSyncPath();
  animRenderKeyframes();
  animSyncCurve();
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
  animSyncPath();
  animRenderKeyframes();
  animRenderShapeList();
  animDraw();
}

Object.values(animSliders).forEach((el) => {
  el.addEventListener('input', animCommit);
  // A slider fires `input` on every pixel of a drag. Recording each one
  // would mean fifty presses of Ctrl+Z to walk back one gesture, so the
  // snapshot is taken when the gesture ends.
  el.addEventListener('change', animRecord);
});
animColor.addEventListener('input', animCommit);
animColor.addEventListener('change', animRecord);
animTextInput.addEventListener('input', () => {
  const shape = animSelected();
  if (shape) { shape.text = animTextInput.value; animDraw(); }
});
animTextInput.addEventListener('change', animRecord);
const animSmooth = document.getElementById('anim-smooth');
const animTension = document.getElementById('anim-tension');
const animTensionValue = document.getElementById('anim-tension-value');
const animTensionField = animTension.closest('.path-tension');

function animSyncPath() {
  const shape = animSelected();
  const on = !!(shape && shape.smoothPath);
  animSmooth.checked = on;
  animTensionField.hidden = !on;
  if (shape) {
    const tension = typeof shape.pathTension === 'number' ? shape.pathTension : 1;
    animTension.value = String(tension);
    animTensionValue.textContent = tension.toFixed(2);
  }
  // Two keyframes describe a straight line whichever way you interpolate,
  // so smoothing means nothing until there is a third to curve through.
  animSmooth.disabled = !shape || shape.keyframes.length < 3;
  animSmooth.title = animSmooth.disabled
    ? 'Add a third keyframe — two points are a straight line either way'
    : 'Curve the path through every keyframe instead of cornering at each one';
}

animSmooth.addEventListener('change', () => {
  const shape = animSelected();
  if (!shape) return;
  shape.smoothPath = animSmooth.checked;
  animSyncPath();
  animDraw();
  animRecord();
});

animTension.addEventListener('input', () => {
  const shape = animSelected();
  if (!shape) return;
  shape.pathTension = parseFloat(animTension.value);
  animTensionValue.textContent = shape.pathTension.toFixed(2);
  animDraw();
});
animTension.addEventListener('change', animRecord);

animReactive.addEventListener('change', () => {
  const shape = animSelected();
  if (shape) { shape.reactive = animReactive.checked; animRenderShapeList(); animDraw(); }
  animRecord();
});
animEasing.addEventListener('change', () => {
  if (animEasing.value === 'custom') {
    // "Custom" is a state you arrive at by dragging, not one you pick;
    // selecting it converts the current preset into editable handles.
    animSetCurve(easingPoints(animCurveSpec()));
    return;
  }
  animSetCurve(animEasing.value);
});

animTime.addEventListener('input', () => { animSyncProps(); animDraw(); });

animAddBtn.addEventListener('click', () => {
  const shape = createShape(animShapeType.value, parseFloat(animTime.value));
  animScene.shapes.push(shape);
  animSetSelection([shape.id], shape.id);
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animRecord();
});

animKeyBtn.addEventListener('click', () => {
  animCommit();
  animRecord();
  showToast('Keyframe set');
});

// Naming matters more than it looks: the agent casts a sentence onto the
// scene by name, so "the tower falls over" only reaches the tower if
// something is actually called that.
animLabelInput.addEventListener('input', () => {
  const shape = animSelected();
  if (!shape) return;
  shape.label = animLabelInput.value.slice(0, 60);
  animRenderShapeList();
  animDrawTimeline();
});

animLabelInput.addEventListener('change', () => {
  if (animSelected()) animRecord();
});

animParentSelect.addEventListener('change', () => {
  const shape = animSelected();
  if (!shape) return;
  const at = parseFloat(animTime.value) || 0;
  const wanted = animParentSelect.value || null;
  if (!setParent(animScene, shape.id, wanted, animSampler, at)) {
    // The picker only offers legal choices, so this means the scene moved
    // under the control. Put it back rather than leaving it lying.
    animRenderParentPicker();
    return;
  }
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animRecord();
});

/**
 * Duplicate the selection.
 *
 * Copies the roots and everything under them, so duplicating a model's
 * torso brings its arms — a copy that loses the parts hanging off it is
 * not a copy of the thing you pointed at.
 */
function animDuplicateSelection() {
  const roots = animSelectionRoots();
  if (!roots.length) return;

  // Gather each root's whole subtree, in outliner order, so a copied child
  // is created after the copied parent it will point at.
  const wanted = new Set();
  for (const root of roots) {
    wanted.add(root.id);
    for (const { shape } of treeOrder(animScene)) {
      if (ancestorsOf(animScene, shape.id).some((a) => a.id === root.id)) wanted.add(shape.id);
    }
  }
  const ordered = treeOrder(animScene)
    .filter(({ shape }) => wanted.has(shape.id))
    .map(({ shape }) => shape);

  const { copies } = duplicateShapes(ordered, () => `d${animDuplicateSerial++}`, {
    offset: 3,
    taken: animScene.shapes.map((sh) => sh.label),
  });
  animScene.shapes.push(...copies);
  // The copies become the selection: the next thing you do is almost
  // always to move them off the originals.
  animSetSelection(copies.map((c) => c.id), copies[0].id);
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animRecord();
  showToast(`Duplicated ${copies.length} object${copies.length === 1 ? '' : 's'}`);
}

// Copies get their own id space so they can never collide with the
// generator's or the importer's.
let animDuplicateSerial = 1;

// Debris and other objects the agent adds get their own id space.
let animAgentSerial = 1;

document.addEventListener('keydown', (ev) => {
  if (animateView.hidden) return;
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return;
  if (isTextEntry(ev.target)) return;
  if (String(ev.key).toLowerCase() !== 'd') return;
  ev.preventDefault();
  animDuplicateSelection();
});

const animNewBtn = document.getElementById('anim-new-btn');

// Starting over without reloading the page. Undoable like any other edit,
// because "New scene" landing on work you meant to keep should cost one
// keystroke to reverse, not everything.
animNewBtn.addEventListener('click', () => {
  animScene = createScene();
  animSetSelection([], null);
  animLevels = null;
  animTime.max = String(animScene.duration);
  animTime.value = '0';
  anim3dSync();
  animRenderShapeList();
  animSyncProps();
  animRenderKeyframes();
  animDraw();
  animRecord();
  showToast('New scene — Ctrl+Z to bring the old one back');
});

animDeleteBtn.addEventListener('click', () => {
  if (!animSelectedIds.size) return;
  const at = parseFloat(animTime.value) || 0;
  // Deleting a parent must not take its children with it, and must not
  // leave them pointing at something that no longer exists. Re-home each
  // survivor where it currently appears — losing an object because you
  // deleted its parent would be the worst possible reading of "delete".
  deleteShapes(animScene, animSelectedIds, (shape, next) => {
    setParent(animScene, shape.id, next, animSampler, at);
  });
  animSetSelection(animScene.shapes.length ? [animScene.shapes[0].id] : [],
                   animScene.shapes.length ? animScene.shapes[0].id : null);
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animRecord();
});

function animStop() {
  animPlaying = false;
  animPlayBtn.textContent = 'Play';
  if (animRaf) cancelAnimationFrame(animRaf);
  animRaf = null;
  // Guides are suppressed while playing; pausing has to redraw them.
  animRenderAt(parseFloat(animTime.value));
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
animVideoBtn.addEventListener('click', async () => {
  if (!animScene.shapes.length) return;
  if (!canRecord()) {
    animHint.textContent = 'This browser cannot record video — use "Export frames" instead.';
    return;
  }

  const total = frameCount(animScene.duration, animScene.fps);
  const label = animVideoBtn.textContent;
  let cancelled = false;
  const cancel = () => { cancelled = true; };
  animVideoBtn.addEventListener('click', cancel, { once: true });
  animVideoBtn.textContent = 'Cancel';
  animExportBtn.disabled = true;
  animHint.textContent = '';

  // Playback would fight the exporter for the canvas, and a scrubbing
  // playhead would be recorded rather than the frames being asked for.
  if (animPlaying) animStop();
  animExporting = true;

  try {
    const result = await recordScene({
      // Draw and hand back whichever canvas the active renderer used — the
      // stream has to be captured from the one actually being painted.
      drawFrame: (t) => { animRenderAt(t); return animActiveCanvas(); },
      duration: animScene.duration,
      fps: animScene.fps,
      onProgress: (done) => {
        animHint.textContent = `Recording frame ${done} of ${total}…`;
      },
      shouldCancel: () => cancelled,
    });

    if (!result.ok) {
      animHint.textContent = result.message;
      return;
    }
    const r = await downloadBlob(result.blob, `animation-${Date.now()}.${result.ext}`);
    if (!r.ok) {
      animHint.textContent = r.message || 'Save cancelled.';
      return;
    }
    animHint.textContent = '';
    showToast(`Exported ${result.seconds.toFixed(1)}s as ${result.label}`);
  } catch (err) {
    animHint.textContent = err.message || 'Could not export that video.';
  } finally {
    animExporting = false;
    animVideoBtn.removeEventListener('click', cancel);
    animVideoBtn.textContent = label;
    animExportBtn.disabled = animScene.shapes.length === 0;
    animRenderAt(parseFloat(animTime.value));
  }
});

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
      animRenderAt(t);
      const source = animActiveCanvas();
      const blob = await new Promise((res) => source.toBlob(res, 'image/png'));
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

const animStage = document.getElementById('anim-stage');
const animGLCanvas = document.getElementById('anim-canvas-gl');
const animOverlay = document.getElementById('anim-overlay');
const animOverlayCtx = animOverlay.getContext('2d');
// True only while a video export is running, so guides stay out of it.
let animExporting = false;
// Created on first use, null if this device cannot: the canvas renderer is
// the always-works fallback, and the switch is invisible except in quality.
let animGL;

function animGLRenderer() {
  if (animGL === undefined) animGL = createGLRenderer(animGLCanvas);
  return animGL;
}

/** The canvas the current frame was actually rendered to. */
function animActiveCanvas() {
  return !animGLCanvas.hidden ? animGLCanvas : animCanvas;
}

/**
 * Draw the scene at `t` through whichever renderer applies: WebGL for 3D
 * scenes when the device has it, the 2D canvas for everything else. Both
 * consume the same resolved frame, so this switch changes fidelity, never
 * position.
 */
function animRenderAt(t) {
  const gl = is3D(animScene) ? animGLRenderer() : null;
  const useGL = !!gl && glRenderFrame(gl, animScene, t, animCurrentLevel(t));
  animGLCanvas.hidden = !useGL;
  animCanvas.hidden = useGL;
  if (!useGL) {
    renderFrame(animCtx, animScene, t, animCanvas.width, animCanvas.height, animCurrentLevel(t));
  }
  animDrawOverlay();
}

/**
 * Editor guides: the selected shape's route through its keyframes.
 *
 * Drawn on a separate canvas so it appears over either renderer and never
 * reaches an export — exports capture the render canvas, not this one.
 * Hidden during playback and while exporting, when a guide is just clutter
 * over the thing you are trying to watch.
 */
function animDrawOverlay() {
  const ctx = animOverlayCtx;
  const w = animOverlay.width;
  const h = animOverlay.height;
  ctx.clearRect(0, 0, w, h);
  if (animPlaying || animExporting) return;

  const shape = animSelected();
  if (!shape) return;

  const time = parseFloat(animTime.value);
  const camera = cameraAt(animScene, time);
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--phosphor').trim() || '#3fc6ff';

  // The selection outline: without it, clicking in the viewport gives no
  // sign of what you actually picked, and a click that missed looks
  // identical to one that hit something behind another object.
  // Every selected object is outlined; the active one — the one the panel
  // edits and the gizmo is attached to — is drawn brighter, so a selection
  // of twenty still says which one the controls are talking about.
  const worlds = worldTransforms(animScene, time);
  for (const other of animScene.shapes) {
    if (!animSelectedIds.has(other.id)) continue;
    const w2 = worlds.get(other.id) || sampleShape(other, time);
    const hull = selectionOutline(other, w2, camera, w, h);
    if (hull.length < 3) continue;
    ctx.save();
    // Neutral rather than the accent: the accent is the same blue the Z
    // axis uses, and a selection outline that matches a gizmo axis reads
    // as a handle you can grab.
    ctx.strokeStyle = '#f2f7f3';
    ctx.lineWidth = other.id === shape.id ? 1.5 : 1;
    ctx.globalAlpha = other.id === shape.id ? 0.85 : 0.4;
    ctx.beginPath();
    ctx.moveTo(hull[0][0], hull[0][1]);
    for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i][0], hull[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // The gizmo, over the outline. Drawn here rather than by a renderer
  // because it is an editor guide: it must appear over either renderer and
  // must never reach an export.
  for (const handle of animGizmoHandles(w, h)) {
    ctx.save();
    ctx.strokeStyle = handle.color;
    ctx.fillStyle = handle.color;
    ctx.lineWidth = handle.kind === 'rotate' ? 1.6 : 2.2;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(handle.points[0][0], handle.points[0][1]);
    for (let i = 1; i < handle.points.length; i++) {
      ctx.lineTo(handle.points[i][0], handle.points[i][1]);
    }
    if (handle.closed) ctx.closePath();
    ctx.stroke();
    // A grabbable end: an arm you cannot see the end of is one you aim at
    // by guessing.
    if (handle.kind !== 'rotate') {
      const tip = handle.points[handle.points.length - 1];
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], handle.kind === 'scale' ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (shape.keyframes.length < 2) return;
  const pts = shapePathScreen(shape, camera, w, h);
  if (pts.length < 2) return;

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  // Dashed, so the guide never reads as part of the artwork.
  ctx.setLineDash(shape.smoothPath ? [] : [5, 5]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.setLineDash([]);

  // A dot per keyframe, so the waypoints the path passes through are
  // visible as the things you can actually move.
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = accent;
  for (const k of shape.keyframes) {
    const world = { x: k.x, y: k.y, z: k.z || 0 };
    let px;
    let py;
    if (camera) {
      const p = projectPoint(world, camera, w, h);
      if (!p.visible) continue;
      px = p.x; py = p.y;
    } else {
      px = (world.x / 100) * w;
      py = (world.y / 100) * h;
    }
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function animOnShow() {
  anim3dSync();
  animTime.max = String(animScene.duration);
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animDrawTimeline();
}

/* ---------- 3D ---------- */
//
// 3D is opt-in per scene. A scene without a camera renders through the
// original 2D path unchanged, which is what lets this ship without
// reflowing anything anyone has already made.
const anim3dToggle = document.getElementById('anim-3d');
const animCameraControls = document.getElementById('camera-controls');
const animCameraPreset = document.getElementById('anim-camera-preset');
const animFov = document.getElementById('anim-fov');
const animFovValue = document.getElementById('anim-fov-value');
const animZ = document.getElementById('anim-z');
const animZValue = document.getElementById('anim-z-value');
const animRotX = document.getElementById('anim-rotx');
const animRotXValue = document.getElementById('anim-rotx-value');
const animRotY = document.getElementById('anim-roty');
const animRotYValue = document.getElementById('anim-roty-value');

const ANIM_ORBIT_TARGET = { x: 50, y: 50, z: 0 };

function anim3dSync() {
  animSyncCameraKeys();
  animSyncLight();
  const on = is3D(animScene);
  anim3dToggle.checked = on;
  animCameraControls.hidden = !on;
  animateView.classList.toggle('anim-3d-on', on);
  if (on) {
    animFov.value = String(Math.round(animScene.camera.fov));
    animFovValue.textContent = `${Math.round(animScene.camera.fov)}°`;
  }
}

anim3dToggle.addEventListener('change', () => {
  if (anim3dToggle.checked) enable3D(animScene);
  else disable3D(animScene);
  anim3dSync();
  animSyncProps();
  animDraw();
  animRecord();
});

animFov.addEventListener('input', () => {
  if (!is3D(animScene)) return;
  const fov = parseInt(animFov.value, 10);
  animFovValue.textContent = `${fov}°`;
  // Keep the camera the same distance from the subject while the lens
  // changes, so this reads as changing lens rather than walking backwards.
  const target = ANIM_ORBIT_TARGET;
  const radius = distanceTo(animScene.camera, target);
  animScene.camera.fov = fov;
  const scaled = orbit(animScene.camera, target, 0, 0);
  const currentRadius = distanceTo(scaled, target) || 1;
  const k = radius / currentRadius;
  animScene.camera.x = target.x + (scaled.x - target.x) * k;
  animScene.camera.y = target.y + (scaled.y - target.y) * k;
  animScene.camera.z = target.z + (scaled.z - target.z) * k;
  animDraw();
});
animFov.addEventListener('change', () => { animAutoKeyCamera(); animRecord(); });

animCameraPreset.addEventListener('change', () => {
  const preset = CAMERA_PRESETS[animCameraPreset.value];
  if (!preset || !is3D(animScene)) return;
  // Presets are angles; put the camera on that angle at the framing
  // distance so every preset frames the subject rather than landing the
  // camera somewhere arbitrary.
  const radius = framingDistance(animScene.camera.fov);
  let cam = { ...animScene.camera, x: ANIM_ORBIT_TARGET.x, y: ANIM_ORBIT_TARGET.y, z: ANIM_ORBIT_TARGET.z - radius,
              rotX: 0, rotY: 0, rotZ: 0 };
  cam = orbit(cam, ANIM_ORBIT_TARGET, -preset.rotY, preset.rotX);
  animScene.camera = cam;
  animCameraPreset.value = '';
  animDraw();
  animRecord();
});

// Dragging the preview orbits; scrolling dollies.
let orbitDrag = null;
let moveDrag = null;
let animGizmoMode = 'move';

const animToolButtons = [...document.querySelectorAll('.anim-tool')];

function animSetGizmoMode(mode) {
  if (!GIZMO_MODES.includes(mode) || mode === animGizmoMode) return;
  animGizmoMode = mode;
  for (const btn of animToolButtons) {
    const on = btn.dataset.mode === mode;
    btn.classList.toggle('selected', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  animDraw();
}

for (const btn of animToolButtons) {
  btn.addEventListener('click', () => animSetGizmoMode(btn.dataset.mode));
}

// G, R, S — the keys every 3D tool uses for these three.
document.addEventListener('keydown', (ev) => {
  if (animateView.hidden) return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (isTextEntry(ev.target)) return;
  const mode = { g: 'move', r: 'rotate', s: 'scale' }[String(ev.key).toLowerCase()];
  if (!mode) return;
  ev.preventDefault();
  animSetGizmoMode(mode);
});

/** The gizmo's handles for the current selection, in canvas pixels. */
function animGizmoHandles(width, height) {
  const shape = animSelected();
  if (!shape || animPlaying || animExporting) return [];
  const t = parseFloat(animTime.value) || 0;
  const world = worldTransforms(animScene, t).get(shape.id) || sampleShape(shape, t);
  return gizmoHandles(animGizmoMode, world, cameraAt(animScene, t), width, height);
}

/**
 * Apply one step of a gizmo drag.
 *
 * Measured from where the drag began rather than accumulated per move
 * event: accumulating turns a rotation into a sum of small angles whose
 * rounding drifts, and makes the result depend on how many pointer events
 * the browser happened to deliver.
 */
function animDragHandle(shape, drag, at, time) {
  const camera = cameraAt(animScene, time);
  const world = worldTransforms(animScene, time).get(shape.id) || drag.starts.get(shape.id);
  const centre = { x: world.x, y: world.y, z: world.z || 0 };
  const handle = drag.handle;
  const targets = animSelectionRoots();

  if (handle.kind === 'move') {
    const axis = AXES.find((a) => a.id === handle.axis);
    const anchor = drag.starts.get(shape.id) || world;
    // One amount for the whole selection, computed against the object the
    // handle is actually attached to. Recomputing it per object would give
    // each its own answer and the group would shear apart.
    const amount = axisMoveAmount(axis.vec,
      { x: anchor.x, y: anchor.y, z: anchor.z || 0 },
      camera, at.width, at.height, drag.from, at);
    for (const target of targets) {
      const start = drag.starts.get(target.id);
      if (!start) continue;
      const delta = localDelta(animScene, target, time, {
        x: axis.vec.x * amount, y: axis.vec.y * amount, z: axis.vec.z * amount,
      });
      setKeyframe(target, time, {
        x: start.x + delta.x,
        y: start.y + delta.y,
        ...(camera ? { z: (start.z || 0) + delta.z } : {}),
      });
    }
    return;
  }

  if (handle.kind === 'rotate') {
    const degrees = rotationForDrag(handle.axis, centre, camera,
                                    at.width, at.height, drag.from, at);
    const channel = AXIS_ROTATION_CHANNEL[handle.axis];
    // Each object turns about its own origin rather than about a shared
    // pivot. With one rotation channel per axis and no separate pivot in
    // the data model, a shared pivot would have to be faked by also moving
    // every object — which is a different edit wearing the same name.
    for (const target of targets) {
      const start = drag.starts.get(target.id);
      if (!start) continue;
      setKeyframe(target, time, { [channel]: (start[channel] || 0) + degrees });
    }
    return;
  }

  if (handle.kind === 'scale') {
    const factor = scaleForDrag(handle.centre, drag.from, at);
    for (const target of targets) {
      const start = drag.starts.get(target.id);
      if (!start) continue;
      // A scale of zero makes a shape that cannot be grabbed again, and a
      // negative one turns geometry inside out with no visible cause.
      setKeyframe(target, time, {
        scale: Math.max(0.02, Math.min(20, (start.scale || 1) * factor)),
      });
    }
  }
}

/** Every selected root's transform at the moment a drag begins. */
function animDragStarts(time) {
  const starts = new Map();
  for (const shape of animSelectionRoots()) {
    starts.set(shape.id, { ...sampleShape(shape, time) });
  }
  const active = animSelected();
  if (active && !starts.has(active.id)) {
    starts.set(active.id, { ...sampleShape(active, time) });
  }
  return starts;
}

/** Pointer position in the render canvas's own pixel coordinates. */
function animStagePoint(ev) {
  const live = animGLCanvas && !animGLCanvas.hidden ? animGLCanvas : animCanvas;
  const box = live.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  return {
    x: ((ev.clientX - box.left) / box.width) * live.width,
    y: ((ev.clientY - box.top) / box.height) * live.height,
    width: live.width,
    height: live.height,
  };
}

/** What the pointer is over right now, or null. */
function animHitTest(ev) {
  const at = animStagePoint(ev);
  if (!at) return null;
  const t = parseFloat(animTime.value) || 0;
  const frame = resolveFrame(animScene, t);
  return pickAt(frame.order, frame.camera, at.width, at.height, at.x, at.y);
}

// Pointing at the thing you want and moving it is what makes a viewport a
// viewport. Drag an object to move it; drag the background to orbit. Hold
// Alt, or use the middle button, to orbit even over an object — the escape
// hatch for a scene so full that the background is not reachable.
animStage.addEventListener('pointerdown', (ev) => {
  const wantsOrbit = ev.altKey || ev.button === 1;
  const at = wantsOrbit ? null : animStagePoint(ev);

  // A gizmo handle outranks the objects beneath it. Aiming at an arm and
  // getting the object behind it instead would make the handles unusable
  // in a crowded scene, which is precisely where they matter.
  const handle = at
    ? pickHandle(animGizmoHandles(at.width, at.height), at.x, at.y)
    : null;
  if (handle) {
    const shape = animSelected();
    moveDrag = {
      id: shape.id,
      handle,
      // The transform the drag started from. Every step is measured
      // against this rather than accumulated frame by frame, so a slow
      // drag and a fast one over the same distance land in the same place.
      from: { x: at.x, y: at.y },
      // The transforms the drag started from, one per object it will move.
      // Every step is measured against these rather than accumulated frame
      // by frame, so a slow drag and a fast one land in the same place.
      starts: animDragStarts(parseFloat(animTime.value) || 0),
      x: ev.clientX,
      y: ev.clientY,
      moved: false,
    };
    animStage.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    return;
  }

  const hit = wantsOrbit ? null : animHitTest(ev);

  if (hit) {
    const additive = ev.shiftKey || ev.ctrlKey || ev.metaKey;
    if (additive || hit.shape.id !== animSelectedId) {
      const next = applyClick(animSelectedIds, animSelectedId, hit.shape.id, { additive });
      animSetSelection(next.ids, next.activeId);
      animRenderShapeList();
      animSyncProps();
    }
    moveDrag = {
      id: hit.shape.id,
      handle: null,
      x: ev.clientX,
      y: ev.clientY,
      moved: false,
    };
    animStage.setPointerCapture(ev.pointerId);
    animDraw();
    ev.preventDefault();
    return;
  }

  if (!is3D(animScene)) return;
  orbitDrag = { x: ev.clientX, y: ev.clientY };
  animStage.setPointerCapture(ev.pointerId);
  ev.preventDefault();
});

animStage.addEventListener('pointermove', (ev) => {
  if (moveDrag) {
    const shape = animScene.shapes.find((s) => s.id === moveDrag.id);
    if (!shape) { moveDrag = null; return; }
    const dx = ev.clientX - moveDrag.x;
    const dy = ev.clientY - moveDrag.y;
    // A click is a select, not a nudge. Until the pointer has actually
    // travelled, selecting a small object would jitter it by a pixel or
    // two and write a keyframe nobody asked for.
    if (!moveDrag.moved && Math.hypot(dx, dy) < 3) return;
    moveDrag.moved = true;
    moveDrag.x = ev.clientX;
    moveDrag.y = ev.clientY;

    const at = animStagePoint(ev);
    if (!at) return;
    const t = parseFloat(animTime.value) || 0;

    if (moveDrag.handle) {
      animDragHandle(shape, moveDrag, at, t);
      animSyncProps();
      animRenderKeyframes();
      animDraw();
      return;
    }

    const camera = cameraAt(animScene, t);
    const world = worldTransforms(animScene, t).get(shape.id) || sampleShape(shape, t);
    // Screen pixels are measured on the live canvas, but the pointer moved
    // in CSS pixels; scale the delta the same way the position was.
    const live = animGLCanvas && !animGLCanvas.hidden ? animGLCanvas : animCanvas;
    const box = live.getBoundingClientRect();
    const sx = box.width ? live.width / box.width : 1;
    const sy = box.height ? live.height / box.height : 1;
    const delta = dragToWorld(dx * sx, dy * sy,
      { x: world.x, y: world.y, z: world.z || 0 }, camera, at.width, at.height);

    // Every selected object moves together — but only the roots of the
    // selection: a child already follows its parent, so moving both moves
    // the child twice and it races away at double speed.
    for (const target of animSelectionRoots()) {
      // Each shape's keyframes hold its own local transform, so a
      // world-space drag has to be expressed in that shape's parent frame
      // before it is written.
      const local = localDelta(animScene, target, t, delta);
      const now = sampleShape(target, t);
      setKeyframe(target, t, {
        x: now.x + local.x,
        y: now.y + local.y,
        ...(camera ? { z: (now.z || 0) + local.z } : {}),
      });
    }
    animSyncProps();
    animRenderKeyframes();
    animDraw();
    return;
  }

  if (!orbitDrag || !is3D(animScene)) return;
  const dx = ev.clientX - orbitDrag.x;
  const dy = ev.clientY - orbitDrag.y;
  orbitDrag = { x: ev.clientX, y: ev.clientY };
  animScene.camera = orbit(animScene.camera, ANIM_ORBIT_TARGET, dx * 0.4, -dy * 0.4);
  animDraw();
});

for (const type of ['pointerup', 'pointercancel']) {
  animStage.addEventListener(type, () => {
    if (moveDrag) {
      // Only a drag that actually moved something is worth an undo step.
      const moved = moveDrag.moved;
      moveDrag = null;
      if (moved) animRecord();
    }
    if (orbitDrag) { orbitDrag = null; animAutoKeyCamera(); animRecord(); }
  });
}

// The cursor is the only cue that an object is grabbable before you try.
animStage.addEventListener('pointermove', (ev) => {
  if (moveDrag || orbitDrag) return;
  animStage.style.cursor = animHitTest(ev) ? 'move' : (is3D(animScene) ? 'grab' : '');
});

animStage.addEventListener('wheel', (ev) => {
  if (!is3D(animScene)) return;
  ev.preventDefault();
  const step = -Math.sign(ev.deltaY) * 6;
  const moved = dolly(animScene.camera, step);
  // Never let a dolly pass through the subject: beyond that point the scene
  // turns inside out and there is no obvious way back.
  if (distanceTo(moved, ANIM_ORBIT_TARGET) > 12) {
    animScene.camera = moved;
    animAutoKeyCamera();
  }
  animDraw();
}, { passive: false });

// Depth and the two extra rotation axes write into the keyframe the same
// way every other property does.
function anim3dCommit() {
  const shape = animSelected();
  if (!shape) return;
  setKeyframe(shape, parseFloat(animTime.value), {
    z: parseFloat(animZ.value),
    rotX: parseFloat(animRotX.value),
    rotY: parseFloat(animRotY.value),
  });
  anim3dSyncLabels();
  animRenderKeyframes();
  animDraw();
}

const animExtrudeRow = document.getElementById('anim-extrude-row');
const animExtrude = document.getElementById('anim-extrude');
const animExtrudeValue = document.getElementById('anim-extrude-value');

animExtrude.addEventListener('input', () => {
  const shape = animSelected();
  if (!shape) return;
  shape.extrude = parseInt(animExtrude.value, 10);
  animExtrudeValue.textContent = animExtrude.value;
  animDraw();
});
animExtrude.addEventListener('change', animRecord);

function anim3dSyncLabels() {
  animZValue.textContent = animZ.value;
  animRotXValue.textContent = animRotX.value;
  animRotYValue.textContent = animRotY.value;
}

for (const el of [animZ, animRotX, animRotY]) {
  el.addEventListener('input', anim3dCommit);
  el.addEventListener('change', animRecord);
}

// --- Camera keyframes ---
//
// Keying the camera is what turns a viewpoint into a shot: dolly in over
// four seconds, orbit past a title, pull back to reveal. The camera samples
// through the same easing machinery as every shape.
const animCamKeyBtn = document.getElementById('anim-camkey-btn');
const animCamKeyCount = document.getElementById('anim-camkey-count');
const animCamClearBtn = document.getElementById('anim-camclear-btn');

function animSyncCameraKeys() {
  const n = cameraKeys(animScene).length;
  animCamKeyCount.hidden = n === 0;
  animCamClearBtn.hidden = n === 0;
  animCamKeyCount.textContent = `${n} key${n === 1 ? '' : 's'}`;
}

animCamKeyBtn.addEventListener('click', () => {
  if (!is3D(animScene)) return;
  setCameraKey(animScene, parseFloat(animTime.value));
  animSyncCameraKeys();
  animDraw();
  animRecord();
  showToast('Camera keyed here');
});

animCamClearBtn.addEventListener('click', () => {
  animScene.cameraKeyframes = [];
  animSyncCameraKeys();
  animDraw();
  animRecord();
});

// Once the camera is animated, moving it means moving it AT this moment:
// orbit, dolly and lens changes re-key the playhead's frame rather than
// silently editing a base camera the render no longer shows. This is the
// auto-key behaviour every animation tool converges on, because the
// alternative is a drag that visibly does nothing.
function animAutoKeyCamera() {
  if (!is3D(animScene) || !cameraKeys(animScene).length) return;
  setCameraKey(animScene, parseFloat(animTime.value));
  animSyncCameraKeys();
}

// --- The scene light ---
const animLightControls = document.getElementById('light-controls');
const animLightAz = document.getElementById('anim-light-az');
const animLightAzValue = document.getElementById('anim-light-az-value');
const animLightEl = document.getElementById('anim-light-el');
const animLightElValue = document.getElementById('anim-light-el-value');
const animLightWarm = document.getElementById('anim-light-warm');
const animLightWarmValue = document.getElementById('anim-light-warm-value');
const animLightKeyBtn = document.getElementById('anim-lightkey-btn');
const animLightKeyCount = document.getElementById('anim-lightkey-count');
const animLightClearBtn = document.getElementById('anim-lightclear-btn');

function animSyncLight() {
  const on = is3D(animScene);
  animLightControls.hidden = !on;
  if (!on) return;
  // Scenes saved before the light existed arrive without one.
  if (!animScene.light) animScene.light = createLight();
  animLightAz.value = String(Math.round(animScene.light.azimuth));
  animLightEl.value = String(Math.round(animScene.light.elevation));
  animLightWarm.value = String(animScene.light.warmth);
  animLightAzValue.textContent = `${Math.round(animScene.light.azimuth)}°`;
  animLightElValue.textContent = `${Math.round(animScene.light.elevation)}°`;
  animLightWarmValue.textContent = Number(animScene.light.warmth).toFixed(2);
  const n = lightKeys(animScene).length;
  animLightKeyCount.hidden = n === 0;
  animLightClearBtn.hidden = n === 0;
  animLightKeyCount.textContent = `${n} key${n === 1 ? '' : 's'}`;
}

// Like the camera: once the light is animated, editing it edits this
// moment's keyframe rather than a base the render no longer shows.
function animAutoKeyLight() {
  if (!is3D(animScene) || !lightKeys(animScene).length) return;
  setLightKey(animScene, parseFloat(animTime.value));
  animSyncLight();
}

function animLightInput() {
  if (!is3D(animScene)) return;
  if (!animScene.light) animScene.light = createLight();
  animScene.light.azimuth = parseFloat(animLightAz.value);
  animScene.light.elevation = parseFloat(animLightEl.value);
  animScene.light.warmth = parseFloat(animLightWarm.value);
  animLightAzValue.textContent = `${Math.round(animScene.light.azimuth)}°`;
  animLightElValue.textContent = `${Math.round(animScene.light.elevation)}°`;
  animLightWarmValue.textContent = animScene.light.warmth.toFixed(2);
  animAutoKeyLight();
  animDraw();
}

for (const el of [animLightAz, animLightEl, animLightWarm]) {
  el.addEventListener('input', animLightInput);
  el.addEventListener('change', animRecord);
}

animLightKeyBtn.addEventListener('click', () => {
  if (!is3D(animScene)) return;
  setLightKey(animScene, parseFloat(animTime.value));
  animSyncLight();
  animDrawTimeline();
  animRecord();
  showToast('Light keyed here');
});

animLightClearBtn.addEventListener('click', () => {
  animScene.lightKeyframes = [];
  animSyncLight();
  animDrawTimeline();
  animRecord();
});


/* ---------- Autosave ---------- */
//
// The scene, the beat and the lyrics survive a reload. Saves are debounced
// off the same chokepoints that record undo history; the restore runs once
// at boot and only into pristine state, so it can never overwrite work.
const workspaceStore = createAutosave({ key: 'thevoice_workspace_v2', storage: localStorage });

function workspacePayload() {
  // Live objects go straight in: JSON.stringify drops the attached easeFn
  // functions, and the restore path revalidates everything anyway.
  return {
    scene: animScene,
    pattern: musicPattern,
    lyrics: (lyricsInput.value || '').slice(0, 20000),
  };
}

function scheduleWorkspaceSave() {
  workspaceStore.schedule(workspacePayload);
}

// The debounce would miss the moments that matter most.
window.addEventListener('beforeunload', () => workspaceStore.flush(workspacePayload));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) workspaceStore.flush(workspacePayload);
});

function restoreWorkspace() {
  const ws = workspaceStore.load();
  if (!workspaceHasContent(ws)) return;

  let restored = false;

  // The scene comes back only into an untouched editor: restoring over
  // something someone has already started would be autosave destroying
  // work instead of protecting it.
  if (ws.scene && animScene.shapes.length === 0 && !is3D(animScene)) {
    try {
      const scene = deserializeScene(ws.scene);
      hydrateSceneImages(scene, loadImage).then(() => animDraw());
      animScene = scene;
      animSetSelection(scene.shapes.length ? [scene.shapes[0].id] : [],
                       scene.shapes.length ? scene.shapes[0].id : null);
      animTime.max = String(animScene.duration);
      animTime.value = '0';
      animHistory.reset(animScene);
      anim3dSync();
      animRenderShapeList();
      animSyncProps();
      animDraw();
      restored = true;
    } catch {
      /* a damaged saved scene is dropped; the beat and lyrics still count */
    }
  }

  if (ws.pattern && ws.pattern.grid && typeof ws.pattern.grid === 'object'
      && !TRACKS.some((t) => musicPattern.grid[t.id].some(Boolean))) {
    // Shape comes from this build's tracks, not the file: a workspace from
    // a build with different drums must not add or drop rows.
    for (const t of TRACKS) {
      const row = Array.isArray(ws.pattern.grid[t.id]) ? ws.pattern.grid[t.id] : [];
      musicPattern.grid[t.id] = Array.from({ length: STEPS }, (_, i) => !!row[i]);
    }
    musicPattern.bpm = Math.round(Math.min(300, Math.max(40, Number(ws.pattern.bpm) || 96)));
    musicPattern.swing = Math.min(1, Math.max(0, Number(ws.pattern.swing) || 0));
    musicBpm.value = String(musicPattern.bpm);
    musicBpmValue.textContent = `${musicPattern.bpm} bpm`;
    musicSwing.value = String(musicPattern.swing);
    musicSwingValue.textContent = musicPattern.swing.toFixed(2);
    if (musicSequencerBuilt) syncSequencer();
    restored = true;
  }

  if (typeof ws.lyrics === 'string' && ws.lyrics.trim() && !lyricsInput.value.trim()) {
    lyricsInput.value = ws.lyrics.slice(0, 20000);
    renderLyricAnalysis();
    restored = true;
  }

  if (restored) {
    const what = describeWorkspace(ws);
    showToast(what ? `Restored your work — ${what}` : 'Restored your work');
  }
}

/* ---------- Undo ---------- */
//
// Snapshots are taken at the boundaries of an action, not on every change:
// a drag mutates the scene on every pointermove, and recording each one
// would mean fifty presses of Ctrl+Z to walk back one gesture.
const animUndoBtn = document.getElementById('anim-undo-btn');
const animRedoBtn = document.getElementById('anim-redo-btn');
const animHistory = createHistory(animScene);

function animSyncHistoryButtons() {
  animUndoBtn.disabled = !animHistory.canUndo();
  animRedoBtn.disabled = !animHistory.canRedo();
}

/** Record the scene as it stands. Safe to call more often than needed. */
function animRecord() {
  animHistory.push(animScene);
  animSyncHistoryButtons();
  scheduleWorkspaceSave();
}

function animRestore(state) {
  if (!state) return;
  animScene = state;
  // The selected shape may not exist in the restored state.
  if (!animScene.shapes.some((s) => s.id === animSelectedId)) {
    animSetSelection(animScene.shapes.length ? [animScene.shapes[0].id] : [],
                   animScene.shapes.length ? animScene.shapes[0].id : null);
  }
  animTime.max = String(animScene.duration);
  if (parseFloat(animTime.value) > animScene.duration) animTime.value = String(animScene.duration);
  anim3dSync();
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animSyncHistoryButtons();
}

function animUndo() {
  // Anything done since the last commit would otherwise be skipped over —
  // committing first makes the current state a place undo can return to.
  animHistory.push(animScene);
  animRestore(animHistory.undo());
}

function animRedo() {
  animRestore(animHistory.redo());
}

animUndoBtn.addEventListener('click', animUndo);
animRedoBtn.addEventListener('click', animRedo);

document.addEventListener('keydown', (ev) => {
  const intent = historyIntent(ev);
  if (!intent) return;
  // Ctrl+Z in a text box is that box's own undo; stealing it to revert the
  // scene would destroy work rather than restore it.
  if (isTextEntry(ev.target)) return;
  if (animateView.hidden) return;
  ev.preventDefault();
  if (intent === 'undo') animUndo();
  else animRedo();
});

/* ---------- Timeline ---------- */
//
// Keyframes were a row of chips you could click but not move, which left
// timing — half of animation — as something you could only retype. Here
// they are diamonds on a track, dragged against a ruler.
const animTimelineCanvas = document.getElementById('anim-timeline');
const animTimelineCtx = animTimelineCanvas.getContext('2d');

let timelineDrag = null;   // { laneIndex, keyframeIndex } while dragging
let timelineScrubbing = false;

/**
 * What the timeline shows, one lane per row.
 *
 * The camera is a lane like any shape — same hit testing, same dragging,
 * same minimum-gap rules — because its keyframes are the same arithmetic.
 * It sits first so the shot always reads top-down: camera, then subjects.
 * The keyframes arrays are the live ones, so a drag mutates the real data.
 */
function timelineLanes() {
  const lanes = [];
  if (is3D(animScene)) {
    lanes.push({ id: '__camera', label: 'Camera', keyframes: cameraKeys(animScene), isCamera: true });
    // The light only earns a row once it is animated; an empty lane for a
    // static light would just push the subjects down.
    if (lightKeys(animScene).length) {
      lanes.push({ id: '__light', label: 'Light', keyframes: lightKeys(animScene), isCamera: true });
    }
  }
  for (const shape of animScene.shapes) lanes.push(shape);
  return lanes;
}

/**
 * Size the backing store to device pixels.
 *
 * A canvas sized only by CSS is drawn at 1x and upscaled, which turns
 * hairlines and small labels to mush on any modern display.
 */
function timelineResize() {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = animTimelineCanvas.clientWidth || 640;
  const cssHeight = timelineHeight(timelineLanes().length);
  const w = Math.round(cssWidth * dpr);
  const h = Math.round(cssHeight * dpr);
  // Assigning width or height reallocates the backing store and clears it.
  // The timeline repaints on every playback frame to move the playhead, so
  // only touch these when they have actually changed.
  if (animTimelineCanvas.width !== w || animTimelineCanvas.height !== h) {
    animTimelineCanvas.style.height = `${cssHeight}px`;
    animTimelineCanvas.width = w;
    animTimelineCanvas.height = h;
    animTimelineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return { width: cssWidth, height: cssHeight };
}

function animDrawTimeline() {
  const { width, height } = timelineResize();
  const ctx = animTimelineCtx;
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#e8efe9';
  const dim = css.getPropertyValue('--ink-dim').trim() || '#8a9490';
  const faint = css.getPropertyValue('--ink-faint').trim() || '#55605a';
  const phosphor = css.getPropertyValue('--phosphor').trim() || '#3fc6ff';
  const surface = css.getPropertyValue('--surface').trim() || '#121613';
  const alt = css.getPropertyValue('--surface-alt').trim() || '#1a201c';

  const duration = animScene.duration;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, width, height);

  // Ruler
  ctx.fillStyle = alt;
  ctx.fillRect(0, 0, width, RULER_HEIGHT);
  ctx.font = "10px 'Share Tech Mono', monospace";
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (const t of rulerTicks(duration, width)) {
    const x = timeToX(t, duration, width);
    ctx.strokeStyle = faint;
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT - 5);
    ctx.lineTo(x, RULER_HEIGHT);
    ctx.stroke();
    ctx.fillStyle = dim;
    ctx.fillText(`${t}s`, x, RULER_HEIGHT / 2 - 1);
  }

  // Rows
  const amber = css.getPropertyValue('--amber').trim() || '#e8c14a';
  const lanes = timelineLanes();
  ctx.textAlign = 'left';
  for (let i = 0; i < lanes.length; i++) {
    const shape = lanes[i];
    const y = rowY(i);
    const selected = shape.id === animSelectedId;
    // The camera lane is amber throughout: it is part of the shot, not one
    // of the subjects, and the colour keeps that distinction legible.
    const laneInk = shape.isCamera ? amber : (selected ? phosphor : dim);

    if (selected) {
      ctx.fillStyle = alt;
      ctx.fillRect(0, y, width, ROW_HEIGHT);
    }
    ctx.strokeStyle = faint;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, y + ROW_HEIGHT);
    ctx.lineTo(width, y + ROW_HEIGHT);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = laneInk;
    ctx.font = "11px 'Share Tech Mono', monospace";
    const label = shape.label.length > 13 ? `${shape.label.slice(0, 12)}…` : shape.label;
    ctx.fillText(label, 8, y + ROW_HEIGHT / 2);

    // The span a shape is alive for, so gaps are visible at a glance.
    const kfs = shape.keyframes;
    if (kfs.length > 1) {
      const x0 = timeToX(kfs[0].time, duration, width);
      const x1 = timeToX(kfs[kfs.length - 1].time, duration, width);
      ctx.strokeStyle = shape.isCamera ? amber : (selected ? phosphor : faint);
      ctx.lineWidth = 2;
      ctx.globalAlpha = selected || shape.isCamera ? 0.55 : 0.3;
      ctx.beginPath();
      ctx.moveTo(x0, y + ROW_HEIGHT / 2);
      ctx.lineTo(x1, y + ROW_HEIGHT / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const kf of kfs) {
      const x = timeToX(kf.time, duration, width);
      const cy = y + ROW_HEIGHT / 2;
      ctx.fillStyle = laneInk;
      ctx.beginPath();
      ctx.moveTo(x, cy - 5);
      ctx.lineTo(x + 5, cy);
      ctx.lineTo(x, cy + 5);
      ctx.lineTo(x - 5, cy);
      ctx.closePath();
      ctx.fill();
      // A keyframe carrying its own curve is marked, so an authored ease is
      // visible without clicking through every one.
      if (kf.ease !== undefined) {
        ctx.fillStyle = surface;
        ctx.beginPath();
        ctx.arc(x, cy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Playhead, drawn last so it is never hidden behind a keyframe.
  const px = timeToX(parseFloat(animTime.value) || 0, duration, width);
  ctx.strokeStyle = phosphor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px, height);
  ctx.stroke();
  ctx.fillStyle = phosphor;
  ctx.beginPath();
  ctx.moveTo(px - 4, 0);
  ctx.lineTo(px + 4, 0);
  ctx.lineTo(px, 6);
  ctx.closePath();
  ctx.fill();
}

function timelinePointer(ev) {
  const rect = animTimelineCanvas.getBoundingClientRect();
  return { x: ev.clientX - rect.left, y: ev.clientY - rect.top, width: rect.width };
}

function timelineSeek(time) {
  animTime.value = String(Math.min(animScene.duration, Math.max(0, time)));
  animSyncProps();
  animDraw();
}

animTimelineCanvas.addEventListener('pointerdown', (ev) => {
  const { x, y, width } = timelinePointer(ev);
  const duration = animScene.duration;

  const lanes = timelineLanes();
  const hit = hitTestKeyframe(lanes, x, y, duration, width);
  if (hit) {
    // Selecting the shape as well: dragging a keyframe of an unselected
    // shape and having the properties panel keep showing a different one
    // would be its own small betrayal. The camera lane changes no
    // selection — it is not a subject.
    if (!hit.shape.isCamera) animSetSelection([hit.shape.id], hit.shape.id);
    timelineDrag = { laneIndex: hit.shapeIndex, keyframeIndex: hit.keyframeIndex };
    animTimelineCanvas.setPointerCapture(ev.pointerId);
    timelineSeek(hit.keyframe.time);
    animRenderShapeList();
    animDrawTimeline();
    ev.preventDefault();
    return;
  }

  const row = rowAt(y);
  if (row >= 0 && row < lanes.length && !lanes[row].isCamera) {
    animSetSelection([lanes[row].id], lanes[row].id);
    animRenderShapeList();
    animSyncProps();
  }
  timelineScrubbing = true;
  animTimelineCanvas.setPointerCapture(ev.pointerId);
  timelineSeek(xToTime(x, duration, width));
  animDrawTimeline();
  ev.preventDefault();
});

animTimelineCanvas.addEventListener('pointermove', (ev) => {
  if (!timelineDrag && !timelineScrubbing) return;
  const { x, width } = timelinePointer(ev);
  const duration = animScene.duration;
  const raw = xToTime(x, duration, width);

  if (timelineDrag) {
    const shape = timelineLanes()[timelineDrag.laneIndex];
    if (!shape) return;
    // Snap to frames unless alt is held. Two keyframes a thousandth apart
    // are the same picture once sampled, and snapping is what lets timings
    // line up across shapes.
    const target = ev.altKey ? raw : snapToFrame(raw, animScene.fps);
    const landed = moveKeyframe(shape, timelineDrag.keyframeIndex, target, duration);
    if (landed !== null) timelineSeek(landed);
    animRenderKeyframes();
  } else {
    timelineSeek(raw);
  }
  animDrawTimeline();
});

for (const type of ['pointerup', 'pointercancel']) {
  animTimelineCanvas.addEventListener(type, () => {
    const wasDragging = timelineDrag !== null;
    timelineDrag = null;
    timelineScrubbing = false;
    animSyncProps();
    animDrawTimeline();
    // Scrubbing changes nothing; only a keyframe move is worth recording.
    if (wasDragging) animRecord();
  });
}

// Keyboard: move the playhead, and nudge the keyframe under it.
animTimelineCanvas.addEventListener('keydown', (ev) => {
  const frame = 1 / (animScene.fps || 30);
  const step = ev.shiftKey ? frame * 10 : frame;
  const t = parseFloat(animTime.value) || 0;

  if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
    ev.preventDefault();
    const dir = ev.key === 'ArrowRight' ? 1 : -1;
    const shape = animSelected();
    if (ev.altKey && shape) {
      // Alt: carry the keyframe at the playhead rather than the playhead.
      const i = shape.keyframes.findIndex((k) => Math.abs(k.time - t) < frame / 2);
      if (i >= 0) {
        const landed = moveKeyframe(shape, i, shape.keyframes[i].time + dir * step, animScene.duration);
        if (landed !== null) timelineSeek(landed);
        animRenderKeyframes();
      }
    } else {
      timelineSeek(t + dir * step);
    }
    animDrawTimeline();
  } else if (ev.key === 'Home') {
    ev.preventDefault(); timelineSeek(0); animDrawTimeline();
  } else if (ev.key === 'End') {
    ev.preventDefault(); timelineSeek(animScene.duration); animDrawTimeline();
  }
});

window.addEventListener('resize', () => {
  if (!animateView.hidden) animDrawTimeline();
});

/* ---------- Scene agent ---------- */
//
// One box, two engines. The local pattern matcher answers instantly and
// costs nothing; anything it cannot parse goes to the model, if one is
// configured. The order matters — trying local first means the common
// requests never incur a bill or a wait.
const agentPrompt = document.getElementById('agent-prompt');
const agentGoBtn = document.getElementById('agent-go-btn');
const agentStatus = document.getElementById('agent-status');
const agentExamples = document.getElementById('agent-examples');

const AGENT_EXAMPLES = [
  'three blue circles that fade in',
  'a title saying "THE VOICE" bouncing in',
  'five bars pulsing to the music',
  'a red triangle spinning for 8 seconds',
  'waves drifting across in teal and purple',
];

for (const example of AGENT_EXAMPLES) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'agent-example';
  btn.textContent = example;
  btn.addEventListener('click', () => {
    agentPrompt.value = example;
    agentPrompt.focus();
  });
  agentExamples.appendChild(btn);
}

/** Replace the scene with a generated one, keeping the panel in step. */
function agentApplyScene(scene) {
  animScene = {
    duration: scene.duration,
    fps: scene.fps,
    background: scene.background,
    shapes: scene.shapes,
  };
  // Solids only exist under a camera; a described cube must not silently
  // arrive as its flat silhouette.
  if (animScene.shapes.some((sh) => isMeshType(sh.type))) enable3D(animScene);
  anim3dSync();
  animSetSelection(animScene.shapes.length ? [animScene.shapes[0].id] : [],
                   animScene.shapes.length ? animScene.shapes[0].id : null);
  animLevels = null;
  animTime.max = String(animScene.duration);
  animTime.value = '0';
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animRecord();
}

async function agentCreate() {
  const prompt = agentPrompt.value.trim();
  if (!prompt) {
    agentStatus.textContent = 'Describe what you want to see first.';
    return;
  }

  // The scene you already have comes first. Someone who has imported a
  // dragon and typed "the dragon smashes into the tower" means *that*
  // dragon; building a fresh sphere and cube instead would throw away
  // everything they had arranged.
  if (animScene.shapes.length) {
    const before = JSON.parse(JSON.stringify(animScene));
    const acted = actOnScene(animScene, prompt, {
      selectedIds: animSelectedIds,
      mintId: () => `a${animAgentSerial++}`,
    });
    if (acted) {
      animTime.max = String(animScene.duration);
      if (acted.added && !is3D(animScene)) { enable3D(animScene); anim3dSync(); }
      animRenderShapeList();
      animSyncProps();
      animDraw();
      animRecord();
      const who = acted.cast.subject.label;
      const what = acted.cast.object ? ` into ${acted.cast.object.label}` : '';
      agentStatus.textContent = `${who} ${acted.action}${what}`
        + (acted.added ? `, ${acted.added} pieces` : '')
        + '. Every keyframe is editable below.';
      showToast('Scene updated');
      return;
    }
    // Nothing in the scene answered to the sentence; leave it exactly as
    // it was rather than half-applied.
    animScene = before;
  }

  // Otherwise build one from scratch: instant, free, and what "three blue
  // circles" actually asks for.
  const local = parseLocalCommand(prompt);
  if (local) {
    agentApplyScene(local);
    agentStatus.textContent = `Built here on the spot — ${local.summary}. Edit any shape below.`;
    showToast('Scene created');
    return;
  }

  const config = getSupabaseConfig();
  const endpoint = getAgentEndpoint() || defaultEndpointFor(config && config.url);
  if (!endpoint) {
    agentStatus.textContent = 'That needs the AI agent, which is not set up on this deployment yet. '
      + 'Try naming a shape and a movement — "a red square that spins" — which works without it.';
    return;
  }

  agentGoBtn.disabled = true;
  const label = agentGoBtn.textContent;
  agentGoBtn.textContent = 'Thinking…';
  agentStatus.textContent = 'Asking the model…';
  try {
    const session = await getCurrentSession().catch(() => null);
    const result = await requestScene({
      prompt,
      // Sending the current scene lets follow-ups like "make it slower"
      // work on what is already there rather than starting over.
      scene: animScene.shapes.length ? animScene : null,
      endpoint,
      accessToken: session && session.access_token,
      anonKey: config && config.anonKey,
    });
    if (!result.ok) {
      agentStatus.textContent = result.message;
      return;
    }
    agentApplyScene(result.scene);
    agentStatus.textContent = result.summary || 'Scene created.';
    showToast('Scene created');
  } catch (err) {
    agentStatus.textContent = err.message || 'The scene agent failed.';
  } finally {
    agentGoBtn.disabled = false;
    agentGoBtn.textContent = label;
  }
}

agentGoBtn.addEventListener('click', agentCreate);
agentPrompt.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') { ev.preventDefault(); agentCreate(); }
});

/* ---------- Timing curve editor ---------- */
//
// The keyframe a segment leaves from owns that segment's curve, so editing
// here always targets the keyframe at or before the playhead — the same
// one whose chip is highlighted.
const animCurveCanvas = document.getElementById('anim-curve');
const animCurveCtx = animCurveCanvas.getContext('2d');
const animCurveNote = document.getElementById('anim-curve-note');

/** The keyframe whose outgoing segment the playhead currently sits in. */
function animActiveKeyframe() {
  const shape = animSelected();
  if (!shape || !shape.keyframes.length) return null;
  const t = parseFloat(animTime.value);
  let found = shape.keyframes[0];
  for (const kf of shape.keyframes) {
    if (kf.time <= t + 0.0001) found = kf;
  }
  return found;
}

function animCurveSpec() {
  const kf = animActiveKeyframe();
  if (!kf) return 'ease';
  return kf.ease === undefined ? (animSelected()?.easing || 'ease') : kf.ease;
}

// Handles live in curve space (0..1 on x, unbounded on y). The drawing pads
// the box so an overshooting handle stays on screen instead of being cut
// off at the edge it is meant to cross.
const CURVE_PAD = 46;

function curveToPixels(x, y) {
  const size = animCurveCanvas.width;
  const inner = size - CURVE_PAD * 2;
  return [CURVE_PAD + x * inner, size - CURVE_PAD - y * inner];
}

function pixelsToCurve(px, py) {
  const size = animCurveCanvas.width;
  const inner = size - CURVE_PAD * 2;
  return [(px - CURVE_PAD) / inner, (size - CURVE_PAD - py) / inner];
}

function animDrawCurve() {
  const ctx = animCurveCtx;
  const size = animCurveCanvas.width;
  const spec = animCurveSpec();
  const named = typeof spec === 'string';
  const ease = resolveEasing(spec);
  const points = easingPoints(spec);

  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#e8efe9';
  const dim = css.getPropertyValue('--ink-faint').trim() || '#55605a';
  const phosphor = css.getPropertyValue('--phosphor').trim() || '#3fc6ff';
  const surface = css.getPropertyValue('--surface').trim() || '#121613';

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, size, size);

  // The unit box: the region a non-overshooting curve stays inside.
  const [bx0, by0] = curveToPixels(0, 1);
  const [bx1, by1] = curveToPixels(1, 0);
  ctx.strokeStyle = dim;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);

  // Quarter gridlines, so the shape of the curve can be read off.
  ctx.globalAlpha = 0.35;
  for (let i = 1; i < 4; i++) {
    const [gx] = curveToPixels(i / 4, 0);
    const [, gy] = curveToPixels(0, i / 4);
    ctx.beginPath(); ctx.moveTo(gx, by0); ctx.lineTo(gx, by1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx0, gy); ctx.lineTo(bx1, gy); ctx.stroke();
  }
  // The diagonal is linear — the reference every other curve is read against.
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(...curveToPixels(0, 0));
  ctx.lineTo(...curveToPixels(1, 1));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // The curve itself, sampled from the same function playback uses — so
  // what is drawn cannot drift from what is rendered.
  ctx.strokeStyle = phosphor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const x = i / 120;
    const [px, py] = curveToPixels(x, ease(x));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Handles are only meaningful for curves that are a single bezier.
  if (named && !EASING_CURVES[spec]) {
    animCurveCanvas.dataset.draggable = 'false';
    return;
  }
  animCurveCanvas.dataset.draggable = 'true';

  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  for (const [i, anchor] of [[0, [0, 0]], [1, [1, 1]]]) {
    const [hx, hy] = [points[i * 2], points[i * 2 + 1]];
    ctx.beginPath();
    ctx.moveTo(...curveToPixels(anchor[0], anchor[1]));
    ctx.lineTo(...curveToPixels(hx, hy));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < 2; i++) {
    const [px, py] = curveToPixels(points[i * 2], points[i * 2 + 1]);
    ctx.fillStyle = phosphor;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = surface;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animSyncCurve() {
  const kf = animActiveKeyframe();
  const spec = animCurveSpec();
  animEasing.value = typeof spec === 'string' && ALL_EASING_NAMES.includes(spec) ? spec : 'custom';
  if (!kf) {
    animCurveNote.textContent = '';
  } else if (Array.isArray(spec)) {
    animCurveNote.textContent = `${kf.time.toFixed(2)}s · custom`;
  } else {
    animCurveNote.textContent = `${kf.time.toFixed(2)}s${hasOvershoot(spec) ? ' · overshoots' : ''}`;
  }
  animDrawCurve();
}

/** Write a curve onto the keyframe that owns the current segment. */
function animSetCurve(spec) {
  const kf = animActiveKeyframe();
  if (!kf) return;
  kf.ease = spec;
  animSyncCurve();
  animDraw();
}

let curveDragging = -1;

function curvePointerPos(ev) {
  const rect = animCurveCanvas.getBoundingClientRect();
  // The canvas is drawn at a fixed resolution but displayed responsively,
  // so pointer coordinates need scaling into canvas space.
  const scale = animCurveCanvas.width / rect.width;
  return [(ev.clientX - rect.left) * scale, (ev.clientY - rect.top) * scale];
}

animCurveCanvas.addEventListener('pointerdown', (ev) => {
  if (animCurveCanvas.dataset.draggable === 'false') return;
  const points = easingPoints(animCurveSpec());
  const [px, py] = curvePointerPos(ev);
  let best = -1;
  let bestDist = 22; // generous, so a handle is easy to grab on a touchscreen
  for (let i = 0; i < 2; i++) {
    const [hx, hy] = curveToPixels(points[i * 2], points[i * 2 + 1]);
    const d = Math.hypot(px - hx, py - hy);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  if (best < 0) return;
  curveDragging = best;
  animCurveCanvas.setPointerCapture(ev.pointerId);
  ev.preventDefault();
});

animCurveCanvas.addEventListener('pointermove', (ev) => {
  if (curveDragging < 0) return;
  const points = easingPoints(animCurveSpec());
  const [px, py] = curvePointerPos(ev);
  let [cx, cy] = pixelsToCurve(px, py);
  // x is clamped because a control point outside 0..1 would make the curve
  // non-monotonic in time — one instant mapping to several values. y is
  // left free: that is precisely what produces overshoot.
  cx = Math.min(1, Math.max(0, cx));
  cy = Math.min(2, Math.max(-1, cy));
  points[curveDragging * 2] = Math.round(cx * 1000) / 1000;
  points[curveDragging * 2 + 1] = Math.round(cy * 1000) / 1000;
  animSetCurve(points);
});

for (const ev of ['pointerup', 'pointercancel']) {
  animCurveCanvas.addEventListener(ev, () => {
    if (curveDragging >= 0) animRecord();
    curveDragging = -1;
  });
}

// Keyboard equivalent, so the curve is not mouse-only. Arrows nudge the
// first handle, shift+arrows the second.
animCurveCanvas.addEventListener('keydown', (ev) => {
  if (animCurveCanvas.dataset.draggable === 'false') return;
  const step = ev.altKey ? 0.01 : 0.05;
  const dx = ev.key === 'ArrowRight' ? step : ev.key === 'ArrowLeft' ? -step : 0;
  const dy = ev.key === 'ArrowUp' ? step : ev.key === 'ArrowDown' ? -step : 0;
  if (!dx && !dy) return;
  ev.preventDefault();
  const points = easingPoints(animCurveSpec());
  const i = ev.shiftKey ? 1 : 0;
  points[i * 2] = Math.round(Math.min(1, Math.max(0, points[i * 2] + dx)) * 1000) / 1000;
  points[i * 2 + 1] = Math.round(Math.min(2, Math.max(-1, points[i * 2 + 1] + dy)) * 1000) / 1000;
  animSetCurve(points);
});

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
        scheduleWorkspaceSave();
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
  scheduleWorkspaceSave();
  syncSequencer();
});

musicBpm.addEventListener('input', () => {
  musicPattern.bpm = parseInt(musicBpm.value, 10);
  scheduleWorkspaceSave();
  musicBpmValue.textContent = `${musicBpm.value} bpm`;
});
musicSwing.addEventListener('input', () => {
  musicPattern.swing = parseFloat(musicSwing.value);
  scheduleWorkspaceSave();
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
  scheduleWorkspaceSave();
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

lyricsInput.addEventListener('input', () => { renderLyricAnalysis(); scheduleWorkspaceSave(); });

function musicOnShow() {
  if (!musicSequencerBuilt) {
    buildSequencer();
    applyPreset(musicPattern, musicPreset.value);
    renderChords();
  }
  syncSequencer();
  showDaw();
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
const gateGuestBtn = document.getElementById('gate-guest-btn');

function setGateStatus(message, kind = 'error') {
  gateStatus.textContent = message || '';
  gateStatus.className = `gate-status${kind === 'info' ? ' info' : ''}`;
  const bad = kind !== 'info' && !!message;
  if (gateEmail) gateEmail.setAttribute('aria-invalid', bad ? 'true' : 'false');
  if (gatePassword) gatePassword.setAttribute('aria-invalid', bad ? 'true' : 'false');
}

function showGate() {
  gate.hidden = false;
  appShell.hidden = true;
  gatePassword.value = '';

  const configured = isBackendConfigured();
  gateForms.hidden = false;
  gateSetupToggle.hidden = false;
  gateSetupToggle.classList.toggle('needed', !configured);
  gateSetupToggle.textContent = configured ? 'Change Supabase project' : 'Connect Supabase';

  if (!configured) {
    gateSetupPanel.hidden = true;
    setGateStatus('Accounts are optional. Enter the studio, or connect Supabase to save across devices.', 'info');
  } else {
    gateSetupPanel.hidden = true;
    setTimeout(() => { try { gateEmail.focus(); } catch (_) {} }, 0);
  }
}

function enterApp() {
  gate.hidden = true;
  gateSetupToggle.hidden = true;
  appShell.hidden = false;
  switchSection('speak');
}

function enterGuest() {
  try { sessionStorage.setItem('voice-guest', '1'); } catch (_) {}
  enterApp();
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
if (gateGuestBtn) gateGuestBtn.addEventListener('click', enterGuest);
gatePassword.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') attemptAuth('login');
});
gateEmail.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!gatePassword.value) gatePassword.focus();
    else attemptAuth('login');
  }
});
const gateShowPass = document.getElementById('gate-show-pass');
if (gateShowPass) {
  gateShowPass.addEventListener('click', () => {
    const show = gatePassword.type === 'password';
    gatePassword.type = show ? 'text' : 'password';
    gateShowPass.textContent = show ? 'Hide' : 'Show';
    gateShowPass.setAttribute('aria-pressed', show ? 'true' : 'false');
  });
}

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

  // Two checks, cheapest first. The local one catches the service_role key
  // and a mismatched URL/key pair without a round trip; the network one is
  // the only thing that can prove the project is actually there.
  const pair = checkSupabasePair(url, key);
  if (!pair.ok) {
    setGateStatus(pair.message);
    return;
  }

  gateConnectBtn.disabled = true;
  const label = gateConnectBtn.textContent;
  gateConnectBtn.textContent = 'CHECKING…';
  setGateStatus(`Checking ${pair.url}…`, 'info');
  try {
    const probe = await verifyBackend(pair.url, pair.anonKey);
    if (!probe.ok) {
      setGateStatus(probe.message);
      return;
    }
    // Only store credentials that have been proven to work, so a failed
    // attempt cannot leave the site pointed at a dead project.
    setSupabaseConfig(probe.url, probe.anonKey);
    if (pair.url !== url.replace(/\/+$/, '')) {
      setGateStatus(`Connected to ${probe.url} — the URL was tidied up for you.`, 'info');
    } else {
      setGateStatus('Connected.', 'info');
    }
    gateSetupPanel.hidden = true;
    gateForms.hidden = false;
    // The job this button existed for is done — step it back so it stops
    // competing with the sign-in form it was blocking.
    gateSetupToggle.classList.remove('needed');
    gateSetupToggle.textContent = 'Change Supabase project';
    applyProviderAvailability(probe);
  } catch (err) {
    setGateStatus(err.message || 'Could not reach that project.');
  } finally {
    gateConnectBtn.disabled = false;
    gateConnectBtn.textContent = label;
  }
});

/**
 * Hide sign-in buttons for providers the project has not switched on.
 *
 * A Google button that returns "provider is not enabled" looks like the site
 * is broken. If the project has not enabled it, better not to offer it.
 */
function applyProviderAvailability(probe) {
  if (!probe || !Array.isArray(probe.providers)) return;
  for (const btn of document.querySelectorAll('[data-provider]')) {
    const name = btn.dataset.provider;
    btn.hidden = probe.providers.length > 0 && !probe.providers.includes(name);
  }
}

onAuthChange((event) => {
  if (event === 'SIGNED_OUT') showGate();
}).catch(() => {});

async function bootstrapAuth() {
  const params = new URLSearchParams(location.search);
  let storedGuest = false;
  try { storedGuest = sessionStorage.getItem('voice-guest') === '1'; } catch (_) {}
  if (params.get('guest') === '1' || storedGuest || window.self !== window.top) {
    enterGuest();
    return;
  }
  if (!isBackendConfigured()) {
    showGate();
    return;
  }
  try {
    const session = await getCurrentSession();
    if (session) {
      enterApp();
      return;
    }
  } catch {
    /* fall through to the gate, then diagnose below */
  }
  showGate();

  // Prove the configured project is really reachable before someone types
  // their password into a form that cannot submit anywhere. A sign-in that
  // fails with no explanation is the single most demoralising way for this
  // app to break, and it is exactly what a stale or mistyped URL produces.
  const config = getSupabaseConfig();
  if (!config) return;

  // The SDK is fetched from a CDN on demand. If that fetch fails the form is
  // present but inert, which reads exactly like a wrong password.
  if (!(await canReachAuthSdk())) {
    setGateStatus('Could not load the sign-in service. Check your internet connection and reload.');
    return;
  }
  const probe = await verifyBackend(config.url, config.anonKey).catch(() => null);
  if (!probe) return;
  if (!probe.ok) {
    setGateStatus(`${probe.message} Use "Change Supabase project" to fix it.`);
    gateSetupToggle.classList.add('needed');
    gateSetupPanel.hidden = false;
    // Pre-fill what is currently stored, so the problem is visible rather
    // than something to be guessed at.
    gateSupabaseUrl.value = config.url;
    gateSupabaseKey.value = config.anonKey;
  } else {
    applyProviderAvailability(probe);
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
const projectTransport = document.getElementById('project-transport');
const projectPlay = document.getElementById('project-play');
const projectScrub = document.getElementById('project-scrub');
const projectScrubFill = document.getElementById('project-scrub-fill');
const projectPos = document.getElementById('project-pos');
const projectVuFill = document.getElementById('project-vu-fill');
const projectSaveBtn = document.getElementById('project-save-btn');
const projectLoadBtn = document.getElementById('project-load-btn');
const projectRecipeFile = document.getElementById('project-recipe-file');
const projectStage = document.getElementById('project-stage');
const projectCanvas = document.getElementById('project-canvas');
const projectCtx = projectCanvas.getContext('2d');

const PROJECT_SR = MUSIC_SR;
let projectBlob = null;
let projectMix = null;      // Float32Array of the last build
let projectLevels = null;   // per-frame loudness, for the reactive scene
let projectDuration = 0;
let projectRaf = null;

function stopProjectPlay() {
  if (projectAudio && !projectAudio.paused) projectAudio.pause();
  if (projectPlay) projectPlay.textContent = '▶';
}

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

  const beatKeep = projectBeatSel.value;
  projectBeatSel.innerHTML = '<option value="">None</option><option value="current">Current Music pattern</option>';
  for (const clip of clips.slice(0, 50)) {
    if (!clip.blob) continue;
    const opt = document.createElement('option');
    opt.value = `clip:${clip.id}`;
    opt.textContent = `Clip · ${clip.title || clip.voiceLabel || 'Audio'} · ${formatDuration(clip.durationSec)}`;
    projectBeatSel.appendChild(opt);
  }
  if (beatKeep && [...projectBeatSel.options].some((o) => o.value === beatKeep)) {
    projectBeatSel.value = beatKeep;
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
  const v = projectBeatSel.value;
  if (v && v.startsWith('clip:')) return true;
  return v === 'current' && TRACKS.some((t) => musicPattern.grid[t.id].some(Boolean));
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
  } else if (projectBeatSel.value.startsWith('clip:')) {
    bits.push(`beat: ${projectBeatSel.selectedOptions[0].textContent}`);
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
async function projectBeatSamples(neededSec) {
  const v = projectBeatSel.value;
  if (v && v.startsWith('clip:')) {
    const clips = await clipLibrary.listClips();
    const clip = clips.find((c) => c.id === v.slice(5));
    if (!clip) return null;
    const buf = await decodeToAudioBuffer(clip.blob);
    let samples = buf.sampleRate === PROJECT_SR
      ? buf.getChannelData(0)
      : resampleLinear(buf.getChannelData(0), buf.sampleRate, PROJECT_SR);
    const need = Math.max(1, Math.round(neededSec * PROJECT_SR));
    if (projectLoop.checked && samples.length && samples.length < need) {
      samples = loopToLength(samples, need);
    }
    return samples;
  }
  if (v !== 'current') return null;
  return projectBeatBed(neededSec);
}

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
    const beat = projectUsesBeat() ? await projectBeatSamples(neededSec) : null;

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
    projectAudio.hidden = true;
    if (projectTransport) projectTransport.hidden = false;
    projectAudioBtn.disabled = false;
    if (projectPlay) projectPlay.textContent = '▶';
    if (projectPos) projectPos.textContent = formatDuration(projectDuration);
    if (projectScrubFill) projectScrubFill.style.width = '0%';

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
    emitVoice('project-mix', { duration: projectDuration });
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

if (projectPlay) {
  projectPlay.addEventListener('click', () => {
    if (!projectAudio.src) return;
    if (typeof stopPlayback === 'function') stopPlayback();
    if (typeof stopLibraryPlay === 'function') stopLibraryPlay();
    if (projectAudio.paused) {
      projectAudio.play().catch(() => {});
      projectPlay.textContent = '■';
    } else {
      projectAudio.pause();
      projectPlay.textContent = '▶';
    }
  });
}
if (projectScrub) {
  projectScrub.addEventListener('click', (ev) => {
    if (!projectAudio.duration) return;
    const r = projectScrub.getBoundingClientRect();
    projectAudio.currentTime = ((ev.clientX - r.left) / r.width) * projectAudio.duration;
  });
}
projectAudio.addEventListener('timeupdate', () => {
  if (!projectAudio.duration) return;
  if (projectScrubFill) projectScrubFill.style.width = `${(projectAudio.currentTime / projectAudio.duration) * 100}%`;
  if (projectPos) projectPos.textContent = `${formatDuration(projectAudio.currentTime)} / ${formatDuration(projectAudio.duration)}`;
  if (projectVuFill && projectMix) {
    const i = Math.floor(projectAudio.currentTime * PROJECT_SR);
    let peak = 0;
    for (let k = 0; k < 512 && i + k < projectMix.length; k++) {
      const a = Math.abs(projectMix[i + k]);
      if (a > peak) peak = a;
    }
    const db = peak > 0.00001 ? 20 * Math.log10(peak) : -60;
    projectVuFill.style.height = `${Math.max(0, Math.min(100, (db + 60) / 60 * 100))}%`;
    projectVuFill.classList.toggle('clip', db > -1);
  }
});
projectAudio.addEventListener('ended', () => {
  if (projectPlay) projectPlay.textContent = '▶';
});

function projectRecipe() {
  return {
    kind: 'thevoice-project',
    v: 1,
    voice: projectVoiceSel.value,
    beat: projectBeatSel.value,
    scene: projectSceneSel.value,
    voiceGain: parseFloat(projectVoiceGain.value),
    beatGain: parseFloat(projectBeatGain.value),
    offset: parseFloat(projectOffset.value),
    loop: projectLoop.checked,
    fade: projectFade.checked,
  };
}

if (projectSaveBtn) {
  projectSaveBtn.addEventListener('click', async () => {
    const json = JSON.stringify(projectRecipe(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const r = await downloadBlob(blob, `thevoice-project-${Date.now()}.json`);
    if (r.ok) showToast('Project recipe saved');
    else if (r.message) projectHint.textContent = r.message;
  });
}
if (projectLoadBtn && projectRecipeFile) {
  projectLoadBtn.addEventListener('click', () => projectRecipeFile.click());
  projectRecipeFile.addEventListener('change', async () => {
    const file = projectRecipeFile.files && projectRecipeFile.files[0];
    projectRecipeFile.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.kind !== 'thevoice-project') throw new Error('Not a The Voice project recipe.');
      await projectRefreshSources();
      if (data.voice) projectVoiceSel.value = data.voice;
      if (data.beat) projectBeatSel.value = data.beat;
      if (data.scene) projectSceneSel.value = data.scene;
      if (data.voiceGain != null) { projectVoiceGain.value = data.voiceGain; projectVoiceGain.dispatchEvent(new Event('input')); }
      if (data.beatGain != null) { projectBeatGain.value = data.beatGain; projectBeatGain.dispatchEvent(new Event('input')); }
      if (data.offset != null) { projectOffset.value = data.offset; projectOffset.dispatchEvent(new Event('input')); }
      if (typeof data.loop === 'boolean') projectLoop.checked = data.loop;
      if (typeof data.fade === 'boolean') projectFade.checked = data.fade;
      projectUpdateSummary();
      showToast('Recipe loaded — hit Build mix');
    } catch (err) {
      projectHint.textContent = err.message || 'Could not read that recipe.';
    }
  });
}

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

/* ---------- File imports ---------- */
//
// Every panel that produced something can now also accept something. The
// shared shape is: pick or drop → validate → hand to the same code path the
// in-app equivalent already uses, so an imported clip is indistinguishable
// from a recorded one from that point on.

guardStrayDrops();

/** Report a rejected file the same way everywhere. */
function importFailed(hintEl, result) {
  if (result.cancelled) return true;
  if (!result.ok) {
    if (hintEl) hintEl.textContent = result.message;
    else showToast(result.message, 'error');
    return true;
  }
  return false;
}

/**
 * Take an audio file and make it the current recording.
 *
 * Decoding first is deliberate: it proves the browser can actually play the
 * file before anything downstream depends on it. A .wav container holding a
 * codec this browser lacks passes every extension and MIME check and then
 * fails silently at playback, which is the confusing case worth catching
 * here where the file name is still in hand.
 */
async function adoptAudioFile(file, hintEl) {
  const buf = await decodeToAudioBuffer(file).catch(() => null);
  if (!buf) {
    const msg = `“${file.name}” could not be decoded. It may use a format this browser cannot play — try a .wav or .mp3.`;
    if (hintEl) hintEl.textContent = msg;
    else showToast(msg, 'error');
    return null;
  }
  recordingBlob = file;
  originalRecordingBlob = file;
  recordingExt = fileExtension(file.name) || 'wav';
  lastClipBlob = file;
  lastClipExt = recordingExt;

  await saveClipToLibrary({
    engine: 'recording',
    voiceLabel: `Imported · ${file.name}`,
    text: '',
    blob: file,
    ext: recordingExt,
    durationSec: buf.duration,
  });
  return buf;
}

// --- Voice Studio ---------------------------------------------------------
const studioImportBtn = document.getElementById('studio-import-btn');

async function studioAdopt(result) {
  if (importFailed(micHint, result)) return;
  micHint.textContent = '';
  const buf = await adoptAudioFile(result.file, micHint);
  if (!buf) return;
  playbackAudio.src = URL.createObjectURL(result.file);
  recordingResult.hidden = false;
  showToast(`Imported ${result.file.name} · ${formatDuration(buf.duration)}`);
}

studioImportBtn.addEventListener('click', async () => {
  studioAdopt(await pickValidated('audio'));
});
makeDropTarget(document.querySelector('[data-panel="studio"]'), 'audio', studioAdopt);

// --- Speak: a script is a file too ---------------------------------------
makeDropTarget(document.querySelector('[data-panel="speak"]'), 'json', async (result) => {
  // Text files arrive here as the json kind, since both are read as text.
  if (result.cancelled) return;
  if (!result.ok) { showToast(result.message, 'error'); return; }
  try {
    const text = await readText(result.file);
    textInput.value = clipToWords(text);
    updateTextStats();
    showToast(`Loaded ${result.file.name}`);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// --- Modulate -------------------------------------------------------------
const modImportBtn = document.getElementById('mod-import-btn');

async function modAdopt(result) {
  if (importFailed(modHint, result)) return;
  modHint.textContent = '';
  const buf = await adoptAudioFile(result.file, modHint);
  if (!buf) return;
  // Load it, don't merely offer it. Importing a file into this panel is an
  // unambiguous request to modulate that file; making the user then press
  // "Use latest recording" would be a step that communicates nothing.
  modSourceBuffer = { data: buf.getChannelData(0), sampleRate: buf.sampleRate };
  modDryBlob = result.file;
  modResultBlob = null;
  modHearing = 'a';
  modSourceLabel.textContent = `Loaded ${result.file.name} · ${buf.duration.toFixed(1)}s`;
  modApplyBtn.disabled = false;
  if (modAbBtn) modAbBtn.disabled = true;
  if (modAbFlag) modAbFlag.textContent = 'A';
  armModPlayer(modDryBlob);
  showToast(`Loaded ${result.file.name} for modulation`);
}

modImportBtn.addEventListener('click', async () => {
  modAdopt(await pickValidated('audio'));
});
makeDropTarget(modulateView, 'audio', modAdopt);

// --- Music ----------------------------------------------------------------
const musicImportBtn = document.getElementById('music-import-btn');

async function musicAdopt(result) {
  if (importFailed(musicHint, result)) return;
  musicHint.textContent = '';
  const buf = await adoptAudioFile(result.file, musicHint);
  if (!buf) return;
  showToast(`Imported ${result.file.name} — use "Layer voice over it" to mix`);
}

musicImportBtn.addEventListener('click', async () => {
  musicAdopt(await pickValidated('audio'));
});
makeDropTarget(musicView, 'audio', musicAdopt);

// --- Project --------------------------------------------------------------
const projectImportBtn = document.getElementById('project-import-btn');

async function projectAdopt(result) {
  if (importFailed(projectHint, result)) return;
  projectHint.textContent = '';
  const buf = await adoptAudioFile(result.file, projectHint);
  if (!buf) return;
  await projectRefreshSources();
  projectVoiceSel.value = 'session';
  projectUpdateSummary();
  showToast(`Imported ${result.file.name} · ${formatDuration(buf.duration)}`);
}

projectImportBtn.addEventListener('click', async () => {
  projectAdopt(await pickValidated('audio'));
});
makeDropTarget(projectView, 'audio', projectAdopt);

// --- Library --------------------------------------------------------------
const libraryImportBtn = document.getElementById('library-import-btn');

libraryImportBtn.addEventListener('click', async () => {
  const files = await pickFile(ACCEPT.audio, { multiple: true });
  if (!files || !files.length) return;
  let added = 0;
  const problems = [];
  for (const file of files) {
    const result = validateFile(file, 'audio');
    if (!result.ok) { problems.push(result.message); continue; }
    const buf = await decodeToAudioBuffer(file).catch(() => null);
    if (!buf) { problems.push(`“${file.name}” could not be decoded.`); continue; }
    await saveClipToLibrary({
      engine: 'recording',
      voiceLabel: `Imported · ${file.name}`,
      text: '',
      blob: file,
      ext: fileExtension(file.name) || 'wav',
      durationSec: buf.duration,
    });
    added += 1;
  }
  await renderLibrary();
  // One clip failing out of twenty should not read as total failure.
  showToast(added
    ? `Imported ${added} clip${added === 1 ? '' : 's'}${problems.length ? `, ${problems.length} skipped` : ''}`
    : 'Nothing could be imported.', added ? 'info' : 'error');
  if (problems.length) libraryEmpty.textContent = problems[0];
});

// --- Animate --------------------------------------------------------------
const animImportAudioBtn = document.getElementById('anim-import-audio-btn');
const animImportImageBtn = document.getElementById('anim-import-image-btn');
const animImportModelBtn = document.getElementById('anim-import-model-btn');
const animOpenBtn = document.getElementById('anim-open-btn');
const animSaveBtn = document.getElementById('anim-save-btn');

/** Drive the scene's reactive shapes from an imported track. */
async function animAdoptAudio(result) {
  if (importFailed(animHint, result)) return;
  animHint.textContent = '';
  const buf = await decodeToAudioBuffer(result.file).catch(() => null);
  if (!buf) {
    animHint.textContent = `“${result.file.name}” could not be decoded.`;
    return;
  }
  animScene.duration = Math.max(1, buf.duration);
  animTime.max = String(animScene.duration);
  animLevels = audioLevelTrack(buf.getChannelData(0), buf.sampleRate, animScene.fps, animScene.duration);
  animDraw();
  showToast(`${result.file.name} loaded — mark a shape reactive to make it move`);
}

animImportAudioBtn.addEventListener('click', async () => {
  animAdoptAudio(await pickValidated('audio'));
});

/** Add an imported image as a shape that can be keyframed like any other. */
async function animAdoptImage(result) {
  if (importFailed(animHint, result)) return;
  animHint.textContent = '';
  try {
    const dataUrl = await readDataUrl(result.file);
    const img = await loadImage(dataUrl);
    registerImage(dataUrl, img);
    const shape = createShape('image', parseFloat(animTime.value) || 0);
    shape.src = dataUrl;
    shape.label = result.file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Image';
    animScene.shapes.push(shape);
    animSetSelection([shape.id], shape.id);
    animRenderShapeList();
    animSyncProps();
    animDraw();
    showToast(`Added ${result.file.name}`);
  } catch (err) {
    animHint.textContent = err.message || 'That image could not be loaded.';
  }
}

animImportImageBtn.addEventListener('click', async () => {
  animAdoptImage(await pickValidated('image'));
});

/**
 * Add an imported .glb or .gltf as ordinary shapes.
 *
 * The model's node tree becomes the scene's own hierarchy, which is why
 * parenting had to exist first: a car's wheels arrive already parented to
 * its body, and moving the body moves them. Every part is a plain shape
 * with plain keyframes from that point on — selectable, re-timeable,
 * re-colourable, exactly like something drawn by hand.
 */
async function animAdoptModel(result) {
  if (importFailed(animHint, result)) return;
  animHint.textContent = `Reading ${result.file.name}…`;
  let model;
  try {
    const bytes = await readArrayBuffer(result.file);
    model = readModel(bytes, { name: result.file.name.replace(/\.[^.]+$/, '') });
  } catch (err) {
    // A GltfError says exactly what is wrong with the file; anything else
    // is a bug on our side and should not be dressed up as the user's.
    animHint.textContent = err instanceof GltfError
      ? err.message
      : `“${result.file.name}” could not be read as a 3D model.`;
    return;
  }

  // Solids only mean anything under a camera.
  if (!is3D(animScene)) {
    enable3D(animScene);
    anim3dSync();
  }

  const at = parseFloat(animTime.value) || 0;
  const flat = flattenModel(model);
  const byNode = new Map();
  const added = [];

  for (const node of flat) {
    const mesh = node.mesh === null ? null : model.meshes[node.mesh];
    // A node with no mesh is a pivot — an empty in Blender's language. It
    // still has to exist, because its children hang from it, so it becomes
    // a shape with nothing to draw rather than being skipped.
    const type = mesh && mesh.faces.length
      ? registerMesh(`${model.name}-${node.index}-${animModelSerial++}`, mesh)
      : null;
    if (type) attachSceneModel(animScene, type, mesh);

    const shape = createShape(type || 'cube', at);
    shape.type = type || shape.type;
    shape.label = (node.name || 'Part').slice(0, 40);
    const t = node.transform;
    const k = shape.keyframes[0];
    // glTF units are metres and this stage is 100 units across, so a
    // one-metre model would otherwise arrive as a speck. Scaling by the
    // model's own size puts it on screen at a usable size whatever units
    // it was authored in.
    k.x = 50 + t.x * MODEL_UNITS;
    k.y = 50 + t.y * MODEL_UNITS;
    k.z = t.z * MODEL_UNITS;
    k.rotX = t.rotX;
    k.rotY = t.rotY;
    k.rotation = t.rotation;
    k.scale = Math.max(0.01, t.scale * (mesh ? mesh.unitScale : 1) * MODEL_UNITS / 18);
    if (!type) k.opacity = 0;   // a pivot is a handle, not a thing to see
    animScene.shapes.push(shape);
    byNode.set(node.index, shape);
    added.push({ shape, parent: node.parent });
  }

  // Parent second, once every shape exists — a child cannot name a parent
  // that has not been created yet. No keep-transform here: these positions
  // are already the model's own local ones, so binding against a world
  // transform would apply the parent's offset twice.
  for (const { shape, parent } of added) {
    if (parent === null) continue;
    const parentShape = byNode.get(parent);
    if (parentShape) setParent(animScene, shape.id, parentShape.id, null, at);
  }

  animSetSelection(added.map((a) => a.shape.id),
                   added.length ? added[0].shape.id : animSelectedId);
  animRenderShapeList();
  animSyncProps();
  animDraw();
  animRecord();

  animHint.textContent = describeImport(model);
  showToast(`Added ${result.file.name} — ${added.length} object${added.length === 1 ? '' : 's'}`);
}

// One model's parts must not collide with another's, and re-importing the
// same file must produce new geometry rather than overwriting the first.
let animModelSerial = 1;

// How many stage units one glTF unit becomes. The stage is 100 across and
// a mesh draws at 18 units per unit of scale, so a one-metre object lands
// at roughly a sixth of the frame — big enough to see, small enough that a
// character and a room both fit.
const MODEL_UNITS = 18;

/** What was in the file, and what we did not do with it. */
function describeImport(model) {
  const n = model.notes;
  const parts = [`${model.meshes.length} mesh${model.meshes.length === 1 ? '' : 'es'}`,
                 `${n.faces} face${n.faces === 1 ? '' : 's'}`];
  const caveats = [];
  if (n.truncated) caveats.push('geometry was trimmed to keep playback smooth');
  if (n.skinned) caveats.push('its skeleton is not animated yet');
  if (n.hasAnimations) caveats.push('its built-in animation was not imported');
  if (n.hasTextures) caveats.push('textures show as flat material colours');
  return `Imported ${parts.join(', ')}.`
    + (caveats.length ? ` Note: ${caveats.join('; ')}.` : '');
}

animImportModelBtn.addEventListener('click', async () => {
  animAdoptModel(await pickValidated('model'));
});

// One drop zone, four kinds — dispatch on what was actually dropped so a
// user does not have to aim at the right button.
makeDropTarget(animateView, 'audio', () => {}, {});
animateView.addEventListener('drop', async (ev) => {
  const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
  if (!file) return;
  const ext = fileExtension(file.name);
  const type = String(file.type || '');
  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
    animAdoptImage(validateFile(file, 'image'));
  } else if (ext === 'glb' || ext === 'gltf') {
    animAdoptModel(validateFile(file, 'model'));
  } else if (ext === 'json') {
    animOpenScene(validateFile(file, 'json'));
  } else {
    animAdoptAudio(validateFile(file, 'audio'));
  }
});

/** Open a saved scene — the other half of an export that already existed. */
async function animOpenScene(result) {
  if (importFailed(animHint, result)) return;
  try {
    const data = await readJson(result.file);
    const scene = deserializeScene(data);
    await hydrateSceneImages(scene, loadImage);
    animScene = scene;
    animSetSelection(scene.shapes.length ? [scene.shapes[0].id] : [],
                     scene.shapes.length ? scene.shapes[0].id : null);
    animLevels = null;
    anim3dSync();
    animTime.max = String(animScene.duration);
    animTime.value = '0';
    animRenderShapeList();
    animSyncProps();
    animDraw();
    // Opening a file starts a new document: the history restarts from it.
    // Without this, the first Ctrl+Z after any edit steps past the opened
    // scene into whatever happened to be on screen before — and undoing
    // into a different document is never what anyone means.
    animHistory.reset(animScene);
    animSyncHistoryButtons();
    animHint.textContent = '';
    showToast(`Opened ${result.file.name} — ${scene.shapes.length} shape${scene.shapes.length === 1 ? '' : 's'}`);
  } catch (err) {
    animHint.textContent = err.message || 'That file is not a scene.';
  }
}

animOpenBtn.addEventListener('click', async () => {
  animOpenScene(await pickValidated('json'));
});

animSaveBtn.addEventListener('click', async () => {
  const json = serializeScene(animScene);
  const blob = new Blob([json], { type: 'application/json' });
  const r = await downloadBlob(blob, `scene-${Date.now()}.json`);
  if (!r.ok) animHint.textContent = r.message || 'Save cancelled.';
  else showToast('Scene saved — reopen it with "Open scene…"');
});

/* ---------- Init ---------- */
// Tells the inline boot guard in the page that the module actually ran.
window.__voiceBooted = true;
try {
  initDaw({
    getBpm: () => musicPattern.bpm,
    setBpm: (n) => {
      musicPattern.bpm = n;
      if (musicBpm) {
        musicBpm.value = String(n);
        musicBpmValue.textContent = `${n} bpm`;
      }
    },
    getPattern: () => musicPattern,
    renderPattern,
    encodeWav16,
    PRESET_PATTERNS,
    applyPreset,
    TRACKS,
    STEPS,
  });
} catch (err) {
  console.warn('DAW init skipped', err);
}
refreshVoiceOptions();
refreshLongformVoices();
loadPaymentLinkInputs();
renderModPresets();
syncModLabels();
updateEngineChrome();
renderClonedVoiceList();
updateTextStats();
restoreWorkspace();
window.TheVoice = Object.assign(window.TheVoice || {}, {
  go: switchSection,
  speak: () => playBtn && playBtn.click(),
  stop: stopPlayback,
  enter: enterGuest,
});
bootstrapAuth().catch(() => showGate());
startUpgradeWatch().catch(() => {});
