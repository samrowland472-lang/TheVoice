import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const impl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole header hops to last hole-path y when last y is present and the next hole has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleHeaderToLastHoleY/);
  assert.match(a, /function pickLastHoleLastPointYTabTarget/);
  assert.match(a, /input\[data-path-axis="y"\]/);
  assert.match(a, /data-select-hole/);
  assert.match(barrel, /shouldShiftTabFromNextHoleHeaderToLastHoleY/);
  assert.match(barrel, /pickLastHoleLastPointYTabTarget/);
  assert.match(impl, /shouldShiftTabFromNextHoleHeaderToLastHoleY/);
  assert.match(impl, /pickLastHoleLastPointYTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleHeaderToLastHoleY/);
  assert.match(ui, /pickLastHoleLastPointYTabTarget/);
});

test("next hole header to last hole y holds Points and Holes list scroll after growth", () => {
  assert.match(impl, /focusHold\(lastY, "\[data-point-list\]", from\)/);
  assert.match(impl, /tagHolePointTabCrossing\(from, lastY, lastY\)/);
});
