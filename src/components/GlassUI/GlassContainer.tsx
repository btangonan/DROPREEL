'use client';

import React from 'react';
import { glassEffects } from '@/styles/design-tokens';

type GlassEffect = 'light' | 'medium' | 'dark' | 'inactive' | 'highlighted';

export interface GlassContainerProps {
  children: React.ReactNode;
  effect?: GlassEffect;
  className?: string;
  rounded?: boolean;
  noBorder?: boolean;
  noShadow?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  scrollable?: boolean;
}

/**
 * A container component with glassmorphism effect
 */
export default function GlassContainer({
  children,
  effect = 'light',
  className = '',
  rounded = true,
  noBorder = false,
  noShadow = false,
  style = {},
  onClick,
  scrollable = false,
}: GlassContainerProps) {
  const glassStyle = glassEffects[effect];
  
  // Override glass style properties if requested
  const containerStyle = {
    ...glassStyle,
    ...(noBorder ? { border: 'none' } : {}),
    ...(noShadow ? { boxShadow: 'none' } : {}),
    ...(scrollable ? { overflow: 'auto' } : {}),
    ...style,
  };
  
  return (
    <div 
      className={`${rounded ? 'rounded-lg' : ''} ${scrollable ? 'overflow-auto' : ''} ${className}`} 
      style={containerStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
