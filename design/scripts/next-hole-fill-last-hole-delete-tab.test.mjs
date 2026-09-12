import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-shift.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole fill-rule hops to previous hole delete when previous hole has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleFillToLastHoleDelete/);
  assert.match(a, /function pickLastHoleDeleteFromFillTabTarget/);
  assert.match(a, /closest\("\[data-hole-fill\]"\)/);
  assert.match(a, /\[data-hole="\$\{h - 1\}"\] \[data-delete-hole\]/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(a, /shouldShiftTabFromNextHoleHeaderToLastHoleDelete\(from, true\)\) return false/);
  assert.match(barrel, /shouldShiftTabFromNextHoleFillToLastHoleDelete/);
  assert.match(barrel, /pickLastHoleDeleteFromFillTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleFillToLastHoleDelete/);
  assert.match(ui, /pickLastHoleDeleteFromFillTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, lastDelete, lastDelete\)/);
  assert.match(comments, /focusPrevHoleDeleteFromFill/);
  assert.match(comments, /shouldShiftTabFromNextHoleFillToLastHoleDelete/);
});

test("next fill to last hole delete holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\[data-hole-list\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
