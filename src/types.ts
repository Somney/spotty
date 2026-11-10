export type Source = 'audius' | 'archive';

export interface Track {
  /** Globally unique, prefixed by source. */
  id: string;
  source: Source;
  title: string;
  artist: string;
  artwork?: string;
  artworkLarge?: string;
  duration?: number;
  year?: number;
  /** Direct audio URL. Archive singles resolve this lazily at play time. */
  streamUrl?: string;
  /** Internet Archive item identifier, when the stream still needs resolving. */
  archiveId?: string;
  /** Audius user id and picture, for opening the artist's page. */
  artistId?: string;
  artistArtwork?: string;
}

export type CollectionKind = 'playlist' | 'concert' | 'genre' | 'era' | 'artist' | 'chart' | 'liked' | 'recent';

export interface Collection {
  id: string;
  kind: CollectionKind;
  title: string;
  subtitle: string;
  artwork?: string;
  /** Kind-specific lookup value: playlist id, archive id, genre name, "1910-1919", artist id, chart name. */
  ref: string;
  icon?: string;
}
