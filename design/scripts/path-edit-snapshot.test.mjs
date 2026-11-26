import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const edit = readFileSync(new URL("../src/lib/design/path-edit.ts", import.meta.url), "utf8");

test("path edit accepts a snapshot base so undo restores points", () => {
  assert.match(edit, /export function snapshotPathNode/);
  assert.match(actions, /base\?: PathNode/);
  assert.match(stage, /orig: snapshotPathNode\(selected\)/);
  assert.match(stage, /editPathHit\(live\.id, live\.hit, local\.x, local\.y, live\.keepSmooth, false, live\.orig\)/);
});
