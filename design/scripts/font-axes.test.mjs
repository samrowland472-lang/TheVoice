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

test("export and outline honor opsz / wdth like the board", () => {
  const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
  const outline = readFileSync(new URL("../src/lib/design/text-to-path.ts", import.meta.url), "utf8");
  const exported = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
  assert.match(render, /applyFontFace/);
  assert.match(outline, /applyFontFace/);
  assert.match(exported, /variationSettings/);
  assert.match(exported, /font-variation-settings/);
});
