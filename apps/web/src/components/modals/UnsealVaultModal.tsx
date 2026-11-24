import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  derivePersonalKek,
  unsealVaultItem,
  type SealedItem,
  type Argon2Options,
} from '@homedash/crypto';

export interface UnsealVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  sealedItem?: SealedItem;
  salt?: Uint8Array;
  argon2Options?: Argon2Options;
  onUnsealed?: (payload: Uint8Array, text: string) => void;
}

export function UnsealVaultModal({
  isOpen,
  onClose,
  sealedItem,
  salt,
  argon2Options,
  onUnsealed,
}: UnsealVaultModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [unsealedText, setUnsealedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassphrase('');
      setShowPassphrase(false);
      setIsUnsealing(false);
      setUnsealedText(null);
      setError(null);
      setIsCopied(false);
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

  const handleUnseal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setError('Master recovery passphrase is required.');
      return;
    }

    setError(null);
    setIsUnsealing(true);

    try {
      // 1. Derive personal KEK via Argon2id entirely in the browser client runtime
      const effectiveSalt = salt ?? new Uint8Array(16);
      const kek = await derivePersonalKek(passphrase, effectiveSalt, argon2Options);

      // 2. Unseal emergency payload if provided
      if (sealedItem) {
        const decryptedBytes = unsealVaultItem(sealedItem, kek);
        const text = new TextDecoder().decode(decryptedBytes);
        setUnsealedText(text);
        onUnsealed?.(decryptedBytes, text);
      } else {
        const message = 'Vault KEK successfully derived in client runtime.';
        setUnsealedText(message);
        onUnsealed?.(kek, message);
      }
    } catch {
      // Catch any decryption error (e.g., Poly1305 MAC tag failure)
      // Zero leakage: never expose internal stack trace or plaintext
      setError('Failed to unseal vault: Invalid recovery passphrase or corrupted payload.');
      setUnsealedText(null);
    } finally {
      setIsUnsealing(false);
    }
  };

  const handleCopy = async () => {
    if (!unsealedText) return;
    try {
      await navigator.clipboard.writeText(unsealedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unseal-vault-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 id="unseal-vault-modal-title" className="text-base font-semibold tracking-tight">
                Client-Side Vault Unsealing
              </h2>
              <p className="text-xs text-slate-400">Zero-knowledge local cryptographic decryption</p>
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

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Zero Plaintext Key Leakage Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-100">Zero Plaintext Key Leakage:</span> Key
              derivation (Argon2id) and decryption (XChaCha20-Poly1305) execute exclusively in your
              browser runtime. The recovery passphrase and unsealed payloads are never sent to the server.
            </div>
          </div>

          {error && (
            <div
              data-testid="unseal-error-message"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!unsealedText ? (
            <form onSubmit={handleUnseal} className="space-y-4">
              <div>
                <label
                  htmlFor="vault-passphrase"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Master Recovery Passphrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="vault-passphrase"
                    data-testid="vault-passphrase-input"
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter your master recovery passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    disabled={isUnsealing}
                    className="w-full pl-9 pr-11 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUnsealing}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="vault-unseal-button"
                  disabled={isUnsealing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:opacity-40 text-white transition-all shadow-md shadow-amber-950/40"
                >
                  {isUnsealing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deriving KEK...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Unseal Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Unsealed Payload View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Payload Successfully Unsealed</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition-colors"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div
                data-testid="unsealed-payload-display"
                className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed shadow-inner"
              >
                {unsealedText}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
