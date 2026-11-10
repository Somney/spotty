import { Collection, Track } from '../types';
import { getJson } from './http';

// Audius: open streaming catalog where artists publish directly. Free, no ads.
const BASE = 'https://api.audius.co/v1';
const APP = 'app_name=spotty';

export const GENRES = [
  'Electronic',
  'Hip-Hop/Rap',
  'Pop',
  'Rock',
  'Lo-Fi',
  'R&B/Soul',
  'Alternative',
  'House',
  'Jazz',
  'Ambient',
  'Latin',
  'Country',
  'Classical',
  'Reggae',
  'Metal',
  'Folk',
];

function url(path: string, params: Record<string, string | number | undefined> = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${BASE}${path}?${qs ? qs + '&' : ''}${APP}`;
}

function toTrack(t: any): Track | null {
  if (!t?.id || t.is_delete || t.is_stream_gated || t.is_streamable === false) return null;
  return {
    id: `audius:${t.id}`,
    source: 'audius',
    title: t.title ?? 'Untitled',
    artist: t.user?.name ?? 'Unknown artist',
    artwork: t.artwork?.['150x150'],
    artworkLarge: t.artwork?.['480x480'] ?? t.artwork?.['1000x1000'],
    duration: t.duration,
    year: t.release_date ? new Date(t.release_date).getFullYear() : undefined,
    streamUrl: `${BASE}/tracks/${t.id}/stream?${APP}`,
  };
}

function toTracks(list: any[] | undefined): Track[] {
  return (list ?? []).map(toTrack).filter((t): t is Track => t !== null);
}

function toCollection(p: any): Collection {
  return {
    id: `audius-pl:${p.id}`,
    kind: 'playlist',
    title: p.playlist_name ?? 'Playlist',
    subtitle: `${p.is_album ? 'Album' : 'Playlist'} · ${p.user?.name ?? 'Audius'}`,
    artwork: p.artwork?.['480x480'] ?? p.artwork?.['150x150'],
    ref: p.id,
  };
}

export async function trending(opts: { genre?: string; time?: 'week' | 'month' | 'allTime'; limit?: number } = {}) {
  const r = await getJson<{ data: any[] }>(
    url('/tracks/trending', { genre: opts.genre, time: opts.time ?? 'week', limit: opts.limit ?? 30 })
  );
  return toTracks(r.data);
}

export async function searchTracks(query: string, limit = 25) {
  const r = await getJson<{ data: any[] }>(url('/tracks/search', { query, limit }));
  return toTracks(r.data);
}

export async function trendingPlaylists(limit = 12) {
  const r = await getJson<{ data: any[] }>(url('/playlists/trending', { limit }));
  return (r.data ?? []).filter((p) => !p.is_private && !p.is_stream_gated).map(toCollection);
}

export async function searchPlaylists(query: string, limit = 10) {
  const r = await getJson<{ data: any[] }>(url('/playlists/search', { query, limit }));
  return (r.data ?? []).filter((p) => !p.is_private && !p.is_stream_gated).map(toCollection);
}

export async function playlistTracks(id: string) {
  const r = await getJson<{ data: any[] }>(url(`/playlists/${id}/tracks`));
  return toTracks(r.data);
}
