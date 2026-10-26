// Records a processed mic chain (device → gain → analyser → MediaRecorder)
// while running live speech-to-text. Gain and monitor actually hit the
// recorded file, not just the meters.

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

function pickMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const t of types) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export function createRecorder() {
  let mediaRecorder = null;
  let recognition = null;
  let chunks = [];
  let stream = null;
  let audioCtx = null;
  let analyser = null;
  let inputGain = null;
  let monitorGain = null;
  let dest = null;

  function teardownGraph() {
    if (recognition) {
      recognition.onresult = null;
      try { recognition.stop(); } catch (_) {}
      recognition = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch (_) {}
    }
    mediaRecorder = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    analyser = null;
    inputGain = null;
    monitorGain = null;
    dest = null;
  }

  return {
    isSupported: !!(navigator.mediaDevices && window.MediaRecorder),
    sttSupported: !!SpeechRecognitionImpl,

    unavailableReason() {
      if (navigator.mediaDevices && window.MediaRecorder) return null;
      if (window.self !== window.top) {
        return 'Microphone access is blocked inside this embedded preview. Open this page directly in your browser (not embedded) to record.';
      }
      if (!window.isSecureContext) {
        return 'Microphone access requires a secure context — serve this page over https, or open the local file directly rather than through another page.';
      }
      return 'Microphone recording is not supported in this browser. Try the latest Chrome, Edge, or Safari.';
    },

    async listMics() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    },

    async start({ onTranscript, onAnalyser, deviceId, gain, monitor, monitorVol } = {}) {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      chunks = [];
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(stream);
      inputGain = audioCtx.createGain();
      inputGain.gain.value = gain == null ? 1 : Math.max(0, Math.min(3, gain));
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      monitorGain = audioCtx.createGain();
      monitorGain.gain.value = monitor ? Math.max(0, Math.min(1, monitorVol == null ? 0.6 : monitorVol)) : 0;
      dest = audioCtx.createMediaStreamDestination();
      source.connect(inputGain);
      inputGain.connect(analyser);
      inputGain.connect(dest);
      inputGain.connect(monitorGain);
      monitorGain.connect(audioCtx.destination);

      const mime = pickMime();
      mediaRecorder = mime ? new MediaRecorder(dest.stream, { mimeType: mime }) : new MediaRecorder(dest.stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start(250);

      if (onAnalyser) onAnalyser(analyser, audioCtx.sampleRate);

      if (SpeechRecognitionImpl && onTranscript) {
        recognition = new SpeechRecognitionImpl();
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalText = '';
        recognition.onresult = (e) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t + ' ';
            else interim += t;
          }
          onTranscript((finalText + interim).trim());
        };
        recognition.onerror = () => {};
        try { recognition.start(); } catch (_) {}
      }
    },

    setGain(v) {
      if (inputGain) inputGain.gain.setTargetAtTime(Math.max(0, Math.min(3, v)), audioCtx.currentTime, 0.02);
    },

    setMonitor(on, vol) {
      if (!monitorGain || !audioCtx) return;
      const g = on ? Math.max(0, Math.min(1, vol == null ? 0.6 : vol)) : 0;
      monitorGain.gain.setTargetAtTime(g, audioCtx.currentTime, 0.02);
    },

    pause() {
      if (mediaRecorder && mediaRecorder.state === 'recording' && mediaRecorder.pause) {
        mediaRecorder.pause();
        return true;
      }
      return false;
    },

    resume() {
      if (mediaRecorder && mediaRecorder.state === 'paused' && mediaRecorder.resume) {
        mediaRecorder.resume();
        return true;
      }
      return false;
    },

    get state() {
      return mediaRecorder ? mediaRecorder.state : 'inactive';
    },

    stop() {
      return new Promise((resolve) => {
        const rec = mediaRecorder;
        const type = rec && rec.mimeType ? rec.mimeType : 'audio/webm';
        const finish = () => {
          const blob = new Blob(chunks, { type });
          teardownGraph();
          resolve(blob.size ? blob : null);
        };
        if (recognition) {
          recognition.onresult = null;
          try { recognition.stop(); } catch (_) {}
          recognition = null;
        }
        if (rec && rec.state !== 'inactive') {
          rec.onstop = finish;
          try { rec.stop(); } catch (_) { finish(); }
        } else {
          finish();
        }
      });
    },
  };
}
