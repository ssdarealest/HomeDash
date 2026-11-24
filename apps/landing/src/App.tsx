import React from 'react';
import { Shield } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-surface-dark text-slate-100 flex flex-col items-center justify-center p-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="p-3 rounded-full bg-surface-card border border-slate-800 text-brand-blue">
          <Shield className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">HomeDash Landing</h1>
        <p className="text-slate-400 max-w-md">
          The Sovereign Operating System for Modern Families. Zero cloud lock-in. No telemetry. 100% Local-First.
        </p>
      </header>
    </div>
  );
}
