import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Artwork } from '../components/Artwork';
import { SeekBar } from '../components/SeekBar';
import { TrackRow } from '../components/TrackRow';
import { useLibrary } from '../state/library';
import { usePlayback, usePlayer } from '../state/player';
import { colors, gradientFor, radius, space } from '../theme';

export function NowPlaying({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = usePlayer();
  const status = usePlayback();
  const { isLiked, toggleLike } = useLibrary();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const track = p.current;
  if (!track) return null;

  const artSize = Math.min(width - space.xl * 2, height * 0.42, 420);
  const liked = isLiked(track.id);
  const busy = p.loading || (status.isBuffering && !status.playing && !p.error);
  const origin =
    track.source === 'audius'
      ? 'Streaming from Audius'
      : `Internet Archive${track.year ? ` · recorded ${track.year}` : ''}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent presentationStyle="fullScreen">
      <LinearGradient colors={[gradientFor(track.id)[1], colors.bg, colors.bg]} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xl }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Close now playing">
              <Ionicons name="chevron-down" size={28} color={colors.text} />
            </Pressable>
            <Text style={styles.topLabel}>NOW PLAYING</Text>
            <View style={styles.iconBtn} />
          </View>

          <View style={{ alignItems: 'center', marginTop: space.lg }}>
            <Artwork uri={track.artworkLarge ?? track.artwork} seed={track.id} size={artSize} rounded={radius.lg} />
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {track.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <Pressable
                onPress={() => toggleLike(track)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Remove from liked songs' : 'Add to liked songs'}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? colors.accent : colors.text} />
              </Pressable>
            </View>

            <View style={{ marginTop: space.lg }}>
              <SeekBar position={status.currentTime} duration={status.duration || track.duration || 0} onSeek={p.seek} />
            </View>

            <View style={styles.controls}>
              <Pressable onPress={p.toggleShuffle} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Shuffle" accessibilityState={{ selected: p.shuffle }}>
                <Ionicons name="shuffle" size={24} color={p.shuffle ? colors.accent : colors.sub} />
              </Pressable>
              <Pressable onPress={p.previous} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Previous track">
                <Ionicons name="play-skip-back" size={30} color={colors.text} />
              </Pressable>
              <Pressable onPress={p.toggle} style={styles.playBtn} accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
                {busy ? (
                  <ActivityIndicator color={colors.accentInk} />
                ) : (
                  <Ionicons name={status.playing && !p.error ? 'pause' : 'play'} size={32} color={colors.accentInk} style={!(status.playing && !p.error) && { marginLeft: 3 }} />
                )}
              </Pressable>
              <Pressable onPress={p.next} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Next track">
                <Ionicons name="play-skip-forward" size={30} color={colors.text} />
              </Pressable>
              <Pressable onPress={p.cycleRepeat} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={`Repeat: ${p.repeat}`}>
                <Ionicons name="repeat" size={24} color={p.repeat === 'off' ? colors.sub : colors.accent} />
                {p.repeat === 'one' ? <Text style={styles.repeatOne}>1</Text> : null}
              </Pressable>
            </View>

            <Text style={[styles.origin, p.error ? { color: colors.danger } : null]}>{p.error ?? origin}</Text>
          </View>

          {p.upNext.length ? (
            <View style={{ marginTop: space.xl }}>
              <Text style={styles.upNext}>Up next</Text>
              {p.upNext.map((t, i) => (
                <TrackRow key={`${t.id}-${i}`} track={t} onPress={() => p.jumpTo(p.pos + 1 + i)} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
  topLabel: { color: colors.sub, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: space.xl, marginTop: space.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  title: { color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  artist: { color: colors.sub, fontSize: 16, marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  playBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  repeatOne: { position: 'absolute', top: 6, right: 4, color: colors.accent, fontSize: 10, fontWeight: '800' },
  origin: { color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: space.lg },
  upNext: { color: colors.text, fontSize: 17, fontWeight: '800', paddingHorizontal: space.lg, marginBottom: space.sm },
});
