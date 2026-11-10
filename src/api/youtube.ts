import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Collection, Track } from '../types';
import { getJson } from './http';

// YouTube, through its official Data API and embedded player. The API needs a key, which each
// person adds in Library > YouTube; a build can also ship one via EXPO_PUBLIC_YOUTUBE_KEY.
const BASE = 'https://www.googleapis.com/youtube/v3';
const STORE = 'spotty.youtubeKey.v1';

let key: string = process.env.EXPO_PUBLIC_YOUTUBE_KEY ?? '';
let loaded = false;
const listeners = new Set<() => void>();

const ready = AsyncStorage.getItem(STORE)
  .then((saved) => {
    if (saved) key = saved;
  })
  .catch(() => {})
  .then(() => {
    loaded = true;
    listeners.forEach((l) => l());
  });

export async function setKey(value: string) {
  key = value.trim();
  if (key) await AsyncStorage.setItem(STORE, key).catch(() => {});
  else await AsyncStorage.removeItem(STORE).catch(() => {});
  listeners.forEach((l) => l());
}

/** The saved key ('' when none), re-rendering when it changes. */
export function useYouTubeKey(): string {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    if (loaded) l();
    return () => void listeners.delete(l);
  }, []);
  return key;
}

function decode(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function toTrack(id: string | undefined, snippet: any): Track | null {
  if (!id || !snippet) return null;
  const thumbs = snippet.thumbnails ?? {};
  return {
    id: `youtube:${id}`,
    source: 'youtube',
    title: decode(snippet.title ?? 'Video'),
    artist: decode(String(snippet.channelTitle ?? 'YouTube').replace(/ - Topic$/, '')),
    artwork: thumbs.medium?.url ?? thumbs.default?.url,
    artworkLarge: thumbs.high?.url ?? thumbs.medium?.url,
    videoId: id,
  };
}

async function call(path: string, params: string): Promise<any[]> {
  await ready;
  if (!key) throw new Error('Add a YouTube key in Library first');
  try {
    const r = await getJson<{ items?: any[] }>(`${BASE}/${path}?${params}&key=${encodeURIComponent(key)}`);
    return r.items ?? [];
  } catch (e: any) {
    // The API answers 400/403 for a bad key or a used-up daily quota.
    if (/\((400|403)\)/.test(e?.message ?? '')) throw new Error('YouTube rejected the key, or its daily quota is used up');
    throw e;
  }
}

/** The music videos trending in a country right now. Cheap: one quota unit. */
export async function popular(regionCode: string, limit = 25): Promise<Track[]> {
  const items = await call(
    'videos',
    `part=snippet&chart=mostPopular&videoCategoryId=10&regionCode=${encodeURIComponent(regionCode)}&maxResults=${Math.min(limit, 50)}`
  );
  return items.map((i) => toTrack(i.id, i.snippet)).filter((t): t is Track => t !== null);
}

/** Music video search. Expensive (100 of the 10,000 free daily units), so only run on request. */
export async function search(query: string, limit = 20): Promise<Track[]> {
  const items = await call(
    'search',
    `part=snippet&type=video&videoCategoryId=10&videoEmbeddable=true&maxResults=${limit}&q=${encodeURIComponent(query)}`
  );
  return items.map((i) => toTrack(i.id?.videoId, i.snippet)).filter((t): t is Track => t !== null);
}

export const youtubeCollection = (c: { code: string; name: string }): Collection => ({
  id: `youtube:${c.code}`,
  kind: 'youtube',
  title: `Trending in ${c.name}`,
  subtitle: 'Music on YouTube',
  ref: c.code,
  icon: 'logo-youtube',
});
