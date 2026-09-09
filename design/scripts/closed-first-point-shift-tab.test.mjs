import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const tab = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const row = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Shift+Tab from first outer-path x targets Closed when Offset and Outline are absent", () => {
  assert.match(a, /shouldShiftTabFromFirstOuterToClosed/);
  assert.match(a, /pickClosedTabTarget/);
  assert.match(a, /path-0/);
  assert.match(a, /data-path-exit="Closed"/);
  assert.match(a, /data-path-exit="Offset"/);
  assert.match(a, /data-path-exit="Outline"/);
  assert.match(tab, /shouldShiftTabFromFirstOuterToClosed/);
  assert.match(tab, /pickClosedTabTarget/);
  assert.match(row, /shouldShiftTabFromFirstOuterToClosed/);
  assert.match(row, /pickClosedTabTarget/);
  assert.match(row, /tagHolePointTabCrossing\(e\.currentTarget, closed, closed\)/);
  assert.match(row, /scrollTop = saved/);
});
