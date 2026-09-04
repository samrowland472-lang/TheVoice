import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("font helpers describe Fraunces opsz and Instrument width", () => {
  const fonts = readFileSync(new URL("../src/lib/design/fonts.ts", import.meta.url), "utf8");
  assert.match(fonts, /opsz/);
  assert.match(fonts, /wdth/);
  assert.match(fonts, /variationSettings/);
  assert.match(fonts, /applyFontFace/);
  assert.match(fonts, /faceAxis/);
  assert.match(fonts, /anyFaceHasAxis/);
  assert.match(fonts, /Fraunces/);
  assert.match(fonts, /Instrument Sans/);
});
