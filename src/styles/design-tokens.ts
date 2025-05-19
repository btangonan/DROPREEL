/**
 * DropReel Design System - Glassmorphism Style
 * 
 * This file defines core design tokens for implementing the glassmorphism design language
 * throughout the application. Glassmorphism is characterized by:
 * - Frosted glass-like elements with subtle transparency
 * - Soft backgrounds with blur effects
 * - Clean typography with strong contrast
 * - Minimalist UI with focused content areas
 * - Subtle shadows and highlights to create depth
 */

// Color Palette
export const colors = {
  // Base colors
  white: '#ffffff',
  black: '#000000',
  
  // Neutral palette
  neutral: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  
  // Primary brand colors
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Main primary color
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  
  // Accent colors
  accent: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // Main accent color
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  
  // Feedback colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Glass effect colors
  glass: {
    light: 'rgba(255, 255, 255, 0.7)',
    light50: 'rgba(255, 255, 255, 0.5)',
    light25: 'rgba(255, 255, 255, 0.25)',
    dark: 'rgba(0, 0, 0, 0.7)',
    dark50: 'rgba(0, 0, 0, 0.5)',
    dark25: 'rgba(0, 0, 0, 0.25)',
    blur: '10px', // Standard blur amount for glass effects
  }
};

// Typography
export const typography = {
  fontFamily: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    display: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  fontWeight: {
    normal: '500',     // Increased from 400 for better readability
    medium: '600',     // Increased from 500
    semibold: '700',   // Increased from 600
    bold: '800',       // Increased from 700
    heavy: '900',      // Added extra bold weight
  },
  fontSize: {
    xs: '0.875rem',    // 14px (increased from 12px)
    sm: '1rem',        // 16px (increased from 14px)
    base: '1.125rem',  // 18px (increased from 16px)
    lg: '1.25rem',     // 20px (increased from 18px)
    xl: '1.5rem',      // 24px (increased from 20px)
    '2xl': '1.75rem',  // 28px (increased from 24px)
    '3xl': '2rem',     // 32px (increased from 30px)
    '4xl': '2.5rem',   // 40px (increased from 36px)
    '5xl': '3.5rem',   // 56px (increased from 48px)
    '6xl': '4rem',     // 64px (new size for very large headings)
  },
  lineHeight: {
    tight: '1.2',       // Tightened slightly for headers
    normal: '1.4',      // Reduced from 1.5 for better appearance
    loose: '1.6',       // Reduced from 1.75
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.02em',
  },
};

// Spacing
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
};

// Glass Effects - Simplified with solid backgrounds for better readability
export const glassEffects = {
  light: {
    background: `rgba(255, 255, 255, 0.85)`,
    backdropFilter: `blur(2em)`,
    WebkitBackdropFilter: `blur(2em)`,
    border: `1px solid rgba(255, 255, 255, 0.18)`,
    boxShadow: `0 4px 12px 0 rgba(0, 0, 0, 0.1)`,
    color: '#111827',
  },
  medium: {
    background: `rgba(245, 245, 245, 0.75)`,
    backdropFilter: `blur(2em)`,
    WebkitBackdropFilter: `blur(2em)`,
    border: `1px solid rgba(255, 255, 255, 0.18)`,
    boxShadow: `0 4px 12px 0 rgba(0, 0, 0, 0.1)`,
    color: '#111827',
  },
  dark: {
    background: `rgba(30, 30, 30, 0.85)`,
    backdropFilter: `blur(2em)`,
    WebkitBackdropFilter: `blur(2em)`,
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    boxShadow: `0 4px 12px 0 rgba(0, 0, 0, 0.2)`,
    color: '#ffffff',
  },
  // States for interactive elements
  inactive: {
    background: `rgba(240, 240, 240, 0.75)`,
    backdropFilter: `blur(2em)`,
    WebkitBackdropFilter: `blur(2em)`,
    border: `1px solid rgba(240, 240, 240, 0.12)`,
    boxShadow: `0 2px 8px 0 rgba(0, 0, 0, 0.05)`,
    opacity: 0.8,
    color: '#6b7280',
  },
  highlighted: {
    background: `rgba(240, 245, 255, 0.95)`,
    backdropFilter: `blur(2em)`,
    WebkitBackdropFilter: `blur(2em)`,
    border: `1px solid rgba(255, 255, 255, 0.3)`,
    boxShadow: `0 6px 16px 0 rgba(0, 0, 0, 0.15)`,
    color: '#111827',
  },
};

// Shadows for adding depth
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// Rounded corners
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// Transitions
export const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.15s ease',
  slow: 'all 0.5s ease',
};

// Export a utility function to create glass-effect styles
export const createGlassStyle = ({
  opacity = 0.7,
  blur = colors.glass.blur,
  borderOpacity = 0.18,
  isDark = false,
  shadowIntensity = 0.37,
} = {}) => {
  const baseColor = isDark ? '0, 0, 0' : '255, 255, 255';
  const borderColor = isDark ? '255, 255, 255' : '255, 255, 255';
  const shadowColor = isDark ? '0, 0, 0' : '31, 38, 135';
  
  return {
    background: `rgba(${baseColor}, ${opacity})`,
    backdropFilter: `blur(${blur})`,
    border: `1px solid rgba(${borderColor}, ${borderOpacity})`,
    boxShadow: `0 8px 32px 0 rgba(${shadowColor}, ${shadowIntensity})`,
  };
};
