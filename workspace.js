// Making the work survive a reload.
//
// Everything a user builds — the animation scene, the beat, the lyrics, how
// a project is balanced — lived in memory only. An accidental refresh, a
// closed tab or a browser crash took all of it, which is the difference
// between software and a toy. Finished audio was already safe in the clip
// library; this covers the rest.
//
// Two jobs, one format: a debounced autosave into localStorage so the app
// picks up where it left off, and an explicit save file so work is portable
// and can be backed up.
//
// A saved workspace is untrusted input. It may have been written by an older
// version, hand-edited, or truncated by a full disk. Nothing here throws on
// bad data — every field is validated and falls back to a default, because
// losing one slider's value is a far better outcome than an app that refuses
// to start.

export const WORKSPACE_VERSION = 1;
export const WORKSPACE_KEY = 'thevoice_workspace';

const clampNum = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const cleanString = (value, max, fallback = '') =>
  (typeof value === 'string' ? value.slice(0, max) : fallback);

/** Bundle the current state of every workspace into one plain object. */
export function serializeWorkspace({ scene, pattern, lyrics = '', project = {} } = {}) {
  return {
    version: WORKSPACE_VERSION,
    savedAt: new Date().toISOString(),
    scene: scene ? { duration: scene.duration, fps: scene.fps, background: scene.background, shapes: scene.shapes } : null,
    pattern: pattern
      ? { bpm: pattern.bpm, swing: pattern.swing, grid: pattern.grid, bassNotes: pattern.bassNotes }
      : null,
    lyrics: String(lyrics || ''),
    project: {
      voiceGain: project.voiceGain,
      beatGain: project.beatGain,
      offset: project.offset,
      loopBeat: project.loopBeat,
      fade: project.fade,
      // The clip id, not the audio: a workspace should stay small enough to
      // sit in localStorage, and the audio is already in the clip library.
      voiceClipId: project.voiceClipId || '',
      beat: project.beat || '',
      scene: project.scene || '',
    },
  };
}

function reviveScene(raw, defaults) {
  if (!raw || !Array.isArray(raw.shapes)) return defaults;
  const shapes = [];
  for (const s of raw.shapes) {
    // A shape with no keyframes cannot be drawn or interpolated; skipping it
    // keeps the rest of the scene rather than discarding the whole file.
    if (!s || !Array.isArray(s.keyframes) || !s.keyframes.length) continue;
    shapes.push({
      id: cleanString(s.id, 40) || `s${shapes.length}`,
      type: cleanString(s.type, 20, 'circle') || 'circle',
      label: cleanString(s.label, 60, 'Shape'),
      text: cleanString(s.text, 200),
      reactive: !!s.reactive,
      easing: cleanString(s.easing, 20, 'ease') || 'ease',
      keyframes: s.keyframes.map((k) => ({
        time: clampNum(k && k.time, 0, 3600, 0),
        x: clampNum(k && k.x, -1000, 1000, 50),
        y: clampNum(k && k.y, -1000, 1000, 50),
        scale: clampNum(k && k.scale, 0.01, 50, 1),
        rotation: clampNum(k && k.rotation, -3600, 3600, 0),
        opacity: clampNum(k && k.opacity, 0, 1, 1),
        color: cleanString(k && k.color, 32, '#3fc6ff') || '#3fc6ff',
      })).sort((a, b) => a.time - b.time),
    });
  }
  return {
    duration: clampNum(raw.duration, 0.1, 3600, defaults.duration),
    fps: clampNum(raw.fps, 1, 120, defaults.fps),
    background: cleanString(raw.background, 32, defaults.background) || defaults.background,
    shapes,
  };
}

function revivePattern(raw, defaults) {
  if (!raw || !raw.grid || typeof raw.grid !== 'object') return defaults;
  const steps = defaults.bassNotes.length;
  const grid = {};
  // Drive the shape from the defaults, not the file: a saved workspace from
  // a build with different drum tracks must not add or drop any.
  for (const id of Object.keys(defaults.grid)) {
    const row = Array.isArray(raw.grid[id]) ? raw.grid[id] : [];
    grid[id] = Array.from({ length: steps }, (_, i) => !!row[i]);
  }
  const bassRaw = Array.isArray(raw.bassNotes) ? raw.bassNotes : [];
  return {
    bpm: Math.round(clampNum(raw.bpm, 40, 300, defaults.bpm)),
    swing: clampNum(raw.swing, 0, 1, defaults.swing),
    grid,
    bassNotes: Array.from({ length: steps }, (_, i) => Math.round(clampNum(bassRaw[i], -48, 48, 0))),
  };
}

