/** Canvas / inspector status strip (path inspector Tab exit, etc). */

let status: string | null = null;
let held = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function getStudioStatus() {
  return status;
}

export function isHeldStudioStatus() {
  return held && status != null;
}

export function setStudioStatus(next: string | null, opts?: { hold?: boolean }) {
  status = next;
  held = Boolean(next && opts?.hold);
  emit();
}

/** Keep until the next inspector action — tool-hint refresh must not wipe it. */
export function holdStudioStatus(next: string) {
  setStudioStatus(next, { hold: true });
}

export function releaseStudioStatus() {
  if (!held && status == null) return;
  status = null;
  held = false;
  emit();
}

export function subscribeStudioStatus(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
