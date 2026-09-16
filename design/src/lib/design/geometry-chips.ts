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
