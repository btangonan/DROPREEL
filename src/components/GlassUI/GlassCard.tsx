'use client';

import React from 'react';
import { transitions } from '@/styles/design-tokens';
import GlassContainer from './GlassContainer';

export interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  maxHeight?: string | number;
  scrollable?: boolean;
  highlighted?: boolean;
  onHeaderClick?: () => void;
}

/**
 * Card component with glass effect and optional scrollable content
 */
export default function GlassCard({
  children,
  title,
  className = '',
  contentClassName = '',
  headerClassName = '',
  maxHeight,
  scrollable = false,
  highlighted = false,
  onHeaderClick,
}: GlassCardProps) {
  const effect = highlighted ? 'highlighted' : 'light';
  
  const contentStyle: React.CSSProperties = {
    maxHeight: maxHeight || 'none',
    overflow: scrollable ? 'auto' : 'visible',
  };

  return (
    <GlassContainer
      effect={effect}
      className={`flex flex-col h-full ${className}`}
      rounded={true}
    >
      {title && (
        <div 
          className={`px-4 py-3 border-b border-white/10 font-bold text-black text-xl tracking-wide uppercase ${headerClassName}`}
          onClick={onHeaderClick}
          style={{
            ...(onHeaderClick ? { cursor: 'pointer', transition: transitions.fast } : {}),
            letterSpacing: '0.05em'  // Slightly wider letter spacing for titles
          }}
        >
          {title}
        </div>
      )}
      <div 
        className={`flex-grow p-4 ${contentClassName}`}
        style={contentStyle}
      >
        {children}
      </div>
    </GlassContainer>
  );
}
