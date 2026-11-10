import { Collection, Track } from '../types';
import { getJson } from './http';

// Internet Archive. Two parts of it are used:
//  - 78rpm records published 1900-1925, which are in the US public domain.
//  - The Live Music Archive ("etree"): concert recordings shared with the bands' permission.
const SEARCH = 'https://archive.org/advancedsearch.php';

export const VINTAGE_FROM = 1900;
export const VINTAGE_TO = 1925;

export const ERAS = [
  { label: '1900s', ref: '1900-1909' },
  { label: '1910s', ref: '1910-1919' },
  { label: '1920s', ref: '1920-1925' },
];

function first(v: unknown): string | undefined {
  if (Array.isArray(v)) return v[0] != null ? String(v[0]) : undefined;
  return v != null ? String(v) : undefined;
}

function searchUrl(q: string, rows: number, sort: string) {
  const fields = ['identifier', 'title', 'creator', 'year'].map((f) => `fl[]=${f}`).join('&');
  return `${SEARCH}?q=${encodeURIComponent(q)}&${fields}&rows=${rows}&sort[]=${encodeURIComponent(sort)}&output=json`;
}

// Strip characters that have meaning in the Archive's Lucene query syntax.
function clean(text: string) {
  return text.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim();
}

export async function vintage(opts: { query?: string; from?: number; to?: number; rows?: number } = {}): Promise<Track[]> {
  const from = Math.max(opts.from ?? VINTAGE_FROM, VINTAGE_FROM);
  const to = Math.min(opts.to ?? VINTAGE_TO, VINTAGE_TO);
  const text = opts.query ? clean(opts.query) : '';
  if (opts.query && !text) return [];
  const q = `collection:78rpm AND mediatype:audio AND year:[${from} TO ${to}]${text ? ` AND (${text})` : ''}`;
  const r = await getJson<{ response: { docs: any[] } }>(searchUrl(q, opts.rows ?? 30, 'downloads desc'));
  return r.response.docs.map((d) => ({
    id: `archive:${d.identifier}`,
    source: 'archive' as const,
    title: first(d.title) ?? d.identifier,
    artist: first(d.creator) ?? 'Unknown artist',
    year: d.year ? Number(d.year) : undefined,
    archiveId: d.identifier,
  }));
}

export async function concerts(opts: { query?: string; rows?: number } = {}): Promise<Collection[]> {
  const text = opts.query ? clean(opts.query) : '';
  if (opts.query && !text) return [];
  const q = `collection:etree AND mediatype:etree${text ? ` AND (${text})` : ''}`;
  const r = await getJson<{ response: { docs: any[] } }>(searchUrl(q, opts.rows ?? 12, 'downloads desc'));
  return r.response.docs.map((d) => {
    const artist = first(d.creator) ?? 'Live recording';
    const full = first(d.title) ?? d.identifier;
    // "Band Live at Venue on 1977-05-08" -> "Venue"
    const venue = full.match(/ Live at (.+?)(?: on \d{4}-\d{2}-\d{2})?$/)?.[1];
    return {
      id: `archive-item:${d.identifier}`,
      kind: 'concert' as const,
      title: venue ? `${artist} — ${venue}` : full,
      subtitle: `Live${d.year ? ` · ${d.year}` : ''} · ${artist}`,
      ref: d.identifier,
    };
  });
}

function parseLength(v: unknown): number | undefined {
  const s = first(v);
  if (!s) return undefined;
  if (s.includes(':')) return s.split(':').reduce((acc, part) => acc * 60 + Number(part), 0) || undefined;
  const n = Number(s);
  return isFinite(n) && n > 0 ? n : undefined;
}

/** All playable tracks inside one Archive item, in order. */
export async function itemTracks(id: string): Promise<Track[]> {
  const r = await getJson<{ metadata?: any; files?: any[] }>(`https://archive.org/metadata/${id}`, 20000);
  const files = (r.files ?? []).filter((f) => /\.mp3$/i.test(f.name ?? ''));
  // Items carry several encodes of the same audio; keep one per recording.
  const vbr = files.filter((f) => f.format === 'VBR MP3' && !/_vbr\.mp3$/i.test(f.name));
  const main = vbr.filter((f) => !f.name.startsWith('_'));
  const picked = main.length ? main : vbr.length ? vbr : files.slice(0, 1);
  const year = Number(String(first(r.metadata?.date) ?? first(r.metadata?.year) ?? '').slice(0, 4)) || undefined;
  return picked.map((f) => ({
    id: `archive:${id}/${f.name}`,
    source: 'archive' as const,
    title: first(f.title) ?? first(r.metadata?.title) ?? f.name.replace(/\.mp3$/i, ''),
    artist: first(f.creator) ?? first(r.metadata?.creator) ?? 'Unknown artist',
    duration: parseLength(f.length),
    year,
    streamUrl: `https://archive.org/download/${id}/${f.name.split('/').map(encodeURIComponent).join('/')}`,
  }));
}

/** Turns a search-result single into something with a stream URL. */
export async function resolve(track: Track): Promise<Track> {
  if (track.streamUrl || !track.archiveId) return track;
  const tracks = await itemTracks(track.archiveId);
  if (!tracks.length) throw new Error('No playable audio in this recording');
  return { ...track, streamUrl: tracks[0].streamUrl, duration: tracks[0].duration };
}
