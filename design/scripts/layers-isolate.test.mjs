import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const isolate = readFileSync(new URL("../src/lib/design/layers-isolate.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const panel = readFileSync(new URL("../src/components/studio/layers-panel.tsx", import.meta.url), "utf8");

test("applyIsolate snapshots visibility and restores it on empty keepIds", () => {
  assert.match(isolate, /export function applyIsolate/);
  assert.match(isolate, /keepIds\.length === 0/);
  assert.match(isolate, /askingShowAll/);
  assert.match(isolate, /snapshot\[n\.id\] \?\? n\.visible/);
  assert.match(isolate, /visible: keep\.has\(n\.id\)/);
  assert.match(isolate, /sameSet\(keepIds, visibleIds\(nodes\)\)/);
  assert.match(isolate, /restoreFromSnapshot/);
});

test("store toggleIsolate writes isolateSnapshot through applyIsolate", () => {
  assert.match(store, /isolateSnapshot: null as Record<string, boolean> \| null/);
  assert.match(store, /toggleIsolate: \(keepIds: string\[\]\)/);
  assert.match(store, /applyIsolate\(doc\.nodes, keepIds, isolateSnapshot\)/);
});

test("layers eye Alt-click isolates; Show all exits isolate", () => {
  assert.match(panel, /e\.altKey/);
  assert.match(panel, /toggleIsolate\(keep\)/);
  assert.match(panel, /Show all/);
  assert.match(panel, /Alt-click isolates this layer/);
});

test("applyLockOthers maps locked as inverted isolate visibility", () => {
  assert.match(isolate, /export function applyLockOthers/);
  assert.match(isolate, /visible: !n\.locked/);
  assert.match(isolate, /lockSnapshot: next\.isolateSnapshot/);
  assert.match(isolate, /locked: !\(unlocked\.get\(n\.id\)/);
});

test("store toggleLockOthers writes lockSnapshot through applyLockOthers", () => {
  assert.match(store, /lockSnapshot: null as Record<string, boolean> \| null/);
  assert.match(store, /toggleLockOthers: \(keepIds: string\[\]\)/);
  assert.match(store, /applyLockOthers\(doc\.nodes, keepIds, lockSnapshot\)/);
});

test("layers lock Alt-click locks others; Unlock all restores", () => {
  assert.match(panel, /toggleLockOthers\(keep\)/);
  assert.match(panel, /Unlock all/);
  assert.match(panel, /Alt-click locks every other layer/);
});
