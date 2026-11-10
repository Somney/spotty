import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Track } from '../types';

const LIKED_KEY = 'spotty.liked.v1';
const RECENT_KEY = 'spotty.recent.v1';
const MAX_RECENT = 40;

interface LibraryValue {
  liked: Track[];
  recent: Track[];
  isLiked: (id: string) => boolean;
  toggleLike: (track: Track) => void;
  addRecent: (track: Track) => void;
}

const Ctx = createContext<LibraryValue | null>(null);

async function load(key: string): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [liked, setLiked] = useState<Track[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const ready = useRef(false);

  useEffect(() => {
    Promise.all([load(LIKED_KEY), load(RECENT_KEY)]).then(([l, r]) => {
      // Merge rather than overwrite, in case something was added before storage loaded.
      setLiked((cur) => [...cur, ...l.filter((t) => !cur.some((c) => c.id === t.id))]);
      setRecent((cur) => [...cur, ...r.filter((t) => !cur.some((c) => c.id === t.id))].slice(0, MAX_RECENT));
      ready.current = true;
    });
  }, []);

  useEffect(() => {
    if (ready.current) AsyncStorage.setItem(LIKED_KEY, JSON.stringify(liked)).catch(() => {});
  }, [liked]);
  useEffect(() => {
    if (ready.current) AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent)).catch(() => {});
  }, [recent]);

  const likedIds = useMemo(() => new Set(liked.map((t) => t.id)), [liked]);
  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const toggleLike = useCallback((track: Track) => {
    setLiked((cur) => (cur.some((t) => t.id === track.id) ? cur.filter((t) => t.id !== track.id) : [track, ...cur]));
  }, []);

  const addRecent = useCallback((track: Track) => {
    setRecent((cur) => [track, ...cur.filter((t) => t.id !== track.id)].slice(0, MAX_RECENT));
  }, []);

  const value = useMemo(
    () => ({ liked, recent, isLiked, toggleLike, addRecent }),
    [liked, recent, isLiked, toggleLike, addRecent]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibrary must be used inside LibraryProvider');
  return v;
}
