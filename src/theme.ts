export const colors = {
  bg: '#0B0B12',
  surface: '#15151E',
  surfaceHi: '#1F1F2B',
  border: '#2A2A38',
  text: '#F4F3F8',
  sub: '#9A99A8',
  faint: '#6B6A78',
  accent: '#FFB23F',
  accentInk: '#1A1204',
  danger: '#FF6B6B',
};

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Deterministic gradient per string, used as artwork fallback and for tiles.
const PALETTES: [string, string][] = [
  ['#FF8A3D', '#B3261E'],
  ['#7B5CFF', '#2A1B7A'],
  ['#18B6A0', '#0B4A52'],
  ['#F2569B', '#6A1B5E'],
  ['#3D8BFF', '#14306E'],
  ['#E0B33C', '#6B4A0E'],
  ['#5FC25B', '#1B4D2B'],
  ['#C06CFF', '#41206E'],
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
