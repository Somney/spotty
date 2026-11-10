import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as archive from '../api/archive';
import * as audius from '../api/audius';
import * as radio from '../api/radio';
import * as charts from '../api/charts';
import { MOST_SHARED, TOP_MONTH, UNDERGROUND, eraCollection, genreCollection } from '../collections';
import { trackArt } from '../components/Artwork';
import { SectionTitle, Shelf, StateNote } from '../components/Shelf';
import { Tap } from '../components/Tap';
import { TrackRow } from '../components/TrackRow';
import { usePlayer } from '../state/player';
import { colors, gradientFor, radius, space } from '../theme';
import { Collection, Track } from '../types';
import { useAsync } from '../useAsync';

const HOME = radio.homeCountry();

function Results({ query, onOpen }: { query: string; onOpen: (c: Collection) => void }) {
  const player = usePlayer();
  const songs = useAsync(() => audius.searchTracks(query), `s:${query}`);
  const artists = useAsync(() => audius.searchArtists(query), `a:${query}`);
  const stations = useAsync(() => radio.searchStations(query), `r:${query}`);
  const old = useAsync(() => archive.vintage({ query, rows: 12 }), `v:${query}`);
  const shows = useAsync(() => archive.concerts({ query, rows: 10 }), `c:${query}`);
  const lists = useAsync(() => audius.searchPlaylists(query), `p:${query}`);
  const hits = useAsync(() => charts.search(query, HOME.code), `h:${query}`);


  const rows = (state: typeof songs, limit: number) =>
    state.data?.length ? (
      state.data.slice(0, limit).map((t: Track, i: number) => (
        <TrackRow key={t.id} track={t} active={player.current?.id === t.id} onPress={() => player.playQueue(state.data!, i, { shuffle: false })} />
      ))
    ) : (
      <StateNote state={state} empty="No results." />
    );

  const cards = (cols: Collection[] | null, icon: string) =>
    (cols ?? []).map((c) => ({ key: c.id, title: c.title, subtitle: c.subtitle, artwork: c.artwork, icon, lookup: c.artist, onPress: () => onOpen(c) }));

  const stationCards = (stations.data ?? []).map((t, i) => ({
    key: t.id,
    title: t.title,
    subtitle: t.artist.replace('Live radio · ', ''),
    artwork: t.artwork,
    ...trackArt(t),
    onPress: () => player.playQueue(stations.data!, i, { shuffle: false }),
  }));

  return (
    <>
      <View style={{ marginTop: space.xl }}>
        <SectionTitle title="Songs" />
        {rows(songs, 10)}
      </View>
      {hits.data?.length !== 0 ? (
        <View style={{ marginTop: space.xl }}>
          <SectionTitle title="Chart Songs" />
          {rows(hits, 8)}
        </View>
      ) : null}
      <Shelf title="Artists" items={cards(artists.data, 'person')} state={artists} />
      <Shelf title="Radio Stations" items={stationCards} state={stations} />
      {old.data?.length !== 0 ? (
        <View style={{ marginTop: space.xl }}>
          <SectionTitle title="From the Vault" />
          {rows(old, 6)}
        </View>
      ) : null}
      <Shelf title="Live Concerts" items={cards(shows.data, 'mic')} state={shows} />
      <Shelf title="Playlists" items={cards(lists.data, 'albums')} state={lists} />
    </>
  );
}

export function SearchScreen({ onOpen }: { onOpen: (c: Collection) => void }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const groups: { title: string; tiles: Collection[] }[] = [
    { title: 'Top Charts', tiles: [charts.chartCollection(HOME), ...charts.CHART_GENRES.map((g) => charts.chartCollection(HOME, g))] },
    { title: 'Radio', tiles: radio.RADIO_TAGS.map(radio.radioCollection) },
    { title: 'Genres', tiles: [TOP_MONTH, UNDERGROUND, MOST_SHARED, ...audius.GENRES.map(genreCollection)] },
    { title: 'Decades', tiles: archive.ERAS.map(eraCollection) },
    { title: 'Countries', tiles: radio.COUNTRIES.map(radio.countryCollection) },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.largeTitle}>Search</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.sub} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Artists, Songs, Stations and More"
          placeholderTextColor={colors.sub}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          selectionColor={colors.accent}
          onSubmitEditing={() => setQuery(text.trim())}
          accessibilityLabel="Search music"
        />
        {text ? (
          <Pressable onPress={() => setText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.sub} />
          </Pressable>
        ) : null}
      </View>

      {query.length >= 2 ? (
        <Results query={query} onOpen={onOpen} />
      ) : (
        groups.map((g) => (
          <View key={g.title} style={{ marginTop: space.xl }}>
            <SectionTitle title={g.title} />
            <View style={styles.grid}>
              {g.tiles.map((c) => (
                <View key={c.id} style={styles.tileWrap}>
                  <Tap onPress={() => onOpen(c)} accessibilityRole="button" accessibilityLabel={c.title}>
                    <LinearGradient colors={gradientFor(c.id)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
                      <Text style={styles.tileText} numberOfLines={2}>
                        {c.title.replace(/ Radio$/, '').replace(/^Top Charts: .*/, 'All Genres')}
                      </Text>
                    </LinearGradient>
                  </Tap>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: { color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.6, paddingHorizontal: space.lg, paddingTop: space.md },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: space.lg,
    marginTop: space.md,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, color: colors.text, fontSize: 17, height: 40, outlineStyle: 'none' } as any,
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.lg - 6 },
  tileWrap: { width: '50%', padding: 6 },
  tile: { height: 84, borderRadius: radius.md, padding: space.md, justifyContent: 'flex-end' },
  tileText: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
});
