import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const shadow = readFileSync(new URL("../src/lib/design/shadow.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-ink.tsx", import.meta.url), "utf8");
const chips = readFileSync(new URL("../src/components/studio/mixed-ink-chips.tsx", import.meta.url), "utf8");

test("shadow helpers clone colour, blur, and both offsets", () => {
  assert.match(shadow, /export function cloneShadow/);
  assert.match(shadow, /ox: shadow.ox/);
  assert.match(shadow, /oy: shadow.oy/);
  assert.match(shadow, /blur: shadow.blur/);
  assert.match(shadow, /export function shadowChipLabel/);
  assert.match(shadow, /export function shadowOxKey/);
  assert.match(shadow, /export function shadowOyKey/);
  assert.match(shadow, /export function shadowOffsetChipLabel/);
  assert.match(shadow, /export function stampShadowOffset/);
});

test("mixed-ink chips apply a cloned full shadow, not colour alone", () => {
  assert.match(mixed, /cloneShadow\(n\.shadow\)/);
  assert.match(mixed, /shadowChipLabel\(n\.shadow\)/);
  assert.match(mixed, /selection shadow x/);
  assert.match(mixed, /Unify full shadow/);
});

test("mixed-ink offset chips name ox and oy independently", () => {
  assert.match(mixed, /MixedShadowOffsetChips/);
  assert.match(mixed, /axis="ox"/);
  assert.match(mixed, /axis="oy"/);
  assert.match(mixed, /X · mixed/);
  assert.match(mixed, /Y · mixed/);
  assert.match(mixed, /stampShadowOffset\(layer\.shadow, "ox"/);
  assert.match(mixed, /stampShadowOffset\(layer\.shadow, "oy"/);
  assert.match(chips, /Unify shadow \$\{axis\}/);
});
