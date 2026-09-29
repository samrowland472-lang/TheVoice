import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const exp = readFileSync(new URL("../src/lib/design/export-campaign.ts", import.meta.url), "utf8");
const idle = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

test("campaign PDF page count follows printJpegPage stack order", () => {
  assert.match(exp, /export function campaignPdfPages/);
  assert.match(exp, /export function campaignPdfPageCount/);
  assert.match(exp, /printJpegPage/);
  assert.match(exp, /campaignPdfPages\(docs\)/);
  assert.match(chrome, /exportPeekCampaignPdf/);
  assert.match(chrome, /downloadCampaignPdf/);
});

test("named caption vanishes at remaining 0 with no ghost name", () => {
  assert.match(idle, /export function peekCaptionVisible/);
  assert.match(chrome, /peekCaptionVisible\(tickRemaining/);
  assert.match(chrome, /peekCaptionOpacity\(tickRemaining\)/);
});
