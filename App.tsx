import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from './src/components/MiniPlayer';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { NowPlaying } from './src/screens/NowPlaying';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryProvider } from './src/state/library';
import { PlayerProvider } from './src/state/player';
import { colors } from './src/theme';
import { Collection } from './src/types';

type Tab = 'home' | 'search' | 'library';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'search', label: 'Search', icon: 'search' },
  { key: 'library', label: 'Library', icon: 'library' },
];

function Shell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  // Each tab keeps its own stack of opened collections.
  const [stacks, setStacks] = useState<Record<Tab, Collection[]>>({ home: [], search: [], library: [] });
  const [nowPlaying, setNowPlaying] = useState(false);

  const stack = stacks[tab];
  const open = useCallback((c: Collection) => setStacks((s) => ({ ...s, [tab]: [...s[tab], c] })), [tab]);
  const back = useCallback(() => setStacks((s) => ({ ...s, [tab]: s[tab].slice(0, -1) })), [tab]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) {
        back();
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, back]);

  const top = stack[stack.length - 1];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Tabs stay mounted so scroll position and search text survive switching. */}
        {TABS.map(({ key }) => (
          <View key={key} style={[StyleSheet.absoluteFill, { display: key === tab && !top ? 'flex' : 'none' }]}>
            {key === 'home' ? <HomeScreen onOpen={open} /> : key === 'search' ? <SearchScreen onOpen={open} /> : <LibraryScreen onOpen={open} />}
          </View>
        ))}
        {top ? <CollectionScreen key={top.id} collection={top} onBack={back} /> : null}
      </View>

      <MiniPlayer onOpen={() => setNowPlaying(true)} />

      <View style={[styles.tabs, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                // Tapping the active tab returns to its root, like most music apps.
                if (on) setStacks((s) => ({ ...s, [t.key]: [] }));
                setTab(t.key);
              }}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
            >
              <Ionicons name={(on ? t.icon : `${t.icon}-outline`) as any} size={23} color={on ? colors.text : colors.faint} />
              <Text style={[styles.tabLabel, on && { color: colors.text }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <NowPlaying visible={nowPlaying} onClose={() => setNowPlaying(false)} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <PlayerProvider>
          <Shell />
        </PlayerProvider>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { color: colors.faint, fontSize: 11, fontWeight: '600' },
});
