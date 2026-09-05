import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const ink = readFileSync(new URL("../src/lib/design/ink.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-ink.tsx", import.meta.url), "utf8");
const chips = readFileSync(new URL("../src/components/studio/mixed-ink-chips.tsx", import.meta.url), "utf8");

test("ink helpers label solid, none, and gradient fills plus stroke width", () => {
  assert.match(ink, /export function fillChipLabel/);
  assert.match(ink, /export function strokeChipLabel/);
  assert.match(ink, /export function cloneFill/);
  assert.match(ink, /grad \$\{fill\.angle\}/);
  assert.match(ink, /\$\{stroke\} · \$\{width\}/);
});

test("mixed-ink chips stamp cloned fill and named stroke when ink disagrees", () => {
  assert.match(chips, /fillChipLabel/);
  assert.match(chips, /strokeChipLabel/);
  assert.match(chips, /cloneFill\(n\.fill\)/);
  assert.match(chips, /Unify fill with/);
  assert.match(chips, /Unify stroke with/);
  assert.match(mixed, /Fill · mixed/);
  assert.match(mixed, /Stroke · mixed/);
  assert.match(mixed, /MixedFillChips/);
  assert.match(mixed, /MixedStrokeChips/);
  assert.match(mixed, /MixedOpacityChips/);
  assert.match(mixed, /MixedBlendChips/);
});

test("opacity and blend chips stamp the picked layer onto the selection", () => {
  assert.match(chips, /Unify opacity with/);
  assert.match(chips, /Unify blend with/);
  assert.match(chips, /opacity: n\.opacity/);
  assert.match(chips, /blend: n\.blend/);
});

test("lock and visibility chips stamp the picked layer onto the selection", () => {
  assert.match(chips, /Unify visibility with/);
  assert.match(chips, /Unify lock with/);
  assert.match(chips, /visible: n\.visible/);
  assert.match(chips, /locked: n\.locked/);
  assert.match(chips, /visibilityChipLabel/);
  assert.match(chips, /lockChipLabel/);
  assert.match(mixed, /Visibility · mixed/);
  assert.match(mixed, /Lock · mixed/);
  assert.match(mixed, /MixedVisibilityChips/);
  assert.match(mixed, /MixedLockChips/);
  assert.match(mixed, /Show all/);
  assert.match(mixed, /Unlock all/);
});
