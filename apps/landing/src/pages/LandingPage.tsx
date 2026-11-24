import React from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { BentoFeatureSection } from '../components/BentoFeatureSection';
import { ArchitectureSection } from '../components/ArchitectureSection';
import { CompatibilityMatrix } from '../components/CompatibilityMatrix';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 selection:bg-brand-blue selection:text-[#08090C]">
      <Navbar />
      <main>
        <HeroSection />
        <BentoFeatureSection />
        <ArchitectureSection />
        <CompatibilityMatrix />
      </main>
      <Footer />
    </div>
  );
};
