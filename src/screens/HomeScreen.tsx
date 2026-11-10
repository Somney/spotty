import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as archive from '../api/archive';
import * as audius from '../api/audius';
import * as radio from '../api/radio';
import * as charts from '../api/charts';
import { ALL_TIME, TOP_SONGS, UNDERGROUND, eraCollection, genreCollection } from '../collections';
import { trackArt } from '../components/Artwork';
import { SectionTitle, Shelf, ShelfItem, StateNote } from '../components/Shelf';
import { Tap } from '../components/Tap';
import { TileRow } from '../components/TileRow';
import { TrackRow } from '../components/TrackRow';
import { usePlayer } from '../state/player';
import { colors, gradientFor, radius, space } from '../theme';
import { Collection, Track } from '../types';
import { useAsync } from '../useAsync';

const HIT_RADIO = radio.RADIO_TAGS[0];
const HOME = radio.homeCountry();
const THROWBACK = radio.RADIO_TAGS.find((r) => r.tag === 'oldies')!;

function today() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

export function HomeScreen({ onOpen }: { onOpen: (c: Collection) => void }) {
  const player = usePlayer();

  const trending = useAsync(() => audius.trending({ time: 'week', limit: 30 }), 'trend');
  const chart = useAsync(() => charts.top(HOME.code, 25), 'chart:home');
  const local = useAsync(() => radio.topInCountry(HOME.code, 14), 'radio:home');
  const hits = useAsync(() => radio.stations(HIT_RADIO.tag, 14), 'radio:hits');
  const fresh = useAsync(() => audius.underground(20), 'underground');
  const playlists = useAsync(() => audius.trendingPlaylists(12), 'playlists');
  const throwback = useAsync(() => radio.stations(THROWBACK.tag, 14), 'radio:oldies');
  const vault = useAsync(() => archive.vintage({ rows: 20 }), 'vault');
  const live = useAsync(() => archive.concerts({ rows: 12 }), 'live');
  const classics = useAsync(() => audius.trending({ time: 'allTime', limit: 20 }), 'allTime');

  const trackItems = (tracks: Track[] | null): ShelfItem[] =>
    (tracks ?? []).map((t, i) => ({
      key: t.id,
      title: t.title,
      subtitle: t.source === 'archive' && t.year ? `${t.artist} · ${t.year}` : t.source === 'radio' ? t.artist.replace('Live radio · ', '') : t.artist,
      artwork: t.artworkLarge ?? t.artwork,
      ...trackArt(t),
      onPress: () => player.playQueue(tracks!, i, { shuffle: false }),
    }));

  const collectionItems = (cols: Collection[] | null, icon: string): ShelfItem[] =>
    (cols ?? []).map((c) => ({ key: c.id, title: c.title, subtitle: c.subtitle, artwork: c.artwork, icon, lookup: c.artist, onPress: () => onOpen(c) }));

  const lead = trending.data?.[0];
  const top = trending.data?.slice(1, 6) ?? [];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <Text style={styles.date}>{today()}</Text>
        <Text style={styles.largeTitle}>Listen Now</Text>
      </View>

      {lead ? (
        <Tap
          onPress={() => player.playQueue(trending.data!, 0, { shuffle: false })}
          style={styles.hero}
          scale={0.98}
          accessibilityRole="button"
          accessibilityLabel={`Play ${lead.title}, ${lead.artist}`}
        >
          <LinearGradient colors={gradientFor(lead.id)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {lead.artworkLarge ? <Image source={{ uri: lead.artworkLarge }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} /> : null}
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroText}>
            <Text style={styles.heroEyebrow}>NUMBER ONE THIS WEEK</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {lead.title}
            </Text>
            <Text style={styles.heroArtist} numberOfLines={1}>
              {lead.artist}
            </Text>
          </View>
          <View style={styles.heroPlay}>
            <Ionicons name="play" size={20} color={colors.text} style={{ marginLeft: 2 }} />
          </View>
        </Tap>
      ) : (
        <View style={[styles.hero, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }]}>
          <StateNote state={trending} empty="Nothing to show right now." />
        </View>
      )}

      {top.length ? (
        <View style={{ marginTop: space.xl }}>
          <SectionTitle title="Top Songs" onSeeAll={() => onOpen(TOP_SONGS)} />
          {top.map((t, i) => (
            <TrackRow key={t.id} track={t} active={player.current?.id === t.id} onPress={() => player.playQueue(trending.data!, i + 1, { shuffle: false })} />
          ))}
        </View>
      ) : null}

      <Shelf title="Top Charts" items={trackItems(chart.data)} state={chart} onSeeAll={() => onOpen(charts.chartCollection(HOME))} />
      <TileRow title="Genres" tiles={audius.GENRES.map(genreCollection)} onOpen={onOpen} />

      <Shelf title={`Radio in ${HOME.name}`} items={trackItems(local.data)} state={local} onSeeAll={() => onOpen(radio.countryCollection(HOME))} />
      <Shelf title="Hit Radio" items={trackItems(hits.data)} state={hits} onSeeAll={() => onOpen(radio.radioCollection(HIT_RADIO))} />
      <Shelf title="New & Rising" items={trackItems(fresh.data)} state={fresh} onSeeAll={() => onOpen(UNDERGROUND)} />
      <TileRow title="Around the World" tiles={radio.COUNTRIES.filter((c) => c.code !== HOME.code).map(radio.countryCollection)} onOpen={onOpen} />
      <Shelf title="Playlists" items={collectionItems(playlists.data, 'albums')} state={playlists} />
      <Shelf title="Throwback Radio" items={trackItems(throwback.data)} state={throwback} onSeeAll={() => onOpen(radio.radioCollection(THROWBACK))} />
      <Shelf title="From the Vault" items={trackItems(vault.data)} state={vault} onSeeAll={() => onOpen(eraCollection(archive.ERAS[2]))} />
      <Shelf title="Live Concerts" items={collectionItems(live.data, 'mic')} state={live} />
      <Shelf title="All-Time Favourites" items={trackItems(classics.data)} state={classics} onSeeAll={() => onOpen(ALL_TIME)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.lg, paddingTop: space.md },
  date: { color: colors.sub, fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  largeTitle: { color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.6, marginTop: 2 },
  hero: { marginHorizontal: space.lg, marginTop: space.lg, aspectRatio: 1.1, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  heroText: { padding: space.lg, paddingRight: 80 },
  heroEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  heroTitle: { color: colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.4, marginTop: 4 },
  heroArtist: { color: 'rgba(255,255,255,0.75)', fontSize: 16, marginTop: 2 },
  heroPlay: {
    position: 'absolute',
    right: space.lg,
    bottom: space.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
