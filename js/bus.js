// Tiny studio bus so Speak, Clone, Library and the DAW share clips
// without importing each other. One event name, one payload shape.

const listeners = new Map();

export function onVoice(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type)?.delete(fn);
}

export function emitVoice(type, payload) {
  const set = listeners.get(type);
  if (set) {
    set.forEach((fn) => {
      try { fn(payload); } catch (err) { console.warn('[TheVoice bus]', err); }
    });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`thevoice:${type}`, { detail: payload }));
  }
}
