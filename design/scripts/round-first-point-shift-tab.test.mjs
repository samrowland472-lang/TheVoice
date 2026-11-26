import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const tab = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first outer-path x targets Round", () => {
  assert.match(a, /shouldShiftTabFromFirstOuterToRound/);
  assert.match(a, /pickRoundTabTarget/);
  assert.match(a, /path-0/);
  assert.match(a, /data-path-exit="Round"/);
  assert.match(a, /data-path-exit="Closed"/);
  assert.match(a, /data-path-exit="Offset"/);
  assert.match(a, /data-path-exit="Outline"/);
  assert.match(tab, /shouldShiftTabFromFirstOuterToRound/);
  assert.match(tab, /pickRoundTabTarget/);
  assert.match(ui, /shouldShiftTabFromFirstOuterToRound/);
  assert.match(ui, /pickRoundTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(e\.currentTarget, round, round\)/);
  assert.match(ui, /scrollTop = saved/);
});

test("point-to-exit Shift+Tab is a hole-point crossing so the list keeps scroll", () => {
  assert.match(b, /fromPoint && toExit/);
  assert.match(b, /data-path-exit/);
});
