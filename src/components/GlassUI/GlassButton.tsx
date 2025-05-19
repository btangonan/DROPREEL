'use client';

import React from 'react';
import { glassEffects, transitions } from '@/styles/design-tokens';

type ButtonState = 'default' | 'highlighted' | 'inactive';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  state?: ButtonState;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Glass-styled button with support for different states and sizes
 */
export default function GlassButton({
  children,
  onClick,
  className = '',
  state = 'default',
  size = 'md',
  fullWidth = false,
  icon,
  disabled = false,
}: GlassButtonProps) {
  // Map state to appropriate glass effect
  const effectMap = {
    default: 'light',
    highlighted: 'highlighted',
    inactive: 'inactive'
  } as const;
  
  const effect = effectMap[state];
  const glassStyle = glassEffects[effect];
  
  // Size classes - increased text size for better readability
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-base',
    md: 'px-4 py-2.5 text-lg',
    lg: 'px-5 py-3 text-xl',
  }[size];
  
  // Hover effect - only apply to non-disabled buttons
  const hoverStyle = !disabled ? {
    transition: transitions.default,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(31, 38, 135, 0.25)',
      opacity: 1,
    }
  } : {};
  
  const buttonStyle = {
    ...glassStyle,
    ...hoverStyle,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: transitions.default,
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`flex items-center justify-center rounded-lg font-medium ${sizeClasses} ${fullWidth ? 'w-full' : ''} text-lg font-semibold tracking-wide ${className}`}
      style={buttonStyle}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
