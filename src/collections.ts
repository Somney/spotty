import * as archive from './api/archive';
import * as audius from './api/audius';
import * as radio from './api/radio';
import * as youtube from './api/youtube';
import { Collection, Track } from './types';

/** Tracks for the collections that are fetched over the network. */
export function loadCollection(c: Collection): Promise<Track[]> {
  switch (c.kind) {
    case 'playlist':
      return audius.playlistTracks(c.ref);
    case 'concert':
      return archive.itemTracks(c.ref);
    case 'artist':
      return audius.artistTracks(c.ref);
    case 'chart':
      if (c.ref === 'trending') return audius.trending({ time: 'week', limit: 50 });
      if (c.ref === 'allTime') return audius.trending({ time: 'allTime', limit: 50 });
      return c.ref === 'underground' ? audius.underground(50) : audius.mostShared(50);
    case 'radio':
      return c.ref.startsWith('country:') ? radio.topInCountry(c.ref.slice(8), 40) : radio.stations(c.ref, 40);
    case 'youtube':
      return youtube.popular(c.ref, 50);
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
  subtitle: 'Top songs this month',
  ref: genre,
  icon: 'pulse',
});

export const eraCollection = (era: { label: string; ref: string }): Collection => ({
  id: `era:${era.ref}`,
  kind: 'era',
  title: `The ${era.label}`,
  subtitle: 'Original 78rpm records',
  ref: era.ref,
  icon: 'disc',
});

export const LIKED: Collection = { id: 'liked', kind: 'liked', title: 'Favourite Songs', subtitle: 'Saved on this device', ref: '', icon: 'heart' };
export const RECENT: Collection = { id: 'recent', kind: 'recent', title: 'Recently Played', subtitle: 'Your listening history', ref: '', icon: 'time' };

export const UNDERGROUND: Collection = { id: 'chart:underground', kind: 'chart', title: 'New & Rising', subtitle: 'Released in the last few days', ref: 'underground', icon: 'rocket' };
export const MOST_SHARED: Collection = { id: 'chart:most-shared', kind: 'chart', title: 'Most Shared', subtitle: 'What people are passing around', ref: 'most-shared', icon: 'share-social' };
export const TOP_SONGS: Collection = { id: 'chart:trending', kind: 'chart', title: 'Top Songs', subtitle: 'This week', ref: 'trending', icon: 'trending-up' };
export const ALL_TIME: Collection = { id: 'chart:allTime', kind: 'chart', title: 'All-Time Favourites', subtitle: 'The most played ever', ref: 'allTime', icon: 'star' };
