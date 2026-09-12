import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from hole fill-rule chip hops to next empty hole header when current hole has no point fields", () => {
  assert.match(a, /function shouldTabFromHoleFillToNextHeader/);
  assert.match(a, /function pickNextHoleHeaderFromFillTabTarget/);
  assert.match(a, /closest\("\[data-hole-fill\]"\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h \+ 1\)/);
  assert.match(barrel, /shouldTabFromHoleFillToNextHeader/);
  assert.match(barrel, /pickNextHoleHeaderFromFillTabTarget/);
  assert.match(ui, /shouldTabFromHoleFillToNextHeader/);
  assert.match(ui, /pickNextHoleHeaderFromFillTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextHeader, nextHeader\)/);
  assert.match(comments, /focusNextHoleHeaderFromFill/);
  assert.match(comments, /shouldTabFromHoleFillToNextHeader/);
});

test("hole fill-rule to next header holds Holes list scroll after growth", () => {
  assert.match(ui, /focusHold\(nextHeader, "\[data-hole-list\]", from\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-hole-list\]"\)/);
  assert.match(b, /fromHeader && toPoint/);
});
