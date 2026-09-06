import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const edit = readFileSync(new URL("../src/lib/design/path-edit.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");
const pathUi = readFileSync(new URL("../src/components/studio/inspector-path.tsx", import.meta.url), "utf8");

test("artboard hit picks a hole body, not only anchors", () => {
  assert.match(edit, /pointInRing\(local, ring\)/);
  assert.match(edit, /return \{ index: 0, arm: "anchor", hole: h \}/);
});

test("selectPathHole and inspector hole rows share the hit", () => {
  assert.match(actions, /export function selectPathHole/);
  assert.match(pathUi, /selectPathHole\(h\)/);
  assert.match(pathUi, /activeHole === h \? "border-phosphor\/60 bg-phosphor\/10"/);
  assert.match(pathUi, /data-hole=\{h\}/);
});

test("picked hole row scrolls into view", () => {
  assert.match(pathUi, /scrollIntoView/);
  assert.match(pathUi, /querySelector\(`\[data-hole="\$\{activeHole\}"\]`\)/);
});

test("highlighted hole row can delete the hole", () => {
  assert.match(actions, /export function deletePathHole/);
  assert.match(pathUi, /deletePathHole\(node\.id, h\)/);
  assert.match(pathUi, /aria-label=\{`delete hole \$\{h \+ 1\}`\}/);
});

test("arrow keys walk picked holes", () => {
  const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");
  assert.match(actions, /export function stepPathHole/);
  assert.match(actions, /selectPathHole\(next\)/);
  assert.match(keys, /stepPathHole/);
  assert.match(keys, /pathEditHit\?\.hole != null/);
});

test("home and end jump to first and last hole", () => {
  const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");
  assert.match(actions, /export function jumpPathHole/);
  assert.match(actions, /const next = end \? count - 1 : 0/);
  assert.match(keys, /jumpPathHole\(e\.key === "End"\)/);
  assert.match(keys, /e\.key === "Home" \|\| e\.key === "End"/);
});

test("left and right walk points on the picked hole ring", () => {
  const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");
  assert.match(actions, /export function stepPathHolePoint/);
  assert.match(actions, /selectPathPoint\(next, hit\.hole\)/);
  assert.match(keys, /stepPathHolePoint/);
  assert.match(keys, /e\.key === "ArrowLeft" \|\| e\.key === "ArrowRight"/);
  assert.match(pathUi, /Holes · \$\{holes\.length\}  ↑↓ ←→ Home End/);
});
