import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { loadCollection } from '../collections';
import { Artwork } from '../components/Artwork';
import { StateNote } from '../components/Shelf';
import { Tap } from '../components/Tap';
import { TrackRow } from '../components/TrackRow';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { colors, radius, space } from '../theme';
import { Collection, Track } from '../types';
import { useAsync } from '../useAsync';

export function CollectionScreen({ collection, onBack }: { collection: Collection; onBack: () => void }) {
  const player = usePlayer();
  const { liked, recent } = useLibrary();
  const remote = useAsync(() => loadCollection(collection), collection.id);

  const local = collection.kind === 'liked' ? liked : collection.kind === 'recent' ? recent : null;
  const tracks: Track[] = local ?? remote.data ?? [];
  const state = local ? { data: local, loading: false, error: null, reload: () => {} } : remote;
  const stations = collection.kind === 'radio';
  const unit = stations ? 'station' : 'song';
  // Charts and lists have no cover of their own; borrow the first track's.
  const cover = collection.artwork ?? tracks.find((t) => t.artworkLarge)?.artworkLarge;

  const header = (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={28} color={colors.accent} />
      </Pressable>
      <View style={styles.art}>
        <Artwork uri={cover} size={220} rounded={collection.kind === 'artist' ? 110 : radius.lg} icon={collection.icon} lookup={collection.artist} />
      </View>
      <Text style={styles.title}>{collection.title}</Text>
      <Text style={styles.subtitle}>{collection.subtitle}</Text>
      <View style={styles.actions}>
        <Tap onPress={() => player.playQueue(tracks, 0, { shuffle: false })} disabled={!tracks.length} style={[styles.action, !tracks.length && { opacity: 0.4 }]} accessibilityRole="button">
          <Ionicons name="play" size={18} color={colors.accent} />
          <Text style={styles.actionText}>Play</Text>
        </Tap>
        <Tap onPress={() => player.playQueue(tracks, 0, { shuffle: true })} disabled={!tracks.length} style={[styles.action, !tracks.length && { opacity: 0.4 }]} accessibilityRole="button">
          <Ionicons name="shuffle" size={18} color={colors.accent} />
          <Text style={styles.actionText}>Shuffle</Text>
        </Tap>
      </View>
    </View>
  );

  return (
    <FlatList
      data={tracks}
      keyExtractor={(t, i) => `${t.id}-${i}`}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <StateNote state={state} empty={collection.kind === 'liked' ? 'Tap the heart on any song to keep it here.' : `No ${unit}s to show.`} />
      }
      ListFooterComponent={
        tracks.length ? (
          <Text style={styles.footer}>
            {tracks.length} {tracks.length === 1 ? unit : `${unit}s`}
          </Text>
        ) : undefined
      }
      contentContainerStyle={{ paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      renderItem={({ item, index }) => (
        <TrackRow
          track={item}
          index={collection.kind === 'chart' || collection.kind === 'genre' ? index : undefined}
          active={player.current?.id === item.id}
          onPress={() => player.playQueue(tracks, index, { shuffle: false })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -10 },
  art: { alignSelf: 'center', borderRadius: radius.lg, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center', marginTop: space.lg },
  subtitle: { color: colors.accent, fontSize: 17, textAlign: 'center', marginTop: 2, letterSpacing: -0.2 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  action: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { color: colors.accent, fontWeight: '600', fontSize: 17 },
  footer: { color: colors.sub, fontSize: 15, paddingHorizontal: space.lg, paddingTop: space.lg },
});
