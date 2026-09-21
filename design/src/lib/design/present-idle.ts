/** Hide present chrome after idle; any activity or F reveals the campaign rail. */

export const PRESENT_IDLE_MS = 2800;

export function shouldHidePresentChrome(opts: {
  idle: boolean;
  notesOpen: boolean;
  menuOpen: boolean;
}): boolean {
  if (opts.notesOpen || opts.menuOpen) return false;
  return opts.idle;
}
