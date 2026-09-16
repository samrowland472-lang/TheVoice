export function rotationChipLabel(rotation: number): string {
  const r = Math.round(rotation);
  return `${r}°`;
}

export function radiusChipLabel(radius: number): string {
  return `r ${Math.round(radius)}`;
}

export function rotationKey(rotation: number): string {
  return String(Math.round(rotation * 10) / 10);
}

export function radiusKey(radius: number): string {
  return String(Math.round(radius * 10) / 10);
}

export function sidesChipLabel(sides: number, kind: string): string {
  const n = Math.max(3, Math.round(sides));
  return kind === "star" ? `${n}★` : `${n}gon`;
}

export function sidesKey(sides: number): string {
  return String(Math.max(3, Math.round(sides)));
}

export function headScaleChipLabel(scale: number): string {
  return `head ${Math.round(scale * 100)}%`;
}

export function headScaleKey(scale: number): string {
  return String(Math.round(scale * 100) / 100);
}

export function dashOffsetChipLabel(offset: number): string {
  return `off ${Math.round(offset)}`;
}

export function dashOffsetKey(offset: number): string {
  return String(Math.round(offset * 100) / 100);
}

export function miterChipLabel(miter: number): string {
  return `mit ${Math.round(miter * 10) / 10}`;
}

export function miterChipKey(miter: number): string {
  return String(Math.round(miter * 100) / 100);
}

export function dashChipLabel(dash: number): string {
  const d = Math.round((dash ?? 0) * 10) / 10;
  return d === 0 ? "solid" : `dash ${d}`;
}

export function dashChipKey(dash: number): string {
  return String(Math.round((dash ?? 0) * 100) / 100);
}

export function capChipLabel(cap: CanvasLineCap): string {
  return cap;
}

export function joinChipLabel(join: CanvasLineJoin): string {
  return join;
}

/** One-line preview of dash / cap / join for a mixed-kind unify chip. */
export function strokeRhythmChipLabel(
  dash: number,
  cap: CanvasLineCap,
  join: CanvasLineJoin,
): string {
  return `${dashChipLabel(dash)} · ${cap} · ${join}`;
}
