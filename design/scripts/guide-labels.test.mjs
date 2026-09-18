import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const types = readFileSync(new URL("../src/lib/design/types.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const select = readFileSync(new URL("../src/lib/design/guide-select.ts", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const palette = readFileSync(new URL("../src/components/studio/studio-app.tsx", import.meta.url), "utf8");

test("guide type carries label", () => {
  assert.match(types, /label\?: string/);
});

test("store can rename and clear labels", () => {
  assert.match(store, /renameGuide:/);
  assert.match(store, /clearGuideLabels:/);
  assert.match(store, /patch\.label/);
});

test("display name falls back to axis + pos", () => {
  assert.match(select, /export function guideDisplayName/);
  assert.match(select, /sanitizeGuideLabel/);
  assert.match(select, /\$\{axis\} \$\{pos\}/);
});

test("canvas draws guide names", () => {
  assert.match(rulers, /guideDisplayName/);
  assert.match(rulers, /if \(g\.hidden\) continue/);
});

test("inspector exposes a name field", () => {
  assert.match(inspector, /guide name/);
  assert.match(inspector, /renameGuide/);
});

test("command palette can clear names", () => {
  assert.match(palette, /Clear guide names/);
});
