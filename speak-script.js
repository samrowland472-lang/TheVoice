// Speak long-form: 20,000 words, not 20,000 characters.
// Most TTS engines choke on a giant blob; we split on sentence
// boundaries so the queue can actually finish.

export const MAX_SPEAK_WORDS = 20000;

export function wordCount(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function clipToWords(text, max = MAX_SPEAK_WORDS) {
  const raw = String(text || '');
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  const parts = trimmed.split(/\s+/);
  if (parts.length <= max) return raw;
  const lead = raw.match(/^\s*/)[0];
  return lead + parts.slice(0, max).join(' ');
}

export function formatEta(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `~${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `~${m}m ${rem}s` : `~${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `~${h}h ${mm}m` : `~${h}h`;
}

/** Split `text` into utterance-sized pieces with start offsets into the original string. */
export function chunkScript(text, maxChars = 480) {
  const src = String(text || '');
  const out = [];
  const limit = Math.max(80, maxChars);
  let i = 0;
  const n = src.length;
  while (i < n) {
    while (i < n && /\s/.test(src[i])) i++;
    if (i >= n) break;
    let end = Math.min(n, i + limit);
    if (end < n) {
      const window = src.slice(i, end);
      let cut = -1;
      for (let k = window.length - 1; k > window.length * 0.35; k--) {
        const ch = window[k];
        const next = window[k + 1];
        if ((ch === '.' || ch === '!' || ch === '?' || ch === '\n') && (!next || /\s/.test(next))) {
          cut = k + 1;
          break;
        }
      }
      if (cut === -1) {
        cut = window.lastIndexOf(' ');
        if (cut < window.length * 0.35) cut = window.length;
      }
      end = i + cut;
    }
    if (end <= i) end = Math.min(n, i + 1);
    out.push({ text: src.slice(i, end), start: i });
    i = end;
  }
  return out;
}
