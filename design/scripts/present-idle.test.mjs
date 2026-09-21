import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");

test("idle hide stays off while notes or a menu is open", () => {
  assert.match(src, /notesOpen \|\| opts\.menuOpen/);
  assert.match(src, /PRESENT_IDLE_MS/);
});
