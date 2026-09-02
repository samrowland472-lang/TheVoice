import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/design/polygon-clip.ts", import.meta.url), "utf8");

test("figure-eight traces run a winding pass before clip", () => {
  assert.match(src, /function extractWindingLobes/);
  assert.match(src, /Winding pass/);
  assert.match(src, /export function splitSelfOverlapping/);
  assert.match(src, /flatMap\(splitSelfOverlapping\)/);
});

test("clipTwo planarizes each operand before half-edge keep", () => {
  assert.match(src, /const A0 = aRings.flatMap\(splitSelfOverlapping\)/);
  assert.match(src, /const B0 = bRings.flatMap\(splitSelfOverlapping\)/);
});
