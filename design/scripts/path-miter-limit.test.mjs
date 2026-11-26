import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const factory = readFileSync(new URL("../src/lib/design/node-factory.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("miter limit lives on every node and defaults to 4", () => {
  assert.match(types, /miterLimit: number/);
  assert.match(factory, /miterLimit: 4/);
});

test("render and export honour miter limit with cap join dash", () => {
  assert.match(render, /ctx\.miterLimit = Math\.max\(1, n\.miterLimit \?\? 4\)/);
  assert.match(exp, /stroke-miterlimit=/);
  assert.match(exp, /stroke-linejoin=/);
});

test("mixed dashed path pick dashes miter when joins or limits disagree", () => {
  assert.match(inspector, /MixedPathDash/);
  assert.match(mixed, /path miter limit mixed/);
  assert.match(mixed, /updateNodes\(ids, \{ miterLimit:/);
  assert.match(mixed, /mixedJoin \|\| join === "miter"/);
});
