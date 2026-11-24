import React from 'react';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';

export interface SinkingFundItem {
  id: string;
  name: string;
  currentCents: number;
  targetCents: number;
  category?: string;
}

export interface CashFlowCardProps {
  monthlyIncomeCents?: number;
  monthlyExpenseCents?: number;
  checkingBalanceCents?: number;
  emergencySavingsCents?: number;
  sinkingFunds?: SinkingFundItem[];
  isCaregiver?: boolean;
  className?: string;
}

const DEFAULT_SINKING_FUNDS: SinkingFundItem[] = [
  {
    id: 'fund-1',
    name: 'Property Tax',
    currentCents: 380000,
    targetCents: 500000,
  },
  {
    id: 'fund-2',
    name: 'Home Insurance',
    currentCents: 145000,
    targetCents: 200000,
  },
  {
    id: 'fund-3',
    name: 'Car Maintenance',
    currentCents: 95000,
    targetCents: 120000,
  },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function CashFlowCard({
  monthlyIncomeCents = 840000,
  monthlyExpenseCents = 524000,
  checkingBalanceCents = 1245050,
  emergencySavingsCents = 3500000,
  sinkingFunds = DEFAULT_SINKING_FUNDS,
  isCaregiver: propIsCaregiver,
  className = '',
}: CashFlowCardProps) {
  const { session, isCaregiver: contextIsCaregiver } = useSession();
  const { surface } = useTheme();

  // Strict Caregiver Quarantine: Under no circumstances render in DOM if caregiver
  const isQuarantined =
    propIsCaregiver ||
    contextIsCaregiver ||
    session?.role === 'caregiver_guest';

  if (isQuarantined) {
    return null;
  }

  const netCents = monthlyIncomeCents - monthlyExpenseCents;
  const isPositiveNet = netCents >= 0;

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-100 shadow-xl'
    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md';

  return (
    <div
      data-testid="cash-flow-card"
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${surfaceClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Cash Flow</h3>
            <p className="text-xs text-slate-400">Monthly Financial Overview</p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Live Ledger
        </span>
      </div>

      {/* Cash Flow Summary */}
      <div className="py-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Inflow</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-slate-100">
            {formatCurrency(monthlyIncomeCents)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Outflow</span>
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-base font-bold text-slate-100">
            {formatCurrency(monthlyExpenseCents)}
          </div>
        </div>
      </div>

      {/* Account Balances */}
      <div className="space-y-2 py-2">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Accounts
        </div>
        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/30 border border-white/5">
          <div className="flex items-center gap-2 text-slate-300">
            <CreditCard className="h-3.5 w-3.5 text-blue-400" />
            <span>Shared Checking</span>
          </div>
          <span className="font-semibold text-slate-100">
            {formatCurrency(checkingBalanceCents)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/30 border border-white/5">
          <div className="flex items-center gap-2 text-slate-300">
            <PiggyBank className="h-3.5 w-3.5 text-indigo-400" />
            <span>Emergency Savings</span>
          </div>
          <span className="font-semibold text-slate-100">
            {formatCurrency(emergencySavingsCents)}
          </span>
        </div>
      </div>

      {/* Sinking Funds Progress Bars */}
      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          <span>Sinking Funds</span>
          <span className="text-[11px] text-slate-400 lowercase">targets</span>
        </div>
        <div data-testid="sinking-funds-progress" className="space-y-2.5">
          {sinkingFunds.map((fund) => {
            const percent = Math.min(
              100,
              Math.round((fund.currentCents / fund.targetCents) * 100)
            );
            return (
              <div key={fund.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{fund.name}</span>
                  <span className="text-slate-400">
                    {formatCurrency(fund.currentCents)} / {formatCurrency(fund.targetCents)}{' '}
                    <span className="text-emerald-400 font-semibold ml-1">
                      {percent}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
