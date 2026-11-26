/** Present-mode fullscreen stays on the present root so the campaign rail remains in view. */

export function presentRootIsFullscreen(root: Element | null, doc: Document = document): boolean {
  if (!root) return false;
  return doc.fullscreenElement === root;
}

export async function enterPresentFullscreen(root: Element | null): Promise<boolean> {
  if (!root || typeof root.requestFullscreen !== "function") return false;
  if (presentRootIsFullscreen(root)) return true;
  try {
    await root.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export async function exitPresentFullscreen(doc: Document = document): Promise<void> {
  if (!doc.fullscreenElement || typeof doc.exitFullscreen !== "function") return;
  try {
    await doc.exitFullscreen();
  } catch {
    /* user-gesture or already left */
  }
}

export async function togglePresentFullscreen(root: Element | null, doc: Document = document): Promise<boolean> {
  if (presentRootIsFullscreen(root, doc)) {
    await exitPresentFullscreen(doc);
    return false;
  }
  return enterPresentFullscreen(root);
}
