import assert from "node:assert/strict";
import { test } from "node:test";

function parseCaretMap(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const start = Number(value.start);
      const end = Number(value.end);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      out[id] = { start: Math.max(0, start), end: Math.max(0, end) };
    }
    return out;
  } catch {
    return {};
  }
}

function clampCaret(saved, textLen) {
  const start = Math.min(textLen, Math.max(0, saved?.start ?? textLen));
  const end = Math.min(textLen, Math.max(0, saved?.end ?? start));
  return { start, end };
}

function parseLastNotesEdit(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.pageId || typeof parsed.name !== "string") return null;
    return { pageId: parsed.pageId, name: parsed.name, at: Number(parsed.at) || 0 };
  } catch {
    return null;
  }
}

test("caret map ignores junk and clamps", () => {
  assert.deepEqual(parseCaretMap(null), {});
  assert.deepEqual(parseCaretMap("not-json"), {});
  const map = parseCaretMap(JSON.stringify({ a: { start: 3, end: 8 }, b: { start: "x" } }));
  assert.deepEqual(map.a, { start: 3, end: 8 });
  assert.equal(map.b, undefined);
  assert.deepEqual(clampCaret({ start: 40, end: 99 }, 10), { start: 10, end: 10 });
  assert.deepEqual(clampCaret(undefined, 4), { start: 4, end: 4 });
});

test("last notes edit requires page id", () => {
  assert.equal(parseLastNotesEdit(null), null);
  assert.equal(parseLastNotesEdit("{}"), null);
  const last = parseLastNotesEdit(JSON.stringify({ pageId: "p1", name: "Story", at: 12 }));
  assert.deepEqual(last, { pageId: "p1", name: "Story", at: 12 });
});

function restoreNotesPageId(last, liveId, pageIds) {
  if (!last?.pageId || last.pageId === liveId) return null;
  if (!pageIds.includes(last.pageId)) return null;
  return last.pageId;
}

test("opening notes from another frame restores last-edited page", () => {
  const last = { pageId: "story", name: "Story", at: 1 };
  assert.equal(restoreNotesPageId(last, "square", ["story", "square", "banner"]), "story");
  assert.equal(restoreNotesPageId(last, "story", ["story", "square"]), null);
  assert.equal(restoreNotesPageId(last, "square", ["square"]), null);
  assert.equal(restoreNotesPageId(null, "square", ["story"]), null);
});
