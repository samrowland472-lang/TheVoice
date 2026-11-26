import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-x.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from hole fill-rule chip hops to next hole first X when current hole has no point fields", () => {
  assert.match(a, /function shouldTabFromHoleFillToNextFirstX/);
  assert.match(a, /function pickNextHoleFirstPointXFromFillTabTarget/);
  assert.match(a, /closest\("\[data-hole-fill\]"\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /\[data-point\^="hole-\$\{h \+ 1\}-"\]/);
  assert.match(a, /input\[data-path-axis="x"\]/);
  assert.match(a, /shouldTabFromHoleFillToNextHeader\(from, false\)\) return false/);
  assert.match(barrel, /shouldTabFromHoleFillToNextFirstX/);
  assert.match(barrel, /pickNextHoleFirstPointXFromFillTabTarget/);
  assert.match(ui, /shouldTabFromHoleFillToNextFirstX/);
  assert.match(ui, /pickNextHoleFirstPointXFromFillTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, nextX, nextX\)/);
});

test("hole fill-rule to next first X holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\[data-hole-list\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
