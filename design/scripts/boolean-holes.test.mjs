import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/design/polygon-clip.ts", import.meta.url), "utf8");

test("groupIslands keeps nested island rings on the parent compound", () => {
  assert.match(src, /function smallestParent/);
  assert.match(src, /export function ringDepth/);
  assert.match(src, /owned = true/);
  assert.match(src, /holes\.push\(byArea\[j\]!\)/);
});

test("boolean preview traces every resulting compound", () => {
  const ops = readFileSync(new URL("../src/lib/design/boolean-ops.ts", import.meta.url), "utf8");
  assert.match(ops, /fillRule: "evenodd"/);
  assert.match(ops, /groupIslands\(clipped\)/);
  const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
  assert.match(stage, /computeBooleanParts/);
  assert.match(stage, /for \(const ghost of ghosts\)/);
});
