import React from 'react';
import { Shield, Github, BookOpen, Lock } from 'lucide-react';

export interface FooterProps {
  onNavigateLanding?: () => void;
  onNavigateDocs?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateLanding,
  onNavigateDocs,
}) => {
  return (
    <footer id="footer" className="bg-[#08090C] border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Zero-Telemetry Manifesto */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0D1117] border border-slate-800 text-brand-blue">
                <Shield className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-slate-100 tracking-tight">
                HomeDash
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              Zero telemetry. No tracking cookies. Zero third-party analytics. 100% local-first and auditable open-source family operating system.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0D1117] border border-slate-800 text-brand-green font-mono text-xs">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Zero cloud leakage guaranteed by design</span>
            </div>
          </div>

          {/* Navigation Anchors */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-200 uppercase tracking-wider text-xs font-mono">
              Navigation
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-slate-100 transition-colors">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-slate-100 transition-colors">
                  Monorepo Architecture
                </a>
              </li>
              <li>
                <a href="#platforms" className="hover:text-slate-100 transition-colors">
                  Supported Platforms
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5173"
                  className="hover:text-brand-blue transition-colors flex items-center gap-1"
                >
                  <span>Open Webapp</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Open-Source & Community */}
          <div className="space-y-3">
            <div className="font-semibold text-slate-200 uppercase tracking-wider text-xs font-mono">
              Open-Source
            </div>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/homedash/homedash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-100 transition-colors inline-flex items-center gap-2"
                >
                  <Github className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="#docs"
                  onClick={(e) => {
                    if (onNavigateDocs) {
                      e.preventDefault();
                      onNavigateDocs();
                    }
                  }}
                  className="hover:text-slate-100 transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Documentation</span>
                </a>
              </li>
              <li>
                <span className="text-slate-500">
                  Licensed under the MIT License
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div>
            &copy; {new Date().getFullYear()} HomeDash Contributors. MIT License.
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#hero"
              onClick={(e) => {
                if (onNavigateLanding) {
                  e.preventDefault();
                  onNavigateLanding();
                }
              }}
              className="hover:text-slate-300 transition-colors"
            >
              Back to Top
            </a>
            <span className="text-slate-700">|</span>
            <span>Zero Telemetry Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
