import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function StepView({ children, style }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={[{ width: '100%' }, style]}
    >
      {children}
    </Animated.View>
  );
}
