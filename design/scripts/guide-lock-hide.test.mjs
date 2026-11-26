import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const select = readFileSync(new URL("../src/lib/design/guide-select.ts", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");

test("guide type carries lock and hide", () => {
  assert.match(types, /locked\?: boolean/);
  assert.match(types, /hidden\?: boolean/);
});

test("store patches lock/hide and refuses to move locked", () => {
  assert.match(store, /patchGuide:/);
  assert.match(store, /g\.id === id && !g\.locked/);
  assert.match(store, /target\?\.locked/);
  assert.match(store, /g\.locked \|\| !drop\.has/);
});

test("nudge skips locked and hidden", () => {
  assert.match(select, /g\.locked \|\| g\.hidden/);
});

test("canvas skips hidden and marks lock", () => {
  assert.match(rulers, /if \(g\.hidden\) continue/);
  assert.match(rulers, /g\.locked/);
  assert.match(rulers, /selectedIds/);
});

test("inspector exposes lock and hide", () => {
  assert.match(inspector, /lock guide/);
  assert.match(inspector, /hide guide/);
  assert.match(inspector, /patchGuide\(g\.id, \{ locked/);
  assert.match(inspector, /patchGuide\(g\.id, \{ hidden/);
});
