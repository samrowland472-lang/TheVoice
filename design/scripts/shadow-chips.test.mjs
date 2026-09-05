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
  assert.match(shadow, /export function shadowOxLabel/);
  assert.match(shadow, /export function shadowOyLabel/);
  assert.match(shadow, /export function stampShadowOx/);
  assert.match(shadow, /export function stampShadowOy/);
  assert.match(shadow, /export function stampShadowColor/);
  assert.match(shadow, /export function stampShadowBlur/);
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
  assert.match(chips, /stampShadowOffset\(layer\.shadow/);
  assert.match(mixed, /stampShadowOx\(sh/);
  assert.match(mixed, /stampShadowOy\(sh/);
  assert.match(mixed, /mapShadows/);
});

test("mixed sliders stay live while colour and offset disagree", () => {
  assert.match(mixed, /Colour · mixed/);
  assert.match(mixed, /Blur · mixed/);
  assert.match(mixed, /X · mixed/);
  assert.match(mixed, /Y · mixed/);
  assert.match(mixed, /ghost/);
  assert.match(mixed, /mapShadows\(\(sh\) => stampShadowColor/);
  assert.match(mixed, /mapShadows\(\(sh\) => stampShadowBlur/);
  assert.match(mixed, /mapShadows\(\(sh\) => stampShadowOx/);
  assert.match(mixed, /mapShadows\(\(sh\) => stampShadowOy/);
});

test("mixed-ink colour and blur chips stamp one field without replacing offsets", () => {
  assert.match(chips, /Unify shadow color/);
  assert.match(chips, /Unify shadow blur/);
  assert.match(chips, /stampShadowColor\(layer\.shadow/);
  assert.match(chips, /stampShadowBlur\(layer\.shadow/);
  assert.match(mixed, /stampShadowColor\(sh/);
  assert.match(mixed, /stampShadowBlur\(sh/);
  assert.match(mixed, /Colour · mixed/);
  assert.match(mixed, /Blur · mixed/);
});
