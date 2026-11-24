import React, { useState } from 'react';
import { Terminal, Copy, Check, ArrowRight, ChevronDown, ShieldCheck, Zap, Lock } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const command = 'docker compose up -d';
  const webappUrl = import.meta.env.VITE_WEBAPP_URL || 'http://localhost:5173';

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="hero" className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background radial gradient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-brand-green/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Immurok-style privacy badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-[#0D1117] text-slate-300 text-xs sm:text-sm font-mono mb-8 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span>Zero cloud lock-in. No telemetry. 100% Local-First</span>
        </div>

        {/* High-contrast headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 max-w-5xl leading-tight">
          The Sovereign Operating System for Modern Families
        </h1>

        {/* Subtitle description */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl leading-relaxed">
          Air-gapped financial tracking, multi-generational health care, and zero-knowledge family vaults.
          Powered by peer-to-peer CRDT sync and provable cryptographic security, running entirely on your local hardware.
        </p>

        {/* Terminal copyable snippet block */}
        <div className="mt-10 w-full max-w-xl">
          <div className="bg-[#0D1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-left">
            {/* Terminal title bar */}
            <div className="px-4 py-2.5 bg-[#161B22] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700/80" />
                <div className="w-3 h-3 rounded-full bg-slate-700/80" />
                <div className="w-3 h-3 rounded-full bg-slate-700/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  homedash-deploy ~ bash
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Instant Launch
              </span>
            </div>

            {/* Terminal command body */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 font-mono text-sm">
              <div className="flex items-center gap-3 overflow-x-auto text-slate-200">
                <Terminal className="w-4 h-4 text-brand-green shrink-0" aria-hidden="true" />
                <span className="text-slate-500 select-none">$</span>
                <span className="text-brand-blue font-semibold">{command}</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied docker command' : 'Copy docker command'}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-surface-card hover:bg-slate-800 text-xs font-medium text-slate-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-brand-green" aria-hidden="true" />
                    <span className="text-brand-green">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <a
            href={webappUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-brand-blue text-[#08090C] font-semibold text-sm hover:bg-brand-blue/90 transition-all shadow-lg hover:shadow-brand-blue/20"
          >
            <span>Launch Webapp</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="#architecture"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-slate-800 bg-[#0D1117] text-slate-300 font-semibold text-sm hover:text-white hover:border-slate-700 transition-all"
          >
            <span>Explore Architecture</span>
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        {/* Tactical Metrics Bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl pt-8 border-t border-slate-800/80">
          <div className="flex flex-col items-center p-4 rounded-lg bg-[#0D1117]/50 border border-slate-800/50">
            <div className="flex items-center gap-2 text-brand-green mb-1">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span className="text-xl font-bold font-mono">0 Bytes</span>
            </div>
            <span className="text-xs text-slate-400">Zero Cloud Telemetry Sent</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-[#0D1117]/50 border border-slate-800/50">
            <div className="flex items-center gap-2 text-brand-blue mb-1">
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span className="text-xl font-bold font-mono">256-Bit</span>
            </div>
            <span className="text-xs text-slate-400">XChaCha20-Poly1305 AEAD</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-[#0D1117]/50 border border-slate-800/50">
            <div className="flex items-center gap-2 text-brand-green mb-1">
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span className="text-xl font-bold font-mono">&lt; 5ms</span>
            </div>
            <span className="text-xs text-slate-400">Local P2P Sync Latency</span>
          </div>
        </div>
      </div>
    </section>
  );
};
