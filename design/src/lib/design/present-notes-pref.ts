export const NOTES_PREF = "voice-design-present-notes";
export const NOTES_CARET = "voice-design-present-notes-caret";
export const NOTES_LAST = "voice-design-present-notes-last";

export type CaretMap = Record<string, { start: number; end: number }>;
export type LastNotesEdit = { pageId: string; name: string; at: number };

export function parseCaretMap(raw: string | null): CaretMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as CaretMap;
    if (!parsed || typeof parsed !== "object") return {};
    const out: CaretMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const start = Number((value as { start?: unknown }).start);
      const end = Number((value as { end?: unknown }).end);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      out[id] = { start: Math.max(0, start), end: Math.max(0, end) };
    }
    return out;
  } catch {
    return {};
  }
}

export function clampCaret(
  saved: { start: number; end: number } | undefined,
  textLen: number,
): { start: number; end: number } {
  const start = Math.min(textLen, Math.max(0, saved?.start ?? textLen));
  const end = Math.min(textLen, Math.max(0, saved?.end ?? start));
  return { start, end };
}

export function parseLastNotesEdit(raw: string | null): LastNotesEdit | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LastNotesEdit;
    if (!parsed?.pageId || typeof parsed.name !== "string") return null;
    return {
      pageId: parsed.pageId,
      name: parsed.name,
      at: Number(parsed.at) || 0,
    };
  } catch {
    return null;
  }
}

/** When opening notes on a different campaign frame, jump back to the last page that was edited. */
export function restoreNotesPageId(
  last: LastNotesEdit | null,
  liveId: string,
  pageIds: string[],
): string | null {
  if (!last?.pageId || last.pageId === liveId) return null;
  if (!pageIds.includes(last.pageId)) return null;
  return last.pageId;
}

export function writeLastNotesEdit(edit: LastNotesEdit) {
  try {
    localStorage.setItem(NOTES_LAST, JSON.stringify(edit));
  } catch {
    /* blocked */
  }
}

export function readLastNotesEdit(): LastNotesEdit | null {
  try {
    return parseLastNotesEdit(localStorage.getItem(NOTES_LAST));
  } catch {
    return null;
  }
}

export function writeCaretMap(map: CaretMap) {
  try {
    localStorage.setItem(NOTES_CARET, JSON.stringify(map));
  } catch {
    /* blocked */
  }
}

export function readCaretMap(): CaretMap {
  try {
    return parseCaretMap(localStorage.getItem(NOTES_CARET));
  } catch {
    return {};
  }
}
