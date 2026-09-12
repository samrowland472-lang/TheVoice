import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-next-header-x.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");

test("Tab from last hole header hops to next hole first-point x when last hole has no point fields", () => {
  assert.match(a, /function shouldTabFromLastHoleHeaderToNextFirstX/);
  assert.match(a, /function pickNextHoleFirstPointXFromHeaderTabTarget/);
  assert.match(a, /holeHeaderHasNoPointFields\(inspector, h\)/);
  assert.match(a, /data-point\^="hole-\$\{h \+ 1\}-"/);
  assert.match(a, /data-path-axis="x"/);
  assert.match(barrel, /shouldTabFromLastHoleHeaderToNextFirstX/);
  assert.match(barrel, /pickNextHoleFirstPointXFromHeaderTabTarget/);
  assert.match(ui, /shouldTabFromLastHoleHeaderToNextFirstX/);
  assert.match(ui, /pickNextHoleFirstPointXFromHeaderTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, nextX, nextX\)/);
  assert.match(comments, /shouldTabFromLastHoleHeaderToNextFirstX/);
});

test("last hole header to next first x holds Points and Holes list scroll after growth", () => {
  assert.match(ui, /focusHold\(nextX, "\[data-point-list\]", from\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-hole-list\]"\)/);
  assert.match(ui, /snapshotList\(from, el, "\[data-point-list\]"\)/);
  assert.match(b, /fromHeader && toPoint/);
});
