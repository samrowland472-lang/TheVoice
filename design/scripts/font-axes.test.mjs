import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("font helpers describe Fraunces opsz and Instrument width", () => {
  const fonts = readFileSync(new URL("../src/lib/design/fonts.ts", import.meta.url), "utf8");
  assert.match(fonts, /opsz/);
  assert.match(fonts, /wdth/);
  assert.match(fonts, /variationSettings/);
  assert.match(fonts, /applyFontFace/);
  assert.match(fonts, /faceSupports/);
  assert.match(fonts, /Fraunces/);
  assert.match(fonts, /Instrument Sans/);
});

test("render export and types carry variation axes", () => {
  const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
  const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
  const exported = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
  assert.match(types, /opticalSize\?: number/);
  assert.match(types, /fontWidth\?: number/);
  assert.match(render, /applyFontFace/);
  assert.match(exported, /font-variation-settings/);
});
