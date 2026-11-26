import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

function peekTickResumeAfterNotesClose(dwellMs, notesWereVisible, notesNowVisible) {
  const safe = !Number.isFinite(dwellMs) || dwellMs < 0 ? 0 : dwellMs;
  if (notesNowVisible) return { dwellMs: safe, paused: true };
  if (notesWereVisible && !notesNowVisible) return { dwellMs: safe, paused: false };
  return { dwellMs: safe, paused: false };
}

test("closing peek notes after a wrap resumes the remaining tick clock", () => {
  assert.match(src, /export function peekTickResumeAfterNotesClose/);
  assert.match(chrome, /peekTickResumeAfterNotesClose/);
  const held = peekTickResumeAfterNotesClose(1600, true, true);
  assert.equal(held.paused, true);
  assert.equal(held.dwellMs, 1600);
  const resume = peekTickResumeAfterNotesClose(1600, true, false);
  assert.equal(resume.paused, false);
  assert.equal(resume.dwellMs, 1600);
});
