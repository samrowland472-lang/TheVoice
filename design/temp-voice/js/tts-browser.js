export function createBrowserTTS() {
  const synth = window.speechSynthesis;
  let voices = [];
  let token = 0;

  function refreshVoices() {
    if (!synth) return [];
    voices = synth.getVoices();
    return voices;
  }

  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = refreshVoices;
  }
  refreshVoices();

  function speakOne(text, { voiceIndex, rate, pitch, volume, onStart, onBoundary, onEnd, onError }) {
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    if (voices[voiceIndex]) utter.voice = voices[voiceIndex];
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    if (onStart) utter.onstart = onStart;
    if (onBoundary) utter.onboundary = onBoundary;
    if (onEnd) utter.onend = onEnd;
    if (onError) utter.onerror = onError;
    synth.speak(utter);
  }

  return {
    isSupported: !!synth,
    listVoices: () => voices,
    refreshVoices,
    speak(text, opts) {
      this.speakQueue([{ text, start: 0 }], opts);
    },
    speakQueue(chunks, { voiceIndex, rate, pitch, volume, onStart, onBoundary, onEnd, onError } = {}) {
      if (!synth) return;
      const my = ++token;
      synth.cancel();
      let i = 0;
      const next = () => {
        if (my !== token) return;
        if (i >= chunks.length) {
          if (onEnd) onEnd();
          return;
        }
        const chunk = chunks[i++];
        const first = i === 1;
        speakOne(chunk.text, {
          voiceIndex, rate, pitch, volume,
          onStart: first ? onStart : undefined,
          onBoundary: onBoundary
            ? (e) => {
                const idx = (e.charIndex || 0) + (chunk.start || 0);
                onBoundary({ charIndex: idx, charLength: e.charLength, name: e.name });
              }
            : undefined,
          onEnd: next,
          onError: (e) => {
            if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
            if (onError) onError(e);
          },
        });
      };
      next();
    },
    pause() {
      if (synth && synth.speaking && !synth.paused) synth.pause();
    },
    resume() {
      if (synth && synth.paused) synth.resume();
    },
    stop() {
      token += 1;
      if (synth) synth.cancel();
    },
    get paused() {
      return synth ? synth.paused : true;
    },
    get speaking() {
      return synth ? synth.speaking : false;
    },
  };
}
