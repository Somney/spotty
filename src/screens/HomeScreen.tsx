import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as archive from '../api/archive';
import * as audius from '../api/audius';
import { eraCollection } from '../collections';
import { Shelf, ShelfItem, SectionTitle, StateNote } from '../components/Shelf';
import { TrackRow } from '../components/TrackRow';
import { usePlayer } from '../state/player';
import { colors, radius, space } from '../theme';
import { Collection, Track } from '../types';
import { useAsync } from '../useAsync';

const CHIPS = ['All', ...audius.GENRES.slice(0, 9)];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late night listening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function HomeScreen({ onOpen }: { onOpen: (c: Collection) => void }) {
  const [genre, setGenre] = useState('All');
  const player = usePlayer();

  const g = genre === 'All' ? undefined : genre;
  const trending = useAsync(() => audius.trending({ genre: g, time: 'week', limit: 30 }), `trend:${genre}`);
  const playlists = useAsync(() => audius.trendingPlaylists(12), 'playlists');
  const classics = useAsync(() => audius.trending({ time: 'allTime', limit: 20 }), 'allTime');
  const vault = useAsync(() => archive.vintage({ rows: 20 }), 'vault');
  const live = useAsync(() => archive.concerts({ rows: 12 }), 'live');

  const trackItems = (tracks: Track[] | null): ShelfItem[] =>
    (tracks ?? []).map((t, i) => ({
      key: t.id,
      title: t.title,
      subtitle: t.source === 'archive' && t.year ? `${t.artist} · ${t.year}` : t.artist,
      artwork: t.artworkLarge ?? t.artwork,
      onPress: () => player.playQueue(tracks!, i, { shuffle: false }),
    }));

  const collectionItems = (cols: Collection[] | null, icon?: string): ShelfItem[] =>
    (cols ?? []).map((c) => ({ key: c.id, title: c.title, subtitle: c.subtitle, artwork: c.artwork, icon, onPress: () => onOpen(c) }));

  const top = trending.data?.slice(0, 6) ?? [];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.tagline}>New releases and century-old records. No ads, ever.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CHIPS.map((c) => {
          const on = c === genre;
          return (
            <Pressable
              key={c}
              onPress={() => setGenre(c)}
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: space.xl }}>
        <SectionTitle title="Trending now" caption={g ? `${g} · this week` : 'What people are playing this week'} />
        {top.length ? (
          top.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i}
              active={player.current?.id === t.id}
              onPress={() => player.playQueue(trending.data!, i, { shuffle: false })}
            />
          ))
        ) : (
          <StateNote state={trending} empty="Nothing trending in this genre right now." />
        )}
      </View>

      {trending.data && trending.data.length > 6 ? (
        <Shelf title="More to discover" items={trackItems(trending.data).slice(6)} state={trending} />
      ) : null}

      <Shelf title="Playlists" caption="Hand-picked sets from the community" items={collectionItems(playlists.data, 'albums')} state={playlists} />

      <Shelf
        title="From the vault"
        caption={`Original 78rpm records, ${archive.VINTAGE_FROM}–${archive.VINTAGE_TO}`}
        items={trackItems(vault.data)}
        state={vault}
      />

      <View style={styles.eras}>
        {archive.ERAS.map((e) => (
          <Pressable key={e.ref} onPress={() => onOpen(eraCollection(e))} style={styles.era} accessibilityRole="button">
            <Text style={styles.eraText}>{e.label}</Text>
          </Pressable>
        ))}
      </View>

      <Shelf title="Legendary live shows" caption="Full concerts, shared by the bands" items={collectionItems(live.data, 'mic')} state={live} />

      <Shelf title="All-time favourites" caption="The most played tracks ever" items={trackItems(classics.data)} state={classics} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.lg, paddingTop: space.lg },
  greeting: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: colors.sub, fontSize: 14, marginTop: 4 },
  chips: { paddingHorizontal: space.lg, gap: space.sm, marginTop: space.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceHi },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.accentInk },
  eras: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, marginTop: space.lg },
  era: { flex: 1, paddingVertical: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  eraText: { color: colors.text, fontWeight: '700' },
});
