import React, { useState } from 'react';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider } from './context/ThemeContext';
import { SyncTelemetryProvider } from './context/SyncTelemetryContext';
import { AppShell } from './components/layout/AppShell';
import { BentoGrid } from './components/bento/BentoGrid';
import { type QuickActionType } from './components/layout/TopUtilityHeader';
import {
  ExpenseModal,
  DoseModal,
  GroceryModal,
  BreakGlassModal,
  UnsealVaultModal,
  type ExpenseFormData,
  type DoseFormData,
  type GroceryFormData,
} from './components/modals';

export type ActiveModalType = 'expense' | 'dose' | 'grocery' | 'break-glass' | 'unseal' | null;

export function DashboardWorkspace() {
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [activeModule, setActiveModule] = useState('dashboard');

  const handleQuickAction = (action: QuickActionType) => {
    setActiveModal(action);
  };

  const handleExpenseSubmit = (_data: ExpenseFormData) => {
    setActiveModal(null);
  };

  const handleDoseSubmit = (_data: DoseFormData) => {
    setActiveModal(null);
  };

  const handleGrocerySubmit = (_data: GroceryFormData) => {
    setActiveModal(null);
  };

  const handleBreakGlassConfirm = (_reason: string) => {
    // Upon emergency confirmation, transition to client-side unseal prompt
    setActiveModal('unseal');
  };

  return (
    <>
      <AppShell
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onQuickAction={handleQuickAction}
      >
        <BentoGrid onUnsealVault={() => setActiveModal('unseal')} />
      </AppShell>

      {/* Quick Action Modals */}
      <ExpenseModal
        isOpen={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleExpenseSubmit}
      />

      <DoseModal
        isOpen={activeModal === 'dose'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleDoseSubmit}
      />

      <GroceryModal
        isOpen={activeModal === 'grocery'}
        onClose={() => setActiveModal(null)}
        onSubmit={handleGrocerySubmit}
      />

      <BreakGlassModal
        isOpen={activeModal === 'break-glass'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleBreakGlassConfirm}
      />

      <UnsealVaultModal
        isOpen={activeModal === 'unseal'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SyncTelemetryProvider>
          <DashboardWorkspace />
        </SyncTelemetryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
