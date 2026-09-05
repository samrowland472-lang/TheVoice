import {
  cloneShadow,
  DEFAULT_SHADOW,
  shadowChipLabel,
  shadowKey,
  stampShadowBlur,
  stampShadowColor,
  stampShadowOx,
  stampShadowOy,
} from "@/lib/design/shadow";
import { useDesign } from "@/lib/design/store";
import type { BlendMode, DesignNode, Shadow } from "@/lib/design/types";
import { cn } from "@/lib/utils";
import {
  MixedBlendChips,
  MixedFillChips,
  MixedLockChips,
  MixedOpacityChips,
  MixedShadowBlurChips,
  MixedShadowColorChips,
  MixedShadowOffsetChips,
  MixedStrokeChips,
  MixedVisibilityChips,
} from "./mixed-ink-chips";
