import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useArtistImage } from '../api/artwork';
import { placeholder, radius } from '../theme';

interface Props {
  uri?: string;
  size?: number;
  rounded?: number;
  icon?: string;
  /** Artist name to look a photo up for when there is no cover. */
  lookup?: string;
  style?: StyleProp<ViewStyle>;
}

export function Artwork({ uri, size, rounded = radius.sm, icon = 'musical-note', lookup, style }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const own = uri && failed !== uri ? uri : undefined;
  const found = useArtistImage(lookup, !own);
  const shown = own ?? (found && failed !== found ? found : undefined);

  const box: ViewStyle = { width: size, height: size, borderRadius: rounded, overflow: 'hidden' };
  return (
    <View style={[box, !size && { aspectRatio: 1, width: '100%' }, style]}>
      <LinearGradient
        colors={placeholder}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={icon as any} size={size ? Math.max(16, size * 0.36) : 44} color="rgba(255,255,255,0.28)" />
      </LinearGradient>
      {shown ? (
        <Image
          source={{ uri: shown }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={250}
          recyclingKey={shown}
          onError={() => setFailed(shown)}
        />
      ) : null}
    </View>
  );
}

/** Which placeholder glyph and photo lookup suit a track. */
export function trackArt(t: { source: string; artist: string }) {
  return {
    icon: t.source === 'radio' ? 'radio' : t.source === 'archive' ? 'disc' : 'musical-note',
    lookup: t.source === 'archive' ? t.artist : undefined,
  };
}
