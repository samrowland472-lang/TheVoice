// Plays TTS audio through a shared Web Audio graph, tapping an analyser so
// the visualizer can react to genuine amplitude data instead of simulated
// pulses.
//
// Two playback paths feed the same graph:
//  - play(blob): for compressed/encoded audio (ElevenLabs mp3, recorded
//    mic clips) via the <audio> element + MediaElementSource.
//  - playPCM(float32Array, sampleRate): for neural TTS output. Kokoro hands
//    back raw Float32 samples; feeding those straight into an AudioBuffer
//    avoids ever encoding them to a WAV file and having the browser decode
//    that file back — a round trip some browsers render as static/noise
//    for 32-bit float PCM. Skipping the round trip sidesteps that class of
//    bug entirely.
export function createAudioEngine(visualizer) {
  const audioEl = document.getElementById('tts-audio');
  let audioCtx = null;
  let analyser = null;
  let mediaSourceNode = null;
  let gainNode = null;
  let rafId = null;
  let currentUrl = null;
  let pendingVolume = 1;

  let mode = null; // 'element' | 'pcm' | null

  let pcmBuffer = null;
  let pcmSource = null;
  let pcmStartCtxTime = 0;
  let pcmOffset = 0;
  let pcmPlaying = false;
  let pcmOnEnd = null;

  function ensureGraph() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    mediaSourceNode = audioCtx.createMediaElementSource(audioEl);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    gainNode = audioCtx.createGain();
    gainNode.gain.value = pendingVolume;
    mediaSourceNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  function pump() {
    const active = (mode === 'element' && !audioEl.paused) || (mode === 'pcm' && pcmPlaying);
    if (!analyser || !active) {
      rafId = null;
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length / 255;
    visualizer.setAmplitude(avg * 1.6);
    rafId = requestAnimationFrame(pump);
  }

  function stopPCM() {
    if (pcmSource) {
      pcmSource.onended = null;
      try {
        pcmSource.stop();
      } catch {
        /* already stopped */
      }
      pcmSource.disconnect();
      pcmSource = null;
    }
    pcmPlaying = false;
    pcmOffset = 0;
  }

  function startPCMFrom(offsetSeconds) {
    pcmSource = audioCtx.createBufferSource();
    pcmSource.buffer = pcmBuffer;
    pcmSource.connect(gainNode);
    pcmSource.onended = () => {
      if (pcmPlaying) {
        pcmPlaying = false;
        pcmOffset = 0;
        if (pcmOnEnd) pcmOnEnd();
      }
    };
    pcmStartCtxTime = audioCtx.currentTime - offsetSeconds;
    pcmSource.start(0, offsetSeconds);
    pcmPlaying = true;
  }

  return {
    async play(blob, { onEnd } = {}) {
      stopPCM();
      mode = 'element';
      ensureGraph();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = URL.createObjectURL(blob);
      audioEl.src = currentUrl;
      audioEl.onended = () => {
        visualizer.setAmplitude(0);
        if (onEnd) onEnd();
      };
      await audioEl.play();
      if (!rafId) pump();
    },

    async playPCM(float32Audio, sampleRate, { onEnd } = {}) {
      audioEl.pause();
      mode = 'pcm';
      ensureGraph();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      stopPCM();
      const buffer = audioCtx.createBuffer(1, float32Audio.length, sampleRate);
      buffer.copyToChannel(float32Audio, 0);
      pcmBuffer = buffer;
      pcmOnEnd = () => {
        visualizer.setAmplitude(0);
        if (onEnd) onEnd();
      };
      startPCMFrom(0);
      if (!rafId) pump();
    },

    pause() {
      if (mode === 'element') {
        audioEl.pause();
      } else if (mode === 'pcm' && pcmPlaying) {
        pcmOffset = audioCtx.currentTime - pcmStartCtxTime;
        if (pcmSource) {
          pcmSource.onended = null;
          try {
            pcmSource.stop();
          } catch {
            /* already stopped */
          }
          pcmSource.disconnect();
          pcmSource = null;
        }
        pcmPlaying = false;
      }
    },

    resume() {
      if (mode === 'element') {
        audioEl.play();
        if (!rafId) pump();
      } else if (mode === 'pcm' && pcmBuffer && !pcmPlaying) {
        startPCMFrom(pcmOffset);
        if (!rafId) pump();
      }
    },

    stop() {
      audioEl.pause();
      audioEl.currentTime = 0;
      stopPCM();
      visualizer.setAmplitude(0);
    },

    get paused() {
      if (mode === 'pcm') return !pcmPlaying;
      return audioEl.paused;
    },

    setVolume(v) {
      pendingVolume = v;
      if (gainNode) gainNode.gain.value = v;
    },
  };
}
