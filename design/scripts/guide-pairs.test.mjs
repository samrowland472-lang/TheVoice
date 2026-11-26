import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const snapSrc = readFileSync(new URL("../src/lib/design/snap-guide.ts", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");

test("guidePairs measures consecutive parallel gaps", () => {
  assert.match(snapSrc, /export function guidePairs/);
  assert.match(snapSrc, /export function formatGuidePair/);
  assert.match(snapSrc, /export type GuidePair/);
});

test("canvas draws pair ticks between parallel guides", () => {
  assert.match(rulers, /guidePairs\(guides\)/);
  assert.match(rulers, /pair\.gap/);
  assert.match(rulers, /pair\.lo/);
  assert.match(rulers, /pair\.hi/);
});

test("inspector lists pair gaps", () => {
  assert.match(inspector, /formatGuidePair/);
  assert.match(inspector, /guidePairs\(guides\)/);
});
