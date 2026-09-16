import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const geo = readFileSync(new URL("../src/components/studio/mixed-geometry.tsx", import.meta.url), "utf8");
const ghost = readFileSync(new URL("../src/lib/design/stroke-ghost.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("stroke ghost carries radius and skips non-rectangles", () => {
  assert.match(ghost, /radius\?: number/);
  assert.match(ghost, /ghost\.radius != null && raw\.kind !== "rect"/);
});

test("radius chips and slider paint a canvas ghost", () => {
  assert.match(geo, /setStrokeGhost\(radius == null \? null : \{ radius \}\)/);
  assert.match(geo, /onMouseEnter=\{\(\) => ghostRadius\(n\.radius\)\}/);
  assert.match(canvas, /drawStrokeGhosts/);
  assert.match(canvas, /strokeGhost/);
});
