import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("campaign SVG shares one defs block across boards", () => {
  assert.match(exp, /export function exportCampaignSvg/);
  assert.match(exp, /export function collectSvgDefs/);
  assert.match(exp, /export function downloadCampaignSvg/);
  assert.match(exp, /docs\.map\(\(d, i\) => collectSvgDefs\(d, `p\$\{i\}-`\)\)/);
  assert.match(exp, /<defs>\$\{defs\}<\/defs>/);
  assert.match(exp, /data-page=/);
  assert.match(exp, /CAMPAIGN_GAP/);
});

test("single-board SVG also lifts clips into defs", () => {
  assert.match(exp, /const defs = collectSvgDefs\(doc\)/);
  assert.match(exp, /defsBlock/);
});
