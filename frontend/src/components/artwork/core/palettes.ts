export const PALETTES = {
  astroGold: [
    [242, 180, 92],
    [255, 122, 60],
    [184, 115, 51],
    [255, 230, 150],
    [230, 160, 40],
  ] as [number, number, number][],
  cosmicViolet: [
    [214, 122, 245],
    [142, 68, 173],
    [244, 143, 177],
    [91, 44, 111],
    [220, 180, 255],
  ] as [number, number, number][],
  solarFlare: [
    [231, 76, 60],
    [243, 156, 18],
    [255, 99, 132],
    [180, 40, 40],
    [255, 200, 180],
  ] as [number, number, number][],
  oceanicDeep: [
    [110, 188, 255],
    [52, 152, 219],
    [41, 128, 185],
    [26, 188, 156],
    [180, 220, 255],
  ] as [number, number, number][],
  nebulaGreen: [
    [46, 204, 113],
    [26, 188, 156],
    [169, 223, 191],
    [30, 130, 76],
    [200, 255, 220],
  ] as [number, number, number][],
};

export const getProfilePalette = (tag: string, username: string): [number, number, number][] => {
  const text = (tag || username || "gallery").toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const keys = Object.keys(PALETTES) as (keyof typeof PALETTES)[];
  return PALETTES[keys[hash % keys.length]];
};

export const blendColor = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => {
  const clamped = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * clamped),
    Math.round(a[1] + (b[1] - a[1]) * clamped),
    Math.round(a[2] + (b[2] - a[2]) * clamped),
  ];
};
