import React from 'react';
import {
  Wallet,
  Pill,
  ListTodo,
  ShieldAlert,
  Radio,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ShoppingCart,
  Wifi,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';
import { type LayoutMode } from '../layout/FilterTabBar';
import { CashFlowCard } from '../cards/CashFlowCard';
import { MedicationTimelineCard } from '../cards/MedicationTimelineCard';
import { DailyOpsCard } from '../cards/DailyOpsCard';
import { BreakGlassStatusCard } from '../cards/BreakGlassStatusCard';
import { SystemSyncTelemetryCard } from '../cards/SystemSyncTelemetryCard';

export type BentoViewFilter = 'overview' | 'operations' | 'caregiver' | 'vault';

export interface BentoGridProps {
  viewFilter?: BentoViewFilter | string;
  layoutMode?: LayoutMode;
  memberFilter?: string;
  className?: string;
}

export function normalizeViewFilter(filter?: string): BentoViewFilter {
  if (!filter) return 'overview';
  const lower = filter.trim().toLowerCase();
  if (lower.includes('operat')) return 'operations';
  if (lower.includes('care')) return 'caregiver';
  if (lower.includes('vault') || lower.includes('secur')) return 'vault';
  return 'overview';
}

export function BentoGrid({
  viewFilter: rawViewFilter = 'overview',
  layoutMode = 'bento',
  memberFilter = 'all',
  className = '',
}: BentoGridProps) {
  const { session, isCaregiver } = useSession();
  const { surface } = useTheme();

  // Strict Caregiver Quarantine
  const isQuarantined = isCaregiver || session?.role === 'caregiver_guest';

  const viewFilter = normalizeViewFilter(rawViewFilter);

  // Determine which domain cards are visible for the selected view and role
  const showCashFlow = !isQuarantined && viewFilter === 'overview';
  const showMedication =
    viewFilter === 'overview' ||
    viewFilter === 'operations' ||
    viewFilter === 'caregiver';
  const showDailyOps =
    viewFilter === 'overview' ||
    viewFilter === 'operations' ||
    viewFilter === 'caregiver';
  const showBreakGlass = !isQuarantined && (viewFilter === 'overview' || viewFilter === 'vault');
  const showTelemetry = viewFilter === 'overview';

  const isGlass = surface === 'glass';
  const tableSurfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10'
    : 'bg-slate-900 border border-slate-800';

  if (layoutMode === 'table') {
    return (
      <div
        data-testid="bento-grid"
        data-layout-mode="table"
        className={`w-full space-y-4 ${className}`}
      >
        <div
          data-testid="bento-table-view"
          className={`rounded-2xl overflow-hidden shadow-xl border ${tableSurfaceClass}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/5">
                <tr>
                  <th className="px-5 py-3.5">Domain Module</th>
                  <th className="px-5 py-3.5">Status & Health</th>
                  <th className="px-5 py-3.5">Metrics / Summary</th>
                  <th className="px-5 py-3.5">Last Sync</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {/* Cash Flow Row - Quarantined for caregiver */}
                {showCashFlow && (
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">Cash Flow & Ledger</p>
                        <p className="text-[11px] text-slate-400">Monthly Checking & Sinking Funds</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="h-3 w-3" />
                        In Budget
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-100">$12,450.50</span> Checking / $35k Savings
                    </td>
                    <td className="px-5 py-4 text-slate-400">Just now</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <span>View Ledger</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}

                {/* Medication Timeline Row */}
                {showMedication && (
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">Medication Schedule</p>
                        <p className="text-[11px] text-slate-400">Daily Regimen & Doses</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Clock className="h-3 w-3" />
                        Next: 12:30 PM
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-100">1 of 4</span> doses taken today
                    </td>
                    <td className="px-5 py-4 text-slate-400">08:05 AM</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <span>Manage Doses</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}

                {/* Daily Ops Row */}
                {showDailyOps && (
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ListTodo className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">Daily Operations</p>
                        <p className="text-[11px] text-slate-400">Groceries & Chores</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShoppingCart className="h-3 w-3" />
                        3 Groceries Pending
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-100">2 Chores</span> remaining (+55 pts)
                    </td>
                    <td className="px-5 py-4 text-slate-400">2m ago</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <span>View Checklist</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}

                {/* Break-Glass Row - Quarantined for caregiver */}
                {showBreakGlass && (
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">Break-Glass Security</p>
                        <p className="text-[11px] text-slate-400">Escrow Unseal Cooldown</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <Clock className="h-3 w-3" />
                        Veto Window Active
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-rose-300">47:59:12</span> remaining
                    </td>
                    <td className="px-5 py-4 text-slate-400">Synchronized</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
                      >
                        <span>Security Controls</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}

                {/* System Telemetry Row */}
                {showTelemetry && (
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">Sync & Mesh Telemetry</p>
                        <p className="text-[11px] text-slate-400">SSE Stream & LAN Peers</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Wifi className="h-3 w-3" />
                        Connected
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-100">2 Local Peers</span> discovered
                    </td>
                    <td className="px-5 py-4 text-slate-400">Continuous</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <span>Inspect Network</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Asymmetric Bento Grid Mode
  return (
    <div
      data-testid="bento-grid"
      data-layout-mode="bento"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}
    >
      {/* Cash Flow Card: col-span-1 (quarantined for caregiver) */}
      {showCashFlow && (
        <div className="col-span-1">
          <CashFlowCard />
        </div>
      )}

      {/* Medication Timeline Card: spans 1 or 2 depending on view */}
      {showMedication && (
        <div
          className={
            viewFilter === 'operations' || viewFilter === 'caregiver'
              ? 'col-span-1 md:col-span-2 lg:col-span-1'
              : 'col-span-1 md:col-span-1 lg:col-span-2'
          }
        >
          <MedicationTimelineCard />
        </div>
      )}

      {/* Daily Operations Card: spans 1 or 2 */}
      {showDailyOps && (
        <div
          className={
            viewFilter === 'operations' || viewFilter === 'caregiver'
              ? 'col-span-1 md:col-span-2 lg:col-span-2'
              : 'col-span-1 md:col-span-2 lg:col-span-2'
          }
        >
          <DailyOpsCard />
        </div>
      )}

      {/* Break-Glass Status Card: col-span-1 (quarantined for caregiver) */}
      {showBreakGlass && (
        <div className="col-span-1">
          <BreakGlassStatusCard />
        </div>
      )}

      {/* System Sync Telemetry Card: col-span-1 */}
      {showTelemetry && (
        <div className="col-span-1">
          <SystemSyncTelemetryCard />
        </div>
      )}
    </div>
  );
}
