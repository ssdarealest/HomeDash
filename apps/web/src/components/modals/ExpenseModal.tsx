import React, { useState, useEffect } from 'react';
import { X, Plus, Wallet, DollarSign, Tag, CreditCard, FileText } from 'lucide-react';

export interface ExpenseFormData {
  amountCents: number;
  category: string;
  account: string;
  note: string;
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ExpenseFormData) => void | Promise<void>;
  isLoading?: boolean;
  initialCategory?: string;
}

const EXPENSE_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Housing',
  'Healthcare',
  'Transportation',
  'Entertainment',
  'Education',
  'Dining',
  'Other',
];

const ACCOUNT_OPTIONS = ['Checking', 'Savings', 'Credit Card', 'Cash'];

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialCategory = 'Groceries',
}: ExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [account, setAccount] = useState('Checking');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCategory(initialCategory);
      setAccount('Checking');
      setNote('');
      setError(null);
    }
  }, [isOpen, initialCategory]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than zero.');
      return;
    }

    const amountCents = Math.round(parsedAmount * 100);
    setError(null);
    onSubmit?.({
      amountCents,
      category,
      account,
      note,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 id="expense-modal-title" className="text-base font-semibold tracking-tight">
                Log Household Expense
              </h2>
              <p className="text-xs text-slate-400">Record a shared family or ledger transaction</p>
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
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label htmlFor="expense-amount" className="block text-xs font-medium text-slate-300 mb-1.5">
              Amount ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <input
                id="expense-amount"
                data-testid="expense-amount-input"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Category Select */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-category" className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <select
                  id="expense-category"
                  data-testid="expense-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Select */}
            <div>
              <label htmlFor="expense-account" className="block text-xs font-medium text-slate-300 mb-1.5">
                Account
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <select
                  id="expense-account"
                  data-testid="expense-account-select"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  {ACCOUNT_OPTIONS.map((acc) => (
                    <option key={acc} value={acc} className="bg-slate-900 text-slate-100">
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label htmlFor="expense-note" className="block text-xs font-medium text-slate-300 mb-1.5">
              Note (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <input
                id="expense-note"
                data-testid="expense-note-input"
                type="text"
                placeholder="e.g., Weekly grocery run at Trader Joe's"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-md shadow-emerald-900/30"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Saving...' : 'Log Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
