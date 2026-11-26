import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dash = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const ghost = readFileSync(new URL("../src/lib/design/stroke-ghost.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("stroke ghost carries headScale and skips non-arrows", () => {
  assert.match(ghost, /headScale\?: number/);
  assert.match(ghost, /ghost\.headScale != null && raw\.kind !== "arrow"/);
});

test("head chips and slider paint a canvas ghost", () => {
  assert.match(dash, /setStrokeGhost\(scale == null \? null : \{ headScale: scale \}\)/);
  assert.match(dash, /onMouseEnter=\{\(\) => ghostHead\(h\)\}/);
  assert.match(canvas, /drawStrokeGhosts/);
  assert.match(canvas, /strokeGhost/);
});
