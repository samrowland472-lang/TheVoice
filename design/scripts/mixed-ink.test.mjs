import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const ink = readFileSync(new URL("../src/lib/design/ink.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-ink.tsx", import.meta.url), "utf8");

test("ink helpers label solid, none, and gradient fills plus stroke width", () => {
  assert.match(ink, /export function fillChipLabel/);
  assert.match(ink, /export function strokeChipLabel/);
  assert.match(ink, /export function cloneFill/);
  assert.match(ink, /grad \$\{fill\.angle\}/);
  assert.match(ink, /\$\{stroke\} · \$\{width\}/);
});

test("mixed-ink chips stamp cloned fill and named stroke when ink disagrees", () => {
  assert.match(mixed, /fillChipLabel/);
  assert.match(mixed, /strokeChipLabel/);
  assert.match(mixed, /cloneFill\(n\.fill\)/);
  assert.match(mixed, /Unify fill with/);
  assert.match(mixed, /Unify stroke with/);
  assert.match(mixed, /Fill · mixed/);
  assert.match(mixed, /Stroke · mixed/);
});
