export function watchFontsForWrapCache(): () => void {
  const fonts = typeof document !== "undefined" ? document.fonts : undefined;
  if (!fonts) return () => {};
  const onDone = () => {
    /* wrap measure cache lives in export.ts */
  };
  fonts.addEventListener("loadingdone", onDone);
  void fonts.ready.then(onDone);
  return () => fonts.removeEventListener("loadingdone", onDone);
}
