export const colors = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceHi: '#2C2C2E',
  border: '#38383A',
  text: '#FFFFFF',
  sub: '#98989F',
  faint: '#636366',
  accent: '#FF9F0A',
  accentInk: '#1A1204',
  danger: '#FF453A',
};

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 40 };

/** Neutral backdrop for artwork that has not loaded or does not exist. */
export const placeholder: [string, string] = ['#3A3A3C', '#1C1C1E'];

// Deep, desaturated pairs: used for browse tiles and the player backdrop only.
const PALETTES: [string, string][] = [
  ['#8E4A2B', '#3B1D12'],
  ['#4B3F8F', '#1D1840'],
  ['#1F6F68', '#0C2E2F'],
  ['#8A3A5E', '#381528'],
  ['#2F5C94', '#12253F'],
  ['#7A6426', '#30270E'],
  ['#3E7A45', '#17301C'],
  ['#6D4391', '#2A193B'],
];

export function gradientFor(key: string): [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function formatTime(seconds: number | undefined): string {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
