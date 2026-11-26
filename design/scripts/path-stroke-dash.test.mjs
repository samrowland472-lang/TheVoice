import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const pathImpl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");

test("path stroke dash lives on the node and paints with setLineDash", () => {
  assert.match(types, /strokeDash/);
  assert.match(render, /ctx\.setLineDash\(dash > 0 \? \[dash, dash\] : \[\]\)/);
  assert.match(exp, /stroke-dasharray=/);
});

test("mixed kinds expose path dash and mixed radius chips", () => {
  assert.match(inspector, /MixedPathDash/);
  assert.match(inspector, /mixedKindsGeom/);
  assert.match(inspector, /Unify radius with/);
  assert.match(mixed, /path stroke dash mixed/);
  assert.match(pathImpl, /hideDash/);
});
