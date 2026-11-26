import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const studio = readFileSync(new URL("../src/components/studio/studio-app.tsx", import.meta.url), "utf8");

test("SVG image and paint use placed <image> with baked matrix, not a rotate group", () => {
  assert.match(exp, /bakedBoxTransform/);
  assert.match(exp, /svgPlacedImage/);
  assert.match(exp, /n\.kind === "image"/);
  assert.match(exp, /n\.kind === "paint"/);
  assert.match(exp, /transform="matrix\(/);
  assert.match(exp, /watchFontsForWrapCache/);
  assert.match(exp, /loadingdone/);
  assert.match(exp, /fonts\.ready\.then/);
});

test("studio resets wrap measure after fonts load", () => {
  assert.match(studio, /watchFontsForWrapCache/);
});
