// Undo.
//
// The app grew a curve editor and a draggable timeline in quick succession —
// two tools whose whole point is to be fiddled with — while having no way
// back from a mistake. A tool that punishes experimentation stops being used
// for experimenting, which is most of what animation is.
//
// This stores whole scene snapshots rather than reversible commands. For a
// scene of a few dozen shapes a snapshot is a few kilobytes, and the
// simplicity buys correctness: there is no command that can forget to
// reverse a field, and no pair of operations that can interleave into a
// state neither expected. Command objects would be worth it for a document
// of a hundred thousand elements; this is not that.

export const HISTORY_LIMIT = 60;

export function createHistory(initial, { limit = HISTORY_LIMIT } = {}) {
  // Snapshots are serialized on the way in. Holding live object references
  // would mean later edits mutate the history as well — the classic way an
  // undo stack quietly becomes a stack of identical states.
  const states = [JSON.stringify(initial)];
  let index = 0;

  const api = {
    /**
     * Record a state, if it differs from the current one.
     *
     * Identical pushes are the common case — every pointerup after a drag
     * that changed nothing, every re-render — and letting them through
     * would fill the stack with states that make Ctrl+Z appear broken.
     */
    push(state) {
      const json = JSON.stringify(state);
      if (json === states[index]) return false;

      // Anything redoable is now unreachable: the timeline has branched.
      states.length = index + 1;
      states.push(json);

      if (states.length > limit) {
        states.shift();
      } else {
        index += 1;
      }
      return true;
    },

    undo() {
      if (index <= 0) return null;
      index -= 1;
      return JSON.parse(states[index]);
    },

    redo() {
      if (index >= states.length - 1) return null;
      index += 1;
      return JSON.parse(states[index]);
    },

    canUndo: () => index > 0,
    canRedo: () => index < states.length - 1,

    /** Current state, for callers that want to reconcile without moving. */
    current: () => JSON.parse(states[index]),

    /** Discard everything and start again from `state`. */
    reset(state) {
      states.length = 0;
      states.push(JSON.stringify(state));
      index = 0;
    },

    get length() { return states.length; },
    get position() { return index; },
  };

  return api;
}

/**
 * Whether a keyboard event is asking for undo or redo.
 *
 * Redo has three bindings in the wild — Ctrl+Y on Windows, Cmd+Shift+Z on
 * Mac, Ctrl+Shift+Z on Linux — and someone who has to discover which one
 * this app chose has already lost the work they were trying to recover.
 */
export function historyIntent(ev) {
  const mod = ev.metaKey || ev.ctrlKey;
  if (!mod) return null;
  const key = String(ev.key || '').toLowerCase();
  if (key === 'z') return ev.shiftKey ? 'redo' : 'undo';
  if (key === 'y') return 'redo';
  return null;
}

/**
 * Whether a keystroke should be left alone because the user is typing.
 *
 * Ctrl+Z inside a text box is the browser's own undo for that box, and
 * stealing it to revert the scene would be actively destructive.
 */
export function isTextEntry(target) {
  if (!target) return false;
  const tag = String(target.tagName || '').toLowerCase();
  if (tag === 'textarea') return true;
  if (target.isContentEditable) return true;
  if (tag !== 'input') return false;
  const type = String(target.type || 'text').toLowerCase();
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file'].includes(type);
}
