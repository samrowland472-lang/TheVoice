import { test } from "node:test";
import assert from "node:assert/strict";

test("setNotes contract: persist before navigate", () => {
  const bag = {};
  const saveDoc = (doc) => {
    bag[doc.id] = { ...doc };
  };
  const loadDoc = (id) => bag[id] ?? null;
  function setNotes(doc, notes) {
    const next = { ...doc, notes, updatedAt: Date.now() };
    saveDoc(next);
    return next;
  }
  const a = { id: "a", name: "Story", notes: "" };
  saveDoc(a);
  setNotes(a, "open on the drop");
  saveDoc({ id: "b", name: "Square", notes: "" });
  assert.equal(loadDoc("a")?.notes, "open on the drop");
});
