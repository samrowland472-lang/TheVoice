import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const wind = readFileSync(new URL("../src/lib/design/winding-pass.ts", import.meta.url), "utf8");
const ops = readFileSync(new URL("../src/lib/design/boolean-ops.ts", import.meta.url), "utf8");
const clip = readFileSync(new URL("../src/lib/design/polygon-clip.ts", import.meta.url), "utf8");

test("figure-eight traces run a winding pass before clip", () => {
  assert.match(wind, /function extractWindingLobes/);
  assert.match(wind, /Winding pass/);
  assert.match(wind, /export function splitSelfOverlapping/);
  assert.match(ops, /splitFigureEight/);
  assert.match(ops, /flatMap\(splitFigureEight\)/);
  assert.match(clip, /flatMap\(splitSelfOverlapping\)/);
});
