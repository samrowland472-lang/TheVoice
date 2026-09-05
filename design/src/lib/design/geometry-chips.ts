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
