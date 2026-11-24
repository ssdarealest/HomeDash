import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { SessionProvider } from '../../context/SessionContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { SyncTelemetryProvider } from '../../context/SyncTelemetryContext';
import { AppShell } from './AppShell';
import { TopUtilityHeader } from './TopUtilityHeader';
import { HeroCommandBar } from './HeroCommandBar';
import { FilterTabBar } from './FilterTabBar';

class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  listeners: Record<string, ((ev: any) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, handler: (ev: any) => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: (ev: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }

  close() {}
}

async function renderWithProviders(ui: React.ReactElement) {
  let rendered: ReturnType<typeof render>;
  await act(async () => {
    rendered = render(
      <SessionProvider>
        <ThemeProvider>
          <SyncTelemetryProvider>{ui}</SyncTelemetryProvider>
        </ThemeProvider>
      </SessionProvider>
    );
  });
  return rendered!;
}

describe('Figma-Inspired Spatial Navigation Shell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/sync/telemetry')) {
          return {
            ok: true,
            json: async () => ({
              status: 'connected',
              hlcTimestamp: '1700000000000:0001:client-01',
              peerList: [
                {
                  peerId: 'peer-1',
                  deviceName: 'Home Hub',
                  address: '192.168.1.50',
                  lastSeen: Date.now(),
                },
              ],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            sessionToken: 'default-token',
            role: 'admin',
          }),
        };
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies sidebar collapse toggle and navigation item selection', async () => {
    const onSelectModule = vi.fn();
    await renderWithProviders(
      <AppShell onSelectModule={onSelectModule}>
        <div data-testid="viewport-content">Main Viewport Content</div>
      </AppShell>
    );

    // Sidebar should be present
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toBeTruthy();
    expect(sidebar.getAttribute('data-collapsed')).toBe('false');

    // Toggle collapse
    const collapseToggle = screen.getByTestId('sidebar-toggle');
    fireEvent.click(collapseToggle);
    expect(sidebar.getAttribute('data-collapsed')).toBe('true');

    // Toggle back
    fireEvent.click(collapseToggle);
    expect(sidebar.getAttribute('data-collapsed')).toBe('false');

    // Navigation items should exist
    const navDailyOps = screen.getByRole('button', { name: /daily ops/i });
    expect(navDailyOps).toBeTruthy();

    fireEvent.click(navDailyOps);
    expect(onSelectModule).toHaveBeenCalledWith('daily-ops');

    // Breadcrumb updates in header
    expect(screen.getByTestId('active-breadcrumb').textContent).toContain('Daily Ops');
  });

  it('verifies quick action pill clicks emit appropriate action callbacks', async () => {
    const onQuickAction = vi.fn();
    await renderWithProviders(
      <TopUtilityHeader onQuickAction={onQuickAction} activeModule="dashboard" />
    );

    const expenseBtn = screen.getByRole('button', { name: /\+ Expense/i });
    const doseBtn = screen.getByRole('button', { name: /\+ Dose/i });
    const groceryBtn = screen.getByRole('button', { name: /\+ Grocery/i });
    const breakGlassBtn = screen.getByRole('button', { name: /Break-Glass/i });

    expect(expenseBtn).toBeTruthy();
    expect(doseBtn).toBeTruthy();
    expect(groceryBtn).toBeTruthy();
    expect(breakGlassBtn).toBeTruthy();

    fireEvent.click(expenseBtn);
    expect(onQuickAction).toHaveBeenCalledWith('expense');

    fireEvent.click(doseBtn);
    expect(onQuickAction).toHaveBeenCalledWith('dose');

    fireEvent.click(groceryBtn);
    expect(onQuickAction).toHaveBeenCalledWith('grocery');

    fireEvent.click(breakGlassBtn);
    expect(onQuickAction).toHaveBeenCalledWith('break-glass');
  });

  it('verifies role switcher in TopUtilityHeader invokes switchRole', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('/api/v1/auth/session')) {
        return {
          ok: true,
          json: async () => ({
            sessionToken: 'token-senior',
            role: 'senior',
            householdId: 'h-1',
            userId: 'u-1',
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          status: 'connected',
          hlcTimestamp: '1700000000000:0001:client-01',
          peerList: [],
        }),
      };
    });
    vi.stubGlobal('fetch', mockFetch);

    await renderWithProviders(<TopUtilityHeader activeModule="dashboard" />);

    const roleSwitcher = screen.getByTestId('role-switcher-select') as HTMLSelectElement;
    expect(roleSwitcher).toBeTruthy();
    expect(roleSwitcher.value).toBe('admin');

    await act(async () => {
      fireEvent.change(roleSwitcher, { target: { value: 'senior' } });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/auth/session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ role: 'senior' }),
      })
    );
  });

  it('verifies HeroCommandBar input text update and category chip selection', async () => {
    const onPromptChange = vi.fn();
    const onSelectCategory = vi.fn();
    const onSubmit = vi.fn();

    await renderWithProviders(
      <HeroCommandBar
        onPromptChange={onPromptChange}
        onSelectCategory={onSelectCategory}
        onSubmit={onSubmit}
      />
    );

    const input = screen.getByPlaceholderText('What needs doing today?') as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Buy almond milk and vitamins' } });
    expect(onPromptChange).toHaveBeenCalledWith('Buy almond milk and vitamins');

    // Category chips
    const groceryChip = screen.getByRole('button', { name: /Grocery/i });
    const choreChip = screen.getByRole('button', { name: /Chore/i });
    const medicationChip = screen.getByRole('button', { name: /Medication/i });
    const expenseChip = screen.getByRole('button', { name: /Expense/i });

    expect(groceryChip).toBeTruthy();
    expect(choreChip).toBeTruthy();
    expect(medicationChip).toBeTruthy();
    expect(expenseChip).toBeTruthy();

    fireEvent.click(medicationChip);
    expect(onSelectCategory).toHaveBeenCalledWith('Medication');

    // Submit via form or Enter key
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSubmit).toHaveBeenCalled();
  });

  it('verifies FilterTabBar tab switching and Bento/Table layout toggle', async () => {
    const onTabChange = vi.fn();
    const onLayoutModeChange = vi.fn();

    await renderWithProviders(
      <FilterTabBar
        onTabChange={onTabChange}
        onLayoutModeChange={onLayoutModeChange}
      />
    );

    // Filter tabs
    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    const activeOpsTab = screen.getByRole('tab', { name: /Active Operations/i });
    const caregiverTab = screen.getByRole('tab', { name: /Caregiver Schedule/i });
    const vaultSecurityTab = screen.getByRole('tab', { name: /Vault Security/i });

    expect(overviewTab).toBeTruthy();
    expect(activeOpsTab).toBeTruthy();
    expect(caregiverTab).toBeTruthy();
    expect(vaultSecurityTab).toBeTruthy();

    fireEvent.click(activeOpsTab);
    expect(onTabChange).toHaveBeenCalledWith('Active Operations');

    // Layout toggle
    const bentoBtn = screen.getByTestId('layout-toggle-bento');
    const tableBtn = screen.getByTestId('layout-toggle-table');

    expect(bentoBtn).toBeTruthy();
    expect(tableBtn).toBeTruthy();

    fireEvent.click(tableBtn);
    expect(onLayoutModeChange).toHaveBeenCalledWith('table');

    fireEvent.click(bentoBtn);
    expect(onLayoutModeChange).toHaveBeenCalledWith('bento');
  });

  it('verifies caregiver quarantine: suppresses Finance & Vault nav and omits Break-Glass pill', async () => {
    localStorage.setItem(
      'homedash_session',
      JSON.stringify({
        token: 'caregiver-token',
        role: 'caregiver_guest',
        householdId: 'h-caregiver',
        userId: 'u-caregiver',
        isAuthenticated: true,
      })
    );

    await renderWithProviders(
      <AppShell>
        <div>Caregiver Viewport</div>
      </AppShell>
    );

    // Sidebar should suppress Finance and Vault navigation links
    expect(screen.queryByRole('button', { name: /Finance/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Vault/i })).toBeNull();

    // Standard modules like Dashboard, Daily Ops, Health Hub, Settings should still exist
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Daily Ops/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Health Hub/i })).toBeTruthy();

    // Header must omit Break-Glass quick action pill
    expect(screen.queryByRole('button', { name: /Break-Glass/i })).toBeNull();

    // Standard quick action pills (+ Expense, + Dose, + Grocery) should still be available
    expect(screen.getByRole('button', { name: /\+ Expense/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /\+ Dose/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /\+ Grocery/i })).toBeTruthy();
  });
});
