import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  HeartPulse,
  Wallet,
  ShieldAlert,
  Radio,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';
import { useSyncTelemetry } from '../../context/SyncTelemetryContext';

export interface MemberRosterItem {
  id: string;
  name: string;
  role: string;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  activeModule?: string;
  onSelectModule?: (moduleId: string) => void;
  householdName?: string;
  members?: MemberRosterItem[];
  className?: string;
}

interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  restrictedToMembers?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'daily-ops', label: 'Daily Ops', icon: CheckSquare },
  { id: 'health-hub', label: 'Health Hub', icon: HeartPulse },
  { id: 'finance', label: 'Finance', icon: Wallet, restrictedToMembers: true },
  { id: 'vault', label: 'Vault', icon: ShieldAlert, restrictedToMembers: true },
  { id: 'p2p-sync', label: 'P2P Sync', icon: Radio },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const DEFAULT_MEMBERS: MemberRosterItem[] = [
  { id: 'm-1', name: 'Sarah Miller', role: 'admin' },
  { id: 'm-2', name: 'Robert Miller', role: 'senior' },
  { id: 'm-3', name: 'Maya Miller', role: 'teen_child' },
  { id: 'm-4', name: 'Alex Rivera', role: 'caregiver_guest' },
];

function formatRoleName(role: string): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'senior':
      return 'Senior';
    case 'teen_child':
      return 'Teen';
    case 'caregiver_guest':
      return 'Caregiver';
    default:
      return role;
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'senior':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'teen_child':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'caregiver_guest':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  activeModule = 'dashboard',
  onSelectModule,
  householdName = 'The Miller Household',
  members = DEFAULT_MEMBERS,
  className = '',
}: SidebarProps) {
  const { session, isCaregiver } = useSession();
  const { surface } = useTheme();
  const { status, peers } = useSyncTelemetry();

  // Strict Caregiver Quarantine: suppress Finance and Vault
  const isQuarantined = isCaregiver || session.role === 'caregiver_guest';
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.restrictedToMembers || !isQuarantined
  );

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/70 backdrop-blur-md border-r border-white/10'
    : 'bg-slate-900 border-r border-slate-800';

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      className={`relative flex flex-col justify-between transition-all duration-200 select-none z-20 ${
        collapsed ? 'w-20' : 'w-64'
      } ${surfaceClass} ${className}`}
    >
      {/* Top Header / Household Profile */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-semibold tracking-tight text-white truncate">
                {householdName}
              </h2>
              <span className="text-xs text-slate-400">Family OS</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        )}

        <button
          type="button"
          data-testid="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${
            collapsed ? 'mx-auto mt-2' : ''
          }`}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {!collapsed && 'Modules'}
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                role="button"
                onClick={() => onSelectModule?.(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Member Roster */}
        <div className="pt-6">
          <div className="px-2 pb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {!collapsed ? (
              <>
                <span>Household Roster</span>
                <Users className="h-3.5 w-3.5 text-slate-500" />
              </>
            ) : (
              <Users className="h-4 w-4 mx-auto text-slate-500" />
            )}
          </div>

          <div className="space-y-1">
            {members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs ${
                  collapsed ? 'justify-center' : 'justify-between'
                } hover:bg-white/5 transition-colors`}
                title={`${member.name} (${formatRoleName(member.role)})`}
              >
                {!collapsed ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="truncate text-slate-300">{member.name}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium border ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {formatRoleName(member.role)}
                    </span>
                  </>
                ) : (
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Self-Hosted Node Status Badge */}
      <div className="p-3 border-t border-white/10">
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-950/40 p-2.5 border border-white/5">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-2 w-2 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : status === 'reconnecting'
                    ? 'bg-amber-400'
                    : 'bg-red-500'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200">Local Node</span>
                <span className="text-[10px] text-slate-400 capitalize">{status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Radio className="h-3 w-3 text-slate-400" />
              <span>{peers.length}p</span>
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center py-2"
            title={`Node status: ${status} (${peers.length} peers)`}
          >
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : status === 'reconnecting'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
