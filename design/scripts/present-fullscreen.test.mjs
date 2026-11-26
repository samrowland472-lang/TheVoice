import assert from "node:assert/strict";
import { test } from "node:test";

function presentRootIsFullscreen(root, doc) {
  if (!root) return false;
  return doc.fullscreenElement === root;
}

test("fullscreen element is the present root so the campaign rail stays", () => {
  const root = { id: "present" };
  const other = { id: "other" };
  assert.equal(presentRootIsFullscreen(null, { fullscreenElement: root }), false);
  assert.equal(presentRootIsFullscreen(root, { fullscreenElement: null }), false);
  assert.equal(presentRootIsFullscreen(root, { fullscreenElement: other }), false);
  assert.equal(presentRootIsFullscreen(root, { fullscreenElement: root }), true);
});
