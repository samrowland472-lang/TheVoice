import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-y.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from hole fill-rule chip hops to next hole first Y when current hole has no point fields and next first X is missing", () => {
  assert.match(a, /function shouldTabFromHoleFillToNextFirstY/);
  assert.match(a, /function pickNextHoleFirstPointYFromFillTabTarget/);
  assert.match(a, /closest\("\\[data-hole-fill\\]"\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /\[data-point\^="hole-\$\{h \+ 1\}-"\]/);
  assert.match(a, /input\[data-path-axis="y"\]/);
  assert.match(a, /shouldTabFromHoleFillToNextHeader\(from, false\)\) return false/);
  assert.match(a, /shouldTabFromHoleFillToNextFirstX\(from, false\)\) return false/);
  assert.match(a, /input\[data-path-axis="x"\]/);
  assert.match(barrel, /shouldTabFromHoleFillToNextFirstY/);
  assert.match(barrel, /pickNextHoleFirstPointYFromFillTabTarget/);
  assert.match(ui, /shouldTabFromHoleFillToNextFirstY/);
  assert.match(ui, /pickNextHoleFirstPointYFromFillTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextY, nextY\)/);
});

test("hole fill-rule to next first Y holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\\[data-hole-list\\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
