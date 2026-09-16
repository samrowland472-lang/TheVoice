import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dash = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const chips = readFileSync(new URL("../src/lib/design/geometry-chips.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("offset and miter chips stamp one outline onto the mixed pick", () => {
  assert.match(chips, /export function dashOffsetChipLabel/);
  assert.match(chips, /export function miterChipLabel/);
  assert.match(dash, /Unify dash offset/);
  assert.match(dash, /Unify miter/);
  assert.match(dash, /strokeDashOffset: n\.strokeDashOffset/);
  assert.match(dash, /miterLimit: n\.miterLimit/);
  assert.match(inspector, /MixedPathDash nodes=\{outlines\}/);
});
