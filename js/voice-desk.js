const CYCLE_HOURS = 72;
const HOUR_MS = 60 * 60 * 1000;
const CYCLE_MS = CYCLE_HOURS * HOUR_MS;
const EPOCH = Date.UTC(2026, 7, 1, 0, 0, 0);

const HOUR_FORMATS = [
  { hour: 0, title: 'Quiet Frequency' },
  { hour: 1, title: 'Last Light' },
  { hour: 2, title: 'Deep Frequency' },
  { hour: 3, title: 'Night Watch' },
  { hour: 4, title: 'Before Dawn' },
  { hour: 5, title: 'First Light' },
  { hour: 6, title: 'Dawn Brief' },
  { hour: 7, title: 'Horizon Scan' },
  { hour: 8, title: 'Morning Dispatch' },
  { hour: 9, title: 'Field Notes' },
  { hour: 10, title: 'The Letter' },
  { hour: 11, title: 'Open Channel' },
  { hour: 12, title: 'High Noon' },
  { hour: 13, title: 'After Image' },
  { hour: 14, title: 'Atlas Hour' },
  { hour: 15, title: 'The Inquiry' },
  { hour: 16, title: 'Pulse Check' },
  { hour: 17, title: 'Golden Hour' },
  { hour: 18, title: 'Dusk Brief' },
  { hour: 19, title: 'Voice Memo' },
  { hour: 20, title: 'Drift Report' },
  { hour: 21, title: 'Late Dispatch' },
  { hour: 22, title: 'After Hours' },
  { hour: 23, title: 'The Continuum' },
];

const DAY_THEMES = ['Arrival', 'Drift', 'Return'];
const TURNS_KEY = 'thevoice.talk.v1';
const START_KEY = 'thevoice.talk.start';
const SCRIPT_KEY = 'thevoice.signal.scripts';

