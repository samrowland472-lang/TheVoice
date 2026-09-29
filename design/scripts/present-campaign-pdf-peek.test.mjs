import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const idle = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");

function peekCaptionOpacity(remaining) {
  if (!Number.isFinite(remaining)) return 1;
  return Math.max(0, Math.min(1, remaining));
}

test("named caption fade locks to tickRemaining", () => {
  assert.match(idle, /export function peekCaptionOpacity/);
  assert.match(chrome, /peekCaptionOpacity\(tickRemaining\)/);
  assert.equal(peekCaptionOpacity(1), 1);
  assert.equal(peekCaptionOpacity(0.5), 0.5);
  assert.equal(peekCaptionOpacity(0), 0);
  assert.equal(peekCaptionOpacity(2), 1);
});

test("Present can download campaign PDF while peek rail is up", () => {
  assert.match(chrome, /downloadCampaignPdf/);
  assert.match(chrome, /campaignDocsFromIndex/);
  assert.match(chrome, /exportPeekCampaignPdf/);
  assert.match(chrome, /Download campaign PDF/);
  assert.match(chrome, /showPeek/);
});
