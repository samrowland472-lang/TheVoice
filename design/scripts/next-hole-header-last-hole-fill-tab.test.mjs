import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-hole-fill-shift.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Shift+Tab from next empty hole header hops to previous hole fill-rule chip when both holes have no point fields", () => {
  assert.match(a, /function shouldShiftTabFromNextHoleHeaderToLastHoleFill/);
  assert.match(a, /function pickLastHoleFillFromHeaderTabTarget/);
  assert.match(a, /\[data-hole="\$\{h - 1\}"\] \[data-hole-fill\]/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h - 1\)/);
  assert.match(a, /shouldShiftTabFromNextHoleHeaderToLastHoleDelete\(from, true\)\) return false/);
  assert.match(barrel, /shouldShiftTabFromNextHoleHeaderToLastHoleFill/);
  assert.match(barrel, /pickLastHoleFillFromHeaderTabTarget/);
  assert.match(ui, /shouldShiftTabFromNextHoleHeaderToLastHoleFill/);
  assert.match(ui, /pickLastHoleFillFromHeaderTabTarget/);
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, lastFill, lastFill\)/);
  assert.match(ui, /list\.scrollTop = saved/);
  assert.match(comments, /focusPrevHoleFillFromHeader/);
  assert.match(comments, /shouldShiftTabFromNextHoleHeaderToLastHoleFill/);
});

test("next header to last hole fill holds Holes list scroll after growth", () => {
  assert.match(ui, /tagHoleHeaderTabCrossing\(from, lastFill, lastFill\)/);
});
