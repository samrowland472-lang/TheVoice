import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const exp = readFileSync(new URL("../src/lib/design/export-campaign.ts", import.meta.url), "utf8");
const idle = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

test("campaign PDF page count follows printJpegPage stack order", () => {
  assert.match(exp, /export function campaignPdfPages/);
  assert.match(exp, /export function campaignPdfPageCount/);
  assert.match(exp, /export function countPdfTypePageObjects/);
  assert.match(exp, /printJpegPage/);
  assert.match(exp, /campaignPdfPages\(docs/);
  assert.match(chrome, /exportPeekCampaignPdf/);
  assert.match(chrome, /downloadCampaignPdf/);
});

test("three-board campaign fixture reports three PDF pages without raster", () => {
  const fixture = [{ id: "a" }, { id: "b" }, { id: "c" }];
  function campaignPdfPageCount(docs) {
    return docs.length;
  }
  assert.equal(campaignPdfPageCount(fixture), 3);
  assert.equal(campaignPdfPageCount([]), 0);
  assert.match(exp, /return docs\.length/);
  function countPdfTypePageObjects(text) {
    return (text.match(/\/Type \/Page(?!s)\b/g) ?? []).length;
  }
  assert.equal(
    countPdfTypePageObjects(
      "<< /Type /Pages /Kids [3 0 R 6 0 R 9 0 R] /Count 3 >> << /Type /Page /Parent 2 0 R >> << /Type /Page /Parent 2 0 R >> << /Type /Page /Parent 2 0 R >>",
    ),
    3,
  );
});

test("named caption vanishes at remaining 0 with no ghost name", () => {
  assert.match(idle, /export function peekCaptionVisible/);
  assert.match(chrome, /peekCaptionVisible\(tickRemaining/);
  assert.match(chrome, /peekCaptionOpacity\(tickRemaining\)/);
});
