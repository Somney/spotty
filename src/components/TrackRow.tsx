import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLibrary } from '../state/library';
import { colors, formatTime, space } from '../theme';
import { Track } from '../types';
import { Artwork, trackArt } from './Artwork';

interface Props {
  track: Track;
  active?: boolean;
  index?: number;
  onPress: () => void;
}

export const TrackRow = React.memo(function TrackRow({ track, active, index, onPress }: Props) {
  const { isLiked, toggleLike } = useLibrary();
  const liked = isLiked(track.id);
  const meta = [track.artist, track.source === 'archive' && track.year ? String(track.year) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title}, ${track.artist}`}
    >
      {index !== undefined ? <Text style={[styles.index, active && { color: colors.accent }]}>{index + 1}</Text> : null}
      <Artwork uri={track.artwork} size={48} {...trackArt(track)} />
      <View style={styles.body}>
        <View style={styles.text}>
          <Text style={[styles.title, active && { color: colors.accent }]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        {track.isLive ? <Text style={styles.live}>LIVE</Text> : track.isPreview ? <Text style={styles.preview}>PREVIEW</Text> : track.duration ? <Text style={styles.duration}>{formatTime(track.duration)}</Text> : null}
        <Pressable
          onPress={() => toggleLike(track)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.accent : colors.faint} />
        </Pressable>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg },
  index: { width: 20, textAlign: 'center', color: colors.sub, fontSize: 15, fontVariant: ['tabular-nums'] },
  // The hairline starts at the text, not the artwork, as in system lists.
  body: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    paddingRight: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 64,
  },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 16, letterSpacing: -0.2 },
  meta: { color: colors.sub, fontSize: 14, marginTop: 2 },
  duration: { color: colors.sub, fontSize: 13, fontVariant: ['tabular-nums'] },
  preview: { color: colors.sub, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  live: { color: colors.danger, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
});
