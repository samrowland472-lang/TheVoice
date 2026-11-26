import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("SVG text is clipped to the node box", () => {
  assert.match(exp, /svgTextBoxClip/);
  assert.match(exp, /clipPath id=/);
  assert.match(exp, /clip-path="url\(#\$\{svgTextClipId/);
  assert.match(exp, /tb-\$/);
});
