import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { campaignPages } from "@/lib/design/campaign";
import {
  exitPresentFullscreen,
  presentRootIsFullscreen,
  togglePresentFullscreen,
} from "@/lib/design/present-fullscreen";
import {
  PRESENT_IDLE_MS,
  isQuietPresentNavKey,
  isQuietPresentPeekTarget,
  peekAfterLostCapture,
  peekCaptionAfterQuietHomeEnd,
  peekCaptionAfterMutedPointerUp,
  peekCaptionAfterShiftRelease,
  peekCaptionNameId,
  peekTickAfterMutedPointerUp,
  peekTickAfterQuietHomeEnd,
  peekTickFadeShouldRestartAfterLostCapture,
  peekScrubIndex,
  shouldHidePresentChrome,
  shouldShowPresentPeek,
} from "@/lib/design/present-idle";
import { screenToDoc } from "@/lib/design/render";
import { useDesign } from "@/lib/design/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CanvasStage } from "./canvas-stage";
import { PresentChipRail } from "./present-chip-menu";
import { PresentNotesJump } from "./present-notes-jump";
import {
  applyWindowBlur,
  peekCaptionAfterLostCaptureCurrentHover,
  peekCaptionAfterQuietEscapeAfterKeepClear,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter,
  peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver,
} from "@/lib/design/present-lost-capture";
