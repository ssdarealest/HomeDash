import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, AlertTriangle, Clock, Lock, FileText } from 'lucide-react';

export interface BreakGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (reason: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function BreakGlassModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: BreakGlassModalProps) {
  const [reason, setReason] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setIsConfirmed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm?.(reason.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-glass-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl shadow-rose-950/40 overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 id="break-glass-modal-title" className="text-base font-semibold tracking-tight text-rose-200">
                Initiate Break-Glass Protocol
              </h2>
              <p className="text-xs text-rose-300/70">Emergency Escrow Recovery & Cryptographic Unsealing</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-6 space-y-4">
          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>48-Hour Emergency Veto Window Activated Upon Confirmation</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Initiating this protocol alerts all household administrators and begins a 48-hour escrow countdown.
              All actions are signed and permanently logged in the immutable audit trail.
            </p>
          </div>

          {/* Emergency Justification Reason */}
          <div>
            <label htmlFor="break-glass-reason" className="block text-xs font-medium text-slate-300 mb-1.5">
              Emergency Declaration & Reason
            </label>
            <div className="relative">
              <textarea
                id="break-glass-reason"
                data-testid="break-glass-reason-input"
                rows={3}
                placeholder="Explain the emergency reason (e.g. Attending physician requires immediate health directives)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                id="break-glass-confirm"
                data-testid="break-glass-confirm-checkbox"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-950 text-rose-600 focus:ring-rose-500/40 cursor-pointer"
              />
              <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors">
                I confirm this is a legitimate emergency and acknowledge that a 48-hour notification will be broadcast to all household members.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="break-glass-submit-button"
              disabled={!isConfirmed || isLoading}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-rose-950/50"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Initiating...' : 'Initiate Break-Glass'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
