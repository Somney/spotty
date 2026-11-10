import * as archive from './api/archive';
import * as audius from './api/audius';
import { Collection, Track } from './types';

/** Tracks for the collections that are fetched over the network. */
export function loadCollection(c: Collection): Promise<Track[]> {
  switch (c.kind) {
    case 'playlist':
      return audius.playlistTracks(c.ref);
    case 'concert':
      return archive.itemTracks(c.ref);
    case 'genre':
      return audius.trending({ genre: c.ref, time: 'month', limit: 50 });
    case 'era': {
      const [from, to] = c.ref.split('-').map(Number);
      return archive.vintage({ from, to, rows: 50 });
    }
    default:
      return Promise.resolve([]);
  }
}

export const genreCollection = (genre: string): Collection => ({
  id: `genre:${genre}`,
  kind: 'genre',
  title: genre,
  subtitle: 'Trending this month',
  ref: genre,
  icon: 'pulse',
});

export const eraCollection = (era: { label: string; ref: string }): Collection => ({
  id: `era:${era.ref}`,
  kind: 'era',
  title: `The ${era.label}`,
  subtitle: 'Original 78rpm records · public domain',
  ref: era.ref,
  icon: 'disc',
});

export const LIKED: Collection = { id: 'liked', kind: 'liked', title: 'Liked songs', subtitle: 'Saved on this device', ref: '', icon: 'heart' };
export const RECENT: Collection = { id: 'recent', kind: 'recent', title: 'Recently played', subtitle: 'Your listening history', ref: '', icon: 'time' };
