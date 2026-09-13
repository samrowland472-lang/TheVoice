import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-y.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole first Y hops to previous hole fill when previous hole has no point fields, current has points, and first X is missing", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleFirstYToLastHoleFill/);
  assert.match(a, /function pickLastHoleFillFromFirstYTabTarget/);
  assert.match(a, /closest\("\\[data-point\\]"\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)\) return false/);
  assert.match(a, /\[data-hole="\$\{h - 1\}"\] \[data-hole-fill\]/);
  assert.match(a, /input\[data-path-axis="x"\]/);
  assert.match(a, /axis !== "y"/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstYToLastHoleY\(from, true\)\) return false/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstYToLastHoleX\(from, true\)\) return false/);
  assert.match(a, /shouldShiftTabFromNextHoleHeaderToLastHoleFill\(from, true\)\) return false/);
  assert.match(barrel, /shouldShiftTabFromNextHoleFirstYToLastHoleFill/);
  assert.match(barrel, /pickLastHoleFillFromFirstYTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleFirstYToLastHoleFill/);
  assert.match(ui, /pickLastHoleFillFromFirstYTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, lastFill, lastFill\)/);
});

test("next hole first Y to last hole fill holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\\[data-hole-list\\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
