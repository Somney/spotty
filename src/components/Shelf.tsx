import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Artwork } from './Artwork';

export interface ShelfItem {
  key: string;
  title: string;
  subtitle: string;
  artwork?: string;
  icon?: string;
  onPress: () => void;
}

export interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

export function StateNote({ state, empty }: { state: Loadable<unknown[]>; empty?: string }) {
  if (state.loading && !state.data) {
    return (
      <View style={styles.note}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (state.error && !state.data) {
    return (
      <View style={styles.note}>
        <Text style={styles.noteText}>Couldn't load this. {state.error}.</Text>
        <Pressable onPress={state.reload} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (state.data && state.data.length === 0 && empty) {
    return (
      <View style={styles.note}>
        <Text style={styles.noteText}>{empty}</Text>
      </View>
    );
  }
  return null;
}

/** Horizontally scrolling row of square cards. */
export function Shelf({ title, caption, items, state }: { title: string; caption?: string; items: ShelfItem[]; state: Loadable<unknown[]> }) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} caption={caption} />
      {items.length ? (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}
          initialNumToRender={4}
          renderItem={({ item }) => (
            <Pressable
              onPress={item.onPress}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitle}`}
            >
              <Artwork uri={item.artwork} seed={item.key} size={148} rounded={radius.md} icon={item.icon} />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <StateNote state={state} empty="Nothing here right now." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.xl },
  header: { paddingHorizontal: space.lg, marginBottom: space.md },
  title: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  caption: { color: colors.sub, fontSize: 13, marginTop: 2 },
  card: { width: 148 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: space.sm },
  cardSub: { color: colors.sub, fontSize: 12, marginTop: 2 },
  note: { minHeight: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, gap: space.md },
  noteText: { color: colors.sub, fontSize: 14, textAlign: 'center' },
  retry: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  retryText: { color: colors.text, fontWeight: '600' },
});
