import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last hole header hops to next hole header when both have no point fields", () => {
  assert.match(a, /function shouldTabFromLastHoleHeaderToNextHeader/);
  assert.match(a, /function pickNextHoleHeaderFromHeaderTabTarget/);
  assert.match(a, /shouldTabFromLastHoleHeaderToNextFirstX\(from, false\)/);
  assert.match(a, /shouldTabFromLastHoleHeaderToNextFirstY\(from, false\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h \+ 1\)/);
  assert.match(barrel, /shouldTabFromLastHoleHeaderToNextHeader/);
  assert.match(barrel, /pickNextHoleHeaderFromHeaderTabTarget/);
  assert.match(ui, /shouldTabFromLastHoleHeaderToNextHeader/);
  assert.match(ui, /pickNextHoleHeaderFromHeaderTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextHeader, nextHeader\)/);
  assert.match(comments, /focusNextHoleHeaderFromHeader/);
  assert.match(comments, /shouldTabFromLastHoleHeaderToNextHeader/);
});

test("last hole header to next header holds Holes list scroll after growth", () => {
  assert.match(ui, /focusHold\(nextHeader, "\[data-hole-list\]", from\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-hole-list\]"\)/);
  assert.match(b, /fromHeader && toPoint/);
});
