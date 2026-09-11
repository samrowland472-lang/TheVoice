import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-last-y.ts", import.meta.url), "utf8");
const impl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from first hole header hops to last outer-path x when last y is missing and hole 0 has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromFirstHoleHeaderToLastOuterX/);
  assert.match(a, /shouldShiftTabFromFirstHoleHeaderToLastOuterY\(from, shift\)\) return false/);
  assert.match(a, /data-select-hole/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(barrel, /shouldShiftTabFromFirstHoleHeaderToLastOuterX/);
  assert.match(impl, /shouldShiftTabFromFirstHoleHeaderToLastOuterX/);
  assert.match(impl, /pickLastOuterLastPointXTabTarget/);
  assert.match(ui, /shouldShiftTabFromFirstHoleHeaderToLastOuterX/);
});

test("first hole header to last outer x holds Points and Holes list scroll after growth", () => {
  assert.match(impl, /focusHold\(lastX, "\[data-point-list\]", from\)/);
  assert.match(impl, /tagHolePointTabCrossing\(from, lastX, lastX\)/);
});
