import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { gradientFor, radius } from '../theme';

interface Props {
  uri?: string;
  /** Seeds the fallback gradient so each item keeps a stable colour. */
  seed: string;
  size?: number;
  rounded?: number;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

export function Artwork({ uri, seed, size, rounded = radius.sm, icon, style }: Props) {
  // Archive recordings have no cover art, so they get a record or a mic on a colour wash.
  const glyph = icon ?? (seed.startsWith('archive-item:') ? 'mic' : seed.startsWith('archive:') ? 'disc' : 'musical-notes');
  const [failed, setFailed] = useState(false);
  const box: ViewStyle = { width: size, height: size, borderRadius: rounded, overflow: 'hidden' };
  return (
    <View style={[box, !size && { aspectRatio: 1, width: '100%' }, style]}>
      <LinearGradient
        colors={gradientFor(seed)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={glyph as any} size={size ? Math.max(16, size * 0.4) : 44} color="rgba(255,255,255,0.75)" />
      </LinearGradient>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}
