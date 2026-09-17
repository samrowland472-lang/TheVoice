import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const chips = readFileSync(new URL("../src/components/studio/mixed-shadow-chips.tsx", import.meta.url), "utf8");
const ghost = readFileSync(new URL("../src/lib/design/stroke-ghost.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("stroke ghost carries per-field shadow patches", () => {
  assert.match(ghost, /shadowColor\?: string/);
  assert.match(ghost, /shadowBlur\?: number/);
  assert.match(ghost, /shadowOx\?: number/);
  assert.match(ghost, /shadowOy\?: number/);
  assert.match(ghost, /shadowSpread\?: number/);
  assert.match(ghost, /shadowInset\?: boolean/);
});

test("mixed shadow chips hover a field-only ghost", () => {
  assert.match(chips, /ghostShadow\(\{ shadowColor: color \}\)/);
  assert.match(chips, /ghostShadow\(\{ shadowBlur: blur \}\)/);
  assert.match(chips, /ghostShadow\(\{ shadowSpread: spread \}\)/);
  assert.match(chips, /ghostShadow\(\{ shadowInset: inset \}\)/);
  assert.match(chips, /shadowOx: value/);
  assert.match(chips, /shadowOy: value/);
  assert.match(chips, /onMouseLeave=\{\(\) => ghostShadow\(null\)\}/);
});

test("canvas paints stroke ghosts including shadow patches", () => {
  assert.match(canvas, /drawStrokeGhosts/);
  assert.match(canvas, /strokeGhost/);
  assert.match(ghost, /canvasShadowParams/);
});
