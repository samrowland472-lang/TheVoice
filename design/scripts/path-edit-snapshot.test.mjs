import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const edit = readFileSync(new URL("../src/lib/design/path-edit.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const resize = readFileSync(new URL("../src/lib/design/box-resize.ts", import.meta.url), "utf8");

test("path-edit snapshots points and holes, not only the node box", () => {
  assert.match(edit, /export function snapshotPathNode/);
  assert.match(edit, /export function clonePathPoint/);
  assert.match(edit, /points: n\.points\.map\(clonePathPoint\)/);
  assert.match(edit, /holes: n\.holes\?\.map/);
});

test("editPathHit applies from the pointer-down snapshot", () => {
  assert.match(actions, /base\?: PathNode/);
  assert.match(actions, /const n = base \?\? live/);
  assert.match(stage, /base: snapshotPathNode/);
  assert.match(stage, /editPathHit\(live\.id, live\.hit, local\.x, local\.y, live\.keepSmooth, false, live\.base\)/);
});

test("mapNodeToBox scales path points with the box", () => {
  assert.match(resize, /if \(n\.kind === "path"\)/);
  assert.match(resize, /points: n\.points\.map/);
});
