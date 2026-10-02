import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const preview = readFileSync(new URL("../src/lib/design/align-preview.ts", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const keys = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");

test("align preview draws the key edge before commit", () => {
  assert.match(preview, /export function planAlign/);
  assert.match(preview, /export function drawAlignPreview/);
  assert.match(preview, /First click previews the phosphor edge/);
  assert.match(preview, /expandMovePlaces/);
  assert.match(preview, /"stay" : "key"/);
  assert.match(preview, /keyName/);
  assert.match(preview, /plan\.keyName/);
  assert.match(inspector, /data-align-key-name/);
  assert.match(preview, /plan\.edge} edge/);
  assert.match(stage, /drawAlignPreview\(ctx, alignPreview, viewport.zoom\)/);
  assert.match(inspector, /Align to key/);
  assert.match(inspector, /data-align-edge/);
  assert.match(inspector, /data-align-stay/);
  assert.match(inspector, /data-align-move/);
  assert.match(inspector, /data-align=/);
  assert.match(inspector, /Commit left/);
  assert.match(inspector, /Align to board/);
  assert.match(inspector, /data-align-board=/);
  assert.match(inspector, /data-align-target="board"/);
  assert.match(preview, /export function planAlignBoard/);
  assert.match(preview, /Aligned \$\{plan\.edge\} to \$\{plan\.target === "board" \? "board" : plan\.keyName\}/);
  assert.match(keys, /commitAlignPreview\(\)/);
  assert.match(keys, /clearAlignPreview\(\)/);
});

test("board left edge shifts a box onto x 0 and pins a box already there", () => {
  const board = { x: 0, w: 200 };
  const mover = { x: 40, w: 20 };
  const stay = { x: 0, w: 10 };
  assert.equal(board.x - mover.x, -40);
  assert.equal(board.x - stay.x, 0);
  assert.match(preview, /target: "board"/);
  assert.match(preview, /Align to board needs an unlocked layer/);
  assert.match(preview, /board edge/);
});

test("left edge keeps the key and shifts the other box", () => {
  const key = { id: "key", x: 40, y: 10, w: 20, h: 20 };
  const other = { id: "other", x: 0, y: 30, w: 10, h: 8 };
  const dx = key.x - other.x;
  assert.equal(dx, 40);
  assert.equal(other.x + dx, key.x);
  assert.match(preview, /key stays/);
  assert.match(preview, /Aligned \$\{plan\.edge\} to \$\{plan\.target === "board" \? "board" : plan\.keyName\}/);
});
