import assert from "node:assert/strict";

const LAST = "voice-design:last-opened:v1";
const STAY = "voice-design:stay-hub";
const DOCS = "voice-design:docs:v1";

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
const sess = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (sess.has(k) ? sess.get(k) : null),
  setItem: (k, v) => sess.set(k, String(v)),
  removeItem: (k) => sess.delete(k),
};

function loadLastOpenedId() {
  const raw = localStorage.getItem(LAST);
  return raw && raw.length > 0 ? raw : null;
}
function saveLastOpenedId(id) {
  localStorage.setItem(LAST, id);
}
function clearLastOpenedId() {
  localStorage.removeItem(LAST);
}
function markStayOnHub() {
  sessionStorage.setItem(STAY, "1");
}
function shouldStayOnHub() {
  return sessionStorage.getItem(STAY) === "1";
}
function lastOpenedToResume(hasDoc) {
  if (shouldStayOnHub()) return null;
  const id = loadLastOpenedId();
  if (!id) return null;
  return hasDoc(id) ? id : null;
}

saveLastOpenedId("doc-a");
assert.equal(loadLastOpenedId(), "doc-a");
assert.equal(
  lastOpenedToResume((id) => id === "doc-a"),
  "doc-a",
);

markStayOnHub();
assert.equal(lastOpenedToResume((id) => id === "doc-a"), null);

sess.delete(STAY);
clearLastOpenedId();
assert.equal(lastOpenedToResume(() => true), null);

saveLastOpenedId("gone");
assert.equal(lastOpenedToResume(() => false), null);

localStorage.setItem(DOCS, JSON.stringify({ "doc-a": { id: "doc-a" } }));
saveLastOpenedId("doc-a");
assert.equal(JSON.parse(localStorage.getItem(DOCS))["doc-a"].id, "doc-a");

console.log("last-opened ok");
