import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const present = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

test("SVG wrap measure scales with optical size", () => {
  assert.match(exp, /opticalWrapScale/);
  assert.match(exp, /canvasFont\(t\.fontFamily\)\?\.opsz/);
  assert.match(exp, /1\.08 - 0\.12 \* tnorm/);
  assert.match(exp, /estimateGlyphWidth\(s, fontSize, opticalScale\)/);
  assert.match(exp, /const opszScale = opticalWrapScale\(t\)/);
});

test("present mode exports baked SVG", () => {
  assert.match(present, /downloadSvg/);
  assert.match(present, /downloadSvg\(live\)/);
  assert.match(present, /Export baked SVG/);
});
