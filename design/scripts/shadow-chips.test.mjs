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
  assert.match(shadow, /export function shadowOxLabel/);
  assert.match(shadow, /export function shadowOyLabel/);
  assert.match(shadow, /export function stampShadowOx/);
  assert.match(shadow, /export function stampShadowOy/);
});

test("mixed-ink chips apply a cloned full shadow, not colour alone", () => {
  assert.match(mixed, /cloneShadow\(n\.shadow\)/);
  assert.match(mixed, /shadowChipLabel\(n\.shadow\)/);
  assert.match(mixed, /selection shadow x/);
  assert.match(mixed, /Unify full shadow/);
});

test("mixed-ink names ox and oy independently and stamps only that offset", () => {
  assert.match(mixed, /Unify shadow ox/);
  assert.match(mixed, /Unify shadow oy/);
  assert.match(mixed, /stampShadowOx\(layer\.shadow/);
  assert.match(mixed, /stampShadowOy\(layer\.shadow/);
  assert.match(mixed, /mapShadows/);
});
