import { useEffect } from "react";
import { installCampaignPdfSmokeHook } from "@/lib/design/campaign-pdf-smoke";

export function CampaignPdfSmokeBridge() {
  useEffect(() => {
    installCampaignPdfSmokeHook();
  }, []);
  return null;
}
