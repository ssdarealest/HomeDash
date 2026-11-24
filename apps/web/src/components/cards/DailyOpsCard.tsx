import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckSquare,
  Square,
  Sparkles,
  Award,
  ListTodo,
  Check,
  User,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  isChecked: boolean;
}

export interface ChoreItem {
  id: string;
  title: string;
  assignee: string;
  points: number;
  isCompleted: boolean;
  dueDate?: string;
}

export interface DailyOpsCardProps {
  groceryItems?: GroceryItem[];
  chores?: ChoreItem[];
  onToggleGrocery?: (itemId: string, isChecked: boolean) => void;
  onToggleChore?: (choreId: string, isCompleted: boolean) => void;
  className?: string;
}

const DEFAULT_GROCERY_ITEMS: GroceryItem[] = [
  { id: 'g-1', name: 'Almond Milk (Unsweetened)', quantity: '2 cartons', category: 'Dairy/Alt', isChecked: false },
  { id: 'g-2', name: 'Pasture-Raised Eggs', quantity: '1 dozen', category: 'Dairy', isChecked: true },
  { id: 'g-3', name: 'Extra Virgin Olive Oil', quantity: '1 bottle', category: 'Pantry', isChecked: false },
  { id: 'g-4', name: 'Organic Baby Spinach', quantity: '1 pack', category: 'Produce', isChecked: false },
];

const DEFAULT_CHORES: ChoreItem[] = [
  { id: 'c-1', title: 'Unload Dishwasher', assignee: 'Maya Miller', points: 25, isCompleted: false, dueDate: 'Today' },
  { id: 'c-2', title: 'Take Out Recycling & Trash', assignee: 'Alex Rivera', points: 15, isCompleted: true, dueDate: 'Today' },
  { id: 'c-3', title: 'Vacuum Living Room', assignee: 'Maya Miller', points: 30, isCompleted: false, dueDate: 'Tomorrow' },
];

export function DailyOpsCard({
  groceryItems: propGrocery,
  chores: propChores,
  onToggleGrocery,
  onToggleChore,
  className = '',
}: DailyOpsCardProps) {
  const { surface } = useTheme();
  const [internalGrocery, setInternalGrocery] = useState<GroceryItem[]>(DEFAULT_GROCERY_ITEMS);
  const [internalChores, setInternalChores] = useState<ChoreItem[]>(DEFAULT_CHORES);

  const groceryItems = propGrocery ?? internalGrocery;
  const chores = propChores ?? internalChores;

  const handleToggleGrocery = (id: string, currentChecked: boolean) => {
    const nextState = !currentChecked;
    if (onToggleGrocery) {
      onToggleGrocery(id, nextState);
    }
    if (!propGrocery) {
      setInternalGrocery((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isChecked: nextState } : item))
      );
    }
  };

  const handleToggleChore = (id: string, currentCompleted: boolean) => {
    const nextState = !currentCompleted;
    if (onToggleChore) {
      onToggleChore(id, nextState);
    }
    if (!propChores) {
      setInternalChores((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isCompleted: nextState } : c))
      );
    }
  };

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-100 shadow-xl'
    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md';

  const pendingGroceryCount = groceryItems.filter((i) => !i.isChecked).length;
  const pendingChoresCount = chores.filter((c) => !c.isCompleted).length;

  return (
    <div
      data-testid="daily-ops-card"
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${surfaceClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ListTodo className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Daily Operations</h3>
            <p className="text-xs text-slate-400">Pantry Restock & Household Chores</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-slate-950/60 border border-white/5 text-slate-300">
            {pendingGroceryCount} items needed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
        {/* Grocery Checklist Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
              <span>Grocery Checklist</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {groceryItems.length - pendingGroceryCount}/{groceryItems.length} checked
            </span>
          </div>

          <div className="space-y-1.5">
            {groceryItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleGrocery(item.id, item.isChecked)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                  item.isChecked
                    ? 'bg-slate-950/20 border-white/5 text-slate-500'
                    : 'bg-slate-950/40 border-white/5 hover:border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={() => handleToggleGrocery(item.id, item.isChecked)}
                    aria-label={item.name}
                    className="h-3.5 w-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span
                    className={`text-xs truncate ${
                      item.isChecked ? 'line-through text-slate-500' : 'font-medium'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                    {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chores Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Pending Chores</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {pendingChoresCount} remaining
            </span>
          </div>

          <div className="space-y-1.5">
            {chores.map((chore) => (
              <div
                key={chore.id}
                onClick={() => handleToggleChore(chore.id, chore.isCompleted)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                  chore.isCompleted
                    ? 'bg-slate-950/20 border-white/5 text-slate-500'
                    : 'bg-slate-950/40 border-white/5 hover:border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border text-[10px] ${
                      chore.isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'border-slate-700 text-transparent'
                    }`}
                  >
                    {chore.isCompleted && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs truncate ${
                        chore.isCompleted ? 'line-through text-slate-500' : 'font-medium'
                      }`}
                    >
                      {chore.title}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <User className="h-2.5 w-2.5" />
                      <span>{chore.assignee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    +{chore.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
