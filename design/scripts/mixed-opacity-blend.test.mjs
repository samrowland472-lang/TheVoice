import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");

test("inspector exposes mixed opacity and blend on multi-select", () => {
  assert.match(inspector, /const mixedOpacity/);
  assert.match(inspector, /const mixedBlend/);
  assert.match(inspector, /Opacity · mixed/);
  assert.match(inspector, /Blend · mixed/);
  assert.match(inspector, /opacity mixed/);
  assert.match(inspector, /blend mixed/);
  assert.match(inspector, /updateNodes\(multi \? ids : \[node\.id\], \{ opacity:/);
  assert.match(inspector, /updateNodes\(multi \? ids : \[node\.id\], \{ blend:/);
});

test("opacity and blend stay visible when kinds mix", () => {
  assert.doesNotMatch(inspector, /\{!multi && <Field label=\{`Opacity/);
  assert.doesNotMatch(inspector, /\{!multi && \(\s*<Field label="Blend"/);
});
