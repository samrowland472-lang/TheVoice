import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const edit = readFileSync(new URL("../src/lib/design/path-edit.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");
const pathUi = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");

test("artboard hit picks a hole body, not only anchors", () => {
  assert.match(edit, /pointInRing\(local, ring\)/);
  assert.match(edit, /return \{ index: 0, arm: "anchor", hole: h \}/);
});

test("selectPathHole and inspector hole rows share the hit", () => {
  assert.match(actions, /export function selectPathHole/);
  assert.match(pathUi, /selectPathHole\(h\)/);
  assert.match(pathUi, /activeHole \? "border-phosphor\/60 bg-phosphor\/10"/);
  assert.match(pathUi, /data-hole=\{h\}/);
});
