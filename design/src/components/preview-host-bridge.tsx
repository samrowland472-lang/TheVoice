/**
 * Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
 * (and later receive registered routes). Noops when the app is not embedded.
 */

import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  collectRoutePathsFromTree,
  installPreviewHostBridge,
} from "@/lib/preview-host-bridge";
// campaign PDF hook is installed lazily so hub SSR does not pull canvas export.

export function PreviewHostBridge() {
  const router = useRouter();

  useEffect(() => {
    void import("@/lib/design/export-campaign").then((m) => m.installCampaignPdfSmokeHook());
    return installPreviewHostBridge({
      navigate: (path) => {
        router.history.push(path);
      },
      getRoutePaths: () => collectRoutePathsFromTree(router.routeTree),
    });
  }, [router]);

  return null;
}
