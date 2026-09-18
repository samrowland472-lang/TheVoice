import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const style = readFileSync(new URL("../src/lib/design/guide-style.ts", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/components/studio/studio-app.tsx", import.meta.url), "utf8");

test("guide style module exposes per-axis look", () => {
  assert.match(style, /export type GuideDash/);
  assert.match(style, /DEFAULT_GUIDE_LOOKS/);
  assert.match(style, /setGuideLook/);
  assert.match(style, /voice-design-guide-looks/);
});

test("rulers draw each axis with its look", () => {
  assert.match(rulers, /resolveGuideLook/);
  assert.match(rulers, /dashArray/);
  assert.match(rulers, /if \(g\.hidden\) continue/);
  assert.match(rulers, /selectedIds/);
});

test("inspector has V/H color and dash chips", () => {
  assert.match(inspector, /setGuideLook/);
  assert.match(inspector, /GUIDE_COLORS/);
  assert.match(inspector, /GUIDE_DASHES/);
  assert.match(inspector, /guideLooks/);
});

test("palette can reset guide looks", () => {
  assert.match(app, /Reset guide colors/);
});
