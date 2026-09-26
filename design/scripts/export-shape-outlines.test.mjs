import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-type.tsx", import.meta.url), "utf8");

test("SVG export bakes ellipse star polygon arrow and rounded rect as path outlines", () => {
  assert.match(exp, /isConvertibleShape/);
  assert.match(exp, /shapeContour/);
  assert.match(exp, /pathD\(s\.x, s\.y, contour\.points, contour\.closed\)/);
  assert.match(exp, /n\.kind !== "rect" \|\| \(n\.radius \?\? 0\) > 0\.5/);
});

test("SVG outline paths wrap rotation around node center", () => {
  assert.match(exp, /svgRotateWrap/);
  assert.match(exp, /nodeCenter/);
  assert.match(exp, /transform="rotate\(\$\{deg\} \$\{c\.x\} \$\{c\.y\}\)"/);
});

test("mixed type lists per-layer copy counts when texts differ", () => {
  assert.match(mixed, /CopyMeter/);
  assert.match(mixed, /per-layer copy counts/);
  assert.match(mixed, /mixedCopy/);
});
