import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as archive from '../api/archive';
import * as audius from '../api/audius';
import { eraCollection, genreCollection } from '../collections';
import { SectionTitle, Shelf, StateNote } from '../components/Shelf';
import { TrackRow } from '../components/TrackRow';
import { usePlayer } from '../state/player';
import { colors, gradientFor, radius, space } from '../theme';
import { Collection, Track } from '../types';
import { useAsync } from '../useAsync';

function Results({ query, onOpen }: { query: string; onOpen: (c: Collection) => void }) {
  const player = usePlayer();
  const songs = useAsync(() => audius.searchTracks(query), `s:${query}`);
  const old = useAsync(() => archive.vintage({ query, rows: 15 }), `v:${query}`);
  const shows = useAsync(() => archive.concerts({ query, rows: 10 }), `c:${query}`);
  const lists = useAsync(() => audius.searchPlaylists(query), `p:${query}`);

  const rows = (state: typeof songs, limit: number) =>
    state.data?.length ? (
      state.data.slice(0, limit).map((t: Track, i: number) => (
        <TrackRow
          key={t.id}
          track={t}
          active={player.current?.id === t.id}
          onPress={() => player.playQueue(state.data!, i, { shuffle: false })}
        />
      ))
    ) : (
      <StateNote state={state} empty="No matches." />
    );

  const cards = (cols: Collection[] | null, icon: string) =>
    (cols ?? []).map((c) => ({ key: c.id, title: c.title, subtitle: c.subtitle, artwork: c.artwork, icon, onPress: () => onOpen(c) }));

  return (
    <>
      <View style={{ marginTop: space.lg }}>
        <SectionTitle title="Songs" />
        {rows(songs, 12)}
      </View>
      <View style={{ marginTop: space.xl }}>
        <SectionTitle title="From the vault" caption="78rpm records, 1900–1925" />
        {rows(old, 8)}
      </View>
      {shows.data?.length !== 0 ? <Shelf title="Live shows" items={cards(shows.data, 'mic')} state={shows} /> : null}
      {lists.data?.length !== 0 ? <Shelf title="Playlists" items={cards(lists.data, 'albums')} state={lists} /> : null}
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

  const tiles: Collection[] = [...archive.ERAS.map(eraCollection), ...audius.GENRES.map(genreCollection)];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Search</Text>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.sub} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Songs, artists, bands, eras"
          placeholderTextColor={colors.faint}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
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
        <>
          <Text style={styles.browse}>Browse all</Text>
          <View style={styles.grid}>
            {tiles.map((c) => (
              <Pressable key={c.id} onPress={() => onOpen(c)} style={styles.tileWrap} accessibilityRole="button" accessibilityLabel={c.title}>
                <LinearGradient colors={gradientFor(c.id)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
                  <Text style={styles.tileText}>{c.title}</Text>
                  <Ionicons name={(c.icon ?? 'musical-notes') as any} size={34} color="rgba(255,255,255,0.35)" style={styles.tileIcon} />
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, paddingHorizontal: space.lg, paddingTop: space.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginTop: space.md,
    paddingHorizontal: space.md,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHi,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, height: 46, outlineStyle: 'none' } as any,
  browse: { color: colors.text, fontSize: 17, fontWeight: '800', paddingHorizontal: space.lg, marginTop: space.xl, marginBottom: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: space.lg - space.xs },
  tileWrap: { width: '50%', padding: space.xs },
  tile: { height: 92, borderRadius: radius.md, padding: space.md, overflow: 'hidden' },
  tileText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  tileIcon: { position: 'absolute', right: 8, bottom: 6, transform: [{ rotate: '-15deg' }] },
});
