import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const baked = readFileSync(new URL("../src/lib/design/path-d-baked.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-type.tsx", import.meta.url), "utf8");

test("SVG export bakes ellipse star polygon arrow and rounded rect as path outlines", () => {
  assert.match(exp, /isConvertibleShape/);
  assert.match(exp, /shapeContour/);
  assert.match(exp, /n\.kind !== "rect" \|\| \(n\.radius \?\? 0\) > 0\.5/);
});

test("SVG outlines wrap rotated nodes about the box center", () => {
  assert.match(exp, /svgRotateTransform/);
  assert.match(exp, /rotate\(\$\{rot\} \$\{cx\} \$\{cy\}\)/);
  assert.match(exp, /rotateWrap/);
});

test("SVG path and shape outlines bake rotation into cubic handles", () => {
  assert.match(baked, /export function pathDBaked/);
  assert.match(baked, /bakeRingRotation/);
  assert.match(baked, /pathD\(0, 0, bakeRingRotation/);
});

test("SVG compound path islands sit in a sibling group", () => {
  assert.match(exp, /data-islands="1"/);
});

test("mixed type lists per-layer copy counts when texts differ", () => {
  assert.match(mixed, /CopyMeter/);
  assert.match(mixed, /per-layer copy counts/);
  assert.match(mixed, /mixedCopy/);
});
