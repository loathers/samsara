function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function createConstrainedColor(
  key: string,
  minLightness: number,
  maxLightness: number,
): string {
  const hash = hashString(key);
  const hue = hash % 360;
  const lightness = minLightness + (hash % (maxLightness - minLightness));
  return `hsl(${hue}, 70%, ${lightness}%)`;
}
