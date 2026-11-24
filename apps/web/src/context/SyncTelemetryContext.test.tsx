import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { SyncTelemetryProvider, useSyncTelemetry } from './SyncTelemetryContext';
import { SessionProvider } from './SessionContext';

describe('SyncTelemetryContext', () => {
  let mockEventSourceInstances: any[] = [];

  class MockEventSource {
    url: string;
    onopen: (() => void) | null = null;
    onerror: ((err: any) => void) | null = null;
    onmessage: ((ev: any) => void) | null = null;
    listeners: Record<string, ((ev: any) => void)[]> = {};

    constructor(url: string) {
      this.url = url;
      mockEventSourceInstances.push(this);
      setTimeout(() => {
        this.onopen?.();
      }, 0);
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

    close() {
      // closed
    }

    // test helper
    emit(event: string, data: any) {
      const listeners = this.listeners[event] || [];
      const ev = { data: typeof data === 'string' ? data : JSON.stringify(data) };
      for (const listener of listeners) {
        listener(ev);
      }
      if (event === 'message' && this.onmessage) {
        this.onmessage(ev);
      }
    }
  }

  beforeEach(() => {
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes telemetry state and establishes SSE connection', async () => {
    const mockTelemetryData = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'connected',
      hlcTimestamp: '1700000000000:0001:server-core',
      connectedPeers: 1,
      peerList: [
        {
          peerId: 'peer-device-1',
          deviceName: 'Living Room Hub',
          address: '192.168.1.100:41632',
          lastSeen: Date.now(),
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTelemetryData,
      })
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>
        <SyncTelemetryProvider>{children}</SyncTelemetryProvider>
      </SessionProvider>
    );

    const { result } = renderHook(() => useSyncTelemetry(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('connected');
    });

    expect(result.current.hlc).toBeDefined();
    expect(result.current.peers).toHaveLength(1);
    expect(result.current.peers[0].deviceName).toBe('Living Room Hub');
  });

  it('refreshes telemetry explicitly when refresh is invoked', async () => {
    const mockTelemetryData = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'connected',
      hlcTimestamp: '1700000000000:0002:server-core',
      connectedPeers: 2,
      peerList: [
        {
          peerId: 'peer-1',
          deviceName: 'Node Alpha',
          address: '192.168.1.10:41632',
          lastSeen: Date.now(),
        },
        {
          peerId: 'peer-2',
          deviceName: 'Node Beta',
          address: '192.168.1.20:41632',
          lastSeen: Date.now(),
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTelemetryData,
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>
        <SyncTelemetryProvider>{children}</SyncTelemetryProvider>
      </SessionProvider>
    );

    const { result } = renderHook(() => useSyncTelemetry(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.peers).toHaveLength(2);
    expect(result.current.hlc).toBe('1700000000000:0002:server-core');
  });

  it('updates status to reconnecting or offline on SSE error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Backend unreachable'))
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>
        <SyncTelemetryProvider>{children}</SyncTelemetryProvider>
      </SessionProvider>
    );

    const { result } = renderHook(() => useSyncTelemetry(), { wrapper });

    await waitFor(() => {
      expect(mockEventSourceInstances.length).toBeGreaterThan(0);
    });

    act(() => {
      const es = mockEventSourceInstances[0];
      es.onerror?.(new Event('error'));
    });

    expect(['reconnecting', 'offline']).toContain(result.current.status);
  });

  it('throws error when useSyncTelemetry is used outside SyncTelemetryProvider', () => {
    expect(() => {
      renderHook(() => useSyncTelemetry());
    }).toThrow('useSyncTelemetry must be used within a SyncTelemetryProvider');
  });
});
