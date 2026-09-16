import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");

test("SVG export paints dash, cap, and join on every outline kind", () => {
  assert.match(exp, /export function svgStrokeStyle/);
  assert.match(exp, /stroke-dasharray=/);
  assert.match(exp, /stroke-dashoffset=/);
  assert.match(exp, /stroke-linecap=/);
  assert.match(exp, /stroke-linejoin=/);
  assert.match(exp, /stroke-miterlimit=/);
  assert.match(exp, /kind === "polygon"/);
  assert.match(exp, /kind === "star"/);
  assert.match(exp, /kind === "arrow"/);
  assert.match(exp, /shapeContour/);
});

test("canvas stroke style matches SVG dash cap join", () => {
  assert.match(render, /export function applyStrokeStyle/);
  assert.match(render, /ctx\.lineCap = n\.lineCap \?\? "round"/);
  assert.match(render, /ctx\.lineJoin = n\.lineJoin \?\? "round"/);
  assert.match(render, /ctx\.setLineDash\(dash > 0 \? \[dash, dash\] : \[\]\)/);
  assert.match(render, /ctx\.lineDashOffset = n\.strokeDashOffset \?\? 0/);
});
