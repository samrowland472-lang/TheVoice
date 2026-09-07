import { useSyncExternalStore } from "react";
import {
  getStudioStatus,
  isHeldStudioStatus,
  subscribeStudioStatus,
} from "@/lib/design/studio-status";

export function StudioStatusStrip() {
  const status = useSyncExternalStore(subscribeStudioStatus, getStudioStatus, getStudioStatus);
  const held = useSyncExternalStore(subscribeStudioStatus, isHeldStudioStatus, isHeldStudioStatus);
  if (!status) return null;
  return (
    <div
      className="shrink-0 border-t border-border bg-surface px-3 py-1.5 font-mono text-[10px] tracking-[0.08em] text-phosphor"
      aria-live="polite"
      data-studio-status={held ? "held" : "live"}
    >
      {status}
    </div>
  );
}
