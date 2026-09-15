import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("mixed-kind outlines share offset and miter sliders", () => {
  assert.match(inspector, /kind === "ellipse"/);
  assert.match(inspector, /kind === "line"/);
  assert.match(inspector, /MixedPathDash nodes=\{outlines\}/);
  assert.match(mixed, /path dash offset mixed/);
  assert.match(mixed, /path miter limit mixed/);
  assert.match(mixed, /updateNodes\(ids, \{ strokeDashOffset:/);
  assert.match(mixed, /updateNodes\(ids, \{ miterLimit:/);
  assert.match(render, /ctx\.lineDashOffset = n\.strokeDashOffset \?\? 0/);
  assert.match(render, /ctx\.miterLimit = Math\.max\(1, n\.miterLimit \?\? 4\)/);
  assert.match(exp, /stroke-dashoffset=/);
  assert.match(exp, /stroke-miterlimit=/);
});
