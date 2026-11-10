import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as audius from '../api/audius';
import { Artwork, trackArt } from '../components/Artwork';
import { SeekBar } from '../components/SeekBar';
import { Tap } from '../components/Tap';
import { TrackRow } from '../components/TrackRow';
import { YouTubeView } from '../components/YouTubeView';
import { useLibrary } from '../state/library';
import { usePlayback, usePlayer } from '../state/player';
import { colors, gradientFor, radius, space } from '../theme';
import { Collection } from '../types';

export function NowPlaying({ visible, onClose, onOpen }: { visible: boolean; onClose: () => void; onOpen: (c: Collection) => void }) {
  const p = usePlayer();
  const status = usePlayback();
  const { isLiked, toggleLike } = useLibrary();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const track = p.current;

  const video = track?.videoId;
  const playing = !!video || (status.playing && !p.error);
  // The cover settles back slightly while paused and swells when music plays.
  const scale = useRef(new Animated.Value(playing ? 1 : 0.86)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: playing ? 1 : 0.86, useNativeDriver: true, speed: 10, bounciness: 6 }).start();
  }, [playing, scale]);

  if (!track) return null;

  const artSize = Math.min(width - space.xl * 2, height * 0.42, 420);
  const liked = isLiked(track.id);
  const busy = p.loading || (status.isBuffering && !status.playing && !p.error);
  const origin =
    track.source === 'audius'
      ? 'Audius'
      : track.source === 'radio'
        ? 'Live broadcast'
        : track.source === 'youtube'
          ? 'Playing in the YouTube player'
        : `Internet Archive${track.year ? ` · ${track.year}` : ''}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent presentationStyle="fullScreen">
      <LinearGradient colors={[gradientFor(track.id)[0], gradientFor(track.id)[1], colors.bg]} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xl }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onClose} hitSlop={16} style={styles.grabArea} accessibilityRole="button" accessibilityLabel="Close now playing">
            <View style={styles.grabber} />
          </Pressable>

          {video ? (
            // Only mounted while this screen is open, so the video stops when it closes.
            <View style={styles.video}>{visible ? <YouTubeView videoId={video} onEnded={p.videoEnded} onError={p.videoEnded} /> : null}</View>
          ) : (
            <Animated.View style={[styles.art, { width: artSize, height: artSize, transform: [{ scale }] }]}>
              <Artwork uri={track.artworkLarge ?? track.artwork} size={artSize} rounded={radius.lg} {...trackArt(track)} />
            </Animated.View>
          )}

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {track.title}
                </Text>
                {track.artistId ? (
                  <Pressable
                    onPress={() => onOpen(audius.artistCollection({ id: track.artistId!, name: track.artist, artwork: track.artistArtwork }))}
                    hitSlop={8}
                    accessibilityRole="link"
                    accessibilityLabel={`Open artist ${track.artist}`}
                  >
                    <Text style={styles.artist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.artist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                )}
              </View>
              <Tap
                onPress={() => toggleLike(track)}
                hitSlop={12}
                style={styles.round}
                scale={0.88}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.accent : colors.text} />
              </Tap>
            </View>

            <View style={{ marginTop: space.lg }}>
              {video ? null : track.isLive ? (
                <View style={styles.liveRow}>
                  <View style={styles.liveLine} />
                  <Text style={styles.live}>LIVE</Text>
                  <View style={styles.liveLine} />
                </View>
              ) : (
                <SeekBar position={status.currentTime} duration={status.duration || track.duration || 0} onSeek={p.seek} />
              )}
            </View>

            <View style={styles.controls}>
              <Tap onPress={p.previous} hitSlop={12} style={styles.skip} scale={0.85} accessibilityRole="button" accessibilityLabel="Previous track">
                <Ionicons name="play-back" size={36} color={colors.text} />
              </Tap>
              {video ? null : (
                <Tap onPress={p.toggle} style={styles.play} scale={0.85} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'}>
                  {busy ? <ActivityIndicator color={colors.text} size="large" /> : <Ionicons name={playing ? 'pause' : 'play'} size={52} color={colors.text} />}
                </Tap>
              )}
              <Tap onPress={p.next} hitSlop={12} style={styles.skip} scale={0.85} accessibilityRole="button" accessibilityLabel="Next track">
                <Ionicons name="play-forward" size={36} color={colors.text} />
              </Tap>
            </View>

            <View style={styles.modes}>
              <Tap onPress={p.toggleShuffle} style={[styles.mode, p.shuffle && styles.modeOn]} accessibilityRole="button" accessibilityLabel="Shuffle" accessibilityState={{ selected: p.shuffle }}>
                <Ionicons name="shuffle" size={18} color={p.shuffle ? colors.accentInk : colors.text} />
                <Text style={[styles.modeText, p.shuffle && styles.modeTextOn]}>Shuffle</Text>
              </Tap>
              <Tap
                onPress={p.cycleRepeat}
                style={[styles.mode, p.repeat !== 'off' && styles.modeOn]}
                accessibilityRole="button"
                accessibilityLabel={`Repeat: ${p.repeat}`}
              >
                <Ionicons name="repeat" size={18} color={p.repeat !== 'off' ? colors.accentInk : colors.text} />
                <Text style={[styles.modeText, p.repeat !== 'off' && styles.modeTextOn]}>{p.repeat === 'one' ? 'Repeat One' : 'Repeat'}</Text>
              </Tap>
            </View>

            <Text style={[styles.origin, p.error ? { color: colors.danger } : null]}>{p.error ?? origin}</Text>
          </View>

          {p.upNext.length ? (
            <View style={{ marginTop: space.xl }}>
              <Text style={styles.upNext}>Playing Next</Text>
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
  grabArea: { alignItems: 'center', paddingVertical: space.sm },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  art: {
    alignSelf: 'center',
    borderRadius: radius.lg,
    marginTop: space.lg,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  video: { marginTop: space.lg, marginHorizontal: space.lg, aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' },
  body: { paddingHorizontal: space.xl, marginTop: space.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  artist: { color: 'rgba(255,255,255,0.6)', fontSize: 20, marginTop: 2, letterSpacing: -0.3 },
  round: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, height: 48 },
  liveLine: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  live: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44, marginTop: space.md },
  skip: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  play: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  modes: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  mode: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modeOn: { backgroundColor: colors.text },
  modeText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  modeTextOn: { color: colors.accentInk },
  origin: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: space.lg },
  upNext: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, paddingHorizontal: space.lg, marginBottom: space.sm },
});
