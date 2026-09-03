import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const wind = readFileSync(new URL("../src/lib/design/winding-pass.ts", import.meta.url), "utf8");
const cut = readFileSync(new URL("../src/lib/design/path-cut.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");

test("knife planarizes figure-eight traces before cut", () => {
  assert.match(wind, /export function explodeTwistedPath/);
  assert.match(wind, /splitSelfOverlapping\(n\.points\)/);
  assert.match(cut, /explodeTwistedPath\(n\)/);
  assert.match(cut, /knifePreviewPoint/);
  assert.match(cut, /knifeStrokePreview/);
  assert.match(cut, /every crossing/);
});

test("knife apply cuts only the crossed figure-eight lobe", () => {
  assert.match(actions, /export function applyKnifeStrokeToPath/);
  assert.match(actions, /explodeTwistedPath\(n\)/);
  assert.match(actions, /Untouched lobes stay closed siblings/);
  assert.match(actions, /applyKnifeStrokeToPath\(n, ax, ay, bx, by\)/);
  assert.match(actions, /applyKnifePointToPath\(n, wx, wy, zoom\)/);
});
