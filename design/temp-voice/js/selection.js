// Working on more than one thing at a time.
//
// A single selection is fine while a scene is three primitives. It stops
// being fine the moment a model arrives as forty parts, or you want two
// dozen of something: moving them one at a time is not slow, it is
// impossible to keep aligned.
//
// The model is the ordinary one. A set of selected ids, plus an *active*
// one — the last touched — which is the object the properties panel edits
// and the gizmo attaches to. Everything that already understood a single
// selection keeps working against the active id; only the operations that
// mean something in bulk look at the set.

/** The active id is always a member, so the two can never disagree. */
export function normaliseSelection(ids, activeId, scene) {
  const present = new Set((scene && scene.shapes ? scene.shapes : []).map((s) => s.id));
  const out = new Set();
  for (const id of ids || []) if (present.has(id)) out.add(id);
  if (activeId && present.has(activeId)) out.add(activeId);
  return out;
}

/**
 * Apply a click to a selection.
 *
 * Plain click replaces; shift or ctrl toggles. Toggling the active object
 * out has to hand the active role to something still selected, or the
 * panel ends up editing an object that is no longer chosen.
 */
export function applyClick(ids, activeId, clickedId, { additive = false } = {}) {
  if (!clickedId) return { ids: new Set(), activeId: null };
  const next = new Set(ids || []);
  if (!additive) return { ids: new Set([clickedId]), activeId: clickedId };

  if (next.has(clickedId) && next.size > 1) {
    next.delete(clickedId);
    const active = clickedId === activeId ? [...next][next.size - 1] : activeId;
    return { ids: next, activeId: active };
  }
  next.add(clickedId);
  return { ids: next, activeId: clickedId };
}

/**
 * Selecting a parent should not mean moving its children twice.
 *
 * A child already follows its parent, so applying a drag to both applies
 * it twice — the child races away at double speed. Bulk operations act on
 * the roots of the selection: the members whose ancestors are not
 * themselves selected.
 */
export function selectionRoots(scene, ids) {
  const chosen = new Set(ids || []);
  const byId = new Map((scene && scene.shapes ? scene.shapes : []).map((s) => [s.id, s]));
  const out = [];
  for (const id of chosen) {
    const shape = byId.get(id);
    if (!shape) continue;
    let cur = shape.parent ? byId.get(shape.parent) : null;
    let covered = false;
    const seen = new Set([id]);
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (chosen.has(cur.id)) { covered = true; break; }
      cur = cur.parent ? byId.get(cur.parent) : null;
    }
    if (!covered) out.push(shape);
  }
  return out;
}

/**
 * Copy shapes, giving the copies fresh ids.
 *
 * The part worth getting right is parenting. A copied child whose parent
 * was copied too must point at the *copy* — otherwise duplicating an arm
 * and its hand leaves the new hand attached to the old arm, and the two
 * models move as one. A copied child whose parent was not copied keeps
 * pointing at the original, which is what "duplicate this part" means.
 *
 * `mint` supplies each new id, so the caller keeps ownership of whatever
 * counter the rest of the scene uses.
 */
export function duplicateShapes(shapes, mint, { offset = 0, taken = null } = {}) {
  const remap = new Map();
  // Names already in use, so a copy of "Cube 1" beside an existing
  // "Cube 2" becomes "Cube 3" rather than a second "Cube 2". Two identical
  // rows in the outliner are worse than an odd number in a name.
  const used = new Set(taken || []);
  const copies = shapes.map((shape) => {
    const copy = JSON.parse(JSON.stringify(shape));
    copy.id = mint();
    remap.set(shape.id, copy.id);
    copy.label = uniqueLabel(shape.label, used);
    used.add(copy.label);
    return copy;
  });

  for (const copy of copies) {
    if (copy.parent && remap.has(copy.parent)) copy.parent = remap.get(copy.parent);
    if (offset) {
      for (const k of copy.keyframes || []) {
        k.x = (k.x || 0) + offset;
        k.y = (k.y || 0) + offset;
      }
    }
  }
  return { copies, remap };
}

/**
 * The next free name in a sequence.
 *
 * Bounded: past a hundred tries the name is decorated instead of counted,
 * because a loop that keeps incrementing against a set it cannot escape is
 * a hang rather than a name.
 */
export function uniqueLabel(label, taken) {
  const used = taken instanceof Set ? taken : new Set(taken || []);
  let next = nextLabel(label);
  for (let i = 0; i < 100 && used.has(next); i++) next = nextLabel(next);
  if (used.has(next)) next = `${nextLabel(label)} copy`.slice(0, 60);
  return next;
}

/**
 * "Cube 3" becomes "Cube 4"; "Torso" becomes "Torso 2".
 *
 * Names matter more once there are forty rows in the outliner, and a
 * column of identical labels is a column you cannot navigate.
 */
export function nextLabel(label) {
  const text = String(label === undefined || label === null ? '' : label);
  if (!text) return 'Copy';
  const m = /^(.*?)(\d+)$/.exec(text);
  if (m) {
    const n = parseInt(m[2], 10);
    // Cap the length so a name cannot grow without bound through repeated
    // duplication of something already absurdly named.
    return `${m[1]}${n + 1}`.slice(0, 60);
  }
  return `${text} 2`.slice(0, 60);
}

/**
 * Delete shapes, re-homing any children that survive.
 *
 * A child of a deleted parent must not vanish with it and must not be left
 * pointing at something that no longer exists. It moves up to its
 * grandparent — the nearest ancestor still in the scene.
 */
export function deleteShapes(scene, ids, onReparent = null) {
  const doomed = new Set(ids || []);
  const byId = new Map(scene.shapes.map((s) => [s.id, s]));
  const survivorParent = (id) => {
    let cur = byId.get(id);
    const seen = new Set();
    while (cur && cur.parent && !seen.has(cur.parent)) {
      seen.add(cur.parent);
      if (!doomed.has(cur.parent)) return cur.parent;
      cur = byId.get(cur.parent);
    }
    return null;
  };

  for (const shape of scene.shapes) {
    if (doomed.has(shape.id)) continue;
    if (shape.parent && doomed.has(shape.parent)) {
      const next = survivorParent(shape.id);
      if (onReparent) onReparent(shape, next);
      else { shape.parent = next; delete shape.bind; }
    }
  }
  const before = scene.shapes.length;
  scene.shapes = scene.shapes.filter((s) => !doomed.has(s.id));
  return before - scene.shapes.length;
}
