import { Collection, Track } from '../types';
import { getJson } from './http';

// Apple's public chart and search feeds. They need no key and cover the mainstream catalogue,
// but only as 30-second previews: full on-demand playback of those songs needs a licence.
const HOST = 'https://itunes.apple.com';

export const CHART_GENRES = [
  { label: 'Pop', id: 14 },
  { label: 'Hip-Hop/Rap', id: 18 },
  { label: 'R&B/Soul', id: 15 },
  { label: 'Country', id: 6 },
  { label: 'Rock', id: 21 },
  { label: 'Alternative', id: 20 },
  { label: 'Dance', id: 17 },
  { label: 'Electronic', id: 7 },
  { label: 'Latin', id: 12 },
  { label: 'K-Pop', id: 51 },
  { label: 'Reggae', id: 24 },
  { label: 'Jazz', id: 11 },
];

// Feed artwork comes at 170px; the same image is served at any size named in the URL.
const big = (url: string | undefined, size: number) => url?.replace(/\/\d+x\d+bb\.(png|jpg)$/, `/${size}x${size}bb.jpg`);

export const chartCollection = (country: { code: string; name: string }, genre?: { label: string; id: number }): Collection => ({
  id: `preview:${country.code}:${genre?.id ?? 'all'}`,
  kind: 'preview',
  title: genre ? `Top ${genre.label}` : `Top Charts: ${country.name}`,
  subtitle: '30-second previews',
  ref: genre ? `${country.code}:${genre.id}` : country.code,
  icon: 'podium',
});

/** The current top songs chart for a country, optionally within one genre. */
export async function top(ref: string, limit = 50): Promise<Track[]> {
  const [country, genre] = ref.split(':');
  const r = await getJson<{ feed?: { entry?: any } }>(
    `${HOST}/${country.toLowerCase()}/rss/topsongs/limit=${limit}${genre ? `/genre=${genre}` : ''}/json`
  );
  const raw = r.feed?.entry;
  const entries: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return entries
    .map((e): Track | null => {
      const links: any[] = Array.isArray(e.link) ? e.link : [e.link];
      const preview = links.find((l) => l?.attributes?.['im:assetType'] === 'preview')?.attributes?.href;
      const id = e.id?.attributes?.['im:id'];
      if (!preview || !id) return null;
      const art = e['im:image']?.[e['im:image'].length - 1]?.label;
      return {
        id: `preview:${id}`,
        source: 'preview',
        title: e['im:name']?.label ?? 'Untitled',
        artist: e['im:artist']?.label ?? 'Unknown artist',
        artwork: big(art, 200),
        artworkLarge: big(art, 600),
        duration: 30,
        streamUrl: preview,
        isPreview: true,
      };
    })
    .filter((t): t is Track => t !== null);
}

export async function search(term: string, country: string, limit = 20): Promise<Track[]> {
  const r = await getJson<{ results?: any[] }>(
    // No media=music here: with it, Apple redirects iPhone browsers to an app link and the request dies.
    `${HOST}/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}&country=${country}`
  );
  return (r.results ?? [])
    .filter((s) => s.previewUrl && s.trackId)
    .map((s) => ({
      id: `preview:${s.trackId}`,
      source: 'preview' as const,
      title: s.trackName ?? 'Untitled',
      artist: s.artistName ?? 'Unknown artist',
      artwork: big(s.artworkUrl100, 200),
      artworkLarge: big(s.artworkUrl100, 600),
      duration: 30,
      year: s.releaseDate ? new Date(s.releaseDate).getFullYear() : undefined,
      streamUrl: s.previewUrl,
      isPreview: true,
    }));
}
