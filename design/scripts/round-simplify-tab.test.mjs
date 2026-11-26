import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const a = readFileSync(new URL("../src/lib/design/path-point-tab-a.ts", import.meta.url), "utf8");
const b = readFileSync(new URL("../src/lib/design/path-point-tab-b.ts", import.meta.url), "utf8");
const tab = readFileSync(new URL("../src/lib/design/path-point-tab.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/studio/inspector-path-impl.tsx", import.meta.url), "utf8");

test("Tab from Round targets Simplify", () => {
  assert.match(a, /shouldTabFromRoundToSimplify/);
  assert.match(a, /data-path-exit"\) !== "Round"/);
  assert.match(a, /data-path-exit="Simplify"/);
  assert.match(a, /pickSimplifyTabTarget/);
  assert.match(tab, /shouldTabFromRoundToSimplify/);
  assert.match(tab, /pickSimplifyTabTarget/);
  assert.match(ui, /shouldTabFromRoundToSimplify/);
  assert.match(ui, /pickSimplifyTabTarget/);
  assert.match(ui, /tagHolePointTabCrossing\(from, simplify, simplify\)/);
  assert.match(ui, /pointListRef\.current/);
});

test("exit-to-exit Tab is a hole-point crossing so the list keeps scroll", () => {
  assert.match(b, /fromExit && toExit && fromExit !== toExit/);
});
