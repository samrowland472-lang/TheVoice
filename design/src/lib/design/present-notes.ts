/** Present-mode speaker notes: N toggles the drawer; Escape closes it first. */

export function presentNotesKeyAction(
  key: string,
  notesOpen: boolean,
): "toggle" | "close" | null {
  if (key === "n" || key === "N") return "toggle";
  if (key === "Escape" && notesOpen) return "close";
  return null;
}

export function applyPresentNotesAction(
  notesOpen: boolean,
  action: "toggle" | "close" | null,
): boolean {
  if (action === "toggle") return !notesOpen;
  if (action === "close") return false;
  return notesOpen;
}
