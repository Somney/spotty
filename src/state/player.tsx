import { AudioPlayer, createAudioPlayer, setAudioModeAsync, useAudioPlayerStatus } from 'expo-audio';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as archive from '../api/archive';
import { Track } from '../types';
import { useLibrary } from './library';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  queue: Track[];
  /** Play order as indexes into `queue`; differs from identity when shuffling. */
  order: number[];
  pos: number;
  shuffle: boolean;
  repeat: RepeatMode;
  loading: boolean;
  error: string | null;
}

interface PlayerValue extends PlayerState {
  current: Track | null;
  upNext: Track[];
  playQueue: (tracks: Track[], startIndex?: number, opts?: { shuffle?: boolean }) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  jumpTo: (orderPos: number) => void;
}

const EMPTY: PlayerState = { queue: [], order: [], pos: 0, shuffle: false, repeat: 'off', loading: false, error: null };
const MAX_SKIPS_ON_ERROR = 3;

let sharedPlayer: AudioPlayer | null = null;
function getPlayer() {
  if (!sharedPlayer) {
    sharedPlayer = createAudioPlayer(null, { updateInterval: 500, keepAudioSessionActive: true });
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(
      () => {}
    );
  }
  return sharedPlayer;
}

function shuffled(indexes: number[]) {
  const a = [...indexes];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Ctx = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = getPlayer();
  const { addRecent } = useLibrary();
  const [state, setState] = useState<PlayerState>(EMPTY);
  const ref = useRef(state);
  ref.current = state;

  // Each load gets a ticket so a slow one can't clobber a newer one.
  const ticket = useRef(0);
  const failures = useRef(0);
  const finishedTicket = useRef(-1);
  const startedTicket = useRef(-1);
  const onFailureRef = useRef<(message: string) => void>(() => {});

  const set = useCallback((patch: Partial<PlayerState>) => {
    ref.current = { ...ref.current, ...patch };
    setState(ref.current);
  }, []);

  const load = useCallback(
    async (pos: number) => {
      const { queue, order } = ref.current;
      const track = queue[order[pos]];
      if (!track) return;
      const mine = ++ticket.current;
      set({ pos, loading: true, error: null });
      player.pause();
      try {
        // Skip the await when the URL is already known: iOS Safari only lets audio start
        // in the same tick as the tap that asked for it.
        const ready = track.streamUrl ? track : await archive.resolve(track);
        if (mine !== ticket.current) return;
        player.replace({ uri: ready.streamUrl! });
        player.play();
        try {
          player.setActiveForLockScreen(
            true,
            { title: track.title, artist: track.artist, artworkUrl: track.artworkLarge ?? track.artwork },
            { showSeekForward: true, showSeekBackward: true }
          );
        } catch {
          // Lock screen controls are a nicety; never fail playback over them.
        }
        webMediaKeys.current();
        set({ loading: false });
      } catch (e: any) {
        if (mine !== ticket.current) return;
        onFailureRef.current(e?.message ?? 'Could not play this track');
      }
    },
    [player, set]
  );

  const step = useCallback(
    (dir: 1 | -1, auto: boolean) => {
      const { order, pos, repeat } = ref.current;
      if (!order.length) return;
      let target = pos + dir;
      if (target >= order.length) {
        if (repeat === 'all' || !auto) target = 0;
        else return; // reached the end
      }
      if (target < 0) target = repeat === 'all' ? order.length - 1 : 0;
      load(target);
    },
    [load]
  );

  const onFailure = useCallback(
    (message: string) => {
      failures.current += 1;
      const { order, pos } = ref.current;
      const canSkip = failures.current <= MAX_SKIPS_ON_ERROR && pos + 1 < order.length;
      set({ loading: false, error: message });
      if (canSkip) load(pos + 1);
    },
    [load, set]
  );
  onFailureRef.current = onFailure;

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      // Only audio that has really advanced counts as a successful play.
      if (s.playing && s.currentTime > 1 && startedTicket.current !== ticket.current) {
        startedTicket.current = ticket.current;
        failures.current = 0;
        const { queue, order, pos } = ref.current;
        const track = queue[order[pos]];
        if (track) addRecent(track);
      }
      if (s.error && !ref.current.loading && !ref.current.error) {
        onFailure('This track could not be streamed');
        return;
      }
      if (s.didJustFinish && finishedTicket.current !== ticket.current) {
        finishedTicket.current = ticket.current;
        if (ref.current.repeat === 'one') {
          finishedTicket.current = -1;
          player.seekTo(0).then(() => player.play());
        } else {
          step(1, true);
        }
      }
    });
    return () => sub.remove();
  }, [player, step, onFailure, addRecent]);

  const playQueue = useCallback<PlayerValue['playQueue']>(
    (tracks, startIndex = 0, opts) => {
      if (!tracks.length) return;
      const shuffle = opts?.shuffle ?? ref.current.shuffle;
      const all = tracks.map((_, i) => i);
      const start = opts?.shuffle ? Math.floor(Math.random() * tracks.length) : startIndex;
      const order = shuffle ? [start, ...shuffled(all.filter((i) => i !== start))] : all;
      failures.current = 0;
      set({ queue: tracks, order, shuffle });
      load(shuffle ? 0 : start);
    },
    [load, set]
  );

  const toggle = useCallback(() => {
    if (!ref.current.queue.length || ref.current.loading) return;
    if (player.playing) player.pause();
    else if (ref.current.error) load(ref.current.pos);
    else player.play();
  }, [player, load]);

  const next = useCallback(() => step(1, false), [step]);
  const webMediaKeys = useRef(() => {});

  const previous = useCallback(() => {
    if (player.currentTime > 3 || ref.current.pos === 0) player.seekTo(0);
    else step(-1, false);
  }, [player, step]);

  // Browsers (including a home-screen web app on iOS) expose skip buttons through Media Session.
  webMediaKeys.current = () => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('previoustrack', previous);
    } catch {
      // Older browsers reject unknown actions.
    }
  };

  const seek = useCallback((seconds: number) => void player.seekTo(Math.max(0, seconds)), [player]);

  const toggleShuffle = useCallback(() => {
    const { order, pos, shuffle, queue } = ref.current;
    const currentIdx = order[pos] ?? 0;
    const all = queue.map((_, i) => i);
    if (shuffle) set({ shuffle: false, order: all, pos: currentIdx });
    else set({ shuffle: true, order: [currentIdx, ...shuffled(all.filter((i) => i !== currentIdx))], pos: 0 });
  }, [set]);

  const cycleRepeat = useCallback(() => {
    const r = ref.current.repeat;
    set({ repeat: r === 'off' ? 'all' : r === 'all' ? 'one' : 'off' });
  }, [set]);

  const jumpTo = useCallback((orderPos: number) => load(orderPos), [load]);

  const value = useMemo<PlayerValue>(() => {
    const current = state.queue[state.order[state.pos]] ?? null;
    const upNext = state.order.slice(state.pos + 1, state.pos + 21).map((i) => state.queue[i]);
    return { ...state, current, upNext, playQueue, toggle, next, previous, seek, toggleShuffle, cycleRepeat, jumpTo };
  }, [state, playQueue, toggle, next, previous, seek, toggleShuffle, cycleRepeat, jumpTo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlayer must be used inside PlayerProvider');
  return v;
}

/** Live position/duration/playing. Kept out of the context so only small components re-render on ticks. */
export function usePlayback() {
  return useAudioPlayerStatus(getPlayer());
}
