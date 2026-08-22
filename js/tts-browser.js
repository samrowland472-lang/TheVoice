export function createBrowserTTS() {
  const synth = window.speechSynthesis;
  let voices = [];

  function refreshVoices() {
    if (!synth) return [];
    voices = synth.getVoices();
    return voices;
  }

  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = refreshVoices;
  }
  refreshVoices();

  return {
    isSupported: !!synth,
    listVoices: () => voices,
    refreshVoices,
    speak(text, { voiceIndex, rate, pitch, volume, onStart, onBoundary, onEnd, onError }) {
      if (!synth) return;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (voices[voiceIndex]) utter.voice = voices[voiceIndex];
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = volume;
      utter.onstart = onStart;
      utter.onboundary = onBoundary;
      utter.onend = onEnd;
      utter.onerror = onError;
      synth.speak(utter);
    },
    pause() {
      if (synth && synth.speaking && !synth.paused) synth.pause();
    },
    resume() {
      if (synth && synth.paused) synth.resume();
    },
    stop() {
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
