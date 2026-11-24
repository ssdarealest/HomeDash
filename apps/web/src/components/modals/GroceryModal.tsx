import React, { useState, useEffect } from 'react';
import { X, Plus, ShoppingCart, Tag, Hash, FileText } from 'lucide-react';

export interface GroceryFormData {
  name: string;
  quantity: string;
  category: string;
  note?: string;
}

export interface GroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: GroceryFormData) => void | Promise<void>;
  isLoading?: boolean;
}

const GROCERY_CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Bakery',
  'Meat & Seafood',
  'Pantry',
  'Beverages',
  'Household',
  'Snacks',
  'Frozen',
];

export function GroceryModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: GroceryModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Produce');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setQuantity('1');
      setCategory('Produce');
      setNote('');
      setError(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a grocery item name.');
      return;
    }

    setError(null);
    onSubmit?.({
      name: name.trim(),
      quantity: quantity.trim() || '1',
      category,
      note: note.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grocery-modal-title"
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
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 id="grocery-modal-title" className="text-base font-semibold tracking-tight">
                Add Grocery Item
              </h2>
              <p className="text-xs text-slate-400">Append to collaborative household shopping list</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label htmlFor="grocery-name" className="block text-xs font-medium text-slate-300 mb-1.5">
              Item Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <input
                id="grocery-name"
                data-testid="grocery-name-input"
                type="text"
                placeholder="e.g. Oat Milk"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          {/* Quantity & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grocery-quantity" className="block text-xs font-medium text-slate-300 mb-1.5">
                Quantity
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="h-3.5 w-3.5" />
                </div>
                <input
                  id="grocery-quantity"
                  data-testid="grocery-quantity-input"
                  type="text"
                  placeholder="e.g. 2 cartons"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="grocery-category" className="block text-xs font-medium text-slate-300 mb-1.5">
                Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <select
                  id="grocery-category"
                  data-testid="grocery-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                >
                  {GROCERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="grocery-note" className="block text-xs font-medium text-slate-300 mb-1.5">
              Brand / Notes (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <input
                id="grocery-note"
                data-testid="grocery-note-input"
                type="text"
                placeholder="e.g., Unsweetened barista edition"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 active:scale-95 text-white transition-all shadow-md shadow-amber-900/30"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Adding...' : 'Add to Grocery List'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
