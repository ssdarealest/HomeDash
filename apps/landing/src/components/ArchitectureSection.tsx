import React, { useState } from 'react';
import { Layers, ShieldCheck, Key, Lock, Network, Database, Cpu, MonitorSmartphone } from 'lucide-react';

interface Tier {
  tierNumber: number;
  name: string;
  pkg: string;
  responsibility: string;
  highlight: string;
}

const TIERS: Tier[] = [
  {
    tierNumber: 1,
    name: 'Cryptographic Core',
    pkg: '@homedash/crypto',
    responsibility: 'Argon2id key derivation, XChaCha20-Poly1305 envelope encryption, and Shamir Secret Sharing M-of-N threshold splitting.',
    highlight: 'Mathematical Zero-Knowledge Root',
  },
  {
    tierNumber: 2,
    name: 'Protocol & Schema',
    pkg: '@homedash/protocol',
    responsibility: 'Zod-validated domain contracts, Hybrid Logical Clock (HLC) schemas, and binary serialization.',
    highlight: 'Unidirectional Type Safety',
  },
  {
    tierNumber: 3,
    name: 'Storage & Sync Engine',
    pkg: '@homedash/storage & @homedash/sync',
    responsibility: 'ACID transactional SQLite and IndexedDB drivers, CRDT state machines, and LAN mDNS discovery.',
    highlight: 'Conflict-Free Local Consensus',
  },
  {
    tierNumber: 4,
    name: 'Business Domains',
    pkg: '@homedash/finance, @homedash/health, @homedash/vault',
    responsibility: 'Double-entry accounting ledger, medication adherence engine, and emergency break-glass custody protocols.',
    highlight: 'Deterministic Household Logic',
  },
  {
    tierNumber: 5,
    name: 'Host Runtimes & Daemon',
    pkg: '@homedash/daemon',
    responsibility: 'Headless background daemon, local HTTP/WebSocket RPC bridge, and secure platform IPC sockets.',
    highlight: 'Zero-Telemetry Native Daemon',
  },
  {
    tierNumber: 6,
    name: 'User Applications',
    pkg: 'apps/desktop, apps/mobile, apps/webapp, apps/landing',
    responsibility: 'Native Flutter desktop/mobile runtimes and React 19 web interfaces for intuitive family interaction.',
    highlight: 'Cross-Platform Experience',
  },
];

export const ArchitectureSection: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<number>(1);

  return (
    <section id="architecture" className="py-20 md:py-28 bg-[#0D1117]/60 border-y border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-[#08090C] text-brand-green text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Monorepo Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            6-Tier Architecture &amp; Cryptographic Rigor
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-3xl">
            A strictly unidirectional dependency hierarchy ensuring low-level cryptographic primitives remain mathematically isolated from top-level application renderers.
          </p>
        </div>

        {/* 6-Tier Interactive Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Tier Selection Column */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Unidirectional Layer Hierarchy (Top to Base)
            </div>
            {TIERS.slice().reverse().map((t) => {
              const isSelected = selectedTier === t.tierNumber;
              return (
                <button
                  key={t.tierNumber}
                  type="button"
                  onClick={() => setSelectedTier(t.tierNumber)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#161B22] border-brand-blue text-white shadow-lg shadow-brand-blue/10'
                      : 'bg-[#08090C] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isSelected
                          ? 'bg-brand-blue text-[#08090C]'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      T{t.tierNumber}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">
                        Tier {t.tierNumber}: {t.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 truncate max-w-[220px]">
                        {t.pkg}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                    {t.highlight}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Tier Inspector */}
          <div className="lg:col-span-7 bg-[#08090C] border border-slate-800 rounded-2xl p-6 sm:p-8">
            {(() => {
              const active = TIERS.find((t) => t.tierNumber === selectedTier)!;
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-mono text-brand-blue uppercase tracking-wider">
                        Active Tier Specification
                      </span>
                      <h3 className="text-2xl font-bold text-slate-100">
                        Tier {active.tierNumber}: {active.name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                      Tier {active.tierNumber} of 6
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                      Packages &amp; Workspaces
                    </h4>
                    <div className="p-3 rounded-lg bg-[#0D1117] border border-slate-800 font-mono text-sm text-brand-blue">
                      {active.pkg}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                      Architectural Responsibilities
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {active.responsibility}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0D1117] border border-slate-800/80">
                    <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
                      Monorepo Invariant Enforced
                    </h4>
                    <p className="text-xs font-mono text-slate-400">
                      Strict downward-only dependency flow. No cyclic linkages. Tier {active.tierNumber} cannot import from any tier &gt; {active.tierNumber}.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Cryptographic Primitives Deep Dive */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-blue" aria-hidden="true" />
            <span>Cryptographic Primitives</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primitive 1 */}
            <div className="p-6 rounded-xl bg-[#08090C] border border-slate-800">
              <div className="flex items-center gap-2 text-brand-blue mb-2">
                <Key className="w-5 h-5" aria-hidden="true" />
                <h4 className="font-bold text-slate-100">Argon2id</h4>
              </div>
              <p className="text-xs font-mono text-slate-400 mb-3">
                Memory-hard master key derivation
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Derives 256-bit Key Encryption Keys (KEK) using high memory allocation (64MB) and multiple iterations to defeat parallel GPU and ASIC attacks.
              </p>
            </div>

            {/* Primitive 2 */}
            <div className="p-6 rounded-xl bg-[#08090C] border border-slate-800">
              <div className="flex items-center gap-2 text-brand-green mb-2">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                <h4 className="font-bold text-slate-100">XChaCha20-Poly1305</h4>
              </div>
              <p className="text-xs font-mono text-slate-400 mb-3">
                192-bit nonce AEAD cipher
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extended-nonce authenticated encryption ensuring cryptographic safety across multi-session key streams without risks of nonce collision.
              </p>
            </div>

            {/* Primitive 3 */}
            <div className="p-6 rounded-xl bg-[#08090C] border border-slate-800">
              <div className="flex items-center gap-2 text-brand-blue mb-2">
                <Layers className="w-5 h-5" aria-hidden="true" />
                <h4 className="font-bold text-slate-100">Shamir Secret Sharing</h4>
              </div>
              <p className="text-xs font-mono text-slate-400 mb-3">
                M-of-N threshold recovery
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Splits master vault recovery keys across trusted family custodians. The master key can only be reassembled when an M-of-N quorum consensus is reached.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