export function positionAt(now = Date.now()) {
  const delta = now - EPOCH;
  const cycle = Math.floor(delta / CYCLE_MS);
  const elapsed = ((delta % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  const slot = Math.min(CYCLE_HOURS - 1, Math.floor(elapsed / HOUR_MS));
  const msIntoHour = elapsed % HOUR_MS;
  const day = Math.floor(slot / 24);
  const hour = slot % 24;
  return {
    cycle,
    slot,
    day: day + 1,
    hour,
    msIntoHour,
    remainingMs: HOUR_MS - msIntoHour,
    title: (HOUR_FORMATS[hour] || HOUR_FORMATS[0]).title,
    theme: DAY_THEMES[day] || DAY_THEMES[0],
  };
}

export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function languageLabel(id) {
  const map = {
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    fr: 'French',
    de: 'German',
    ja: 'Japanese',
    zh: 'Chinese',
    'pt-BR': 'Portuguese (Brazil)',
    hi: 'Hindi',
    it: 'Italian',
    ko: 'Korean',
    en: 'English',
  };
  return map[id] || id;
}

async function askFlick(prompt) {
  const res = await fetch('/api/flick-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.text) {
    throw new Error(body.error || 'Flick is offline on this host.');
  }
  return String(body.text).replace(/DAW:\s*\{[^\n]+\}\s*/g, '').trim();
}

function loadTurns() {
  try {
    const raw = JSON.parse(localStorage.getItem(TURNS_KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(-40) : [];
  } catch {
    return [];
  }
}

function saveTurns(turns) {
  localStorage.setItem(TURNS_KEY, JSON.stringify(turns.slice(-40)));
}

function loadScripts() {
  try {
    return JSON.parse(localStorage.getItem(SCRIPT_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function initVoiceDesk({ switchSection, speak, stop, pickFile }) {
  const speakLongformBtn = document.getElementById('speak-longform-btn');
  if (speakLongformBtn) {
    speakLongformBtn.addEventListener('click', () => switchSection('longform'));
  }

  initDub({ speak, pickFile });
  initTalk({ speak, stop });
  initSignal({ speak });
}

function initDub({ speak, pickFile }) {
  const importBtn = document.getElementById('dub-import-btn');
  const recordBtn = document.getElementById('dub-record-btn');
  const timerEl = document.getElementById('dub-timer');
  const audioEl = document.getElementById('dub-source-audio');
  const sourceLabel = document.getElementById('dub-source-label');
  const transcriptEl = document.getElementById('dub-transcript');
  const scriptEl = document.getElementById('dub-script');
  const transcribeBtn = document.getElementById('dub-transcribe-btn');
  const translateBtn = document.getElementById('dub-translate-btn');
  const renderBtn = document.getElementById('dub-render-btn');
  const keepLang = document.getElementById('dub-keep-lang');
  const langSel = document.getElementById('dub-lang');
  const hint = document.getElementById('dub-hint');
  if (!importBtn || !renderBtn) return;

  let sourceBlob = null;
  let rec = null;
  let recChunks = [];
  let recTimer = 0;
  let recStarted = 0;

  function setHint(text) {
    if (hint) hint.textContent = text || '';
  }

  function setSource(blob, name) {
    sourceBlob = blob;
    if (audioEl) {
      audioEl.hidden = false;
      audioEl.src = URL.createObjectURL(blob);
    }
    if (sourceLabel) sourceLabel.textContent = name || 'Source loaded.';
  }

  importBtn.addEventListener('click', async () => {
    try {
      const file = pickFile
        ? await pickFile('audio')
        : await new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.onchange = () => resolve(input.files && input.files[0]);
            input.click();
          });
      if (file) setSource(file, file.name);
    } catch (err) {
      setHint(err.message || 'Could not import.');
    }
  });

  recordBtn.addEventListener('click', async () => {
    if (rec && rec.state === 'recording') {
      rec.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recChunks = [];
      rec = new MediaRecorder(stream);
      recStarted = Date.now();
      recTimer = window.setInterval(() => {
        if (timerEl) timerEl.textContent = formatClock(Date.now() - recStarted);
      }, 200);
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) recChunks.push(ev.data);
      };
      rec.onstop = () => {
        window.clearInterval(recTimer);
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunks, { type: rec.mimeType || 'audio/webm' });
        setSource(blob, 'Recorded take');
        recordBtn.textContent = 'Record take';
        rec = null;
      };
      rec.start();
      recordBtn.textContent = 'Stop';
      setHint('Recording…');
    } catch {
      setHint('Microphone permission is required to record a take.');
    }
  });

  transcribeBtn.addEventListener('click', async () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!sourceBlob) {
      setHint('Add a source clip first.');
      return;
    }
    if (!Ctor) {
      setHint('This browser has no speech recognition. Paste the transcript, then Translate.');
      return;
    }
    setHint('Listening while the take plays. Use headphones if you can.');
    const recog = new Ctor();
    recog.lang = 'en-US';
    recog.continuous = true;
    recog.interimResults = true;
    let text = '';
    recog.onresult = (ev) => {
      let out = '';
      for (let i = 0; i < ev.results.length; i++) out += ev.results[i][0].transcript + ' ';
      text = out.trim();
      if (transcriptEl) transcriptEl.value = text;
    };
    recog.onend = () => {
      if (keepLang && keepLang.checked && transcriptEl && scriptEl) scriptEl.value = transcriptEl.value;
      setHint(text ? 'Transcript ready.' : 'Nothing heard. Paste the lines instead.');
    };
    recog.start();
    if (audioEl) {
      try {
        await audioEl.play();
      } catch {
        /* autoplay */
      }
      audioEl.onended = () => {
        try { recog.stop(); } catch (_) {}
      };
    }
  });

  translateBtn.addEventListener('click', async () => {
    const src = (transcriptEl && transcriptEl.value.trim()) || '';
    if (!src) {
      setHint('Add a transcript first.');
      return;
    }
    if (keepLang && keepLang.checked) {
      if (scriptEl) scriptEl.value = src;
      setHint('Keeping the original language.');
      return;
    }
    const lang = languageLabel(langSel ? langSel.value : 'es-ES');
    setHint(`Translating into ${lang}…`);
    try {
      const text = await askFlick(
        `Translate the following into ${lang} for spoken dubbing. Return only the translated narration, no quotes or notes.\n\n${src}`,
      );
      if (scriptEl) scriptEl.value = text;
      setHint('Script ready.');
    } catch (err) {
      setHint(err.message || 'Could not translate.');
    }
  });

  renderBtn.addEventListener('click', () => {
    const spoken = ((scriptEl && scriptEl.value) || (transcriptEl && transcriptEl.value) || '').trim();
    if (!spoken) {
      setHint('Need a script to render.');
      return;
    }
    const textInput = document.getElementById('text-input');
    if (textInput) textInput.value = spoken;
    setHint('Rendering through Speak…');
    speak();
  });
}

function initTalk({ speak, stop }) {
  const thread = document.getElementById('talk-thread');
  const draft = document.getElementById('talk-draft');
  const sendBtn = document.getElementById('talk-send-btn');
  const micBtn = document.getElementById('talk-mic-btn');
  const resetBtn = document.getElementById('talk-reset-btn');
  const hint = document.getElementById('talk-hint');
  const windowEl = document.getElementById('talk-window');
  if (!thread || !sendBtn) return;

  let turns = loadTurns();
  let startedAt = Number(localStorage.getItem(START_KEY) || 0);
  let busy = false;
  let recog = null;

  function paintWindow() {
    if (!windowEl) return;
    if (!startedAt) {
      windowEl.textContent = 'Memory holds seventy-two hours. It will not restart you from zero.';
      return;
    }
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, 72 * 3600000 - elapsed);
    windowEl.textContent = `${formatClock(elapsed)} in · ${formatClock(remaining)} remaining in the 72-hour window`;
  }

  function paintThread() {
    thread.replaceChildren();
    if (!turns.length) {
      const empty = document.createElement('p');
      empty.className = 'hint hint-info';
      empty.textContent = 'Nothing said yet.';
      thread.appendChild(empty);
      return;
    }
    turns.forEach((t) => {
      const el = document.createElement('div');
      el.className = 'talk-msg ' + t.role;
      const who = document.createElement('div');
      who.className = 'talk-who';
      who.textContent = t.role === 'user' ? 'You' : 'The Voice';
      const body = document.createElement('div');
      body.textContent = t.text;
      el.append(who, body);
      thread.appendChild(el);
    });
    thread.scrollTop = thread.scrollHeight;
  }

  async function send(text) {
    const cleaned = (text || '').trim();
    if (!cleaned || busy) return;
    busy = true;
    if (!startedAt) {
      startedAt = Date.now();
      localStorage.setItem(START_KEY, String(startedAt));
    }
    turns = [...turns, { role: 'user', text: cleaned, at: Date.now() }].slice(-40);
    saveTurns(turns);
    paintThread();
    paintWindow();
    if (hint) hint.textContent = 'Listening…';
    try {
      const history = turns.map((t) => ({
        role: t.role === 'assistant' ? 'assistant' : 'user',
        content: t.text,
      }));
      const res = await fetch('/api/flick-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.text) throw new Error(body.error || 'Talk failed.');
      const reply = String(body.text).replace(/DAW:\s*\{[^\n]+\}\s*/g, '').trim();
      turns = [...turns, { role: 'assistant', text: reply, at: Date.now() }].slice(-40);
      saveTurns(turns);
      paintThread();
      const textInput = document.getElementById('text-input');
      if (textInput) textInput.value = reply;
      if (hint) hint.textContent = 'Speaking…';
      speak();
    } catch (err) {
      if (hint) hint.textContent = err.message || 'Talk failed.';
    } finally {
      busy = false;
    }
  }

  sendBtn.addEventListener('click', () => {
    const value = draft ? draft.value : '';
    if (draft) draft.value = '';
    send(value);
  });
  draft && draft.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      sendBtn.click();
    }
  });

  micBtn && micBtn.addEventListener('click', () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      if (hint) hint.textContent = 'This browser has no speech recognition. Type instead.';
      return;
    }
    if (recog) {
      try { recog.stop(); } catch (_) {}
      recog = null;
      micBtn.textContent = 'Mic';
      return;
    }
    recog = new Ctor();
    recog.lang = 'en-US';
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (ev) => {
      const last = ev.results[ev.results.length - 1];
      const said = last && last[0] && last[0].transcript;
      if (said) send(said);
    };
    recog.onend = () => {
      recog = null;
      micBtn.textContent = 'Mic';
    };
    recog.start();
    micBtn.textContent = 'Stop mic';
  });

  resetBtn && resetBtn.addEventListener('click', () => {
    turns = [];
    startedAt = 0;
    localStorage.removeItem(TURNS_KEY);
    localStorage.removeItem(START_KEY);
    stop && stop();
    paintThread();
    paintWindow();
    if (hint) hint.textContent = '';
  });

  paintThread();
  paintWindow();
  window.setInterval(paintWindow, 1000);
}

