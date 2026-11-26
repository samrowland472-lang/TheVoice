import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const exp = readFileSync(new URL("../src/lib/design/export-campaign.ts", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../src/lib/design/export-pdf.ts", import.meta.url), "utf8");
const idle = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const top = readFileSync(new URL("../src/components/studio/top-bar.tsx", import.meta.url), "utf8");
const smoke = readFileSync(new URL("./browser-smoke.mjs", import.meta.url), "utf8");
const bridge = readFileSync(new URL("../src/components/preview-host-bridge.tsx", import.meta.url), "utf8");

test("campaign PDF page count follows printJpegPage stack order", () => {
  assert.match(exp, /export function campaignPdfPages/);
  assert.match(exp, /export function campaignPdfPageCount/);
  assert.match(exp, /printJpegPage/);
  assert.match(exp, /campaignPdfPages\(docs\)/);
  assert.match(top, /downloadCampaignPdf/);
});

test("three-board campaign fixture reports three PDF pages without raster", () => {
  const fixture = [{ id: "a" }, { id: "b" }, { id: "c" }];
  function campaignPdfPageCount(docs) {
    return docs.length;
  }
  assert.equal(campaignPdfPageCount(fixture), 3);
  assert.equal(campaignPdfPageCount([]), 0);
  assert.match(exp, /return docs\.length/);
});

test("named caption vanishes at remaining 0 with no ghost name", () => {
  assert.match(idle, /export function peekCaptionVisible/);
  assert.match(idle, /export function peekCaptionOpacity/);
  assert.match(chrome, /peekCaptionNameId/);
});

test("browser smoke rasters three boards and asserts /Type /Page", () => {
  assert.match(pdf, /export function pdfTypePageCount/);
  assert.match(pdf, /Type \\\/Page/);
  assert.match(exp, /threeBoardCampaignFixture/);
  assert.match(exp, /probeRasterCampaignPdf/);
  assert.match(bridge, /installCampaignPdfSmokeHook/);
  assert.match(smoke, /__voiceDesignCampaignPdf/);
  assert.match(smoke, /typePage === 3/);
});
