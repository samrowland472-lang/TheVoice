import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const factory = readFileSync(new URL("../src/lib/design/node-factory.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("dash offset lives on every node and defaults to 0", () => {
  assert.match(types, /strokeDashOffset: number/);
  assert.match(factory, /strokeDashOffset: 0/);
});

test("render and export honour width dash offset", () => {
  assert.match(render, /ctx\.lineDashOffset = n\.strokeDashOffset \?\? 0/);
  assert.match(render, /ctx\.setLineDash\(dash > 0 \? \[dash, dash\] : \[\]\)/);
  assert.match(exp, /stroke-dashoffset=/);
  assert.match(exp, /stroke-width=/);
});

test("mixed dashed path pick dashes width and offset when they disagree", () => {
  assert.match(inspector, /MixedPathDash/);
  assert.match(mixed, /path stroke width mixed/);
  assert.match(mixed, /updateNodes\(ids, \{ strokeWidth:/);
  assert.match(mixed, /path dash offset mixed/);
  assert.match(mixed, /updateNodes\(ids, \{ strokeDashOffset:/);
});
