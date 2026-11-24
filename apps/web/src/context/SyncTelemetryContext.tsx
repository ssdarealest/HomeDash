import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from './SessionContext';

export type SyncConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface DiscoveredPeer {
  peerId: string;
  deviceName: string;
  address: string;
  lastSeen: number;
}

export interface SyncTelemetryContextType {
  status: SyncConnectionStatus;
  hlc: string;
  peers: DiscoveredPeer[];
  refresh: () => Promise<void>;
}

const SyncTelemetryContext = createContext<SyncTelemetryContextType | null>(null);

const DEFAULT_HLC = '0:0:client';

export function SyncTelemetryProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const [status, setStatus] = useState<SyncConnectionStatus>('reconnecting');
  const [hlc, setHlc] = useState<string>(DEFAULT_HLC);
  const [peers, setPeers] = useState<DiscoveredPeer[]>([]);

  const fetchTelemetry = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }

      const response = await fetch('/api/v1/sync/telemetry', {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Telemetry fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.hlcTimestamp) {
        setHlc(data.hlcTimestamp);
      }
      if (Array.isArray(data.peerList)) {
        setPeers(data.peerList);
      }
      setStatus('connected');
    } catch {
      // Telemetry endpoint unavailable or network error
      setStatus((prev) => (prev === 'connected' ? 'reconnecting' : prev));
    }
  }, [session?.token]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    if (!session?.token) {
      setStatus('offline');
      return;
    }

    const sseUrl = `/api/v1/realtime/stream?token=${encodeURIComponent(session.token)}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setStatus('connected');
      };

      eventSource.onerror = () => {
        setStatus('reconnecting');
      };

      eventSource.addEventListener('connected', () => {
        setStatus('connected');
      });

      eventSource.addEventListener('sync:invalidate', () => {
        fetchTelemetry();
      });

      eventSource.addEventListener('ping', () => {
        setStatus('connected');
      });
    } catch {
      setStatus('offline');
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [session?.token, fetchTelemetry]);

  const value = useMemo(
    () => ({
      status,
      hlc,
      peers,
      refresh: fetchTelemetry,
    }),
    [status, hlc, peers, fetchTelemetry]
  );

  return <SyncTelemetryContext.Provider value={value}>{children}</SyncTelemetryContext.Provider>;
}

export function useSyncTelemetry(): SyncTelemetryContextType {
  const context = useContext(SyncTelemetryContext);
  if (!context) {
    throw new Error('useSyncTelemetry must be used within a SyncTelemetryProvider');
  }
  return context;
}
