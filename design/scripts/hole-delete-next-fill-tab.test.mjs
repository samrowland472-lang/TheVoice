import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-delete.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from hole delete hops to next hole fill-rule chip when the current hole has no point fields", () => {
  assert.match(a, /function shouldTabFromHoleDeleteToNextFill/);
  assert.match(a, /function pickNextHoleFillFromDeleteTabTarget/);
  assert.match(a, /closest\("\[data-delete-hole\]"\)/);
  assert.match(a, /\[data-hole="\$\{h \+ 1\}"\] \[data-hole-fill\]/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /shouldTabFromHoleDeleteToNextHeader\(from, false\)\) return false/);
  assert.match(barrel, /shouldTabFromHoleDeleteToNextFill/);
  assert.match(barrel, /pickNextHoleFillFromDeleteTabTarget/);
  assert.match(ui, /shouldTabFromHoleDeleteToNextFill/);
  assert.match(ui, /pickNextHoleFillFromDeleteTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextFill, nextFill\)/);
  assert.match(comments, /focusNextHoleFillFromDelete/);
  assert.match(comments, /shouldTabFromHoleDeleteToNextFill/);
});

test("hole delete to next fill holds Holes list scroll after growth", () => {
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextFill, nextFill\)/);
  assert.match(ui, /closest\("\[data-hole-list\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
