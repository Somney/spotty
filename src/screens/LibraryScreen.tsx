import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as youtube from '../api/youtube';
import { LIKED, RECENT } from '../collections';
import { SectionTitle } from '../components/Shelf';
import { TrackRow } from '../components/TrackRow';
import { useLibrary } from '../state/library';
import { usePlayer } from '../state/player';
import { colors, radius, space } from '../theme';
import { Collection } from '../types';

export function LibraryScreen({ onOpen }: { onOpen: (c: Collection) => void }) {
  const { liked, recent } = useLibrary();
  const player = usePlayer();
  const ytKey = youtube.useYouTubeKey();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

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
        <Pressable
          onPress={() => {
            setDraft(ytKey);
            setEditing(true);
          }}
          style={({ pressed }) => [styles.entry, pressed && { backgroundColor: colors.surface }]}
          accessibilityRole="button"
        >
          <Ionicons name="logo-youtube" size={24} color={colors.accent} style={{ width: 30 }} />
          <View style={styles.entryBody}>
            <Text style={styles.entryTitle}>YouTube</Text>
            <Text style={styles.count}>{ytKey ? 'On' : 'Off'}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </View>
        </Pressable>
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

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>YouTube</Text>
            <Text style={styles.sheetText}>
              Adds trending music videos and YouTube search. Videos play in YouTube's own player, so they stay on screen and
              YouTube may show its ads. Paste a free YouTube Data API key from Google Cloud to turn it on.
            </Text>
            <Pressable onPress={() => Linking.openURL('https://console.cloud.google.com/apis/library/youtube.googleapis.com')} hitSlop={8}>
              <Text style={styles.link}>Get a key from Google Cloud</Text>
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="API key"
              placeholderTextColor={colors.sub}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={colors.accent}
              style={styles.keyInput}
              accessibilityLabel="YouTube API key"
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setEditing(false)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  youtube.setKey(draft);
                  setEditing(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={[styles.link, { fontWeight: '700' }]}>{draft.trim() ? 'Save' : ytKey ? 'Turn Off' : 'Done'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: space.lg },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md, maxWidth: 440, width: '100%', alignSelf: 'center' },
  sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  sheetText: { color: colors.sub, fontSize: 15, lineHeight: 21 },
  link: { color: colors.accent, fontSize: 17 },
  keyInput: { height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceHi, color: colors.text, fontSize: 16, paddingHorizontal: space.md, outlineStyle: 'none' } as any,
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm },
  empty: { alignItems: 'center', paddingHorizontal: space.xxl, marginTop: 88, gap: space.sm },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  emptyText: { color: colors.sub, fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
