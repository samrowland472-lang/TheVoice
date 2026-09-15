import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");

test("shape outlines share dash cap join with paths", () => {
  assert.match(inspector, /kind === "ellipse"/);
  assert.match(inspector, /kind === "line"/);
  assert.match(inspector, /MixedPathDash/);
  assert.match(mixed, /nodes: DesignNode/);
  assert.match(render, /ctx\.setLineDash\(dash > 0 \? \[dash, dash\] : \[\]\)/);
  assert.match(render, /ctx\.lineCap = n\.lineCap \?\? "round"/);
  assert.match(exp, /stroke-dasharray=/);
  assert.match(exp, /stroke-linecap=/);
});
