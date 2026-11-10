import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, gradientFor, radius, space } from '../theme';
import { Collection } from '../types';
import { SectionTitle } from './Shelf';
import { Tap } from './Tap';

/** A horizontally scrolling row of labelled colour tiles, for genres and countries. */
export function TileRow({ title, tiles, onOpen }: { title: string; tiles: Collection[]; onOpen: (c: Collection) => void }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <SectionTitle title={title} />
      <FlatList
        horizontal
        data={tiles}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}
        initialNumToRender={5}
        renderItem={({ item }) => (
          <Tap onPress={() => onOpen(item)} accessibilityRole="button" accessibilityLabel={item.title}>
            <LinearGradient colors={gradientFor(item.id)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
              <Text style={styles.text} numberOfLines={2}>
                {item.title}
              </Text>
            </LinearGradient>
          </Tap>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 132, height: 72, borderRadius: radius.md, padding: space.md, justifyContent: 'flex-end' },
  text: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
});
