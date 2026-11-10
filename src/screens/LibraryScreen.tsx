import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LIKED, RECENT } from '../collections';
import { SectionTitle } from '../components/Shelf';
import { TrackRow } from '../components/TrackRow';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { colors, space } from '../theme';
import { Collection } from '../types';

export function LibraryScreen({ onOpen }: { onOpen: (c: Collection) => void }) {
  const { liked, recent } = useLibrary();
  const player = usePlayer();

  const entry = (c: Collection, count: number) => (
    <Pressable onPress={() => onOpen(c)} style={({ pressed }) => [styles.entry, pressed && { backgroundColor: colors.surface }]} accessibilityRole="button">
      <Ionicons name={c.icon as any} size={24} color={colors.accent} style={{ width: 30 }} />
      <View style={styles.entryBody}>
        <Text style={styles.entryTitle}>{c.title}</Text>
        <Text style={styles.count}>{count}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </View>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
      <Text style={styles.largeTitle}>Library</Text>
      <View style={{ marginTop: space.md }}>
        {entry(LIKED, liked.length)}
        {entry(RECENT, recent.length)}
      </View>

      {recent.length ? (
        <View style={{ marginTop: space.xl }}>
          <SectionTitle title="Recently Played" />
          {recent.slice(0, 8).map((t, i) => (
            <TrackRow key={t.id} track={t} active={player.current?.id === t.id} onPress={() => player.playQueue(recent, i, { shuffle: false })} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your music will appear here</Text>
          <Text style={styles.emptyText}>Songs you play and the ones you mark as favourites are kept on this device.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: { color: colors.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.6, paddingHorizontal: space.lg, paddingTop: space.md },
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg },
  entryBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 52,
    paddingRight: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  entryTitle: { flex: 1, color: colors.text, fontSize: 20, letterSpacing: -0.3 },
  count: { color: colors.sub, fontSize: 17 },
  empty: { alignItems: 'center', paddingHorizontal: space.xxl, marginTop: 88, gap: space.sm },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  emptyText: { color: colors.sub, fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
