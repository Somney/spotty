import React, { useRef, useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import { colors, formatTime } from '../theme';

interface Props {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export function SeekBar({ position, duration, onSeek }: Props) {
  const width = useRef(1);
  const pageLeft = useRef(0);
  const [drag, setDrag] = useState<number | null>(null);

  const usable = duration > 0 && isFinite(duration);
  const fraction = drag ?? (usable ? Math.min(1, position / duration) : 0);

  // pageX stays reliable while the finger moves outside the bar; locationX does not.
  const at = (e: GestureResponderEvent) => Math.min(1, Math.max(0, (e.nativeEvent.pageX - pageLeft.current) / width.current));

  return (
    <View>
      <View
        style={styles.hit}
        onLayout={(e) => {
          width.current = e.nativeEvent.layout.width || 1;
        }}
        onStartShouldSetResponder={() => usable}
        onMoveShouldSetResponder={() => usable}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          // Children ignore touches, so locationX is relative to the bar itself.
          pageLeft.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
          setDrag(Math.min(1, Math.max(0, e.nativeEvent.locationX / width.current)));
        }}
        onResponderMove={(e) => setDrag(at(e))}
        onResponderRelease={(e) => {
          onSeek(at(e) * duration);
          setDrag(null);
        }}
        onResponderTerminate={() => setDrag(null)}
        accessibilityRole="adjustable"
        accessibilityLabel="Seek"
        accessibilityValue={{ min: 0, max: Math.round(duration || 0), now: Math.round(position || 0) }}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: `${fraction * 100}%` }, drag !== null && styles.thumbActive]} />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(drag !== null ? drag * duration : position)}</Text>
        <Text style={styles.time}>{usable ? formatTime(duration) : '--:--'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { height: 32, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.accent },
  thumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7, backgroundColor: colors.text },
  thumbActive: { transform: [{ scale: 1.3 }] },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.sub, fontSize: 12, fontVariant: ['tabular-nums'] },
});
