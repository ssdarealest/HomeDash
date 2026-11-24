import React from 'react';
import {
  ChevronRight,
  Plus,
  ShieldAlert,
  Wallet,
  HeartPulse,
  ShoppingCart,
  User,
  Sun,
  Moon,
  Layers,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';
import type { UserRole } from '@homedash/protocol';

export type QuickActionType = 'expense' | 'dose' | 'grocery' | 'break-glass';

export interface TopUtilityHeaderProps {
  activeModule?: string;
  onQuickAction?: (action: QuickActionType) => void;
  onToggleSidebar?: () => void;
  className?: string;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'daily-ops': 'Daily Ops',
  'health-hub': 'Health Hub',
  finance: 'Finance',
  vault: 'Vault',
  'p2p-sync': 'P2P Sync',
  settings: 'Settings',
};

function formatModuleBreadcrumb(moduleKey: string): string {
  if (MODULE_LABELS[moduleKey]) {
    return MODULE_LABELS[moduleKey];
  }
  return moduleKey
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TopUtilityHeader({
  activeModule = 'dashboard',
  onQuickAction,
  className = '',
}: TopUtilityHeaderProps) {
  const { session, switchRole, isCaregiver } = useSession();
  const { theme, surface, toggleTheme, toggleSurface } = useTheme();

  // Strict Caregiver Quarantine: omit Break-Glass quick action pill
  const isQuarantined = isCaregiver || session.role === 'caregiver_guest';

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border-b border-white/10'
    : 'bg-slate-900 border-b border-slate-800';

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    await switchRole(newRole);
  };

  return (
    <header
      data-testid="top-utility-header"
      className={`h-14 px-6 flex items-center justify-between z-10 transition-colors ${surfaceClass} ${className}`}
    >
      {/* Left: Active Module Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-slate-400">HomeDash</span>
        <ChevronRight className="h-4 w-4 text-slate-600" />
        <span
          data-testid="active-breadcrumb"
          className="font-medium text-slate-100 font-sans tracking-tight"
        >
          {formatModuleBreadcrumb(activeModule)}
        </span>
      </div>

      {/* Center: Quick Action Pill Buttons */}
      <div className="flex items-center gap-2">
        {!isQuarantined && (
          <button
            type="button"
            onClick={() => onQuickAction?.('expense')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Expense</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onQuickAction?.('dose')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Dose</span>
        </button>

        <button
          type="button"
          onClick={() => onQuickAction?.('grocery')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Grocery</span>
        </button>

        {/* Quarantine: Omitted when caregiver_guest */}
        {!isQuarantined && (
          <button
            type="button"
            onClick={() => onQuickAction?.('break-glass')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 hover:border-red-500/50 transition-all shadow-sm shadow-red-500/20"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Break-Glass</span>
          </button>
        )}
      </div>

      {/* Right: Theme / Surface / User Role Switcher */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Toggle Theme (Current: ${theme})`}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={toggleSurface}
          title={`Toggle Surface Style (Current: ${surface})`}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
        >
          <Layers className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        {/* Role Switcher Dropdown */}
        <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 border border-white/10 px-2 py-1">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <select
            data-testid="role-switcher-select"
            value={session.role}
            onChange={handleRoleChange}
            className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="admin" className="bg-slate-900 text-slate-200">
              Admin
            </option>
            <option value="senior" className="bg-slate-900 text-slate-200">
              Senior
            </option>
            <option value="teen_child" className="bg-slate-900 text-slate-200">
              Teen Child
            </option>
            <option value="caregiver_guest" className="bg-slate-900 text-slate-200">
              Caregiver Guest
            </option>
          </select>
        </div>
      </div>
    </header>
  );
}
