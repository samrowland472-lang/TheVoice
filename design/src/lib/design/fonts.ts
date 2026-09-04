export type FontAxisTag = "opsz" | "wdth" | "slnt" | "ital" | "GRAD" | "SOFT";

export interface FontAxis {
  tag: FontAxisTag;
  min: number;
  max: number;
  fallback: number;
}

export interface CanvasFont {
  id: string;
  family: string;
  fallback: string;
  weights: number[];
  role: "display" | "body" | "mono";
  opsz?: FontAxis;
  wdth?: FontAxis;
  slnt?: FontAxis;
  ital?: FontAxis;
  GRAD?: FontAxis;
  SOFT?: FontAxis;
}
