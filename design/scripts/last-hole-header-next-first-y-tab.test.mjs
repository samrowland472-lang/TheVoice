import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last hole header hops to next hole first-point y when last hole has no point fields and next first x is missing", () => {
  assert.match(a, /function shouldTabFromLastHoleHeaderToNextFirstY/);
  assert.match(a, /function pickNextHoleFirstPointYFromHeaderTabTarget/);
  assert.match(a, /shouldTabFromLastHoleHeaderToNextFirstX\(from, false\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /data-path-axis="y"/);
  assert.match(barrel, /shouldTabFromLastHoleHeaderToNextFirstY/);
  assert.match(barrel, /pickNextHoleFirstPointYFromHeaderTabTarget/);
  assert.match(ui, /shouldTabFromLastHoleHeaderToNextFirstY/);
  assert.match(ui, /pickNextHoleFirstPointYFromHeaderTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, nextY, nextY\)/);
  assert.match(comments, /focusNextHoleFirstYFromHeader/);
  assert.match(comments, /shouldTabFromLastHoleHeaderToNextFirstY/);
});

test("last hole header to next first y holds Points and Holes list scroll after growth", () => {
  assert.match(ui, /focusHold\(nextY, "\[data-point-list\]", from\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-hole-list\]"\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-point-list\]"\)/);
  assert.match(b, /fromHeader && toPoint/);
});
