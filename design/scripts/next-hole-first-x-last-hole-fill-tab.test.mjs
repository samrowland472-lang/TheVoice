import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-x.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next hole first X hops to previous hole fill when previous hole has no point fields and current still has points", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleFirstXToLastHoleFill/);
  assert.match(a, /function pickLastHoleFillFromFirstXTabTarget/);
  assert.match(a, /closest\("\[data-point\]"\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)\) return false/);
  assert.match(a, /\[data-hole="\$\{h - 1\}"\] \[data-hole-fill\]/);
  assert.match(a, /axis !== "x"/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstXToLastHoleY\(from, true\)\) return false/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstXToLastHoleX\(from, true\)\) return false/);
  assert.match(a, /shouldShiftTabFromNextHoleFirstXToLastHoleHeader\(from, true\)\) return false/);
  assert.match(a, /shouldShiftTabFromNextHoleHeaderToLastHoleFill\(from, true\)\) return false/);
  assert.match(barrel, /shouldShiftTabFromNextHoleFirstXToLastHoleFill/);
  assert.match(barrel, /pickLastHoleFillFromFirstXTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleFirstXToLastHoleFill/);
  assert.match(ui, /pickLastHoleFillFromFirstXTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, lastFill, lastFill\)/);
});

test("next hole first X to last hole fill holds Holes list scroll after growth", () => {
  assert.match(ui, /closest\("\[data-hole-list\]"\)/);
  assert.match(ui, /list\.scrollTop = saved/);
});
