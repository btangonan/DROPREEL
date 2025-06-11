'use client';

import React from 'react';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { ServicesSection } from './ServicesSection';
import { CTASection } from './CTASection';

export function DigitalSyncWebsite() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <CTASection />
      </main>
    </div>
  );
}