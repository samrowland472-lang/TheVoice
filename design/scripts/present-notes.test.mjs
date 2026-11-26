import assert from "node:assert/strict";

function presentNotesKeyAction(key, notesOpen) {
  if (key === "n" || key === "N") return "toggle";
  if (key === "Escape" && notesOpen) return "close";
  return null;
}

function applyPresentNotesAction(notesOpen, action) {
  if (action === "toggle") return !notesOpen;
  if (action === "close") return false;
  return notesOpen;
}

assert.equal(presentNotesKeyAction("n", false), "toggle");
assert.equal(presentNotesKeyAction("N", true), "toggle");
assert.equal(presentNotesKeyAction("Escape", true), "close");
assert.equal(presentNotesKeyAction("Escape", false), null);
assert.equal(applyPresentNotesAction(false, "toggle"), true);
assert.equal(applyPresentNotesAction(true, "toggle"), false);
console.log("present-notes ok");
