import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const shape = readFileSync(new URL("../src/lib/design/shape-to-path.ts", import.meta.url), "utf8");
const bools = readFileSync(new URL("../src/lib/design/boolean-ops.ts", import.meta.url), "utf8");

test("canvas traces arrow heads as closed paths using headScale", () => {
  assert.match(render, /function arrowPath/);
  assert.match(render, /n\.headScale \?\? 1/);
  assert.match(render, /case "arrow":/);
  assert.match(shape, /export function arrowPoints/);
  assert.match(shape, /n\.headScale \?\? 1/);
  assert.match(bools, /arrowPoints\(n\.w, n\.h/);
});
