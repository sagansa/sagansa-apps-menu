'use client';

import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

interface LiquidGlassProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function LiquidGlass({ 
  intensity = 80, 
  tint = 'default', 
  style, 
  children, 
  ...props 
}: LiquidGlassProps) {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.webContainer,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.nativeContainer, style]}
      {...props}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 0, 0.16)',
    borderRadius: 16,
  },
  nativeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 0, 0.16)',
    borderRadius: 16,
  },
});