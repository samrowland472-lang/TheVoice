import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const view = readFileSync(new URL("../src/components/studio/path-point-row-view.tsx", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/path-point-row.tsx", import.meta.url), "utf8");

test("Tab from last hole-path y hops to the next hole header when next hole has no point fields", () => {
  assert.match(a, /function shouldTabFromLastHoleYToNextHeader/);
  assert.match(a, /axis !== "y"/);
  assert.match(a, /holeHasNoPointFields\(inspector, h \+ 1\)/);
  assert.match(a, /data-select-hole="\$\{h \+ 1\}"/);
  assert.match(barrel, /shouldTabFromLastHoleYToNextHeader/);
  assert.match(view, /shouldTabFromLastHoleYToNextHeader/);
  assert.match(view, /focusHoldEl\(header, from\)/);
  const yBlock = ui.split('data-path-axis="y"')[1] ?? "";
  assert.match(yBlock, /shouldTabFromLastHoleYToNextHeader/);
  assert.match(yBlock, /pickNextHoleHeaderTabTarget/);
});
