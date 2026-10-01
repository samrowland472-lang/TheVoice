import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const top = readFileSync(new URL("../src/components/studio/top-bar.tsx", import.meta.url), "utf8");

test("raster path hoists a hidden group without painting a box", () => {
  assert.match(render, /export function paintHiddenGroupHoist/);
  assert.match(render, /no group box/);
  assert.match(render, /if \(!n\.visible\) \{\s*paintHiddenGroupHoist/);
  assert.match(render, /paintGroupNest\(ctx, n, paint\)/);
});

test("hidden group opacity and blend ride the canvas nest", () => {
  assert.match(render, /export function paintGroupNest/);
  assert.match(render, /ctx\.globalAlpha \*= n\.opacity/);
  assert.match(render, /ctx\.globalCompositeOperation = n\.blend/);
  assert.match(render, /isolates the nest/);
  assert.match(render, /paintForest/);
  assert.match(inspector, /board, PNG, and SVG/);
  assert.match(inspector, /still wrap that nest/);
  assert.match(top, /hidden nest keeps opacity on PNG/);
});
