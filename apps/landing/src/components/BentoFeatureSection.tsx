import React from 'react';
import { Wallet, HeartPulse, ShieldAlert, Network, ArrowUpRight, Cpu, Layers } from 'lucide-react';

interface BentoCardProps {
  icon: React.ReactNode;
  category: string;
  title: string;
  description: string;
  badge: string;
  features: string[];
  accentColor: 'blue' | 'green';
}

const BentoCard: React.FC<BentoCardProps> = ({
  icon,
  category,
  title,
  description,
  badge,
  features,
  accentColor,
}) => {
  const accentBorder =
    accentColor === 'blue'
      ? 'group-hover:border-brand-blue/50'
      : 'group-hover:border-brand-green/50';
  const badgeStyle =
    accentColor === 'blue'
      ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
      : 'bg-brand-green/10 text-brand-green border-brand-green/20';
  const iconContainer =
    accentColor === 'blue'
      ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
      : 'bg-brand-green/10 text-brand-green border-brand-green/20';

  return (
    <div
      className={`group relative rounded-2xl bg-[#0D1117] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-950/50 ${accentBorder}`}
    >
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-xl border ${iconContainer}`}>
            {icon}
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${badgeStyle}`}>
            {badge}
          </span>
        </div>

        {/* Category & Title */}
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
          {category}
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3 tracking-tight group-hover:text-white transition-colors">
          {title}
        </h3>

        {/* Narrative Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {description}
        </p>
      </div>

      {/* Feature Bullet Highlights */}
      <div className="pt-4 border-t border-slate-800/80">
        <ul className="space-y-2.5">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-brand-blue transition-colors" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const BentoFeatureSection: React.FC = () => {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-[#0D1117] text-brand-blue text-xs font-mono mb-4">
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Modular Bento Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            Four Pillars of Absolute Sovereignty
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl">
            Designed for households that refuse to trade convenience for autonomy. Every byte remains on your personal devices.
          </p>
        </div>

        {/* 4-Tile Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Pillar 1: Family Finance */}
          <BentoCard
            icon={<Wallet className="w-6 h-6" aria-hidden="true" />}
            category="Economic Ledger"
            title="Family Finance & Automated OCR Ingestion"
            description="Complete double-entry accounting with granular cash flow tracking, sinking funds allocation, and encrypted receipts parsed directly on-device using client-side WASM OCR."
            badge="Client-Side OCR"
            accentColor="blue"
            features={[
              'Real-time cash flow and multi-account reconciliation',
              'Goal-oriented sinking funds with automated quota alerts',
              'Client-side parsed encrypted receipts with zero cloud leakage',
            ]}
          />

          {/* Pillar 2: Multi-Gen Care & Health Hub */}
          <BentoCard
            icon={<HeartPulse className="w-6 h-6" aria-hidden="true" />}
            category="Multi-Gen Well-Being"
            title="Multi-Gen Care & Health Hub"
            description="Comprehensive family care monitoring providing medication scheduling, vital trends analytics, and caregiver shift logging built with strict privacy controls for dependent relatives."
            badge="HIPAA-Grade Local"
            accentColor="green"
            features={[
              'High-reliability medication scheduling with dosage confirmation',
              'Multi-metric vital trends tracking (glucose, blood pressure, SPO2)',
              'Caregiver shift logging with timestamped handover notes',
            ]}
          />

          {/* Pillar 3: Zero-Knowledge Vault with Break-Glass */}
          <BentoCard
            icon={<ShieldAlert className="w-6 h-6" aria-hidden="true" />}
            category="Emergency Resilience"
            title="Zero-Knowledge Vault with Break-Glass"
            description="Cryptographic estate planning utilizing Argon2id key derivation, Shamir Secret Sharing threshold recovery, and a tamper-evident 48-hour cooldown countdown safeguard."
            badge="Shamir M-of-N"
            accentColor="blue"
            features={[
              'Argon2id memory-hard master key derivation',
              'Shamir Secret Sharing multi-custodian quorum assembly',
              'Emergency break-glass activation with 48-hour cooldown countdown',
            ]}
          />

          {/* Pillar 4: Local-First P2P Sync Engine */}
          <BentoCard
            icon={<Network className="w-6 h-6" aria-hidden="true" />}
            category="Distributed Mesh"
            title="Local-First P2P Sync Engine"
            description="Zero cloud dependency mesh network with automatic peer discovery, hybrid logical clocks for conflict-free state resolution, and background LAN synchronization."
            badge="Pure Local Mesh"
            accentColor="green"
            features={[
              'Hybrid logical clocks for deterministically ordered state merges',
              'mDNS and WebSocket local peer discovery across household nodes',
              'Zero cloud dependency with full offline-first resilience',
            ]}
          />
        </div>
      </div>
    </section>
  );
};
