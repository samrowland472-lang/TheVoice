import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const exp = readFileSync(new URL("../src/lib/design/export.ts", import.meta.url), "utf8");

test("print PDF writes a JPEG PDF, not a PNG download", () => {
  assert.match(exp, /export function buildJpegPdf/);
  assert.match(exp, /\/Filter \/DCTDecode/);
  assert.match(exp, /downloadPrintPdf/);
  assert.match(exp, /\$\{slug\(doc\.name\)\}-print\.pdf/);
  assert.doesNotMatch(exp, /downloadPrintPdf[\s\S]{0,200}print\.png/);
});
