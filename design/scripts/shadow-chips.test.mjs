import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const shadow = readFileSync(new URL("../src/lib/design/shadow.ts", import.meta.url), "utf8");
const mixed = readFileSync(new URL("../src/components/studio/mixed-ink.tsx", import.meta.url), "utf8");

test("shadow helpers clone colour, blur, and both offsets", () => {
  assert.match(shadow, /export function cloneShadow/);
  assert.match(shadow, /ox: shadow.ox/);
  assert.match(shadow, /oy: shadow.oy/);
  assert.match(shadow, /blur: shadow.blur/);
  assert.match(shadow, /export function shadowChipLabel/);
});

test("mixed-ink chips apply a cloned full shadow, not colour alone", () => {
  assert.match(mixed, /cloneShadow\(n\.shadow\)/);
  assert.match(mixed, /shadowChipLabel\(n\.shadow\)/);
  assert.match(mixed, /selection shadow x/);
  assert.match(mixed, /Unify full shadow/);
});
