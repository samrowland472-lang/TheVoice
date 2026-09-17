import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const app = readFileSync(new URL("../src/components/studio/studio-app.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("command palette exposes print-mark and safe-area commands", () => {
  assert.match(app, /id: "print-marks"/);
  assert.match(app, /id: "safe-area"/);
  assert.match(app, /togglePrintMarks/);
  assert.match(app, /toggleSafeArea/);
  assert.match(app, /setPrintMarks\(true\)/);
  assert.match(app, /setSafeArea\(false\)/);
});

test("store persists print-mark and safe-area prefs", () => {
  assert.match(store, /readPrintMarksPref/);
  assert.match(store, /writePrintMarksPref/);
  assert.match(store, /readSafeAreaPref/);
  assert.match(store, /writeSafeAreaPref/);
  assert.match(store, /togglePrintMarks/);
});

test("inspector still exposes print-mark toggle", () => {
  assert.match(inspector, /Print marks/);
  assert.match(inspector, /togglePrintMarks/);
});
