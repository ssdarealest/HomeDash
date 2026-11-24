import React from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SyncTelemetryProvider, useSyncTelemetry } from './context/SyncTelemetryContext';

function DashboardShell() {
  const { session, switchRole, isCaregiver, logout } = useSession();
  const { theme, surface, toggleTheme, toggleSurface } = useTheme();
  const { status, hlc, peers } = useSyncTelemetry();

  return (
    <div className="min-h-screen p-6 transition-colors duration-200">
      <header className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">HomeDash Family OS</h1>
          <p className="text-sm text-slate-400">Desktop Spatial Workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-md text-xs font-medium surface-card"
          >
            Theme: {theme}
          </button>
          <button
            onClick={toggleSurface}
            className="px-3 py-1.5 rounded-md text-xs font-medium surface-card"
          >
            Surface: {surface}
          </button>
          <button
            onClick={() => switchRole(isCaregiver ? 'admin' : 'caregiver_guest')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Role: {session.role}
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600/80 hover:bg-red-500 text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mt-6">
        <div className="surface-card p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-2">System Telemetry</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Status:</span>{' '}
              <span className="font-mono text-emerald-400">{status}</span>
            </div>
            <div>
              <span className="text-slate-400">HLC Clock:</span>{' '}
              <span className="font-mono">{hlc}</span>
            </div>
            <div>
              <span className="text-slate-400">Connected Peers:</span>{' '}
              <span className="font-mono">{peers.length}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SyncTelemetryProvider>
          <DashboardShell />
        </SyncTelemetryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
