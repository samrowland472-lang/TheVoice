const KEY = "voice-design.inspector-rail";

let rail = false;
const listeners = new Set<() => void>();

function readStored() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

if (typeof localStorage !== "undefined") rail = readStored();

/** Inspector collapsed to a rail. Equal-gap size then lives on the canvas tick. */
export function getInspectorRail() {
  return rail;
}

export function setInspectorRail(next: boolean) {
  if (rail === next) return;
  rail = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  for (const fn of listeners) fn();
}

export function subscribeInspectorRail(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