/**
 * Turn a saved workspace back into usable state.
 *
 * `defaults` supplies a fresh scene and pattern to fall back to field by
 * field. Returns null only when the input is not a workspace at all — a
 * damaged one still yields whatever could be salvaged.
 */
export function deserializeWorkspace(raw, defaults = {}) {
  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;
  // A file from a future version may use fields this build cannot read, so
  // refuse it rather than silently loading half of someone's work.
  if (Number(data.version) > WORKSPACE_VERSION) return null;

  const defScene = defaults.scene || { duration: 5, fps: 30, background: '#0a0d0c', shapes: [] };
  const defPattern = defaults.pattern || { bpm: 96, swing: 0, grid: {}, bassNotes: [] };
  const p = data.project && typeof data.project === 'object' ? data.project : {};

  return {
    version: Number(data.version) || 1,
    savedAt: cleanString(data.savedAt, 40),
    scene: reviveScene(data.scene, defScene),
    pattern: revivePattern(data.pattern, defPattern),
    lyrics: cleanString(data.lyrics, 20000),
    project: {
      voiceGain: clampNum(p.voiceGain, 0, 1.5, 1),
      beatGain: clampNum(p.beatGain, 0, 1.5, 0.7),
      offset: clampNum(p.offset, 0, 60, 0),
      loopBeat: p.loopBeat === undefined ? true : !!p.loopBeat,
      fade: p.fade === undefined ? true : !!p.fade,
      voiceClipId: cleanString(p.voiceClipId, 60),
      beat: cleanString(p.beat, 20),
      scene: cleanString(p.scene, 20),
    },
  };
}

/** True when a workspace holds anything worth restoring. */
export function workspaceHasContent(ws) {
  if (!ws) return false;
  const shapes = ws.scene && Array.isArray(ws.scene.shapes) ? ws.scene.shapes.length : 0;
  const hits = ws.pattern && ws.pattern.grid
    ? Object.values(ws.pattern.grid).some((row) => Array.isArray(row) && row.some(Boolean))
    : false;
  return shapes > 0 || hits || !!(ws.lyrics && ws.lyrics.trim());
}

/** A short human summary, for telling someone what is about to be restored. */
export function describeWorkspace(ws) {
  if (!ws) return 'Nothing saved.';
  const bits = [];
  const shapes = ws.scene && ws.scene.shapes ? ws.scene.shapes.length : 0;
  if (shapes) bits.push(`${shapes} shape${shapes === 1 ? '' : 's'}`);
  if (ws.pattern && ws.pattern.grid) {
    const hits = Object.values(ws.pattern.grid)
      .reduce((n, row) => n + (Array.isArray(row) ? row.filter(Boolean).length : 0), 0);
    if (hits) bits.push(`${hits} drum hit${hits === 1 ? '' : 's'}`);
  }
  if (ws.lyrics && ws.lyrics.trim()) {
    const lines = ws.lyrics.trim().split('\n').filter((l) => l.trim()).length;
    bits.push(`${lines} line${lines === 1 ? '' : 's'} of lyrics`);
  }
  return bits.length ? bits.join(', ') : 'Nothing saved.';
}

/**
 * Save to localStorage, reporting failure rather than throwing.
 *
 * A quota error is the realistic case — the clip library shares the origin —
 * and an autosave that takes the app down with it would be worse than one
 * that quietly does not happen.
 */
export function storeWorkspace(payload, storage) {
  try {
    storage.setItem(WORKSPACE_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    return { ok: false, message: (err && err.message) || 'Could not save.' };
  }
}

export function loadStoredWorkspace(storage, defaults) {
  let raw;
  try {
    raw = storage.getItem(WORKSPACE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  return deserializeWorkspace(raw, defaults);
}

export function clearStoredWorkspace(storage) {
  try {
    storage.removeItem(WORKSPACE_KEY);
  } catch {
    /* nothing to clear */
  }
}
