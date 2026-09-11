import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const hop = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const impl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole header hops to last hole-path x when last y is missing and the next hole has no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleHeaderToLastHoleX/);
  assert.match(a, /function pickLastHoleLastPointXTabTarget/);
  assert.match(a, /input\[data-path-axis="y"\]/);
  assert.match(a, /input\[data-path-axis="x"\]/);
  assert.match(a, /data-select-hole/);
  assert.match(hop, /function shouldTabFromLastHoleXToNextHeader/);
  assert.match(barrel, /shouldShiftTabFromNextHoleHeaderToLastHoleX/);
  assert.match(barrel, /pickLastHoleLastPointXTabTarget/);
  assert.match(impl, /shouldShiftTabFromNextHoleHeaderToLastHoleX/);
  assert.match(impl, /pickLastHoleLastPointXTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleHeaderToLastHoleX/);
  assert.match(ui, /pickLastHoleLastPointXTabTarget/);
});

test("next hole header to last hole x holds Points and Holes list scroll after growth", () => {
  assert.match(impl, /focusHold\(lastX, "\[data-point-list\]", from\)/);
  assert.match(impl, /tagHolePointTabCrossing\(from, lastX, lastX\)/);
});
