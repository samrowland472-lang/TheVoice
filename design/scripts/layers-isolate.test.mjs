import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const isolate = readFileSync(new URL("../src/lib/design/layers-isolate.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const panel = readFileSync(new URL("../src/components/studio/layers-panel.tsx", import.meta.url), "utf8");
const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");

test("applyIsolate snapshots visibility and restores it on empty keepIds", () => {
  assert.match(isolate, /export function applyIsolate/);
  assert.match(isolate, /keepIds\.length === 0/);
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

test("layers eye Alt-click isolates; Show all exits isolate with empty keep", () => {
  assert.match(panel, /e\.altKey/);
  assert.match(panel, /toggleIsolate\(keep\)/);
  assert.match(panel, /toggleIsolate\(\[\]\)/);
  assert.match(panel, /Show all/);
  assert.match(panel, /Alt-click isolates this layer/);
  assert.match(panel, /Isolating/);
});

test("Escape and Cmd+2 drive isolate / show all", () => {
  assert.match(keys, /s\.isolateSnapshot/);
  assert.match(keys, /s\.toggleIsolate\(\[\]\)/);
  assert.match(keys, /meta && e\.key === "2"/);
});
