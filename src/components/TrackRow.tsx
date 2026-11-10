import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLibrary } from '../state/library';
import { colors, formatTime, space } from '../theme';
import { Track } from '../types';
import { Artwork } from './Artwork';

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
      android_ripple={{ color: colors.surfaceHi }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${track.title} by ${track.artist}`}
    >
      {index !== undefined ? <Text style={[styles.index, active && { color: colors.accent }]}>{index + 1}</Text> : null}
      <Artwork uri={track.artwork} seed={track.id} size={48} />
      <View style={styles.text}>
        <Text style={[styles.title, active && { color: colors.accent }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {track.duration ? <Text style={styles.duration}>{formatTime(track.duration)}</Text> : null}
      <Pressable
        onPress={() => toggleLike(track)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Remove from liked songs' : 'Add to liked songs'}
      >
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.accent : colors.faint} />
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  index: { width: 22, textAlign: 'center', color: colors.faint, fontSize: 13, fontVariant: ['tabular-nums'] },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.sub, fontSize: 13, marginTop: 2 },
  duration: { color: colors.faint, fontSize: 12, fontVariant: ['tabular-nums'] },
});
