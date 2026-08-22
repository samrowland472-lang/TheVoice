// Direct browser -> ElevenLabs calls using the user's own API key. Nothing
// passes through any server we run; the key lives only in localStorage.
const API_BASE = 'https://api.elevenlabs.io/v1';
const KEY_STORAGE = 'speakscape_elevenlabs_key';
const VOICES_STORAGE = 'speakscape_cloned_voices';

export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}

export function setApiKey(key) {
  if (key) localStorage.setItem(KEY_STORAGE, key);
  else localStorage.removeItem(KEY_STORAGE);
}

export function getClonedVoices() {
  try {
    return JSON.parse(localStorage.getItem(VOICES_STORAGE) || '[]');
  } catch {
    return [];
  }
}

export function saveClonedVoice(voice) {
  const list = getClonedVoices();
  list.push(voice);
  localStorage.setItem(VOICES_STORAGE, JSON.stringify(list));
  return list;
}

export function removeClonedVoice(voiceId) {
  const list = getClonedVoices().filter((v) => v.voice_id !== voiceId);
  localStorage.setItem(VOICES_STORAGE, JSON.stringify(list));
  return list;
}

// ElevenLabs' own error responses are JSON with a specific, useful
// {detail: {message, code}} — surfacing that directly is far more helpful
// than a blanket "unauthorized", so this parses it when present and only
// falls back to a generic message when the body isn't JSON at all.
async function friendlyError(err, res) {
  if (res) {
    try {
      const body = await res.clone().json();
      const detailMsg = body && body.detail && (body.detail.message || body.detail);
      if (typeof detailMsg === 'string' && detailMsg) return `ElevenLabs: ${detailMsg}`;
    } catch {
      /* not JSON — fall through to status-based messages */
    }
    if (res.status === 401) return 'ElevenLabs rejected the API key (unauthorized). Double-check it in Settings.';
    if (res.status === 429) return 'ElevenLabs rate limit / quota reached for this key.';
  }
  if (err instanceof TypeError) {
    return "Couldn't reach ElevenLabs from the browser — this can happen if their API blocks direct browser (CORS) requests. Their API is normally called from a server; a fully client-side site may hit that wall.";
  }
  return (err && err.message) || 'Unknown error talking to ElevenLabs.';
}

export async function cloneVoice(apiKey, blob, name, filename = 'sample.webm') {
  const form = new FormData();
  form.append('name', name);
  form.append('files', blob, filename);

  let res;
  try {
    res = await fetch(`${API_BASE}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form,
    });
  } catch (err) {
    throw new Error(await friendlyError(err));
  }

  if (!res.ok) {
    throw new Error(await friendlyError(new Error(`HTTP ${res.status}`), res));
  }

  const data = await res.json();
  return { voice_id: data.voice_id, name };
}

export async function synthesize(apiKey, voiceId, text) {
  let res;
  try {
    res = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
  } catch (err) {
    throw new Error(await friendlyError(err));
  }

  if (!res.ok) {
    throw new Error(await friendlyError(new Error(`HTTP ${res.status}`), res));
  }

  return res.blob();
}
