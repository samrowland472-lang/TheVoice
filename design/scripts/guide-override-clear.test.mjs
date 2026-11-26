import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");

test("active color/dash chip clears the override", () => {
  assert.match(inspector, /clear guide color/);
  assert.match(inspector, /clear guide dash/);
  assert.match(inspector, /patchGuide\?\.\(g\.id, \{ color: undefined \}\)/);
  assert.match(inspector, /patchGuide\?\.\(g\.id, \{ dash: undefined \}\)/);
});

test("patchGuide drops undefined keys", () => {
  assert.match(store, /if \(v === undefined\) delete next\[k\]/);
});
