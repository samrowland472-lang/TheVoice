import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("SVG wrap measure scales with optical size", () => {
  assert.match(exp, /opticalWrapScale/);
  assert.match(exp, /canvasFont\(t\.fontFamily\)\?\.opsz/);
  assert.match(exp, /1\.08 - 0\.12 \* tnorm/);
  assert.match(exp, /estimateGlyphWidth\(s, fontSize, opticalScale\)/);
  assert.match(exp, /wrapMeasureForText/);
  assert.match(exp, /OffscreenCanvas/);
  assert.match(exp, /documentFontsReady/);
  assert.match(exp, /applyFontFace\(ctx/);
});

test("baked SVG download is the present and studio export path", () => {
  assert.match(exp, /export function downloadSvg/);
  assert.match(exp, /exportSvg\(doc\)/);
  assert.match(exp, /bakedPathD/);
});
