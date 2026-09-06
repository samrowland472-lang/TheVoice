/** Canvas / inspector status strip (path inspector Tab exit, etc). */

let status: string | null = null;
const listeners = new Set<() => void>();

export function getStudioStatus() {
  return status;
}

export function setStudioStatus(next: string | null) {
  status = next;
  for (const fn of listeners) fn();
}

export function subscribeStudioStatus(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
