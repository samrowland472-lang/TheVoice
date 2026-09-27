import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const curve = readFileSync(new URL("../src/lib/design/path-curve.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("path-curve bakes rotated cubic handles into world-space points", () => {
  assert.match(curve, /export function rotateHandle/);
  assert.match(curve, /export function bakeRotatedPoints/);
  assert.match(curve, /rotateHandle\(p\.in, rot\)/);
  assert.match(curve, /rotateHandle\(p\.out, rot\)/);
});

test("SVG export uses bakedPathD for paths and convertible shapes", () => {
  assert.match(exp, /bakedPathD\(p, p\.points/);
  assert.match(exp, /bakedPathD\(s, contour\.points/);
  assert.match(exp, /bakeRotatedPoints\(n\.x, n\.y, pts, rot, cx, cy\)/);
});

test("SVG text clip-path stays inside the rotate group", () => {
  assert.match(exp, /Clip-path lives inside the rotate group/);
  assert.match(exp, /rotateWrap\(n, svgTextMarkup/);
});
