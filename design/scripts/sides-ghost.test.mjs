import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dash = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const ghost = readFileSync(new URL("../src/lib/design/stroke-ghost.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("stroke ghost carries sides and skips non polygons/stars", () => {
  assert.match(ghost, /sides\?: number/);
  assert.match(ghost, /ghost\.sides != null && raw\.kind !== "polygon" && raw\.kind !== "star"/);
});

test("sides chips and slider paint a canvas ghost", () => {
  assert.match(dash, /setStrokeGhost\(count == null \? null : \{ sides: count \}\)/);
  assert.match(dash, /onMouseEnter=\{\(\) => ghostSides\(s\)\}/);
  assert.match(canvas, /drawStrokeGhosts/);
  assert.match(canvas, /strokeGhost/);
});
