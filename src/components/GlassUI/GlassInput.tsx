'use client';

import React from 'react';
import { glassEffects, transitions } from '@/styles/design-tokens';

interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  large?: boolean;
  transparent?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

/**
 * Glass-styled input component
 */
export default function GlassInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  large = false,
  transparent = false,
  fullWidth = true,
  disabled = false,
}: GlassInputProps) {
  // Choose appropriate glass style based on transparency and disabled state
  const effect = disabled ? 'inactive' : (transparent ? 'medium' : 'light');
  const glassStyle = glassEffects[effect];
  
  const inputStyle = {
    ...glassStyle,
    padding: large ? '1.25rem 1.5rem' : '0.75rem 1.25rem',
    fontSize: large ? '2rem' : '1.25rem',
    textAlign: large ? 'center' : 'left' as 'center' | 'left',
    fontWeight: large ? '800' : '600',  // Much bolder text
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.7 : 1,
    transition: transitions.default,
    color: '#000000',  // Pure black for maximum contrast
    letterSpacing: large ? '0.02em' : 'normal',
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-lg ${className}`}
      style={inputStyle}
      disabled={disabled}
    />
  );
}
