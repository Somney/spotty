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
        {/* No thumb: the bar itself thickens while it is being dragged. */}
        <View style={[styles.track, drag !== null && styles.trackActive]} pointerEvents="none">
          <View style={[styles.fill, drag !== null && styles.fillActive, { width: `${fraction * 100}%` }]} />
        </View>
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
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  trackActive: { height: 10, borderRadius: 5 },
  fill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.75)' },
  fillActive: { backgroundColor: colors.text },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
