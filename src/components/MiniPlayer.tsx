import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayback, usePlayer } from '../state/player';
import { colors, radius, space } from '../theme';
import { Artwork, trackArt } from './Artwork';

export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { current, loading, error, toggle, next } = usePlayer();
  const status = usePlayback();
  if (!current) return null;

  const playing = status.playing && !error;
  const busy = loading || (status.isBuffering && !status.playing && !error);

  return (
    <Pressable onPress={onOpen} style={styles.wrap} accessibilityRole="button" accessibilityLabel="Open now playing">
      <Artwork uri={current.artwork} size={44} rounded={radius.sm} {...trackArt(current)} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {current.title}
        </Text>
        {error ? (
          <Text style={[styles.sub, { color: colors.danger }]} numberOfLines={1}>
            {error}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={toggle} hitSlop={10} style={styles.btn} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'}>
        {busy ? <ActivityIndicator color={colors.text} /> : <Ionicons name={playing ? 'pause' : 'play'} size={24} color={colors.text} />}
      </Pressable>
      <Pressable onPress={next} hitSlop={10} style={styles.btn} accessibilityRole="button" accessibilityLabel="Next track">
        <Ionicons name="play-forward" size={24} color={colors.text} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.sm,
    marginBottom: 6,
    padding: 8,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 16, letterSpacing: -0.2 },
  sub: { fontSize: 12, marginTop: 1 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
