import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const wind = readFileSync(new URL("../src/lib/design/winding-pass.ts", import.meta.url), "utf8");
const cut = readFileSync(new URL("../src/lib/design/path-cut.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");
const apply = readFileSync(new URL("../src/lib/design/knife-apply.ts", import.meta.url), "utf8");
const shape = readFileSync(new URL("../src/lib/design/shape-to-path.ts", import.meta.url), "utf8");

test("knife planarizes figure-eight traces before cut", () => {
  assert.match(wind, /export function explodeTwistedPath/);
  assert.match(wind, /splitSelfOverlapping\(n\.points\)/);
  assert.match(cut, /explodeTwistedPath\(n\)/);
  assert.match(cut, /knifePreviewPoint/);
  assert.match(cut, /knifePreviewLobe/);
  assert.match(cut, /knifeStrokePreview/);
  assert.match(cut, /only the lobes a stroke will open/);
});

test("knife apply cuts only the crossed figure-eight lobe", () => {
  assert.match(apply, /export function applyKnifeStrokeToPath/);
  assert.match(apply, /explodeTwistedPath\(n\)/);
  assert.match(apply, /Untouched lobes stay closed siblings/);
  assert.match(actions, /applyKnifeStrokeToPath\(n, ax, ay, bx, by\)/);
  assert.match(actions, /applyKnifePointToPath\(n, wx, wy, zoom\)/);
});

test("knife preview returns only crossed bowtie lobes", () => {
  assert.match(cut, /Untouched bowtie rings stay unmarked/);
  assert.match(cut, /lobes: PathNode\[\]/);
});

test("knife converts primitive shapes before the cut", () => {
  assert.match(shape, /export function asEditablePath/);
  assert.match(actions, /asEditablePath\(n\)/);
  assert.match(actions, /knifePaths/);
});
