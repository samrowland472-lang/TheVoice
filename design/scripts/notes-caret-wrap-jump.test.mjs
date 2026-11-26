import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const pref = readFileSync(new URL("../src/lib/design/present-notes-pref.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const panel = readFileSync(new URL("../src/components/studio/present-notes-panel.tsx", import.meta.url), "utf8");

function shouldRestoreNotesCaretAfterFrameJump(notesVisible, prevPageId, nextPageId) {
  if (!notesVisible || !nextPageId) return false;
  return nextPageId !== prevPageId;
}

test("notes caret restores when jumping frames after wrap", () => {
  assert.match(pref, /shouldRestoreNotesCaretAfterFrameJump/);
  assert.match(chrome, /shouldRestoreNotesCaretAfterFrameJump/);
  assert.match(chrome, /campaignStackAdvance/);
  assert.match(chrome, /persistNotesCaret/);
  assert.match(chrome, /restoreNotesCaret/);
  assert.match(panel, /restoreCaretIfFocused/);
  assert.equal(shouldRestoreNotesCaretAfterFrameJump(true, "c", "a"), true);
  assert.equal(shouldRestoreNotesCaretAfterFrameJump(false, "c", "a"), false);
  assert.equal(shouldRestoreNotesCaretAfterFrameJump(true, "a", "a"), false);
});
