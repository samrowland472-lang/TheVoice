import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

function peekTickDwellAcrossWrap(dwellMs, notesVisible, wrapped) {
  if (!Number.isFinite(dwellMs) || dwellMs < 0) return 0;
  if (wrapped && notesVisible) return dwellMs;
  if (wrapped) return 0;
  return dwellMs;
}

function peekTickDwellAfterNotesClose(dwellMs, notesWereOpen, notesVisible, wrapped) {
  if (!Number.isFinite(dwellMs) || dwellMs < 0) return 0;
  if (notesWereOpen && !notesVisible) return dwellMs;
  return peekTickDwellAcrossWrap(dwellMs, notesVisible, wrapped);
}

test("wrap keeps tick remaining when peek notes stay open", () => {
  assert.match(src, /export function peekTickDwellAcrossWrap/);
  assert.match(chrome, /peekTickDwellAcrossWrap/);
  assert.match(chrome, /notesVisible/);
  assert.equal(peekTickDwellAcrossWrap(1600, true, true), 1600);
  assert.equal(peekTickDwellAcrossWrap(1600, false, true), 0);
  assert.equal(peekTickDwellAcrossWrap(800, true, false), 800);
});

test("closing notes after a wrap resumes the same remaining clock", () => {
  assert.match(src, /export function peekTickDwellAfterNotesClose/);
  assert.match(chrome, /peekTickDwellAfterNotesClose/);
  assert.match(chrome, /wrapPending/);
  assert.equal(peekTickDwellAfterNotesClose(1600, true, false, true), 1600);
  assert.equal(peekTickDwellAfterNotesClose(400, true, false, true), 400);
  assert.equal(peekTickDwellAfterNotesClose(1600, false, false, true), 0);
});
