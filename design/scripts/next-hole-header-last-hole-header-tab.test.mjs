import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole header hops to previous hole header when both have no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleHeaderToLastHoleHeader/);
  assert.match(a, /function pickLastHoleHeaderFromHeaderTabTarget/);
  assert.match(a, /shouldShiftTabFromNextHoleHeaderToLastHoleY\(from, true\)/);
  assert.match(a, /shouldShiftTabFromNextHoleHeaderToLastHoleX\(from, true\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(barrel, /shouldShiftTabFromNextHoleHeaderToLastHoleHeader/);
  assert.match(barrel, /pickLastHoleHeaderFromHeaderTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleHeaderToLastHoleHeader/);
  assert.match(ui, /pickLastHoleHeaderFromHeaderTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, prevHeader, prevHeader\)/);
  assert.match(comments, /focusPrevHoleHeaderFromHeader/);
  assert.match(comments, /shouldShiftTabFromNextHoleHeaderToLastHoleHeader/);
});

test("next hole header to last hole header holds Holes list scroll after growth", () => {
  assert.match(ui, /focusHold\(prevHeader, "\[data-hole-list\]", from\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-hole-list\]"\)/);
  assert.match(b, /fromHeader && toPoint/);
});
