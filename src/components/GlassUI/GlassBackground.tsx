'use client';

import React from 'react';

interface GlassBackgroundProps {
  children: React.ReactNode;
}

/**
 * Provides a subtle gradient background for glassmorphism effects
 */
export default function GlassBackground({ children }: GlassBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full bg-gray-50">
      {/* Content container */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
