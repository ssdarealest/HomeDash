import { describe, it, expect, beforeEach } from 'vitest';
import {
  PeerDiscoveryManager,
  PeerSessionCoordinator,
} from '../src/p2p';

describe('P2P Peer Discovery & Session Coordinator (Phase 6 Task 2)', () => {
  const householdId = '11111111-1111-4111-a111-111111111111';
  const otherHouseholdId = '99999999-9999-4999-a999-999999999999';
  const householdKey = 'household_shared_secret_key_123';
  const wrongKey = 'wrong_secret_key_456';
  const peer1Id = '22222222-2222-4222-a222-222222222222';
  const peer2Id = '33333333-3333-4333-a333-333333333333';

  let discovery: PeerDiscoveryManager;
  let sessionCoord: PeerSessionCoordinator;

  beforeEach(() => {
    discovery = new PeerDiscoveryManager();
    sessionCoord = new PeerSessionCoordinator();
  });

  describe('PeerDiscoveryManager', () => {
    it('generates valid announcement and verifies it on ingestion', () => {
      const announcement = discovery.generateAnnouncement({
        householdId,
        peerId: peer1Id,
        deviceName: 'iPad Living Room',
        hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer1',
        port: 8443,
        householdKey,
      });

      const accepted = discovery.handleAnnouncement(announcement, '192.168.1.50', householdKey);
      expect(accepted).toBe(true);

      const peers = discovery.getPeers(householdId);
      expect(peers.length).toBe(1);
      expect(peers[0].peerId).toBe(peer1Id);
      expect(peers[0].address).toBe('192.168.1.50');
      expect(peers[0].port).toBe(8443);
    });

    it('rejects announcement with wrong household key or forged signature', () => {
      const announcement = discovery.generateAnnouncement({
        householdId,
        peerId: peer1Id,
        deviceName: 'iPad Living Room',
        hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer1',
        port: 8443,
        householdKey,
      });

      const accepted = discovery.handleAnnouncement(announcement, '192.168.1.50', wrongKey);
      expect(accepted).toBe(false);
      expect(discovery.getPeers(householdId).length).toBe(0);
    });

    it('isolates peers by householdId', () => {
      const ann1 = discovery.generateAnnouncement({
        householdId,
        peerId: peer1Id,
        deviceName: 'iPad Living Room',
        hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer1',
        port: 8443,
        householdKey,
      });
      const ann2 = discovery.generateAnnouncement({
        householdId: otherHouseholdId,
        peerId: peer2Id,
        deviceName: 'Neighbor Device',
        hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer2',
        port: 8443,
        householdKey: 'neighbor_key',
      });

      discovery.handleAnnouncement(ann1, '192.168.1.50', householdKey);
      discovery.handleAnnouncement(ann2, '192.168.1.99', 'neighbor_key');

      expect(discovery.getPeers(householdId).length).toBe(1);
      expect(discovery.getPeers(householdId)[0].peerId).toBe(peer1Id);
      expect(discovery.getPeers(otherHouseholdId).length).toBe(1);
      expect(discovery.getPeers(otherHouseholdId)[0].peerId).toBe(peer2Id);
    });

    it('prunes stale peers exceeding TTL', () => {
      const ann1 = discovery.generateAnnouncement({
        householdId,
        peerId: peer1Id,
        deviceName: 'iPad Living Room',
        hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer1',
        port: 8443,
        householdKey,
      });
      discovery.handleAnnouncement(ann1, '192.168.1.50', householdKey);

      // Advance time beyond TTL
      const past = Date.now() + 35000;
      discovery.pruneStalePeers(30000, past);

      expect(discovery.getPeers(householdId, past).length).toBe(0);
    });
  });

  describe('PeerSessionCoordinator', () => {
    it('conducts successful mutual challenge-response handshake', () => {
      const req = sessionCoord.createHandshakeRequest(householdId, peer1Id, householdKey);
      const verifyReq = sessionCoord.verifyHandshakeRequest(req, householdId, householdKey);
      expect(verifyReq.valid).toBe(true);

      const res = sessionCoord.createHandshakeResponse(req, householdKey);
      expect(res.accepted).toBe(true);

      const verifyRes = sessionCoord.verifyHandshakeResponse(req, res, householdKey);
      expect(verifyRes).toBe(true);

      const keyPeer1 = sessionCoord.deriveSessionKey(req.nonce, res.sessionNonce, householdKey);
      const keyPeer2 = sessionCoord.deriveSessionKey(req.nonce, res.sessionNonce, householdKey);
      expect(keyPeer1).toBe(keyPeer2);
      expect(keyPeer1.length).toBe(64); // 32 bytes hex
    });

    it('rejects handshake with mismatched household ID or invalid signature', () => {
      const req = sessionCoord.createHandshakeRequest(householdId, peer1Id, householdKey);
      const verifyMismatched = sessionCoord.verifyHandshakeRequest(req, otherHouseholdId, householdKey);
      expect(verifyMismatched.valid).toBe(false);

      const verifyWrongKey = sessionCoord.verifyHandshakeRequest(req, householdId, wrongKey);
      expect(verifyWrongKey.valid).toBe(false);
    });
  });
});
