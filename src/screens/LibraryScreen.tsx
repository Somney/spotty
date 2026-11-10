import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LIKED, RECENT } from '../collections';
import { Artwork } from '../components/Artwork';
import { SectionTitle } from '../components/Shelf';
import { TrackRow } from '../components/TrackRow';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { colors, radius, space } from '../theme';
import { Collection } from '../types';

export function LibraryScreen({ onOpen }: { onOpen: (c: Collection) => void }) {
  const { liked, recent } = useLibrary();
  const player = usePlayer();

  const entry = (c: Collection, count: number) => (
    <Pressable onPress={() => onOpen(c)} style={({ pressed }) => [styles.entry, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <Artwork seed={c.id} size={56} rounded={radius.md} icon={c.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.entryTitle}>{c.title}</Text>
        <Text style={styles.entrySub}>
          {count} {count === 1 ? 'song' : 'songs'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.faint} />
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Your library</Text>
      <View style={{ marginTop: space.md }}>
        {entry(LIKED, liked.length)}
        {entry(RECENT, recent.length)}
      </View>

      {recent.length ? (
        <View style={{ marginTop: space.xl }}>
          <SectionTitle title="Jump back in" />
          {recent.slice(0, 8).map((t, i) => (
            <TrackRow key={t.id} track={t} active={player.current?.id === t.id} onPress={() => player.playQueue(recent, i, { shuffle: false })} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="headset" size={40} color={colors.faint} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>Play something from Home, and tap the heart on songs you want to keep.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, paddingHorizontal: space.lg, paddingTop: space.lg },
  entry: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  entryTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  entrySub: { color: colors.sub, fontSize: 13, marginTop: 2 },
  empty: { alignItems: 'center', paddingHorizontal: space.xxl, marginTop: 64, gap: space.sm },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: space.sm },
  emptyText: { color: colors.sub, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
