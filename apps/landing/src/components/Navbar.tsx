import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

export interface NavbarProps {
  onNavigateLanding?: () => void;
  onNavigateDocs?: () => void;
  isDocsView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateLanding,
  onNavigateDocs,
  isDocsView = false,
}) => {
  const webappUrl = import.meta.env.VITE_WEBAPP_URL || 'http://localhost:5173';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#08090C]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0D1117] border border-slate-800 text-brand-blue shadow-sm">
            <Shield className="w-5 h-5" aria-hidden="true" />
          </div>
          <a
            href="#"
            onClick={(e) => {
              if (onNavigateLanding) {
                e.preventDefault();
                onNavigateLanding();
              }
            }}
            className="flex items-center gap-2 group"
          >
            <span className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-brand-blue transition-colors">
              HomeDash
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
              v0.1-local
            </span>
          </a>
        </div>

        {/* Navigation Anchors */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            onClick={(e) => {
              if (onNavigateLanding && isDocsView) {
                e.preventDefault();
                onNavigateLanding();
                window.location.hash = '#features';
              }
            }}
            className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            Features
          </a>
          <a
            href="#architecture"
            onClick={(e) => {
              if (onNavigateLanding && isDocsView) {
                e.preventDefault();
                onNavigateLanding();
                window.location.hash = '#architecture';
              }
            }}
            className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            Architecture
          </a>
          <a
            href="#platforms"
            onClick={(e) => {
              if (onNavigateLanding && isDocsView) {
                e.preventDefault();
                onNavigateLanding();
                window.location.hash = '#platforms';
              }
            }}
            className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            Platforms
          </a>
          <a
            href="#docs"
            onClick={(e) => {
              if (onNavigateDocs) {
                e.preventDefault();
                onNavigateDocs();
              }
            }}
            className={`text-sm font-medium transition-colors ${
              isDocsView ? 'text-brand-blue font-semibold' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Docs
          </a>
          <a
            href="#github"
            className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            GitHub
          </a>
        </nav>

        {/* Open Webapp CTA */}
        <div className="flex items-center gap-4">
          <a
            href={webappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-brand-blue text-[#08090C] hover:bg-brand-blue/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-[#08090C]"
          >
            <span>Open Webapp</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
};