function initSignal({ speak }) {
  const cycleLabel = document.getElementById('signal-cycle-label');
  const clockEl = document.getElementById('signal-clock');
  const slotEl = document.getElementById('signal-slot');
  const remainEl = document.getElementById('signal-remain');
  const hand = document.getElementById('signal-dial-hand');
  const openBtn = document.getElementById('signal-open-btn');
  const nextBtn = document.getElementById('signal-next-btn');
  const scriptEl = document.getElementById('signal-script');
  const hint = document.getElementById('signal-hint');
  if (!openBtn) return;

  let previewSlot = null;

  function paint() {
    const pos = positionAt();
    const slot = previewSlot == null ? pos.slot : previewSlot;
    const hour = slot % 24;
    const day = Math.floor(slot / 24);
    const title = (HOUR_FORMATS[hour] || HOUR_FORMATS[0]).title;
    if (cycleLabel) cycleLabel.textContent = `Cycle ${pos.cycle + 1} · Day ${day + 1} ${DAY_THEMES[day]}`;
    if (clockEl) {
      clockEl.textContent = `${String(hour).padStart(2, '0')}:${String(Math.floor(pos.msIntoHour / 60000)).padStart(2, '0')}`;
    }
    if (slotEl) slotEl.textContent = `Hour ${slot + 1} / 72 · ${title}`;
    if (remainEl) remainEl.textContent = `${formatClock(pos.remainingMs)} left in this hour`;
    if (hand) hand.style.transform = `rotate(${(slot / CYCLE_HOURS) * 360}deg)`;
  }

  async function openSlot(slot) {
    const hour = slot % 24;
    const day = Math.floor(slot / 24);
    const title = (HOUR_FORMATS[hour] || HOUR_FORMATS[0]).title;
    const key = `${Math.floor(positionAt().cycle)}-${slot}`;
    const store = loadScripts();
    if (store[key] && scriptEl) {
      scriptEl.value = store[key];
      const textInput = document.getElementById('text-input');
      if (textInput) textInput.value = store[key];
      if (hint) hint.textContent = `On air · ${title}`;
      speak();
      return;
    }
    if (hint) hint.textContent = `Writing ${title}…`;
    try {
      const text = await askFlick(
        `Write a 90-second spoken radio piece titled "${title}" for hour ${hour} of day ${day + 1} (${DAY_THEMES[day]}) of a 72-hour cycle that never repeats. Return only the spoken script.`,
      );
      store[key] = text;
      localStorage.setItem(SCRIPT_KEY, JSON.stringify(store));
      if (scriptEl) scriptEl.value = text;
      const textInput = document.getElementById('text-input');
      if (textInput) textInput.value = text;
      if (hint) hint.textContent = `On air · ${title}`;
      speak();
    } catch (err) {
      if (hint) hint.textContent = err.message || 'Signal failed.';
    }
  }

  openBtn.addEventListener('click', () => {
    previewSlot = null;
    openSlot(positionAt().slot);
  });
  nextBtn && nextBtn.addEventListener('click', () => {
    const pos = positionAt();
    previewSlot = (pos.slot + 1) % CYCLE_HOURS;
    paint();
    openSlot(previewSlot);
  });

  paint();
  window.setInterval(paint, 1000);
}
