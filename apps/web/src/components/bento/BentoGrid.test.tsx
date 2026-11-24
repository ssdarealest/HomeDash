import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { SessionProvider, SessionState } from '../../context/SessionContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { SyncTelemetryProvider } from '../../context/SyncTelemetryContext';
import { BentoGrid, BentoViewFilter } from './BentoGrid';
import { CashFlowCard } from '../cards/CashFlowCard';
import { MedicationTimelineCard } from '../cards/MedicationTimelineCard';
import { DailyOpsCard } from '../cards/DailyOpsCard';
import { BreakGlassStatusCard } from '../cards/BreakGlassStatusCard';
import { SystemSyncTelemetryCard } from '../cards/SystemSyncTelemetryCard';

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

const ADMIN_SESSION: SessionState = {
  token: 'admin-jwt-token',
  role: 'admin',
  householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  userId: 'admin-user-01',
  isAuthenticated: true,
};

const CAREGIVER_SESSION: SessionState = {
  token: 'caregiver-jwt-token',
  role: 'caregiver_guest',
  householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  userId: 'caregiver-user-01',
  isAuthenticated: true,
};

async function renderWithProviders(
  ui: React.ReactElement,
  session: SessionState = ADMIN_SESSION
) {
  localStorage.setItem('homedash_session', JSON.stringify(session));
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

describe('Modular Bento Domain Cards & Caregiver Quarantine', () => {
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
                  peerId: 'peer-kitchen-tablet',
                  deviceName: 'Kitchen Display',
                  address: '192.168.1.102',
                  lastSeen: Date.now(),
                },
                {
                  peerId: 'peer-living-tv',
                  deviceName: 'Living Room TV',
                  address: '192.168.1.115',
                  lastSeen: Date.now() - 30000,
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

  it('renders all 5 domain cards when rendered with role: admin in overview view', async () => {
    await renderWithProviders(<BentoGrid viewFilter="overview" layoutMode="bento" />, ADMIN_SESSION);

    expect(screen.getByTestId('bento-grid')).toBeTruthy();
    expect(screen.getByTestId('cash-flow-card')).toBeTruthy();
    expect(screen.getByTestId('medication-timeline-card')).toBeTruthy();
    expect(screen.getByTestId('daily-ops-card')).toBeTruthy();
    expect(screen.getByTestId('break-glass-status-card')).toBeTruthy();
    expect(screen.getByTestId('system-sync-telemetry-card')).toBeTruthy();
  });

  it('strictly omits CashFlowCard and BreakGlassStatusCard from the DOM when role is caregiver_guest', async () => {
    await renderWithProviders(<BentoGrid viewFilter="overview" layoutMode="bento" />, CAREGIVER_SESSION);

    const bentoGrid = screen.getByTestId('bento-grid');
    expect(bentoGrid).toBeTruthy();

    // Allowed cards must render
    expect(screen.getByTestId('medication-timeline-card')).toBeTruthy();
    expect(screen.getByTestId('daily-ops-card')).toBeTruthy();
    expect(screen.getByTestId('system-sync-telemetry-card')).toBeTruthy();

    // Quarantined cards MUST NEVER be present in the DOM
    expect(screen.queryByTestId('cash-flow-card')).toBeNull();
    expect(screen.queryByTestId('break-glass-status-card')).toBeNull();
  });

  it('view filter switching: operations view focuses daily ops and medication cards', async () => {
    await renderWithProviders(<BentoGrid viewFilter="operations" layoutMode="bento" />, ADMIN_SESSION);

    expect(screen.getByTestId('daily-ops-card')).toBeTruthy();
    expect(screen.getByTestId('medication-timeline-card')).toBeTruthy();
    expect(screen.queryByTestId('cash-flow-card')).toBeNull();
    expect(screen.queryByTestId('break-glass-status-card')).toBeNull();
  });

  it('view filter switching: caregiver view focuses caregiver schedule and vitals while preserving quarantine', async () => {
    await renderWithProviders(<BentoGrid viewFilter="caregiver" layoutMode="bento" />, CAREGIVER_SESSION);

    // Caregiver-allowed cards
    expect(screen.getByTestId('medication-timeline-card')).toBeTruthy();
    expect(screen.getByTestId('daily-ops-card')).toBeTruthy();

    // Strictly quarantined cards omitted
    expect(screen.queryByTestId('cash-flow-card')).toBeNull();
    expect(screen.queryByTestId('break-glass-status-card')).toBeNull();
  });

  it('view filter switching: vault view focuses break-glass card for admin and omits for caregiver', async () => {
    const { unmount } = await renderWithProviders(<BentoGrid viewFilter="vault" layoutMode="bento" />, ADMIN_SESSION);
    expect(screen.getByTestId('break-glass-status-card')).toBeTruthy();
    expect(screen.queryByTestId('cash-flow-card')).toBeNull();
    expect(screen.queryByTestId('daily-ops-card')).toBeNull();
    unmount();

    await renderWithProviders(<BentoGrid viewFilter="vault" layoutMode="bento" />, CAREGIVER_SESSION);
    // Quarantined for caregiver
    expect(screen.queryByTestId('break-glass-status-card')).toBeNull();
  });

  it('layout mode toggle: switches between bento grid and table presentation', async () => {
    const { rerender } = await renderWithProviders(
      <BentoGrid viewFilter="overview" layoutMode="bento" />,
      ADMIN_SESSION
    );

    const bentoContainer = screen.getByTestId('bento-grid');
    expect(bentoContainer.getAttribute('data-layout-mode')).toBe('bento');

    rerender(
      <SessionProvider>
        <ThemeProvider>
          <SyncTelemetryProvider>
            <BentoGrid viewFilter="overview" layoutMode="table" />
          </SyncTelemetryProvider>
        </ThemeProvider>
      </SessionProvider>
    );

    const tableContainer = screen.getByTestId('bento-grid');
    expect(tableContainer.getAttribute('data-layout-mode')).toBe('table');
    expect(screen.getByTestId('bento-table-view')).toBeTruthy();
  });

  it('CashFlowCard displays account balances, cash flow metrics, and sinking funds progress', async () => {
    await renderWithProviders(<CashFlowCard />, ADMIN_SESSION);

    expect(screen.getByTestId('cash-flow-card')).toBeTruthy();
    expect(screen.getByText(/Cash Flow/i)).toBeTruthy();
    expect(screen.getByText(/Shared Checking/i)).toBeTruthy();
    expect(screen.getByText(/Emergency Savings/i)).toBeTruthy();
    expect(screen.getByText(/Sinking Funds/i)).toBeTruthy();
    expect(screen.getByTestId('sinking-funds-progress')).toBeTruthy();
  });

  it('CashFlowCard returns null when rendered with isCaregiver or caregiver_guest session', async () => {
    const { container } = await renderWithProviders(<CashFlowCard />, CAREGIVER_SESSION);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('cash-flow-card')).toBeNull();
  });

  it('BreakGlassStatusCard displays emergency timer, veto button, and unseal button for admin', async () => {
    const onVeto = vi.fn();
    const onUnseal = vi.fn();
    await renderWithProviders(
      <BreakGlassStatusCard onVeto={onVeto} onUnseal={onUnseal} />,
      ADMIN_SESSION
    );

    expect(screen.getByTestId('break-glass-status-card')).toBeTruthy();
    expect(screen.getByText(/Break-Glass Protocol/i)).toBeTruthy();
    expect(screen.getByTestId('break-glass-countdown')).toBeTruthy();

    const vetoBtn = screen.getByRole('button', { name: /Veto Emergency/i });
    const unsealBtn = screen.getByRole('button', { name: /Trigger Unseal/i });

    expect(vetoBtn).toBeTruthy();
    expect(unsealBtn).toBeTruthy();

    fireEvent.click(vetoBtn);
    expect(onVeto).toHaveBeenCalled();

    fireEvent.click(unsealBtn);
    expect(onUnseal).toHaveBeenCalled();
  });

  it('BreakGlassStatusCard returns null when rendered with caregiver session', async () => {
    const { container } = await renderWithProviders(<BreakGlassStatusCard />, CAREGIVER_SESSION);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('break-glass-status-card')).toBeNull();
  });

  it('MedicationTimelineCard displays doses schedule and handles Log Dose interaction', async () => {
    const onLogDose = vi.fn();
    await renderWithProviders(<MedicationTimelineCard onLogDose={onLogDose} />, ADMIN_SESSION);

    expect(screen.getByTestId('medication-timeline-card')).toBeTruthy();
    expect(screen.getByText(/Medication Schedule/i)).toBeTruthy();

    const logButtons = screen.getAllByRole('button', { name: /Log Dose/i });
    expect(logButtons.length).toBeGreaterThan(0);

    fireEvent.click(logButtons[0]);
    expect(onLogDose).toHaveBeenCalled();
  });

  it('DailyOpsCard allows toggling grocery checklist items and shows chore reward points', async () => {
    const onToggleGrocery = vi.fn();
    await renderWithProviders(
      <DailyOpsCard onToggleGrocery={onToggleGrocery} />,
      ADMIN_SESSION
    );

    expect(screen.getByTestId('daily-ops-card')).toBeTruthy();
    expect(screen.getByText(/Daily Operations/i)).toBeTruthy();
    expect(screen.getByText(/Grocery Checklist/i)).toBeTruthy();
    expect(screen.getByText(/Pending Chores/i)).toBeTruthy();

    // Checkbox toggle
    const groceryCheckboxes = screen.getAllByRole('checkbox');
    expect(groceryCheckboxes.length).toBeGreaterThan(0);

    fireEvent.click(groceryCheckboxes[0]);
    expect(onToggleGrocery).toHaveBeenCalled();

    // Points badges
    expect(screen.getByText(/\+25 pts/i)).toBeTruthy();
  });

  it('SystemSyncTelemetryCard displays real-time SSE health, HLC timestamp, and LAN peers', async () => {
    await renderWithProviders(<SystemSyncTelemetryCard />, ADMIN_SESSION);

    expect(screen.getByTestId('system-sync-telemetry-card')).toBeTruthy();
    expect(screen.getByText(/Sync & LAN Telemetry/i)).toBeTruthy();
    expect(screen.getByTestId('sse-health-badge')).toBeTruthy();
    expect(screen.getByTestId('hlc-timestamp-display')).toBeTruthy();
    expect(screen.getByText(/1700000000000:0001:client-01/i)).toBeTruthy();
    expect(screen.getByText(/Kitchen Display/i)).toBeTruthy();
    expect(screen.getByText(/192.168.1.102/i)).toBeTruthy();
  });
});
