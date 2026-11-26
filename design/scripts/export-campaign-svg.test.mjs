import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const camp = readFileSync(new URL("../src/lib/design/export-campaign.ts", import.meta.url), "utf8");

test("campaign SVG shares one defs block across boards", () => {
  assert.match(camp, /export function exportCampaignSvg/);
  assert.match(exp, /export function collectSvgDefs/);
  assert.match(camp, /export function downloadCampaignSvg/);
  assert.match(camp, /docs\.map\(\(d, i\) => collectSvgDefs\(d, `p\$\{i\}-`\)\)/);
  assert.match(camp, /<defs>\$\{defs\}<\/defs>/);
  assert.match(camp, /data-page=/);
  assert.match(camp, /CAMPAIGN_GAP/);
  assert.match(camp, /campaignStackLayout/);
});

test("single-board SVG also lifts clips into defs", () => {
  assert.match(exp, /const defs = collectSvgDefs\(doc\)/);
  assert.match(exp, /defsBlock/);
});

test("campaign PDF walks the same stacked boards", () => {
  assert.match(camp, /export function exportCampaignPdf/);
  assert.match(camp, /export function downloadCampaignPdf/);
  assert.match(camp, /campaignDocsFromIndex/);
  assert.match(camp, /\/Filter \/DCTDecode/);
  assert.match(camp, /one PDF page per board/i);
});
