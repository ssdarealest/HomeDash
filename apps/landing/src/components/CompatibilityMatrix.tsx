import React from 'react';
import { Server, Terminal, Monitor, Smartphone, Globe, CheckCircle2 } from 'lucide-react';

interface PlatformRow {
  platform: string;
  icon: React.ReactNode;
  clientType: string;
  offlineFirst: boolean;
  p2pSync: boolean;
  hardwareVault: string;
  status: string;
}

const PLATFORMS: PlatformRow[] = [
  {
    platform: 'Docker',
    icon: <Server className="w-4 h-4 text-brand-blue" aria-hidden="true" />,
    clientType: 'Container Daemon & Web Bridge',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'TPM2 / Secure Key',
    status: 'Production Ready',
  },
  {
    platform: 'Linux',
    icon: <Terminal className="w-4 h-4 text-brand-green" aria-hidden="true" />,
    clientType: 'Native Executable & Systemd Service',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'SecretService / Keyring',
    status: 'Production Ready',
  },
  {
    platform: 'macOS',
    icon: <Monitor className="w-4 h-4 text-brand-blue" aria-hidden="true" />,
    clientType: 'Native Desktop App (Universal)',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'Secure Enclave / Keychain',
    status: 'Production Ready',
  },
  {
    platform: 'Windows',
    icon: <Monitor className="w-4 h-4 text-slate-300" aria-hidden="true" />,
    clientType: 'Native Desktop App (WinUI)',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'Windows Hello / DPAPI',
    status: 'Production Ready',
  },
  {
    platform: 'iOS',
    icon: <Smartphone className="w-4 h-4 text-brand-blue" aria-hidden="true" />,
    clientType: 'Native Flutter Mobile App',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'Secure Enclave / Keychain',
    status: 'Production Ready',
  },
  {
    platform: 'Android',
    icon: <Smartphone className="w-4 h-4 text-brand-green" aria-hidden="true" />,
    clientType: 'Native Flutter Mobile App',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'Android Keystore / StrongBox',
    status: 'Production Ready',
  },
  {
    platform: 'Web',
    icon: <Globe className="w-4 h-4 text-brand-blue" aria-hidden="true" />,
    clientType: 'Progressive Web Application (PWA)',
    offlineFirst: true,
    p2pSync: true,
    hardwareVault: 'WebAuthn / OPFS',
    status: 'Production Ready',
  },
];

export const CompatibilityMatrix: React.FC = () => {
  return (
    <section id="platforms" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-[#0D1117] text-brand-blue text-xs font-mono mb-4">
            <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cross-Platform Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
            True Sovereignty Across Every Platform
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl">
            Compiled native binaries for desktop, mobile, and server environments. Full offline capability with zero reliance on vendor cloud backends.
          </p>
        </div>

        {/* Matrix Table Container */}
        <div className="bg-[#0D1117] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#161B22]/80 text-xs font-mono uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-4 px-6">
                    Platform
                  </th>
                  <th scope="col" className="py-4 px-6">
                    Offline-First
                  </th>
                  <th scope="col" className="py-4 px-6">
                    P2P Sync
                  </th>
                  <th scope="col" className="py-4 px-6">
                    Hardware Vault
                  </th>
                  <th scope="col" className="py-4 px-6">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {PLATFORMS.map((item) => (
                  <tr
                    key={item.platform}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Platform name with icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#08090C] border border-slate-800 group-hover:border-slate-700 transition-colors">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">
                            {item.platform}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.clientType}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Offline-First */}
                    <td className="py-4 px-6 font-mono text-xs">
                      <div className="inline-flex items-center gap-1.5 text-brand-green">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Enabled</span>
                      </div>
                    </td>

                    {/* P2P Sync */}
                    <td className="py-4 px-6 font-mono text-xs">
                      <div className="inline-flex items-center gap-1.5 text-brand-green">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>mDNS / WebRTC</span>
                      </div>
                    </td>

                    {/* Hardware Vault */}
                    <td className="py-4 px-6 font-mono text-xs text-slate-300">
                      {item.hardwareVault}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 font-mono text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green border border-brand-green/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
