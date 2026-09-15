import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const factory = readFileSync(new URL("../src/lib/design/node-factory.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-path-dash.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("line cap and join live on every node", () => {
  assert.match(types, /lineCap: CanvasLineCap/);
  assert.match(types, /lineJoin: CanvasLineJoin/);
  assert.match(factory, /lineCap: "round"/);
  assert.match(factory, /lineJoin: "round"/);
});

test("render and export honour cap, join, and dash", () => {
  assert.match(render, /ctx\.lineCap = n\.lineCap \?\? "round"/);
  assert.match(render, /ctx\.lineJoin = n\.lineJoin \?\? "round"/);
  assert.match(render, /ctx\.setLineDash\(dash > 0 \? \[dash, dash\] : \[\]\)/);
  assert.match(exp, /stroke-dasharray=/);
  assert.match(exp, /stroke-linecap=/);
  assert.match(exp, /stroke-linejoin=/);
});

test("mixed kind pick writes cap and join onto path ids only", () => {
  assert.match(inspector, /MixedPathDash/);
  assert.match(inspector, /paths\.map\(\(p\) => p\.id\)/);
  assert.match(mixed, /path line cap mixed/);
  assert.match(mixed, /path line join mixed/);
  assert.match(mixed, /updateNodes\(ids, \{ lineCap:/);
  assert.match(mixed, /updateNodes\(ids, \{ lineJoin:/);
});
