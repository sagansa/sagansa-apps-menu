'use client';

import { CSSProperties, HTMLAttributes } from 'react';

interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

const tintBackground: Record<NonNullable<LiquidGlassProps['tint']>, string> = {
  default: 'rgba(255, 255, 255, 0.72)',
  light: 'rgba(255, 255, 255, 0.82)',
  dark: 'rgba(15, 23, 42, 0.72)',
};

export function LiquidGlass({ 
  intensity = 80, 
  tint = 'default', 
  style, 
  children, 
  ...props 
}: LiquidGlassProps) {
  const blur = Math.max(8, Math.min(intensity / 4, 28));
  const glassStyle: CSSProperties = {
    backgroundColor: tintBackground[tint],
    backdropFilter: `blur(${blur}px)`,
    border: '1px solid rgba(26, 26, 0, 0.16)',
    borderRadius: 16,
    ...style,
  };

  return (
    <div
      style={glassStyle}
      {...props}
    >
      {children}
    </div>
  );
}
