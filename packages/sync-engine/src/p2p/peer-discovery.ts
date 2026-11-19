import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PeerAnnouncement } from '@homedash/protocol';

export interface DiscoveredPeer {
  householdId: string;
  peerId: string;
  deviceName: string;
  hlcTimestamp: string;
  port: number;
  lastSeen: number;
  address: string;
}

export interface GenerateAnnouncementOptions {
  householdId: string;
  peerId: string;
  deviceName: string;
  hlcTimestamp: string;
  port: number;
  householdKey: string;
}

export class PeerDiscoveryManager {
  private peers: Map<string, DiscoveredPeer> = new Map();

  generateAnnouncement(opts: GenerateAnnouncementOptions): PeerAnnouncement {
    const timestamp = new Date().toISOString();
    const payload = `${opts.householdId}:${opts.peerId}:${opts.deviceName}:${opts.hlcTimestamp}:${opts.port}:${timestamp}`;
    const signature = createHmac('sha256', opts.householdKey).update(payload).digest('hex');

    return {
      householdId: opts.householdId,
      peerId: opts.peerId,
      deviceName: opts.deviceName,
      hlcTimestamp: opts.hlcTimestamp,
      port: opts.port,
      signature,
      timestamp,
    };
  }

  handleAnnouncement(
    announcement: PeerAnnouncement,
    address: string,
    householdKey: string,
    nowMs: number = Date.now()
  ): boolean {
    const payload = `${announcement.householdId}:${announcement.peerId}:${announcement.deviceName}:${announcement.hlcTimestamp}:${announcement.port}:${announcement.timestamp}`;
    const expectedSig = createHmac('sha256', householdKey).update(payload).digest('hex');

    const sigBuf = Buffer.from(announcement.signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    // Verify clock skew (at most 5 minutes)
    const annTime = new Date(announcement.timestamp).getTime();
    if (Math.abs(nowMs - annTime) > 5 * 60 * 1000) {
      return false;
    }

    this.peers.set(announcement.peerId, {
      householdId: announcement.householdId,
      peerId: announcement.peerId,
      deviceName: announcement.deviceName,
      hlcTimestamp: announcement.hlcTimestamp,
      port: announcement.port,
      lastSeen: nowMs,
      address,
    });

    return true;
  }

  getPeers(householdId: string, nowMs: number = Date.now()): DiscoveredPeer[] {
    this.pruneStalePeers(30000, nowMs);
    const result: DiscoveredPeer[] = [];
    for (const peer of this.peers.values()) {
      if (peer.householdId === householdId) {
        result.push({ ...peer });
      }
    }
    return result;
  }

  pruneStalePeers(ttlMs: number = 30000, nowMs: number = Date.now()): void {
    for (const [id, peer] of this.peers.entries()) {
      if (nowMs - peer.lastSeen > ttlMs) {
        this.peers.delete(id);
      }
    }
  }

  clear(): void {
    this.peers.clear();
  }
}
