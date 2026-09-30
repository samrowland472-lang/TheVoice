import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const bar = readFileSync(new URL("../src/components/studio/top-bar.tsx", import.meta.url), "utf8");

test("selectionDocument keeps named nodes on the same artboard", () => {
  assert.match(exp, /export function selectionDocument/);
  assert.match(exp, /name: `\$\{doc\.name\} selection`/);
  assert.match(exp, /doc\.nodes\.filter\(\(n\) => keep\.has\(n\.id\)\)/);
});

test("export menu offers selection PNG and SVG", () => {
  assert.match(bar, /selectionDocument/);
  assert.match(bar, /sel-png/);
  assert.match(bar, /sel-svg/);
  assert.match(bar, /Selection PNG/);
  assert.match(bar, /Selection SVG/);
});
