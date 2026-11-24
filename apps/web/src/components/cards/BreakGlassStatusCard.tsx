import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Key,
  Timer,
  Ban,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';

export interface BreakGlassStatusCardProps {
  countdownSeconds?: number;
  status?: 'sealed' | 'countdown' | 'unsealed';
  onVeto?: () => void;
  onUnseal?: () => void;
  isCaregiver?: boolean;
  className?: string;
}

export function BreakGlassStatusCard({
  countdownSeconds: initialSeconds = 172800, // 48 hours in seconds
  status: initialStatus = 'countdown',
  onVeto,
  onUnseal,
  isCaregiver: propIsCaregiver,
  className = '',
}: BreakGlassStatusCardProps) {
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

  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  useEffect(() => {
    if (currentStatus !== 'countdown' || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCurrentStatus('unsealed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStatus, secondsRemaining]);

  const handleVeto = () => {
    setCurrentStatus('sealed');
    onVeto?.();
  };

  const handleUnseal = () => {
    setCurrentStatus('countdown');
    onUnseal?.();
  };

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(
    minutes
  ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-100 shadow-xl'
    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md';

  return (
    <div
      data-testid="break-glass-status-card"
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${surfaceClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Break-Glass Protocol</h3>
            <p className="text-xs text-slate-400">Escrow Security & Emergency Unseal</p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Escrow Active
        </span>
      </div>

      {/* Countdown Timer Display */}
      <div className="py-4 space-y-3">
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-xs text-rose-300 font-medium mb-1">
            <Timer className="h-4 w-4 text-rose-400 animate-pulse" />
            <span>Emergency Veto Window Remaining</span>
          </div>

          <div
            data-testid="break-glass-countdown"
            className="text-3xl font-mono font-bold tracking-wider text-rose-200 py-1"
          >
            {formattedCountdown}
          </div>

          <p className="text-[11px] text-slate-400 max-w-sm mt-1">
            Household admins retain 48-hour veto capability over unsealed credentials.
            All unseal attempts generate cryptographically signed audit logs.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/5">
        <button
          type="button"
          onClick={handleVeto}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition-all shadow-md shadow-rose-900/30"
        >
          <Ban className="h-3.5 w-3.5" />
          <span>Veto Emergency</span>
        </button>

        <button
          type="button"
          onClick={handleUnseal}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white transition-all shadow-md shadow-amber-900/30"
        >
          <Key className="h-3.5 w-3.5" />
          <span>Trigger Unseal</span>
        </button>
      </div>
    </div>
  );
}
