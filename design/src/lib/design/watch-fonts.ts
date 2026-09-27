import { resetWrapMeasureCache } from "./export";

let wrapFontWatchAttached = false;

/** After document.fonts reload, drop the wrap face so measureText is not stale. */
export function watchFontsForWrapCache() {
  if (typeof document === "undefined") return;
  const fonts = document.fonts;
  if (!fonts || wrapFontWatchAttached) return;
  wrapFontWatchAttached = true;
  const reset = () => resetWrapMeasureCache();
  fonts.addEventListener?.("loadingdone", reset);
  void fonts.ready.then(reset);
}
