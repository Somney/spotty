import { Collection, Track } from '../types';
import { getJson } from './http';

// Radio Browser: a community directory of internet radio stations. The stations are ordinary
// licensed broadcasters, which is how chart music can be streamed here legitimately.
const BASE = 'https://de1.api.radio-browser.info/json';

export const RADIO_TAGS = [
  { label: 'Hit Radio', tag: 'top 40' },
  { label: 'Pop Radio', tag: 'pop' },
  { label: 'Hip-hop Radio', tag: 'hip hop' },
  { label: 'Rock Radio', tag: 'rock' },
  { label: 'Dance Radio', tag: 'dance' },
  { label: 'R&B Radio', tag: 'rnb' },
  { label: 'Country Radio', tag: 'country' },
  { label: 'Latin Radio', tag: 'latin' },
  { label: 'Jazz Radio', tag: 'jazz' },
  { label: 'Classical Radio', tag: 'classical' },
  { label: '80s Radio', tag: '80s' },
  { label: '90s Radio', tag: '90s' },
  { label: 'Oldies Radio', tag: 'oldies' },
];

export const radioCollection = (r: { label: string; tag: string }): Collection => ({
  id: `radio:${r.tag}`,
  kind: 'radio',
  title: r.label,
  subtitle: 'Live stations',
  ref: r.tag,
  icon: 'radio',
});

// The directory is open to anyone, so it carries a lot of keyword-stuffed listings.
function looksLegit(s: any): boolean {
  const name = String(s.name ?? '').trim();
  if (name.length < 2 || name.length > 40) return false;
  if (!/^[\p{L}\p{N}]/u.test(name)) return false; // "# TOP 100 --", "-- CHARTS --"
  if (/[#|*_=~]|-{2,}|\s{3,}/.test(name)) return false;
  if (String(s.tags ?? '').split(',').length > 12) return false;
  if (s.hls !== 0 || s.lastcheckok !== 1) return false;
  if (!/^(MP3|AAC\+?)$/.test(s.codec)) return false;
  // HE-AAC sounds fine at low rates; MP3 does not.
  if (s.bitrate && s.bitrate < (s.codec === 'MP3' ? 96 : 48)) return false;
  if (!String(s.url_resolved ?? '').startsWith('https://')) return false;
  return true;
}

const SHORT: Record<string, string> = {
  GB: 'United Kingdom',
  US: 'United States',
  RU: 'Russia',
  NL: 'Netherlands',
  KR: 'South Korea',
  AE: 'UAE',
};

function toTrack(s: any): Track {
  const logo = String(s.favicon ?? '').startsWith('https://') ? s.favicon : undefined;
  const country = SHORT[s.countrycode] ?? String(s.country ?? '').replace(/^The /, '');
  return {
    id: `radio:${s.stationuuid}`,
    source: 'radio',
    title: String(s.name).trim(),
    artist: ['Live radio', country].filter(Boolean).join(' · '),
    artwork: logo,
    artworkLarge: logo,
    streamUrl: s.url_resolved,
    isLive: true,
  };
}

/** Two-letter country of the device, e.g. "US", when the system exposes one. */
function region(): string | undefined {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale.match(/[-_]([A-Z]{2})\b/)?.[1];
  } catch {
    return undefined;
  }
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = t.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function query(params: string, limit: number): Promise<Track[]> {
  // Ask for extra rows: a good share is filtered out.
  const r = await getJson<any[]>(`${BASE}/stations/search?${params}&order=clickcount&reverse=true&hidebroken=true&is_https=true&limit=${limit * 4}`);
  return r.filter(looksLegit).map(toTrack);
}

// Stations with a logo go first; they are also the better-run ones.
const logoFirst = (tracks: Track[]) => [...tracks.filter((t) => t.artwork), ...tracks.filter((t) => !t.artwork)];

/** Popular stations for a genre: the listener's own country first, then English-language ones worldwide. */
export async function stations(tag: string, limit = 30): Promise<Track[]> {
  const base = `tag=${encodeURIComponent(tag)}&tagExact=true`;
  const here = region();
  const [local, english] = await Promise.all([
    here ? query(`${base}&countrycode=${here}`, limit).catch(() => []) : Promise.resolve([]),
    query(`${base}&language=english`, limit),
  ]);
  const merged = dedupe([...logoFirst(local), ...logoFirst(english)]);
  // Very small genres may have nothing in English; fall back to everything.
  if (merged.length >= 6) return merged.slice(0, limit);
  return dedupe([...merged, ...logoFirst(await query(base, limit))]).slice(0, limit);
}

export async function searchStations(name: string, limit = 12): Promise<Track[]> {
  return dedupe(logoFirst(await query(`name=${encodeURIComponent(name)}`, limit))).slice(0, limit);
}
