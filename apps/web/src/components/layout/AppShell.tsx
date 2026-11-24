import React, { useState } from 'react';
import { Sidebar, type MemberRosterItem } from './Sidebar';
import { TopUtilityHeader, type QuickActionType } from './TopUtilityHeader';
import { HeroCommandBar } from './HeroCommandBar';
import { FilterTabBar, type LayoutMode } from './FilterTabBar';
import { useTheme } from '../../context/ThemeContext';

export interface AppShellProps {
  children?: React.ReactNode;
  defaultActiveModule?: string;
  activeModule?: string;
  onSelectModule?: (moduleId: string) => void;
  onQuickAction?: (action: QuickActionType) => void;
  defaultLayoutMode?: LayoutMode;
  layoutMode?: LayoutMode;
  onLayoutModeChange?: (mode: LayoutMode) => void;
  householdName?: string;
  members?: MemberRosterItem[];
  className?: string;
}

export function AppShell({
  children,
  defaultActiveModule = 'dashboard',
  activeModule: controlledActiveModule,
  onSelectModule,
  onQuickAction,
  defaultLayoutMode = 'bento',
  layoutMode: controlledLayoutMode,
  onLayoutModeChange,
  householdName,
  members,
  className = '',
}: AppShellProps) {
  const { theme, surface } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [internalActiveModule, setInternalActiveModule] = useState(defaultActiveModule);
  const [internalLayoutMode, setInternalLayoutMode] = useState<LayoutMode>(defaultLayoutMode);
  const [commandPrompt, setCommandPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedMember, setSelectedMember] = useState('all');

  const currentModule =
    controlledActiveModule !== undefined ? controlledActiveModule : internalActiveModule;
  const currentLayoutMode =
    controlledLayoutMode !== undefined ? controlledLayoutMode : internalLayoutMode;

  const handleSelectModule = (moduleId: string) => {
    if (controlledActiveModule === undefined) {
      setInternalActiveModule(moduleId);
    }
    onSelectModule?.(moduleId);
  };

  const handleLayoutModeChange = (mode: LayoutMode) => {
    if (controlledLayoutMode === undefined) {
      setInternalLayoutMode(mode);
    }
    onLayoutModeChange?.(mode);
  };

  const handleCategorySelect = (cat: string | null) => {
    setSelectedCategory(cat);
    if (cat === 'Expense') {
      onQuickAction?.('expense');
    } else if (cat === 'Medication') {
      onQuickAction?.('dose');
    } else if (cat === 'Grocery') {
      onQuickAction?.('grocery');
    }
  };

  const handleHeroSubmit = (prompt: string, cat?: string | null) => {
    if (cat === 'Expense') {
      onQuickAction?.('expense');
    } else if (cat === 'Medication') {
      onQuickAction?.('dose');
    } else if (cat === 'Grocery') {
      onQuickAction?.('grocery');
    }
  };

  const isDark = theme === 'dark';
  const rootBgClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900';

  return (
    <div
      data-testid="app-shell"
      data-surface={surface}
      className={`flex h-screen w-screen overflow-hidden font-sans antialiased ${rootBgClass} ${className}`}
    >
      {/* Figma-Inspired Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        activeModule={currentModule}
        onSelectModule={handleSelectModule}
        householdName={householdName}
        members={members}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Utility Header */}
        <TopUtilityHeader
          activeModule={currentModule}
          onQuickAction={onQuickAction}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        />

        {/* Viewport Workspace */}
        <main
          data-testid="main-viewport"
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Hero Prompt Dispatcher */}
          <HeroCommandBar
            prompt={commandPrompt}
            onPromptChange={setCommandPrompt}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            onSubmit={handleHeroSubmit}
          />

          {/* View Filter Controls and Layout Toggle */}
          <FilterTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedMember={selectedMember}
            onMemberChange={setSelectedMember}
            layoutMode={currentLayoutMode}
            onLayoutModeChange={handleLayoutModeChange}
          />

          {/* Main Viewport Content Slot */}
          <div data-testid="app-shell-content" className="pt-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
