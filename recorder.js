// Records a mic sample (for playback/cloning) while simultaneously running
// live browser speech-to-text (for the transcript) and driving a small
// waveform preview — three views of the same recording session.
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

export function createRecorder() {
  let mediaRecorder = null;
  let recognition = null;
  let chunks = [];
  let stream = null;
  let audioCtx = null;
  let analyser = null;

  return {
    isSupported: !!(navigator.mediaDevices && window.MediaRecorder),
    sttSupported: !!SpeechRecognitionImpl,

    // Distinguishes *why* recording might be unavailable so the UI can say
    // something actionable instead of a blanket "not supported" — the most
    // common real-world cause is an insecure/embedded context, not an
    // actually incapable browser.
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

    // onAnalyser receives the live AnalyserNode once, up front, along with
    // the context's sample rate — the caller drives its own draw loop
    // against it (spectrum bars, pitch detection, level meter all read
    // from the same node) rather than recorder.js dictating what gets
    // computed per frame.
    async start({ onTranscript, onAnalyser }) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();

      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
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
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    },

    stop() {
      return new Promise((resolve) => {
        if (recognition) {
          recognition.onresult = null;
          recognition.stop();
          recognition = null;
        }
        if (audioCtx) {
          audioCtx.close();
          audioCtx = null;
        }
        if (mediaRecorder) {
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
            stream.getTracks().forEach((t) => t.stop());
            resolve(blob);
          };
          mediaRecorder.stop();
        } else {
          resolve(null);
        }
      });
    },
  };
}
