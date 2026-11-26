import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const shadow = readFileSync(new URL("../src/lib/design/shadow.ts", import.meta.url), "utf8");
const crop = readFileSync(new URL("../src/lib/design/selection-document.ts", import.meta.url), "utf8");

test("shadowCropExtents pads drop shadow halo and offset", () => {
  assert.match(shadow, /export function shadowCropExtents/);
  assert.match(shadow, /shadowInset/);
  assert.match(shadow, /canvasShadowParams/);
  assert.match(shadow, /halo \+ Math\.max\(0, -p\.ox\)/);
  assert.match(shadow, /halo \+ Math\.max\(0, p\.oy\)/);
});

test("cropSelectionDocument uses shadow extents plus base pad", () => {
  assert.match(crop, /shadowCropExtents/);
  assert.match(crop, /halo\.left/);
  assert.match(crop, /halo\.bottom/);
  assert.match(crop, /padL \+ padR/);
});
