import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("geometry bakes anchors and cubic handle offsets under rotation", () => {
  const geo = readFileSync(new URL("../src/lib/design/geometry.ts", import.meta.url), "utf8");
  assert.match(geo, /export function rotateOffset/);
  assert.match(geo, /export function bakeRingRotation/);
  assert.match(geo, /rotateOffset\(p\.in, deg\)/);
  assert.match(geo, /rotateOffset\(p\.out, deg\)/);
});

test("pathDBaked writes world-space cubics after rotate", () => {
  const baked = readFileSync(new URL("../src/lib/design/path-d-baked.ts", import.meta.url), "utf8");
  assert.match(baked, /export function pathDBaked/);
  assert.match(baked, /bakeRingRotation\(n\.x, n\.y, pts/);
});

test("SVG text clip lives inside the rotate group", () => {
  const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
  assert.match(exp, /rotateWrap\(n, svgTextMarkup/);
  assert.match(exp, /svgTextBoxClip/);
  assert.match(exp, /clip-path="url\(#\$\{svgTextClipId/);
});
