import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const transform = readFileSync(new URL("../src/lib/design/group-transform.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("selectionLabelScreen sits above the group box in screen space", () => {
  assert.match(transform, /export function selectionLabelScreen/);
  assert.match(transform, /viewport\.x \+ box\.x \* z/);
  assert.match(transform, /viewport\.y \+ box\.y \* z - 26/);
});

test("canvas group chip double-click commits a name through updateNodes", () => {
  assert.match(stage, /selectionLabelScreen/);
  assert.match(stage, /Double-click to rename/);
  assert.match(stage, /updateNodes\(\[renameId\], \{ name: next \}, true\)/);
  assert.match(stage, /aria-label="Group name"/);
});
