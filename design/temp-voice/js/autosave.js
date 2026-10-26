// Autosave: the work survives a reload.
//
// Everything a user builds in the animator, the sequencer and the lyrics
// pad lived in memory only — an accidental refresh, a crashed tab or a
// closed laptop took all of it. Finished audio was already safe in the clip
// library; this covers the work in progress.
//
// Saves are debounced: gestures fire change events continuously, and
// serializing a scene with embedded images on every slider pixel would make
// the act of editing janky — the thing autosave exists to protect.
//
// A restored payload is untrusted: it may be from an older build, truncated
// by a full quota, or hand-edited. Loading never throws; damaged pieces are
// dropped one by one rather than the whole restore failing.

export function createAutosave({
  key,
  storage,
  debounceMs = 800,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
} = {}) {
  let pending = null;

  const write = (makePayload) => {
    let payload;
    try {
      payload = makePayload();
    } catch {
      return false; // a broken serializer must not take the app down
    }
    try {
      storage.setItem(key, JSON.stringify({ savedAt: Date.now(), ...payload }));
      return true;
    } catch {
      // Quota is the realistic failure — a scene with big embedded images
      // shares 5MB with everything else on the origin. An autosave that
      // throws is worse than one that quietly does not happen.
      return false;
    }
  };

  return {
    /** Save soon. Repeated calls within the window collapse to one write. */
    schedule(makePayload) {
      if (pending !== null) clearTimer(pending);
      pending = setTimer(() => {
        pending = null;
        write(makePayload);
      }, debounceMs);
    },

    /** Save now — for the moments a debounce would miss: tab close, hide. */
    flush(makePayload) {
      if (pending !== null) {
        clearTimer(pending);
        pending = null;
      }
      return write(makePayload);
    },

    load() {
      let raw;
      try {
        raw = storage.getItem(key);
      } catch {
        return null;
      }
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        return data && typeof data === 'object' ? data : null;
      } catch {
        return null;
      }
    },

    clear() {
      if (pending !== null) {
        clearTimer(pending);
        pending = null;
      }
      try {
        storage.removeItem(key);
      } catch {
        /* nothing to clear */
      }
    },

    hasPending: () => pending !== null,
  };
}

/** Whether a saved workspace holds anything worth restoring. */
export function workspaceHasContent(ws) {
  if (!ws || typeof ws !== 'object') return false;
  const shapes = ws.scene && Array.isArray(ws.scene.shapes) ? ws.scene.shapes.length : 0;
  const hits = ws.pattern && ws.pattern.grid && typeof ws.pattern.grid === 'object'
    ? Object.values(ws.pattern.grid).some((row) => Array.isArray(row) && row.some(Boolean))
    : false;
  const lyrics = typeof ws.lyrics === 'string' && ws.lyrics.trim().length > 0;
  return shapes > 0 || hits || lyrics;
}

/** One line saying what is about to come back, for the restore toast. */
export function describeWorkspace(ws) {
  if (!ws) return '';
  const bits = [];
  const shapes = ws.scene && Array.isArray(ws.scene.shapes) ? ws.scene.shapes.length : 0;
  if (shapes) bits.push(`${shapes} shape${shapes === 1 ? '' : 's'}`);
  if (ws.scene && ws.scene.camera) bits.push('3D');
  if (ws.pattern && ws.pattern.grid
      && Object.values(ws.pattern.grid).some((r) => Array.isArray(r) && r.some(Boolean))) {
    bits.push('a beat');
  }
  if (typeof ws.lyrics === 'string' && ws.lyrics.trim()) bits.push('lyrics');
  return bits.join(' · ');
}
