import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-delete.ts", import.meta.url), "utf8");
const fill = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-shift.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next empty hole header hops to previous hole delete when both holes have no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleHeaderToLastHoleDelete/);
  assert.match(a, /function pickLastHoleDeleteFromHeaderTabTarget/);
  assert.match(a, /closest\("\[data-select-hole\]"\)/);
  assert.match(a, /\[data-hole="\$\{h - 1\}"\] \[data-delete-hole\]/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(fill, /shouldShiftTabFromNextHoleHeaderToLastHoleDelete\(from, true\)\) return false/);
  assert.match(barrel, /shouldShiftTabFromNextHoleHeaderToLastHoleDelete/);
  assert.match(barrel, /pickLastHoleDeleteFromHeaderTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleHeaderToLastHoleDelete/);
  assert.match(ui, /pickLastHoleDeleteFromHeaderTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, lastDelete, lastDelete\)/);
  assert.match(comments, /focusPrevHoleDeleteFromHeader/);
  assert.match(comments, /shouldShiftTabFromNextHoleHeaderToLastHoleDelete/);
});

test("next header to last hole delete holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\[data-hole-list\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
