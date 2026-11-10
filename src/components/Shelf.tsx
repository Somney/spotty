import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Artwork } from './Artwork';
import { Tap } from './Tap';

export interface ShelfItem {
  key: string;
  title: string;
  subtitle: string;
  artwork?: string;
  icon?: string;
  lookup?: string;
  onPress: () => void;
}

export interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function SectionTitle({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const label = (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll ? <Ionicons name="chevron-forward" size={20} color={colors.sub} style={{ marginTop: 2 }} /> : null}
    </View>
  );
  return onSeeAll ? (
    <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel={`See all: ${title}`}>
      {label}
    </Pressable>
  ) : (
    label
  );
}

export function StateNote({ state, empty }: { state: Loadable<unknown[]>; empty?: string }) {
  if (state.loading && !state.data) {
    return (
      <View style={styles.note}>
        <ActivityIndicator color={colors.sub} />
      </View>
    );
  }
  if (state.error && !state.data) {
    return (
      <View style={styles.note}>
        <Text style={styles.noteText}>{state.error}.</Text>
        <Pressable onPress={state.reload} hitSlop={10} accessibilityRole="button">
          <Text style={styles.retryText}>Try Again</Text>
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

const CARD = 156;

/** Horizontally scrolling row of square cards. Hidden entirely when it has loaded and is empty. */
export function Shelf({ title, items, state, onSeeAll }: { title: string; items: ShelfItem[]; state: Loadable<unknown[]>; onSeeAll?: () => void }) {
  if (state.data && !items.length) return null;
  return (
    <View style={styles.section}>
      <SectionTitle title={title} onSeeAll={items.length ? onSeeAll : undefined} />
      {items.length ? (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.md }}
          initialNumToRender={4}
          snapToInterval={CARD + space.md}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <Tap onPress={item.onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.subtitle}`}>
              <Artwork uri={item.artwork} size={CARD} rounded={radius.md} icon={item.icon} lookup={item.lookup} />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </Tap>
          )}
        />
      ) : (
        <StateNote state={state} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: space.lg, marginBottom: space.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  card: { width: CARD },
  cardTitle: { color: colors.text, fontSize: 14, marginTop: 6, letterSpacing: -0.1 },
  cardSub: { color: colors.sub, fontSize: 14, marginTop: 1 },
  note: { minHeight: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, gap: space.md },
  noteText: { color: colors.sub, fontSize: 15, textAlign: 'center' },
  retryText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
});
