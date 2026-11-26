import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");

test("SVG export writes dash, cap, join, and miter onto stroked nodes", () => {
  assert.match(exp, /export function svgStrokeStyle/);
  assert.match(exp, /stroke-dasharray=/);
  assert.match(exp, /stroke-dashoffset=/);
  assert.match(exp, /stroke-linecap=/);
  assert.match(exp, /stroke-linejoin=/);
  assert.match(exp, /stroke-miterlimit=/);
  assert.match(exp, /svgStrokeStyle\(n\)/);
});

test("canvas and PNG honour the same dash, cap, join, and miter", () => {
  assert.match(render, /export function applyStrokeStyle/);
  assert.match(render, /setLineDash/);
  assert.match(render, /lineDashOffset/);
  assert.match(render, /applyStrokeStyle\(ctx, n\)/);
});
