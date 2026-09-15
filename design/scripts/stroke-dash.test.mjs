import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const pathImpl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const factory = readFileSync(new URL("../src/lib/design/node-factory.ts", import.meta.url), "utf8");

test("strokeDash lives on every node and defaults to solid", () => {
  assert.match(types, /strokeDash: number/);
  assert.match(factory, /strokeDash: 0/);
});

test("renderer and inspector honour mixed path dash on mixed kinds", () => {
  assert.match(render, /setLineDash/);
  assert.match(inspector, /path stroke dash mixed/);
  assert.match(inspector, /mixedDash/);
  assert.match(inspector, /paths\.map\(\(p\) => p\.id\)/);
  assert.match(inspector, /rects\.map\(\(r\) => r\.id\)/);
  assert.match(pathImpl, /aria-label="path stroke dash"/);
});
