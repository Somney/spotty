import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayback, usePlayer } from '../state/player';
import { colors, radius, space } from '../theme';
import { Artwork } from './Artwork';

export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { current, loading, error, toggle, next } = usePlayer();
  const status = usePlayback();
  if (!current) return null;

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const busy = loading || (status.isBuffering && !status.playing && !error);

  return (
    <Pressable onPress={onOpen} style={styles.wrap} accessibilityRole="button" accessibilityLabel="Open now playing">
      <View style={styles.row}>
        <Artwork uri={current.artwork} seed={current.id} size={42} />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {current.title}
          </Text>
          <Text style={[styles.sub, error ? { color: colors.danger } : null]} numberOfLines={1}>
            {error ?? current.artist}
          </Text>
        </View>
        <Pressable onPress={toggle} hitSlop={10} style={styles.btn} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Ionicons name={status.playing && !error ? 'pause' : 'play'} size={26} color={colors.text} />
          )}
        </Pressable>
        <Pressable onPress={next} hitSlop={10} style={styles.btn} accessibilityRole="button" accessibilityLabel="Next track">
          <Ionicons name="play-skip-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: space.sm,
    marginBottom: space.xs,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sub: { color: colors.sub, fontSize: 12, marginTop: 1 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  fill: { height: 2, backgroundColor: colors.accent },
});
