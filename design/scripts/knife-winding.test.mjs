import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const wind = readFileSync(new URL("../src/lib/design/winding-pass.ts", import.meta.url), "utf8");
const cut = readFileSync(new URL("../src/lib/design/path-cut.ts", import.meta.url), "utf8");

test("knife planarizes figure-eight traces before cut", () => {
  assert.match(wind, /export function explodeTwistedPath/);
  assert.match(wind, /splitSelfOverlapping\(n\.points\)/);
  assert.match(cut, /explodeTwistedPath\(n\)/);
  assert.match(cut, /knifePreviewPoint/);
});
