import { useEffect } from "react";
import {
  pickNextHoleHeaderFromFillTabTarget,
  shouldTabFromHoleFillToNextHeader,
  tagHoleHeaderTabCrossing,
} from "@/lib/design/path-point-tab";
import { PathFields as PathFieldsImpl } from "./inspector-path-impl";
import type { PathNode } from "@/lib/design/types";

export function PathFields({ node }: { node: PathNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || e.shiftKey) return;
      const from = e.target;
      if (!(from instanceof Element)) return;
      if (!shouldTabFromHoleFillToNextHeader(from, false)) return;
      const nextHeader = pickNextHoleHeaderFromFillTabTarget(from);
      if (!nextHeader) return;
      e.preventDefault();
      tagHoleHeaderTabCrossing(from, nextHeader, nextHeader);
      const list = from.closest("[data-hole-list]");
      const saved = list instanceof HTMLElement ? list.scrollTop : 0;
      nextHeader.focus();
      if (list instanceof HTMLElement) {
        list.scrollTop = saved;
        requestAnimationFrame(() => {
          list.scrollTop = saved;
        });
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);
  return <PathFieldsImpl node={node} />;
}
