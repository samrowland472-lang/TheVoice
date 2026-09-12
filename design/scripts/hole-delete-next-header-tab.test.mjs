import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-delete.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const impl = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from hole delete hops to next empty hole header when both holes have no point fields", () => {
  assert.match(a, /function shouldTabFromHoleDeleteToNextHeader/);
  assert.match(a, /function pickNextHoleHeaderFromDeleteTabTarget/);
  assert.match(a, /closest\("\[data-delete-hole\]"\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h \+ 1\)/);
  assert.match(barrel, /shouldTabFromHoleDeleteToNextHeader/);
  assert.match(barrel, /pickNextHoleHeaderFromDeleteTabTarget/);
  assert.match(ui, /shouldTabFromHoleFillToNextHeader/);
  assert.match(ui, /shouldTabFromHoleDeleteToNextHeader/);
  assert.match(ui, /pickNextHoleHeaderFromDeleteTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextHeader, nextHeader\)/);
  assert.match(impl, /shouldTabFromHoleDeleteToNextHeader/);
  assert.match(impl, /pickNextHoleHeaderFromDeleteTabTarget/);
  assert.match(impl, /focusHold\(nextHeader, "\[data-hole-list\]", from\)/);
  assert.match(comments, /focusNextHoleHeaderFromDelete/);
  assert.match(comments, /shouldTabFromHoleDeleteToNextHeader/);
});

test("hole delete to next header holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\[data-hole-list\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
  assert.match(impl, /focusHold\(nextHeader, "\[data-hole-list\]", from\)/);
});
