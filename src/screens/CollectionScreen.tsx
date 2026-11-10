import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { loadCollection } from '../collections';
import { Artwork } from '../components/Artwork';
import { StateNote } from '../components/Shelf';
import { TrackRow } from '../components/TrackRow';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { colors, gradientFor, radius, space } from '../theme';
import { Collection, Track } from '../types';
import { useAsync } from '../useAsync';

export function CollectionScreen({ collection, onBack }: { collection: Collection; onBack: () => void }) {
  const player = usePlayer();
  const { liked, recent } = useLibrary();
  const remote = useAsync(() => loadCollection(collection), collection.id);

  const local = collection.kind === 'liked' ? liked : collection.kind === 'recent' ? recent : null;
  const tracks: Track[] = local ?? remote.data ?? [];
  const state = local ? { data: local, loading: false, error: null, reload: () => {} } : remote;

  const header = (
    <LinearGradient colors={[gradientFor(collection.id)[1], colors.bg]} style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <View style={{ alignItems: 'center' }}>
        <Artwork uri={collection.artwork} seed={collection.id} size={184} rounded={radius.lg} icon={collection.icon} />
      </View>
      <Text style={styles.title}>{collection.title}</Text>
      <Text style={styles.subtitle}>
        {collection.subtitle}
        {tracks.length ? ` · ${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}` : ''}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => player.playQueue(tracks, 0, { shuffle: false })}
          disabled={!tracks.length}
          style={[styles.play, !tracks.length && { opacity: 0.4 }]}
          accessibilityRole="button"
        >
          <Ionicons name="play" size={18} color={colors.accentInk} />
          <Text style={styles.playText}>Play</Text>
        </Pressable>
        <Pressable
          onPress={() => player.playQueue(tracks, 0, { shuffle: true })}
          disabled={!tracks.length}
          style={[styles.shuffle, !tracks.length && { opacity: 0.4 }]}
          accessibilityRole="button"
        >
          <Ionicons name="shuffle" size={18} color={colors.text} />
          <Text style={styles.shuffleText}>Shuffle</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );

  return (
    <FlatList
      data={tracks}
      keyExtractor={(t, i) => `${t.id}-${i}`}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <StateNote
          state={state}
          empty={collection.kind === 'liked' ? 'Tap the heart on any song to save it here.' : 'No songs to show.'}
        />
      }
      contentContainerStyle={{ paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      renderItem={({ item, index }) => (
        <TrackRow
          track={item}
          index={index}
          active={player.current?.id === item.id}
          onPress={() => player.playQueue(tracks, index, { shuffle: false })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingBottom: space.lg, paddingTop: space.sm },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginTop: space.lg },
  subtitle: { color: colors.sub, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  play: { flex: 1, height: 46, borderRadius: radius.pill, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  playText: { color: colors.accentInk, fontWeight: '800', fontSize: 15 },
  shuffle: { flex: 1, height: 46, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  shuffleText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
