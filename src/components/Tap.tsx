import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A pressable that gently shrinks under the finger, the way system controls do. */
export function Tap({ style, scale = 0.97, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scale?: number }) {
  const v = useRef(new Animated.Value(1)).current;
  const to = (value: number) => Animated.spring(v, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return <AnimatedPressable {...rest} onPressIn={() => to(scale)} onPressOut={() => to(1)} style={[style, { transform: [{ scale: v }] }]} />;
}
