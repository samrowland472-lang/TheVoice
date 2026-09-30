import { blankDocument } from "./templates";
import {
  campaignPdfPageCount,
  countPdfTypePageObjects,
  exportCampaignPdf,
} from "./export-campaign";
import type { DesignDocument } from "./types";

export function threeBoardCampaignFixture(): DesignDocument[] {
  return [
    blankDocument("card", "Board A"),
    blankDocument("card", "Board B"),
    blankDocument("card", "Board C"),
  ];
}

export function rasterThreeBoardCampaignPdf(scale = 1) {
  const docs = threeBoardCampaignFixture();
  const pdf = exportCampaignPdf(docs, scale);
  const typePages = countPdfTypePageObjects(pdf);
  return {
    expected: campaignPdfPageCount(docs),
    typePages,
    bytes: pdf.byteLength,
    header: new TextDecoder("latin1").decode(pdf.slice(0, 8)),
  };
}

declare global {
  interface Window {
    __voiceDesignCampaignPdfSmoke?: typeof rasterThreeBoardCampaignPdf;
  }
}

export function installCampaignPdfSmokeHook() {
  if (typeof window === "undefined") return;
  window.__voiceDesignCampaignPdfSmoke = rasterThreeBoardCampaignPdf;
}

installCampaignPdfSmokeHook();
