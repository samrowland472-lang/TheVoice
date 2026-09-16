import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dash = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("arrow headScale lives on shape nodes and paints", () => {
  assert.match(types, /headScale\?: number/);
  assert.match(render, /function arrowPath/);
  assert.match(render, /n\.headScale \?\? 1/);
  assert.match(exp, /n\.kind === "arrow"/);
});

test("mixed stroke keeps dash and adds sides / head chips", () => {
  assert.match(dash, /strokeDash/);
  assert.match(dash, /Unify sides/);
  assert.match(dash, /Unify arrowhead/);
  assert.match(dash, /polygon sides mixed/);
  assert.match(dash, /arrow head scale mixed/);
  assert.match(inspector, /MixedPathDash/);
});

test("mixed dash offset and miter chips stamp onto every outline", () => {
  assert.match(dash, /Unify dash offset/);
  assert.match(dash, /Unify miter/);
  assert.match(dash, /strokeDashOffset: off/);
  assert.match(dash, /miterLimit: m/);
});
