import React from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Clock,
  Server,
  RefreshCw,
  Activity,
  Laptop,
} from 'lucide-react';
import { useSyncTelemetry, SyncConnectionStatus, DiscoveredPeer } from '../../context/SyncTelemetryContext';
import { useTheme } from '../../context/ThemeContext';

export interface SystemSyncTelemetryCardProps {
  status?: SyncConnectionStatus;
  hlc?: string;
  peers?: DiscoveredPeer[];
  onRefresh?: () => void;
  className?: string;
}

export function SystemSyncTelemetryCard({
  status: propStatus,
  hlc: propHlc,
  peers: propPeers,
  onRefresh,
  className = '',
}: SystemSyncTelemetryCardProps) {
  const telemetry = useSyncTelemetry();
  const { surface } = useTheme();

  const status = propStatus ?? telemetry.status;
  const hlc = propHlc ?? telemetry.hlc;
  const peers = propPeers ?? telemetry.peers;

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await telemetry.refresh();
    }
  };

  const isGlass = surface === 'glass';
  const surfaceClass = isGlass
    ? 'bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-100 shadow-xl'
    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md';

  const isConnected = status === 'connected';
  const isReconnecting = status === 'reconnecting';

  return (
    <div
      data-testid="system-sync-telemetry-card"
      className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${surfaceClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Sync & LAN Telemetry</h3>
            <p className="text-xs text-slate-400">Mesh Health & Discovered Peers</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh telemetry"
          className="p-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* SSE Connection Health Status */}
      <div className="py-3 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">SSE Stream State</span>
          </div>

          <div
            data-testid="sse-health-badge"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isReconnecting
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="h-3.5 w-3.5" />
                <span>Connected</span>
              </>
            ) : isReconnecting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Reconnecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>

        {/* HLC Timestamp Display */}
        <div
          data-testid="hlc-timestamp-display"
          className="p-3 rounded-xl bg-slate-950/40 border border-white/5 space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Hybrid Logical Clock (HLC)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">monotonic</span>
          </div>
          <div className="font-mono text-xs text-cyan-300 break-all bg-slate-950/60 p-1.5 rounded border border-white/5">
            {hlc}
          </div>
        </div>

        {/* LAN Discovered Peers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider">
            <span>Discovered LAN Peers</span>
            <span className="text-[11px] text-cyan-400 lowercase">
              {peers.length} active
            </span>
          </div>

          {peers.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-950/20 border border-white/5 text-center text-xs text-slate-500">
              No LAN peers currently discovered on local subnet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {peers.map((peer) => (
                <div
                  key={peer.peerId}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/30 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="h-3.5 w-3.5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-200">{peer.deviceName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{peer.address}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    Online
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
