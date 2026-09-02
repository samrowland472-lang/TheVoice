import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const wind = readFileSync(new URL("../src/lib/design/winding-pass.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/lib/design/path-actions.ts", import.meta.url), "utf8");
const cut = readFileSync(new URL("../src/lib/design/path-cut.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("knife planarizes figure-eight traces before cut", () => {
  assert.match(wind, /export function explodeTwistedPath/);
  assert.match(wind, /splitSelfOverlapping\(n\.points\)/);
  assert.match(actions, /explodeTwistedPath/);
  assert.match(actions, /function cutPlanarizedPath/);
  assert.match(actions, /cutPlanarizedPath\(n,/);
  assert.match(cut, /explodeTwistedPath\(n\)/);
});

test("knife tool draws a stroke and applies cut on the artboard", () => {
  assert.match(stage, /tool === "knife"/);
  assert.match(stage, /knifeCutStroke/);
  assert.match(stage, /knifePreviewPoint/);
});
