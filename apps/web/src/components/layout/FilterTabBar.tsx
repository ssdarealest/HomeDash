import React, { useState } from 'react';
import {
  LayoutGrid,
  Table,
  Filter,
  Users,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSession } from '../../context/SessionContext';

export type LayoutMode = 'bento' | 'table';

export interface FilterTabBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedMember?: string;
  onMemberChange?: (memberId: string) => void;
  layoutMode?: LayoutMode;
  onLayoutModeChange?: (mode: LayoutMode) => void;
  members?: Array<{ id: string; name: string }>;
  className?: string;
}

export const FILTER_TABS = [
  'Overview',
  'Active Operations',
  'Caregiver Schedule',
  'Vault Security',
];

const DEFAULT_MEMBERS = [
  { id: 'all', name: 'All Members' },
  { id: 'm-1', name: 'Sarah Miller' },
  { id: 'm-2', name: 'Robert Miller' },
  { id: 'm-3', name: 'Maya Miller' },
  { id: 'm-4', name: 'Alex Rivera' },
];

export function FilterTabBar({
  activeTab: controlledTab,
  onTabChange,
  selectedMember: controlledMember,
  onMemberChange,
  layoutMode: controlledLayoutMode,
  onLayoutModeChange,
  members = DEFAULT_MEMBERS,
  className = '',
}: FilterTabBarProps) {
  const { surface } = useTheme();
  const { session, isCaregiver } = useSession();

  // Strict Caregiver Quarantine: filter out Vault Security tab
  const isQuarantined = isCaregiver || session.role === 'caregiver_guest';
  const visibleTabs = FILTER_TABS.filter((tab) => {
    if (tab === 'Vault Security' && isQuarantined) {
      return false;
    }
    return true;
  });

  const [internalTab, setInternalTab] = useState('Overview');
  const [internalMember, setInternalMember] = useState('all');
  const [internalLayoutMode, setInternalLayoutMode] = useState<LayoutMode>('bento');

  const currentTab = controlledTab !== undefined ? controlledTab : internalTab;
  const currentMember = controlledMember !== undefined ? controlledMember : internalMember;
  const currentLayoutMode =
    controlledLayoutMode !== undefined ? controlledLayoutMode : internalLayoutMode;

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10'
    : 'bg-slate-900 border border-slate-800';

  const handleTabClick = (tab: string) => {
    if (controlledTab === undefined) {
      setInternalTab(tab);
    }
    onTabChange?.(tab);
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (controlledMember === undefined) {
      setInternalMember(val);
    }
    onMemberChange?.(val);
  };

  const handleLayoutModeClick = (mode: LayoutMode) => {
    if (controlledLayoutMode === undefined) {
      setInternalLayoutMode(mode);
    }
    onLayoutModeChange?.(mode);
  };

  return (
    <div
      data-testid="filter-tab-bar"
      className={`rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap select-none transition-colors ${surfaceClass} ${className}`}
    >
      {/* Left: View Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist">
        {visibleTabs.map((tab) => {
          const isActive = currentTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Right: Member Filter Dropdown and Bento/Table Toggle */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Member Filter Dropdown */}
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-950/50 border border-white/10 px-2.5 py-1 text-xs">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <select
            data-testid="member-filter-select"
            value={currentMember}
            onChange={handleMemberChange}
            aria-label="Filter by Household Member"
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
          >
            {members.map((member) => (
              <option
                key={member.id}
                value={member.id}
                className="bg-slate-900 text-slate-200"
              >
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bento Grid vs Table View Toggle */}
        <div className="flex items-center rounded-lg bg-slate-950/50 border border-white/10 p-0.5">
          <button
            type="button"
            data-testid="layout-toggle-bento"
            aria-label="Bento Grid view"
            title="Bento Grid View"
            onClick={() => handleLayoutModeClick('bento')}
            className={`p-1.5 rounded-md transition-all ${
              currentLayoutMode === 'bento'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            data-testid="layout-toggle-table"
            aria-label="Table view"
            title="Table View"
            onClick={() => handleLayoutModeClick('table')}
            className={`p-1.5 rounded-md transition-all ${
              currentLayoutMode === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
