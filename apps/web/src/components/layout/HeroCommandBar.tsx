import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ShoppingCart,
  CheckSquare,
  HeartPulse,
  Wallet,
  CornerDownLeft,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface CategoryChipDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  activeClass: string;
}

export const CATEGORY_CHIPS: CategoryChipDef[] = [
  {
    id: 'Grocery',
    label: 'Grocery',
    icon: ShoppingCart,
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
    activeClass: 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/30 border-amber-400',
  },
  {
    id: 'Chore',
    label: 'Chore',
    icon: CheckSquare,
    colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
    activeClass: 'bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/30 border-blue-400',
  },
  {
    id: 'Medication',
    label: 'Medication',
    icon: HeartPulse,
    colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20',
    activeClass: 'bg-rose-500 text-white font-semibold shadow-md shadow-rose-500/30 border-rose-400',
  },
  {
    id: 'Expense',
    label: 'Expense',
    icon: Wallet,
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    activeClass: 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/30 border-emerald-400',
  },
];

export interface HeroCommandBarProps {
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  onSubmit?: (prompt: string, category?: string | null) => void;
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  className?: string;
}

export function HeroCommandBar({
  prompt: controlledPrompt,
  onPromptChange,
  onSubmit,
  selectedCategory: controlledCategory,
  onSelectCategory,
  className = '',
}: HeroCommandBarProps) {
  const { surface } = useTheme();
  const [internalPrompt, setInternalPrompt] = useState('');
  const [internalCategory, setInternalCategory] = useState<string | null>(null);

  const isPromptControlled = controlledPrompt !== undefined;
  const promptValue = isPromptControlled ? controlledPrompt : internalPrompt;

  const isCategoryControlled = controlledCategory !== undefined;
  const currentCategory = isCategoryControlled ? controlledCategory : internalCategory;

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20'
    : 'bg-slate-900 border border-slate-800 shadow-md';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isPromptControlled) {
      setInternalPrompt(val);
    }
    onPromptChange?.(val);
  };

  const handleSelectCategory = (catId: string) => {
    const next = currentCategory === catId ? null : catId;
    if (!isCategoryControlled) {
      setInternalCategory(next);
    }
    onSelectCategory?.(next);
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSubmit) {
      onSubmit(promptValue, currentCategory);
    }
    if (!isPromptControlled) {
      setInternalPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  return (
    <div
      data-testid="hero-command-bar"
      className={`rounded-xl p-3.5 transition-all ${surfaceClass} ${className}`}
    >
      <form onSubmit={handleFormSubmit} className="space-y-3">
        {/* Figma-inspired Prompt Input */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={promptValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="What needs doing today?"
            className="w-full pl-11 pr-12 py-2.5 rounded-lg bg-slate-950/60 border border-white/10 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
          />
          <button
            type="submit"
            aria-label="Submit command prompt"
            className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 transition-colors"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Instant Category Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 pl-1 mr-1">
            <Search className="h-3 w-3" />
            <span>Category:</span>
          </span>
          {CATEGORY_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const isSelected = currentCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="button"
                onClick={() => handleSelectCategory(chip.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all border ${
                  isSelected ? chip.activeClass : chip.colorClass
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
}
