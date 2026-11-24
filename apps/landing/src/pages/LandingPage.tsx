import React from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { BentoFeatureSection } from '../components/BentoFeatureSection';
import { ArchitectureSection } from '../components/ArchitectureSection';
import { CompatibilityMatrix } from '../components/CompatibilityMatrix';
import { Footer } from '../components/Footer';

export interface LandingPageProps {
  onNavigateDocs?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateDocs }) => {
  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 selection:bg-brand-blue selection:text-[#08090C]">
      <Navbar onNavigateDocs={onNavigateDocs} />
      <main>
        <HeroSection />
        <BentoFeatureSection />
        <ArchitectureSection />
        <CompatibilityMatrix />
      </main>
      <Footer onNavigateDocs={onNavigateDocs} />
    </div>
  );
};
