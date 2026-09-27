import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");
const render = readFileSync(new URL("../src/lib/design/render.ts", import.meta.url), "utf8");
const filters = readFileSync(new URL("../src/lib/design/image-filters.ts", import.meta.url), "utf8");
const inspect = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const adjust = readFileSync(new URL("../src/components/studio/image-adjust.tsx", import.meta.url), "utf8");

test("crop helpers and CSS filter live on image-filters", () => {
  assert.match(filters, /export function cssFilterStyle/);
  assert.match(filters, /export function svgImageFilterStyle/);
  assert.match(filters, /export function normalizeCrop/);
  assert.match(filters, /export function cropSourceBox/);
  assert.match(filters, /export function cropSourceRect/);
  assert.match(filters, /brightness\(\$\{b\}\) contrast\(\$\{c\}\) saturate\(\$\{s\}\) blur\(\$\{blur\}px\)/);
});

test("canvas draws cropped source and applies CSS filter", () => {
  assert.match(render, /cropSourceRect/);
  assert.match(render, /cssFilterStyle/);
  assert.match(render, /ctx\.filter = css/);
  assert.match(render, /ctx\.drawImage\(img, src\.sx, src\.sy, src\.sw, src\.sh, n\.x, n\.y, n\.w, n\.h\)/);
});

test("SVG bakes crop into clipPath on placed image", () => {
  assert.match(exp, /svgImageCropClip/);
  assert.match(exp, /clip-path="url\(#\$\{svgImageClipId/);
  assert.match(exp, /preserveAspectRatio="none"/);
  assert.match(exp, /svgImageFilterStyle/);
});

test("inspector mounts photo crop and mixed filters", () => {
  assert.match(inspect, /ImageAdjust/);
  assert.match(inspect, /MixedFilters/);
  assert.match(adjust, /Crop/);
  assert.match(adjust, /cssFilterStyle/);
});
